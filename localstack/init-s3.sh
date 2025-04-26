#!/bin/bash
set -e

echo "Initializing LocalStack S3 buckets..."

# Create S3 buckets
aws --endpoint-url=http://localhost:4566 s3 mb s3://coloringbook-uploads
aws --endpoint-url=http://localhost:4566 s3 mb s3://coloringbook-processed
aws --endpoint-url=http://localhost:4566 s3 mb s3://coloringbook-final-pdfs

# Configure CORS for the upload bucket to allow browser uploads
aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors --bucket coloringbook-uploads --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}'

echo "S3 buckets successfully created and configured!"
