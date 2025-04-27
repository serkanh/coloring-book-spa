import { Request, Response } from 'express';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
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

export const uploadController = {
  /**
   * Upload images to S3
   */
  uploadImages: async (req: Request, res: Response) => {
    try {
      console.log('Starting file upload process...');
      console.log('S3 Config:', {
        endpoint: s3Options.endpoint,
        region: s3Options.region,
        forcePathStyle: s3Options.s3ForcePathStyle,
        bucket: process.env.S3_UPLOAD_BUCKET
      });

      if (!req.files || req.files.length === 0) {
        console.log('No files were uploaded');
        return res.status(400).json({ message: 'No files were uploaded' });
      }

      console.log(`Received ${Array.isArray(req.files) ? req.files.length : 0} files for upload`);

      // For mock purposes, create a unique upload ID
      const uploadId = uuidv4();
      console.log(`Created upload ID: ${uploadId}`);

      // Handle multiple file uploads
      const uploadPromises = Array.isArray(req.files)
        ? req.files.map(async (file: Express.Multer.File, index: number) => {
            const fileName = `${uploadId}/${Date.now()}-${file.originalname}`;
            const key = `uploads/${fileName}`;
            console.log(`[File ${index + 1}] Preparing upload for: ${file.originalname} -> ${key}`);

            // Check if file buffer exists and handle the upload accordingly
            // When running in Docker, multer provides the file buffer directly
            const fileBuffer = file.buffer || await fs.promises.readFile(file.path);
            console.log(`[File ${index + 1}] File buffer size: ${fileBuffer.length} bytes`);

            // Upload to S3 (or LocalStack in development)
            const params = {
              Bucket: process.env.S3_UPLOAD_BUCKET || 'coloringbook-uploads',
              Key: key,
              Body: fileBuffer,
              ContentType: file.mimetype,
              ACL: 'public-read' // Make the file publicly accessible for testing
            };

            console.log(`[File ${index + 1}] Starting S3 upload with params:`, {
              bucket: params.Bucket,
              key: params.Key,
              contentType: params.ContentType
            });

            // Perform the upload
            try {
              const uploadResult = await s3.upload(params).promise();
              console.log(`[File ${index + 1}] S3 upload successful:`, uploadResult);

              // Construct a URL that will work with LocalStack or AWS
              let fileUrl;
              if (process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT) {
                // For LocalStack
                fileUrl = `${process.env.AWS_ENDPOINT}/${params.Bucket}/${params.Key}`;
              } else {
                // For real AWS
                fileUrl = uploadResult.Location;
              }

              console.log(`[File ${index + 1}] File URL: ${fileUrl}`);

              return {
                originalName: file.originalname,
                s3Key: key,
                mimeType: file.mimetype,
                size: file.size,
                url: fileUrl,
                uploadResult
              };
            } catch (uploadError) {
              console.error(`[File ${index + 1}] S3 upload failed:`, uploadError);
              throw uploadError;
            }
          })
        : [];

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);

      // In a real app, we would store the upload info in the database
      // and trigger the Lambda function for processing

      return res.status(200).json({
        message: 'Files uploaded successfully',
        uploadId,
        files: uploadResults,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      return res.status(500).json({ message: 'Error uploading files' });
    }
  },

  /**
   * Get upload status
   */
  getUploadStatus: async (req: Request, res: Response) => {
    try {
      const { uploadId } = req.params;

      // In a real app, we would check the database for the upload status
      // For now, we'll mock a response

      return res.status(200).json({
        uploadId,
        status: 'processing', // could be 'pending', 'processing', 'completed', 'failed'
        filesProcessed: 5,
        totalFiles: 10,
        startedAt: new Date(Date.now() - 60000).toISOString(),
      });
    } catch (error) {
      console.error('Error getting upload status:', error);
      return res.status(500).json({ message: 'Error getting upload status' });
    }
  },

  /**
   * Get pre-signed URL for direct upload to S3
   */
  getPresignedUrl: async (req: Request, res: Response) => {
    try {
      const { fileName, fileType } = req.query;

      if (!fileName || !fileType) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // Create unique file name to prevent overwriting
      const uniqueFileName = `${Date.now()}-${fileName}`;
      const key = `uploads/${req.user?.userId}/${uniqueFileName}`;

      // Set parameters for S3 pre-signed URL
      const params = {
        Bucket: process.env.S3_UPLOAD_BUCKET || 'coloringbook-uploads',
        Key: key,
        ContentType: fileType as string,
        Expires: 600, // URL expiration time in seconds (10 minutes)
      };

      // Generate the pre-signed URL
      const url = s3.getSignedUrl('putObject', params);

      return res.status(200).json({
        url,
        key,
        fileName: uniqueFileName,
      });
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      return res.status(500).json({ message: 'Error generating pre-signed URL' });
    }
  },

  /**
   * Delete a processed image from S3
   */
  deleteProcessedImage: async (req: Request, res: Response) => {
    try {
      const { imageUrl } = req.query;

      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid image URL parameter' });
      }

      console.log(`Attempting to delete image at URL: ${imageUrl}`);

      // Extract bucket and key from the URL
      let bucket: string;
      let key: string;

      try {
        // Parse the URL
        const urlObj = new URL(imageUrl);

        // Handle LocalStack vs AWS S3 URLs
        if (process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT) {
          // For LocalStack URLs like: http://localhost:4566/bucket-name/processed/image.png
          const pathParts = urlObj.pathname.split('/');
          bucket = pathParts[1]; // The first part after the initial slash is the bucket name
          key = pathParts.slice(2).join('/'); // The rest is the key
        } else {
          // For AWS S3 URLs like: https://bucket-name.s3.amazonaws.com/processed/image.png
          // Or: https://s3.region.amazonaws.com/bucket-name/processed/image.png
          const hostParts = urlObj.hostname.split('.');

          if (hostParts[1] === 's3' && hostParts[2] === 'amazonaws') {
            // URL format: bucket-name.s3.amazonaws.com
            bucket = hostParts[0];
            key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
          } else if (hostParts[0] === 's3') {
            // URL format: s3.region.amazonaws.com/bucket-name/key
            const pathParts = urlObj.pathname.split('/');
            bucket = pathParts[1];
            key = pathParts.slice(2).join('/');
          } else {
            // Default to using configured bucket
            bucket = process.env.S3_PROCESSED_BUCKET || 'coloringbook-processed';
            key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
          }
        }
      } catch (parseError) {
        console.error('Error parsing image URL:', parseError);
        return res.status(400).json({
          message: 'Invalid image URL format',
          error: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
      }

      console.log(`Deleting from S3: Bucket=${bucket}, Key=${key}`);

      // Delete from S3
      const params = {
        Bucket: bucket,
        Key: key
      };

      const deleteResult = await s3.deleteObject(params).promise();
      console.log('S3 delete result:', deleteResult);

      return res.status(200).json({
        message: 'Image deleted successfully',
        bucket,
        key
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      return res.status(500).json({
        message: 'Error deleting image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
};
