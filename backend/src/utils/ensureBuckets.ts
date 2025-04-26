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

/**
 * Function to create a bucket if it doesn't exist
 */
const createBucketIfNotExists = async (bucketName: string): Promise<void> => {
  try {
    // Check if bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`✅ Bucket ${bucketName} already exists`);
  } catch (error) {
    if ((error as any).code === 'NotFound' || (error as any).code === 'NoSuchBucket' || (error as any).statusCode === 404) {
      console.log(`❌ Bucket ${bucketName} not found, creating it...`);
      try {
        // Create the bucket
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`✅ Bucket ${bucketName} created successfully`);

        // Configure CORS
        const corsParams = {
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                AllowedOrigins: ['*'],
                ExposeHeaders: ['ETag'],
              },
            ],
          },
        };

        try {
          await s3.putBucketCors(corsParams).promise();
          console.log(`✅ CORS configuration set for bucket ${bucketName}`);
        } catch (corsError) {
          console.error(`❌ Error setting CORS for bucket ${bucketName}:`, corsError);
        }
      } catch (createError) {
        console.error(`❌ Error creating bucket ${bucketName}:`, createError);
      }
    } else {
      console.error(`❌ Error checking bucket ${bucketName}:`, error);
    }
  }
};

/**
 * Ensures that all required buckets exist
 */
export const ensureBuckets = async (): Promise<void> => {
  console.log('🔍 Checking if required S3 buckets exist...');

  const buckets = [
    process.env.S3_UPLOAD_BUCKET || 'coloringbook-uploads',
    process.env.S3_PROCESSED_BUCKET || 'coloringbook-processed',
    process.env.S3_FINAL_BUCKET || 'coloringbook-final-pdfs',
  ];

  // Create all buckets in parallel
  await Promise.all(buckets.map(bucket => createBucketIfNotExists(bucket)));

  console.log('✅ All required S3 buckets are now available');
};
