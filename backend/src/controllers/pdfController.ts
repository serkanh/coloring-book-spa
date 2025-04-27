import { Request, Response } from 'express';
import { generateColoringBookPDF, cleanupPdfFiles } from '../services/pdfService';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Get the minimum images required from env vars or use default
const MIN_IMAGES_REQUIRED = parseInt(process.env.MIN_IMAGES_REQUIRED || '8', 10);

// In-memory storage for tracking PDF generation jobs
const pdfJobs: Record<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId?: string;
  imageUrls: string[];
  pdfUrl?: string;
  title?: string;
  message?: string;
  createdAt: Date;
}> = {};

// Using module.exports instead of ES exports for TypeScript compatibility with require()
module.exports = {
  pdfController: {
  /**
   * Generate a coloring book PDF from a list of image URLs
   */
  generatePDF: async (req: Request, res: Response) => {
    try {
      const { imageUrls, title } = req.body;
      const userId = req.user?.userId;

      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ message: 'No image URLs provided' });
      }

      // Check minimum number of images based on environment setting
      if (imageUrls.length < MIN_IMAGES_REQUIRED) {
        return res.status(400).json({
          message: `At least ${MIN_IMAGES_REQUIRED} images are required to create a coloring book`
        });
      }

      // Create a PDF job ID
      const jobId = uuidv4();

      // Store job info
      pdfJobs[jobId] = {
        status: 'pending',
        userId,
        imageUrls,
        title: title || 'My Coloring Book',
        createdAt: new Date()
      };

      // Process asynchronously
      res.status(202).json({
        message: 'PDF generation started',
        jobId,
        status: 'pending',
      });

      // Start processing
      pdfJobs[jobId].status = 'processing';

      try {
        // Generate the PDF
        const pdfUrl = await generateColoringBookPDF(
          imageUrls,
          title || 'My Coloring Book'
        );

        // Update job status
        pdfJobs[jobId].status = 'completed';
        pdfJobs[jobId].pdfUrl = pdfUrl;

        console.log(`PDF generation completed for job ${jobId}`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        pdfJobs[jobId].status = 'failed';
        pdfJobs[jobId].message = error instanceof Error ? error.message : 'Unknown error';
      }
    } catch (error) {
      console.error('Error in generatePDF controller:', error);
      return res.status(500).json({ message: 'Server error generating PDF' });
    }
  },

  /**
   * Get the status of a PDF generation job
   */
  getPdfStatus: async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      if (!jobId || !pdfJobs[jobId]) {
        return res.status(404).json({ message: 'PDF job not found' });
      }

      const job = pdfJobs[jobId];

      // Prepare response
      const response: any = {
        jobId,
        status: job.status,
        message: job.message,
      };

      // If job is completed, include PDF URL
      if (job.status === 'completed' && job.pdfUrl) {
        response.pdfUrl = job.pdfUrl;
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error getting PDF status:', error);
      return res.status(500).json({ message: 'Server error getting PDF status' });
    }
  },

  /**
   * List all PDF jobs for a user (for debugging purposes)
   */
  listUserPdfs: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userJobs = Object.entries(pdfJobs)
        .filter(([_, job]) => job.userId === userId)
        .map(([jobId, job]) => ({
          jobId,
          status: job.status,
          title: job.title,
          pdfUrl: job.pdfUrl,
          imageCount: job.imageUrls.length,
          createdAt: job.createdAt
        }));

      return res.status(200).json({ pdfs: userJobs });
    } catch (error) {
      console.error('Error listing user PDFs:', error);
      return res.status(500).json({ message: 'Server error listing user PDFs' });
    }
  }
  }
};
