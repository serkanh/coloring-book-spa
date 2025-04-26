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
};
