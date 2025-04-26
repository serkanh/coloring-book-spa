import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Import with dynamic require to work around TypeScript issues
const { uploadController } = require('../controllers/uploadController');
const { authMiddleware } = require('../utils/authMiddleware');
const { processController } = require('../controllers/processController');

dotenv.config();

const router = express.Router();

// Configure AWS SDK for debugging endpoints
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

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only jpeg and png files
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG files are allowed'));
    }
  },
});

// Regular upload routes
router.post('/image', authMiddleware, upload.array('images', 24), uploadController.uploadImages);
router.get('/status/:uploadId', authMiddleware, uploadController.getUploadStatus);
router.get('/presigned-url', authMiddleware, uploadController.getPresignedUrl);

// Image processing routes
router.post('/process', authMiddleware, upload.single('image'), processController.processImage);
router.get('/process/status/:jobId', authMiddleware, processController.getProcessingStatus);
router.get('/process/image/:jobId', authMiddleware, processController.getProcessedImage);
router.post('/process/confirm/:jobId', authMiddleware, processController.confirmProcessedImage);
router.delete('/process/cancel/:jobId', authMiddleware, processController.cancelProcessing);

// Debugging endpoints - no auth required for testing
router.get('/debug/list-buckets', async (req, res) => {
  try {
    console.log('Attempting to list S3 buckets...');
    const data = await s3.listBuckets().promise();
    console.log('S3 buckets:', data.Buckets);
    res.status(200).json({ buckets: data.Buckets });
  } catch (err) {
    const error = err as Error;
    console.error('Error listing buckets:', error);
    res.status(500).json({ message: 'Error listing buckets', error: error.message });
  }
});

router.get('/debug/list-files/:bucket', async (req, res) => {
  try {
    const { bucket } = req.params;
    console.log(`Attempting to list files in bucket: ${bucket}`);

    const params = {
      Bucket: bucket
    };

    const data = await s3.listObjectsV2(params).promise();
    console.log(`Files in bucket ${bucket}:`, data.Contents);
    res.status(200).json({
      bucket,
      files: data.Contents,
      count: data.KeyCount
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Error listing files in bucket ${req.params.bucket}:`, error);
    res.status(500).json({
      message: `Error listing files in bucket ${req.params.bucket}`,
      error: error.message
    });
  }
});

// Upload a test file to verify S3 functionality
router.post('/debug/upload-test', async (req, res) => {
  try {
    const bucket = process.env.S3_UPLOAD_BUCKET || 'coloringbook-uploads';
    const key = `test-file-${Date.now()}.txt`;
    const body = 'This is a test file to verify S3 upload functionality';

    console.log(`Attempting to upload test file to ${bucket}/${key}`);

    const params = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'text/plain'
    };

    const data = await s3.upload(params).promise();
    console.log('Test file uploaded successfully:', data);

    res.status(200).json({
      message: 'Test file uploaded successfully',
      location: data.Location,
      key: data.Key,
      bucket: data.Bucket
    });
  } catch (err) {
    const error = err as Error;
    console.error('Error uploading test file:', error);
    res.status(500).json({
      message: 'Error uploading test file',
      error: error.message
    });
  }
});

export default router;
