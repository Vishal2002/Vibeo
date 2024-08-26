import React, { useState, useRef, useEffect } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { upload, getVideo } from '../api/apiService';
import { toast } from 'react-toastify';
import { useAuth } from '../context/Auth';
import { useNavigate } from 'react-router-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';

interface ProcessedVideo {
  status: string;
  s3Url: string;
  thumbnailUrl: string;
  subtitlesUrl: string;
  segmentsUrl: string;
  transcodedUrls: { resolution: string; url: string }[];
}

const VideoUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedVideo, setProcessedVideo] = useState<ProcessedVideo | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to upload a video");
      navigate('/signin');
      return;
    }
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const data = await upload(file, (progress) => {
        setUploadProgress(progress);
      });
      setIsUploading(false);
      setIsProcessing(true);

      // Start polling for video status
      const intervalId = setInterval(async () => {
        const video = await getVideo(data.videoId);
        if (video && video.status === 'completed') {
          setProcessedVideo(video);
          setIsProcessing(false);
          clearInterval(intervalId);
          toast.success("Video processed successfully!");
        } else if (video && video.status === 'failed') {
          setIsProcessing(false);
          toast.error("Video processing failed.");
          clearInterval(intervalId);
        }
      }, 5000); // Poll every 5 seconds
    } catch (err) {
      toast.error("Error processing video");
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (processedVideo && processedVideo.segmentsUrl && videoRef.current) {
      if (playerRef.current) {
        playerRef.current.dispose();
      }

      const videoJsOptions = {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{
          src: processedVideo.segmentsUrl,
          type: 'application/x-mpegURL'
        }]
      };

      const player = videojs(videoRef.current, videoJsOptions, function onPlayerReady() {
        console.log('Player is ready');
      });

      player.on('error', (error:any) => {
        console.error('Video.js error:', error);
      });

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [processedVideo]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold font-cabin text-center mb-8">Video Upload & Processing</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <div
            className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FaCloudUploadAlt className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className="text-xl font-cabin mb-2">Drag & Drop your video here</p>
            <p className="text-sm text-gray-500 mb-4">or click to select a file</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="hidden"
            />
            {file && (
              <p className="text-sm text-green-600 font-semibold">{file.name}</p>
            )}
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading || isProcessing}
            className={`mt-4 w-full py-2 px-4 rounded-md font-semibold ${
              !file || isUploading || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Upload & Process'}
          </button>
        </div>

        <div className="w-full md:w-1/2">
          <div className="bg-gray-100 break-words rounded-lg p-8 h-full">
            <h2 className="text-2xl font-cabin font-semibold mb-4">Processing Result</h2>
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="font-cabin text-lg">Processing your video...</p>
              </div>
            ) : processedVideo ? (
              <div>
                <p className="text-lg text-green-600 font-semibold mb-4">Video processed successfully!</p>
                <h3 className="text-xl font-cabin font-semibold mb-2">Processed Video Details:</h3>
                <p><strong>Status:</strong> {processedVideo.status}</p>
                <p><strong>S3 URL:</strong> {processedVideo.s3Url}</p>
                <p><strong>Thumbnail URL:</strong> <img src={processedVideo.thumbnailUrl} alt="Thumbnail" className="mt-2 max-w-full h-auto" /> </p>
                <p><strong>Subtitles URL:</strong> {processedVideo.subtitlesUrl}</p>
                <p><strong>Segments URL:</strong> {processedVideo.segmentsUrl}</p>
                <h4 className="text-lg font-cabin font-semibold mt-4 mb-2">Transcoded URLs:</h4>
                <ul className="list-disc pl-5">
                  {processedVideo.transcodedUrls.map((item, index) => (
                    <li key={index}>{item.resolution}: {item.url}</li>
                  ))}
                </ul>
                {processedVideo.segmentsUrl && (
                  <div className="mt-4">
                    <h4 className="text-lg font-cabin font-semibold mb-2">Video Player:</h4>
                    <div data-vjs-player>
                      <video ref={videoRef} className="video-js vjs-big-play-centered" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-lg font-cabin text-gray-500">Upload a video to see the results here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;