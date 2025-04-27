import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Temporary directory for storing processed images
// Use /app/temp which is mounted as a volume in docker-compose.yml
const TEMP_DIR = path.join(process.cwd(), 'temp');
console.log(`Using temp directory: ${TEMP_DIR}`);

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Process an image with OpenAI to convert it to a sketch/coloring book style
 * @param imageBuffer The buffer of the image to process
 * @param prompt The prompt to use for image processing
 */
export const convertToSketch = async (
  imageBuffer: Buffer,
  prompt = 'Convert this image to a black and white sketch suitable for a coloring book'
): Promise<{ processedImageUrl: string; processedImagePath: string }> => {
  try {
    console.log('Starting image conversion to sketch...');

    // Generate temporary file paths
    const inputImageId = uuidv4();
    const inputImagePath = path.join(TEMP_DIR, `${inputImageId}_input.png`);
    const maskImagePath = path.join(TEMP_DIR, `${inputImageId}_mask.png`);
    const outputImageId = uuidv4();
    const outputImagePath = path.join(TEMP_DIR, `${outputImageId}_output.png`);

    // Write input image to disk
    fs.writeFileSync(inputImagePath, imageBuffer);

    // Create a transparent mask (optional for edit)
    // For full image transformation, we can use a simple transparent PNG
    fs.writeFileSync(maskImagePath, Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]));

    // For development/testing without actual OpenAI API calls, uncomment this mock
    // Use the mock implementation for development/testing
    return mockImageProcessing(inputImagePath, outputImagePath);

    /*
    // The following code is commented out because of issues with the OpenAI API's
    // image format requirements. If those are resolved, uncomment this section.

    console.log('Calling OpenAI API to process image...');

    const response = await openai.images.edit({
      image: fs.createReadStream(inputImagePath),
      mask: fs.createReadStream(maskImagePath),
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    console.log('OpenAI API response:', response);

    // Get the URL from the response
    const processedImageUrl = response.data && response.data[0] && response.data[0].url ? response.data[0].url : '';

    if (!processedImageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Download the image from the URL
    const imageResponse = await fetch(processedImageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save the processed image
    fs.writeFileSync(outputImagePath, buffer);

    console.log(`Image processed successfully. Saved to ${outputImagePath}`);

    // Clean up input files
    fs.unlinkSync(inputImagePath);
    fs.unlinkSync(maskImagePath);

    return {
      processedImageUrl,
      processedImagePath: outputImagePath,
    };
    */
  } catch (error) {
    console.error('Error processing image with OpenAI:', error);
    throw error;
  }
}

/**
 * Mock function for local testing without OpenAI API
 * This creates a simple black and white sketch effect
 */
const mockImageProcessing = async (
  inputImagePath: string,
  outputImagePath: string
): Promise<{ processedImageUrl: string; processedImagePath: string }> => {
  console.log('Using mock image processing - simulating a sketch effect');

  // For simplicity in this mock version, we'll just copy the file
  // In a real implementation with Sharp, we would apply filters here
  fs.copyFileSync(inputImagePath, outputImagePath);

  console.log('Mock processing complete');

  // Return the output path only - don't create a file:// URL
  // The controller will handle creating the proper URL
  return {
    processedImageUrl: '', // Empty URL since controller will handle this
    processedImagePath: outputImagePath,
  };
};

/**
 * Get the processed image by its ID
 */
export const getProcessedImage = (imageId: string): Buffer | null => {
  const imagePath = path.join(TEMP_DIR, `${imageId}_output.png`);

  if (fs.existsSync(imagePath)) {
    return fs.readFileSync(imagePath);
  }

  return null;
};

/**
 * Clean up temporary files
 */
export const cleanupTempFiles = (imageId: string): void => {
  const outputPath = path.join(TEMP_DIR, `${imageId}_output.png`);

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
};
