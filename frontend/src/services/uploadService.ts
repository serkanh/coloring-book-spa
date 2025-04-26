import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Upload multiple images to the server
 * @param files Array of File objects to upload
 * @param onProgress Optional callback for upload progress updates
 * @returns Promise that resolves with the upload result
 */
export const uploadImages = async (
  files: File[],
  onProgress?: (progress: Record<string, number>) => void
): Promise<any> => {
  try {
    console.log('Starting upload to backend API:', `${API_URL}/uploads/image`);
    console.log('Files to upload:', files);

    // Create a FormData object to send the files
    const formData = new FormData();

    // Append each file to the FormData
    files.forEach((file) => {
      formData.append('images', file);
    });

    // Track upload progress
    const progressTracker: Record<string, number> = {};
    files.forEach((file) => {
      progressTracker[file.name] = 0;
    });

    // Make the API request
    const response = await axios.post(`${API_URL}/uploads/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return;

        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );

        // Update progress for all files
        files.forEach((file) => {
          progressTracker[file.name] = percentCompleted;
        });

        // Call the progress callback if provided
        if (onProgress) {
          onProgress({...progressTracker});
        }
      },
    });

    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

/**
 * Get upload status
 * @param uploadId The ID of the upload to check
 * @returns Promise that resolves with the upload status
 */
export const getUploadStatus = async (uploadId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/uploads/status/${uploadId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting upload status:', error);
    throw error;
  }
};

/**
 * Upload a test file to verify S3 functionality
 * @returns Promise that resolves with the test upload result
 */
export const uploadTestFile = async (): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/uploads/debug/upload-test`);
    return response.data;
  } catch (error) {
    console.error('Error uploading test file:', error);
    throw error;
  }
};

/**
 * List S3 buckets
 * @returns Promise that resolves with the list of S3 buckets
 */
export const listBuckets = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/uploads/debug/list-buckets`);
    return response.data;
  } catch (error) {
    console.error('Error listing buckets:', error);
    throw error;
  }
};

/**
 * List files in an S3 bucket
 * @param bucket The name of the bucket to list files from
 * @returns Promise that resolves with the list of files in the bucket
 */
export const listFiles = async (bucket: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/uploads/debug/list-files/${bucket}`);
    return response.data;
  } catch (error) {
    console.error('Error listing files in bucket:', error);
    throw error;
  }
};
