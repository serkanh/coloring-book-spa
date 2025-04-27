import OpenAI, { toFile } from 'openai';
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
): Promise<{ base64Image: string; processedImagePath?: string }> => {
  try {
    console.log('Starting image conversion to sketch...');

    // Generate temporary file paths
    const inputImageId = uuidv4();
    const inputImagePath = path.join(TEMP_DIR, `${inputImageId}_input.png`);
    const outputImageId = uuidv4();
    const outputImagePath = path.join(TEMP_DIR, `${outputImageId}_output.png`);

    // Write input image to disk
    fs.writeFileSync(inputImagePath, imageBuffer);

    // For development/testing without actual OpenAI API calls, uncomment this mock
    if (process.env.USE_MOCK_OPENAI === 'true') {
      console.log('Using mock OpenAI processing');
      return mockImageProcessing(inputImagePath, outputImagePath);
    }

    console.log('Calling OpenAI API to process image...');

    // Convert the image to a OpenAI-compatible file object
    const image = await toFile(fs.createReadStream(inputImagePath), null, {
      type: 'image/png',
    });

    // Call OpenAI API
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: image,
      prompt: prompt
    });

    console.log('OpenAI API response received');

    // Check if response data exists
    if (!response.data || response.data.length === 0) {
      throw new Error('No data returned from OpenAI');
    }

    // Get the b64_json from the response based on the structure you provided
    const base64Image = response.data[0]?.b64_json;
    console.log('Base64 image extraction:', base64Image ? 'successful' : 'failed');

    if (!base64Image) {
      throw new Error('No b64_json found in OpenAI response');
    }

    // Optionally save the image to disk for reference/debugging
    fs.writeFileSync(outputImagePath, Buffer.from(base64Image, 'base64'));
    console.log(`Image saved to disk at ${outputImagePath}`);

    // Clean up input file
    try {
      fs.unlinkSync(inputImagePath);
    } catch (err) {
      console.error('Error cleaning up input file:', err);
    }

    return {
      base64Image,
      processedImagePath: outputImagePath,
    };
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
): Promise<{ base64Image: string; processedImagePath?: string }> => {
  console.log('Using mock image processing - simulating a sketch effect');

  // For simplicity in this mock version, we'll just copy the file
  // In a real implementation with Sharp, we would apply filters here
  fs.copyFileSync(inputImagePath, outputImagePath);

  // Read the file and convert to base64
  const imageBuffer = fs.readFileSync(outputImagePath);
  const base64Image = imageBuffer.toString('base64');

  console.log('Mock processing complete');

  return {
    base64Image,
    processedImagePath: outputImagePath,
  };
};

/**
 * Get the processed image by its ID
 */
export const getProcessedImage = (imageId?: string): Buffer | null => {
  if (!imageId) {
    console.log('No image ID provided to getProcessedImage');
    return null;
  }

  const imagePath = path.join(TEMP_DIR, `${imageId}_output.png`);

  if (fs.existsSync(imagePath)) {
    console.log(`Retrieved processed image from ${imagePath}`);
    return fs.readFileSync(imagePath);
  }

  console.log(`Image file not found at ${imagePath}`);
  return null;
};

/**
 * Clean up temporary files
 */
export const cleanupTempFiles = (imageId?: string): void => {
  // If no imageId is provided, return early
  if (!imageId) {
    return;
  }

  const outputPath = path.join(TEMP_DIR, `${imageId}_output.png`);

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    console.log(`Cleaned up temporary file: ${outputPath}`);
  }
};
