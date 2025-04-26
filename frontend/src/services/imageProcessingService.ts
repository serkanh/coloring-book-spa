import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Process an image with OpenAI to convert it to a sketch
 * @param file The image file to process
 * @param prompt The prompt to use for image processing
 * @returns Promise that resolves with the processing job ID
 */
export const processImage = async (
  file: File,
  prompt = 'Convert this image to a black and white sketch suitable for a coloring book'
): Promise<string> => {
  try {
    console.log('Starting image processing:', file.name);

    // Create a FormData object
    const formData = new FormData();
    formData.append('image', file);
    formData.append('prompt', prompt);

    // Make API request
    const response = await axios.post(`${API_URL}/uploads/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Image processing started:', response.data);

    return response.data.jobId;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

/**
 * Get the status of an image processing job
 * @param jobId The ID of the processing job
 * @returns Promise that resolves with the job status
 */
export const getProcessingStatus = async (jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedImageUrl?: string;
  message?: string;
}> => {
  try {
    const response = await axios.get(`${API_URL}/uploads/process/status/${jobId}`);
    console.log('Processing status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting processing status:', error);
    throw error;
  }
};

/**
 * Get the URL to view the processed image
 * @param jobId The ID of the processing job
 * @returns The URL to view the processed image
 */
export const getProcessedImageUrl = (jobId: string): string => {
  return `${API_URL}/uploads/process/image/${jobId}`;
};

/**
 * Confirm the processed image and upload it to S3
 * @param jobId The ID of the processing job
 * @returns Promise that resolves with the S3 URL of the confirmed image
 */
export const confirmProcessedImage = async (jobId: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/uploads/process/confirm/${jobId}`);
    console.log('Image confirmed:', response.data);
    return response.data.url;
  } catch (error) {
    console.error('Error confirming processed image:', error);
    throw error;
  }
};

/**
 * Cancel an image processing job
 * @param jobId The ID of the processing job
 */
export const cancelProcessing = async (jobId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/uploads/process/cancel/${jobId}`);
    console.log('Processing canceled');
  } catch (error) {
    console.error('Error canceling processing:', error);
    throw error;
  }
};
