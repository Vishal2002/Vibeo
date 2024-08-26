import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config();

// Log the REDIS_URL for debugging purposes
console.log('REDIS_URL:', process.env.REDIS_URL as string);

// Create a Bull queue
const videoProcessingQueue = new Queue('video-processing', process.env.REDIS_URL as string);

export const addToQueue = async (data: any) => {
  try {
    // Add job to the Bull queue
    const job = await videoProcessingQueue.add(data);
    console.log('Job added to queue', job.id);
    return job.id;
  } catch (error) {
    console.error('Error adding job to queue:', error);
    throw error;
  }
};

// Optional: Add event listeners for better monitoring
videoProcessingQueue.on('completed', (job) => {
  console.log(`Job ${job.id} has been completed`);
});

videoProcessingQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with error ${err.message}`);
});

// Export the queue for use in other parts of your application if needed
export { videoProcessingQueue };