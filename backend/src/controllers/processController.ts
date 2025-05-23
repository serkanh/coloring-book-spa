import { Request, Response } from 'express';
import { convertToSketch, getProcessedImage, cleanupTempFiles } from '../services/openaiService';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS SDK
const s3Options: AWS.S3.ClientConfiguration = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};

// Use LocalStack endpoint in development
if (process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT) {
  s3Options.endpoint = process.env.AWS_ENDPOINT;
  s3Options.s3ForcePathStyle = true; // Required for LocalStack
}

const s3 = new AWS.S3(s3Options);

// Keep track of processing images
const processingJobs: Record<string, {
  originalImageId: string;
  processedImageId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  processedImageUrl?: string;
  base64Image?: string;
}> = {};

export const processController = {
  /**
   * Process an image with OpenAI to convert it to a sketch/coloring book style
   */
  processImage: async (req: Request, res: Response) => {
    try {
      // Check if file is included
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const file = req.file;
      const prompt = req.body.prompt || 'Convert this image to a black and white sketch suitable for a coloring book';

      console.log(`Processing image: ${file.originalname} with prompt: ${prompt}`);

      // Create a processing job ID
      const jobId = uuidv4();
      const originalImageId = uuidv4();
      const processedImageId = uuidv4();

      // Store job info
      processingJobs[jobId] = {
        originalImageId,
        processedImageId,
        status: 'pending',
      };

      // Process asynchronously
      res.status(202).json({
        message: 'Image processing started',
        jobId,
        status: 'pending',
      });

      // Start processing
      processingJobs[jobId].status = 'processing';

      try {
        // Convert image to sketch
        const result = await convertToSketch(file.buffer, prompt);

        // Store processed info
        processingJobs[jobId].status = 'completed';
        processingJobs[jobId].base64Image = result.base64Image;

        // Optionally store processed image path if available
        if (result.processedImagePath) {
          processingJobs[jobId].processedImageId = processedImageId;
        }

        console.log(`Image processing completed for job ${jobId}`);
      } catch (error) {
        console.error('Error processing image:', error);
        processingJobs[jobId].status = 'failed';
        processingJobs[jobId].message = error instanceof Error ? error.message : 'Unknown error';
      }
    } catch (error) {
      console.error('Error in processImage controller:', error);
      return res.status(500).json({ message: 'Server error processing image' });
    }
  },

  /**
   * Get the status of an image processing job
   */
  getProcessingStatus: async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      if (!jobId || !processingJobs[jobId]) {
        return res.status(404).json({ message: 'Processing job not found' });
      }

      const job = processingJobs[jobId];

      // Prepare response object
      const response: any = {
        jobId,
        status: job.status,
        message: job.message,
      };

      // If job is completed, include image data
      if (job.status === 'completed') {
        // Include base64 image data if available
        if (job.base64Image) {
          response.base64Image = job.base64Image;
          console.log('Returning base64 image data in response');
        }

        // Include URL as fallback (for backwards compatibility)
        if (job.processedImageId) {
          const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
          const filename = `${job.processedImageId}_output.png`;
          response.processedImageUrl = `${baseUrl}/temp/${filename}`;
          console.log(`Setting processed image URL: ${response.processedImageUrl}`);
        }
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error getting processing status:', error);
      return res.status(500).json({ message: 'Server error getting processing status' });
    }
  },

  /**
   * Get the processed image
   */
  getProcessedImage: async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      if (!jobId || !processingJobs[jobId]) {
        return res.status(404).json({ message: 'Processing job not found' });
      }

      const job = processingJobs[jobId];

      if (job.status !== 'completed') {
        return res.status(400).json({
          message: 'Image processing not completed',
          status: job.status
        });
      }

      // If we have base64 data, return it
      if (job.base64Image) {
        return res.status(200).json({
          base64Image: job.base64Image
        });
      }

      // Otherwise try to get the file from disk
      if (!job.processedImageId) {
        return res.status(404).json({ message: 'No processed image ID found' });
      }

      const imageBuffer = getProcessedImage(job.processedImageId);

      if (!imageBuffer) {
        return res.status(404).json({ message: 'Processed image not found' });
      }

      // Send the image
      res.set('Content-Type', 'image/png');
      return res.send(imageBuffer);
    } catch (error) {
      console.error('Error getting processed image:', error);
      return res.status(500).json({ message: 'Server error getting processed image' });
    }
  },

  /**
   * Confirm the processed image and upload to S3
   */
  confirmProcessedImage: async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      if (!jobId || !processingJobs[jobId]) {
        return res.status(404).json({ message: 'Processing job not found' });
      }

      const job = processingJobs[jobId];

      if (job.status !== 'completed') {
        return res.status(400).json({
          message: 'Image processing not completed',
          status: job.status
        });
      }

      // Get image buffer, either from base64 or from file
      let imageBuffer: Buffer;

      if (job.base64Image) {
        // Convert base64 to buffer
        imageBuffer = Buffer.from(job.base64Image, 'base64');
      } else if (job.processedImageId) {
        const tempBuffer = getProcessedImage(job.processedImageId);
        if (!tempBuffer) {
          return res.status(404).json({ message: 'Processed image not found' });
        }
        imageBuffer = tempBuffer;
      } else {
        return res.status(404).json({ message: 'No image data available' });
      }

      // Upload to S3
      const fileName = `${Date.now()}-processed.png`;
      const key = `processed/${fileName}`;

      const params = {
        Bucket: process.env.S3_PROCESSED_BUCKET || 'coloringbook-processed',
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/png',
        ACL: 'public-read', // Make it publicly accessible
      };

      console.log(`Uploading processed image to S3: ${params.Bucket}/${params.Key}`);

      const uploadResult = await s3.upload(params).promise();

      console.log('S3 upload result:', uploadResult);

      // Clean up temporary files if they exist
      if (job.processedImageId) {
        cleanupTempFiles(job.processedImageId);
      }

      // Remove job from memory
      delete processingJobs[jobId];

      // Build the URL based on environment
      let url;
      if (process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT) {
        // For LocalStack
        url = `${process.env.AWS_ENDPOINT}/${params.Bucket}/${params.Key}`;
      } else {
        // For real AWS
        url = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
      }

      return res.status(200).json({
        message: 'Image confirmed and uploaded to S3',
        url,
        bucket: params.Bucket,
        key: params.Key,
      });
    } catch (error) {
      console.error('Error confirming processed image:', error);
      return res.status(500).json({ message: 'Server error confirming processed image' });
    }
  },

  /**
   * Cancel an image processing job
   */
  cancelProcessing: async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      if (!jobId || !processingJobs[jobId]) {
        return res.status(404).json({ message: 'Processing job not found' });
      }

      const job = processingJobs[jobId];

      // Clean up temporary files if they exist
      if (job.processedImageId) {
        cleanupTempFiles(job.processedImageId);
      }

      // Remove job from memory
      delete processingJobs[jobId];

      return res.status(200).json({
        message: 'Processing job canceled',
        jobId,
      });
    } catch (error) {
      console.error('Error canceling processing job:', error);
      return res.status(500).json({ message: 'Server error canceling processing job' });
    }
  },
};
