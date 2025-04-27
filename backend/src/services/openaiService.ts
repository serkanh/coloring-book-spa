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
): Promise<{ processedImageUrl: string; processedImagePath: string }> => {
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

    // Call OpenAI API with the new approach
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: image,
      prompt: prompt
    });

    console.log('OpenAI API response received');

    // Write the response to a file for inspection
    const responseLogPath = path.join(TEMP_DIR, 'openai-response.json');
    fs.writeFileSync(
      responseLogPath,
      JSON.stringify({
        fullResponse: response,
        data: response.data,
        firstItem: response.data && response.data.length > 0 ? response.data[0] : null
      }, null, 2)
    );
    console.log(`Full response written to ${responseLogPath} for inspection`);

    // Check if response data exists
    if (!response.data || response.data.length === 0) {
      throw new Error('No data returned from OpenAI');
    }

    // Get the URL from the response
    const imageUrl = response.data[0]?.url;
    console.log('Image URL extracted:', imageUrl);

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('Image URL from OpenAI:', imageUrl);

    // Download the image from the URL
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const image_bytes = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputImagePath, image_bytes);

    console.log(`Image processed successfully. Saved to ${outputImagePath}`);

    // Clean up input file
    fs.unlinkSync(inputImagePath);

    return {
      processedImageUrl: '', // The controller will generate the proper URL
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
