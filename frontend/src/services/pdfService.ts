import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Generate a coloring book PDF from a list of image URLs
 * @param imageUrls Array of image URLs to include in the PDF
 * @param title Title of the coloring book (optional)
 * @returns Promise that resolves with the PDF generation job ID
 */
export const generatePdf = async (
  imageUrls: string[],
  title?: string
): Promise<string> => {
  try {
    console.log('Starting PDF generation with', imageUrls.length, 'images');

    // Make API request
    const response = await axios.post(`${API_URL}/pdfs/generate`, {
      imageUrls,
      title
    });

    console.log('PDF generation started:', response.data);

    return response.data.jobId;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Get the status of a PDF generation job
 * @param jobId The ID of the processing job
 * @returns Promise that resolves with the job status
 */
export const getPdfStatus = async (jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfUrl?: string;
  message?: string;
}> => {
  try {
    const response = await axios.get(`${API_URL}/pdfs/status/${jobId}`);
    console.log('PDF status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting PDF status:', error);
    throw error;
  }
};

/**
 * List all PDF jobs for the current user
 * @returns Promise that resolves with a list of PDF jobs
 */
export const listUserPdfs = async (): Promise<Array<{
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  title?: string;
  pdfUrl?: string;
  imageCount: number;
  createdAt: string;
}>> => {
  try {
    const response = await axios.get(`${API_URL}/pdfs/list`);
    console.log('User PDFs:', response.data);
    return response.data.pdfs;
  } catch (error) {
    console.error('Error listing user PDFs:', error);
    throw error;
  }
};
