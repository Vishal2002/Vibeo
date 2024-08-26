const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk');
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require("@aws-sdk/client-transcribe");
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// AWS Configuration
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
 
});



const s3 = new AWS.S3();
const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log('Connected to DB from worker side');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});


// Video Schema
const VideoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  description: { type: String },
  s3Url: { type: String },
  thumbnailUrl: { type: String },
  subtitlesUrl: { type: String },
  transcodedUrls: [{
    resolution: String,
    url: String
  }],
  segmentsUrl: String,
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', VideoSchema);

async function processVideo(videoId, s3Url,userId) {
  const tempDir = path.join(__dirname, 'temp', videoId);
  await fs.mkdir(tempDir, { recursive: true });

try {
    console.log(`Starting to process video ${videoId} from ${s3Url}`);
    await updateMongoDB(videoId, { status: 'processing' });

    const localPath = await downloadFromS3(s3Url, tempDir);
    console.log(`Video downloaded to ${localPath}`);

    const [transcodedUrls, thumbnailUrl, segmentsUrl] = await Promise.all([
      transcodeVideo(videoId, localPath, tempDir),
      generateAndUploadThumbnail(localPath, videoId, tempDir),
      generateAndUploadSegments(localPath, videoId, tempDir)
    ]);

    const audioPath = await extractAudio(localPath, tempDir);
    console.log(`Audio extracted to ${audioPath}`);
    await uploadToS3(audioPath, `audio/${videoId}.mp3`);

    const subtitlesUrl = await handleTranscription(videoId);
    console.log(`Transcription completed. Subtitles URL: ${subtitlesUrl}`);

    const finalUpdateData = {
      userId:userId,
      status: 'completed',
      thumbnailUrl,
      transcodedUrls,
      subtitlesUrl,
      segmentsUrl
    };
    console.log(`Updating MongoDB with final data:`, finalUpdateData);
    await updateMongoDB(videoId, finalUpdateData);

    console.log(`Video processing completed for ${videoId}`);

  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    await updateMongoDB(videoId, { status: 'failed' });
  } finally {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function downloadFromS3(s3Url, tempDir) {
  const urlParts = new URL(s3Url);
  const key = decodeURIComponent(urlParts.pathname.substring(1)).replace(/\+/g, ' ');
  const localPath = path.join(tempDir, 'input_video.mp4');

  const params = {
    Bucket: process.env.BUCKET,
    Key: key
  };

  const writeStream = (await fs.open(localPath, 'w')).createWriteStream();
  s3.getObject(params).createReadStream().pipe(writeStream);

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  console.log(`File downloaded successfully to ${localPath}`);
  return localPath;
}

async function transcodeVideo(videoId, localPath, tempDir) {
  const resolutions = ['640x360'];
  const transcodedUrls = [];

  for (const resolution of resolutions) {
    const outputPath = path.join(tempDir, `${videoId}_${resolution}.mp4`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(localPath)
        .outputOptions([
          `-vf scale=${resolution}`,
          '-c:v libx264',
          '-crf 23',
          '-preset medium',
          '-c:a aac',
          '-b:a 128k'
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const s3Url = await uploadToS3(outputPath, `transcoded/${videoId}/${resolution}.mp4`);
    transcodedUrls.push({ resolution, url: s3Url });
  }

  return transcodedUrls;
}

async function generateAndUploadThumbnail(inputPath, videoId, tempDir) {
  const thumbnailPath = path.join(tempDir, `thumbnail_${videoId}.jpg`);
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        count: 1,
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '320x240'
      })
      .on('end', resolve)
      .on('error', reject);
  });

  return await uploadToS3(thumbnailPath, `thumbnails/${videoId}.jpg`);
}

async function generateAndUploadSegments(inputPath, videoId, tempDir) {
  const segmentsDir = path.join(tempDir, `segments_${videoId}`);
  await fs.mkdir(segmentsDir, { recursive: true });

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls'
      ])
      .output(path.join(segmentsDir, 'playlist.m3u8'))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  const files = await fs.readdir(segmentsDir);
  for (const file of files) {
    const localPath = path.join(segmentsDir, file);
    await uploadToS3(localPath, `segments/${videoId}/${file}`);
  }

  return `https://${process.env.BUCKET}.s3.amazonaws.com/segments/${videoId}/playlist.m3u8`;
}

async function extractAudio(videoPath, tempDir) {
  const outputPath = path.join(tempDir, 'audio.mp3');
  
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(outputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  return outputPath;
}

async function uploadToS3(localPath, s3Key) {
  const fileContent = await fs.readFile(localPath);
  const params = {
    Bucket: process.env.BUCKET,
    Key: s3Key,
    Body: fileContent
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

async function handleTranscription(videoId) {
  const jobName = `transcribe_${videoId}_${uuidv4()}`;
  
  try {
    // Start new transcription job
    await startTranscription(videoId,jobName);
    
    // Wait for job to complete
    const result = await waitForTranscriptionJob(jobName);
    return result.TranscriptionJob.Subtitles.SubtitleFileUris[0];
  } catch (error) {
    console.error("Error handling transcription:", error);
    throw error;
  }
}

async function startTranscription(videoId,jobName) {
  const params = {
    TranscriptionJobName: jobName,
    LanguageCode: "en-US",
    Media: { 
      MediaFileUri: `s3://${process.env.BUCKET}/audio/${videoId}.mp3` 
    },
    OutputBucketName: process.env.BUCKET,
    OutputKey: `transcriptions/${videoId}_${uuidv4()}`,
    Subtitles: {
      Formats: ["vtt"]
    }
  };

  const command = new StartTranscriptionJobCommand(params);

  try {
    const data = await transcribeClient.send(command);
    console.log("Transcription job started:", data.TranscriptionJob.TranscriptionJobName);
  } catch (error) {
    console.error("Error starting transcription job:", error);
    throw error;
  }
}

async function waitForTranscriptionJob(jobName) {
  while (true) {
    const command = new GetTranscriptionJobCommand({ TranscriptionJobName: jobName });
    const job = await transcribeClient.send(command);
    const status = job.TranscriptionJob.TranscriptionJobStatus;
    
    if (status === 'COMPLETED' || status === 'FAILED') {
      return job;
    }
    
    console.log(`Transcription job ${jobName} is ${status}. Waiting...`);
    await new Promise(resolve => setTimeout(resolve, 30000)); 
  }
}

async function updateMongoDB(videoId, updateData) {
  try {
    console.log('Updating MongoDB for videoId:', videoId);
    console.log('Update data:', updateData);
    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, { new: true });
    if (!updatedVideo) {
      console.log('No video found with this ID:', videoId);
      return null;
    }
    console.log('Video updated successfully:', updatedVideo);
    return updatedVideo;
  } catch (error) {
    console.error('Error updating MongoDB:', error);
    throw error;
  }
}

module.exports = { processVideo };
