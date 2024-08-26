const Queue = require('bull');
const { processVideo } = require('./magic');
require('dotenv').config();

const videoQueue = new Queue('video-processing', process.env.REDIS_URL);

videoQueue.process(async (job) => {
  const { videoId, s3Url,userId } = job.data;
  console.log(`Starting job for video ${videoId}`);
  try {
    await processVideo(videoId, s3Url,userId);
    console.log(`Job completed for video ${videoId}`);
  } catch (error) {
    console.error(`Error processing job for video ${videoId}:`, error);
  }
});

videoQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed for video ${job.data.videoId}`);
});

videoQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed for video ${job.data.videoId}:`, err);
});

console.log('Worker is running');