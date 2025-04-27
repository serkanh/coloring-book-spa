import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
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

// Ensure temp directory exists
const tempDir = path.join(__dirname, '..', '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Generate a coloring book PDF from a list of image URLs
 * @param imageUrls Array of image URLs to include in the PDF
 * @param title Title of the coloring book (optional)
 * @returns URL to the generated PDF
 */
export const generateColoringBookPDF = async (
  imageUrls: string[],
  title = 'My Coloring Book'
): Promise<string> => {
  try {
    console.log(`Generating coloring book PDF with ${imageUrls.length} images`);

    // Create a temporary file for the PDF
    const pdfId = uuidv4();
    const pdfPath = path.join(tempDir, `${pdfId}.pdf`);

    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'letter', // 8.5 x 11 inches
    });

    // Create a write stream for the PDF
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Add a cover page
    doc.font('Helvetica-Bold')
      .fontSize(28)
      .text(title, { align: 'center' })
      .moveDown(2);

    doc.font('Helvetica')
      .fontSize(14)
      .text('Created with Coloring Book SPA', { align: 'center' })
      .text(`Contains ${imageUrls.length} pages to color`, { align: 'center' })
      .moveDown(4);

    doc.fontSize(12)
      .text('Instructions:', { align: 'left' })
      .moveDown(0.5)
      .fontSize(10)
      .text('1. Print this coloring book on your favorite paper', { align: 'left' })
      .text('2. Use colored pencils, markers, or crayons to color the pages', { align: 'left' })
      .text('3. Be creative and have fun!', { align: 'left' })
      .moveDown(2);

    // Add page numbers at the bottom
    const pageCount = imageUrls.length + 1; // +1 for cover page
    doc.fontSize(8)
      .text(`Page 1 of ${pageCount}`, { align: 'center' });

    // Download and add each image to the PDF
    for (let i = 0; i < imageUrls.length; i++) {
      console.log(`Processing image ${i + 1}/${imageUrls.length}`);

      const imageUrl = imageUrls[i];

      try {
        // Download the image
        let imageBuffer: Buffer;

        if (imageUrl.startsWith('data:image')) {
          // Handle base64 encoded images
          const base64Data = imageUrl.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // Extract bucket and key from URL
          let bucket: string;
          let key: string;

          try {
            // Parse the URL
            const urlObj = new URL(imageUrl);

            // Handle LocalStack vs AWS S3 URLs
            if (process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT) {
              // For LocalStack URLs like: http://localhost:4566/bucket-name/processed/image.png
              // or http://localstack:4566/bucket-name/processed/image.png
              const pathParts = urlObj.pathname.split('/');
              bucket = pathParts[1]; // The first part after the initial slash is the bucket name
              key = pathParts.slice(2).join('/'); // The rest is the key

              console.log(`Parsed LocalStack URL - Bucket: ${bucket}, Key: ${key}`);
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

              console.log(`Parsed AWS URL - Bucket: ${bucket}, Key: ${key}`);
            }

            // Get the image directly from S3
            console.log(`Getting image from S3: ${bucket}/${key}`);
            const s3Response = await s3.getObject({
              Bucket: bucket,
              Key: key
            }).promise();

            // Convert S3 response to buffer
            if (s3Response.Body) {
              imageBuffer = s3Response.Body as Buffer;
              console.log(`Successfully retrieved image from S3, size: ${imageBuffer.length} bytes`);
            } else {
              throw new Error('S3 response body is empty');
            }
          } catch (s3Error) {
            console.error('Error retrieving image from S3:', s3Error);

            // Fallback to HTTP request if S3 retrieval fails
            console.log(`Falling back to HTTP request for ${imageUrl}`);
            const response = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
              // Increase timeout for image downloads
              timeout: 10000
            });
            imageBuffer = Buffer.from(response.data, 'binary');
          }
        }

        // Add a new page for each image (except first one)
        if (i > 0) {
          doc.addPage();
        } else {
          doc.addPage();
        }

        // Calculate image dimensions to fit on the page
        const maxWidth = doc.page.width - 100; // 50pt margin on each side
        const maxHeight = doc.page.height - 150; // 50pt margin top/bottom + space for page number

        // Add the image centered on the page
        doc.image(imageBuffer, {
          fit: [maxWidth, maxHeight],
          align: 'center',
          valign: 'center'
        });

        // Add page number at the bottom
        doc.fontSize(8)
          .text(`Page ${i + 2} of ${pageCount}`, { align: 'center' });

      } catch (err) {
        console.error(`Error processing image ${i + 1}:`, err);
        // Add error page placeholder
        if (i > 0) {
          doc.addPage();
        }
        // Position text in the center of the page
        const centerY = doc.page.height / 2 - 50;
        doc.fontSize(14)
          .text(`Unable to process image ${i + 1}`, { align: 'center' })
          .moveDown(1)
          .fontSize(10)
          .text('This image could not be included in your coloring book.', { align: 'center' });
      }
    }

    // Finalize the PDF document
    doc.end();

    // Wait for the PDF to be fully written to disk
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    console.log(`PDF saved to ${pdfPath}`);

    // Upload the PDF to S3
    const key = `final-pdfs/${pdfId}.pdf`;
    const params = {
      Bucket: process.env.S3_FINAL_BUCKET || 'coloringbook-final-pdfs',
      Key: key,
      Body: fs.createReadStream(pdfPath),
      ContentType: 'application/pdf',
      ACL: 'public-read', // Make it publicly accessible
    };

    console.log(`Uploading PDF to S3: ${params.Bucket}/${params.Key}`);

    const uploadResult = await s3.upload(params).promise();
    console.log('S3 upload result:', uploadResult);

    // Clean up the temporary file
    fs.unlinkSync(pdfPath);

    // Build the URL based on environment
    let pdfUrl;
    if (process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT) {
      // For LocalStack
      pdfUrl = `${process.env.AWS_ENDPOINT}/${params.Bucket}/${params.Key}`;
    } else {
      // For real AWS
      pdfUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
    }

    console.log(`PDF available at: ${pdfUrl}`);

    return pdfUrl;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Clean up temporary files
 * @param pdfId ID of the PDF to clean up
 */
export const cleanupPdfFiles = (pdfId: string): void => {
  try {
    const pdfPath = path.join(tempDir, `${pdfId}.pdf`);
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log(`Cleaned up PDF file: ${pdfPath}`);
    }
  } catch (error) {
    console.error('Error cleaning up PDF files:', error);
  }
};
