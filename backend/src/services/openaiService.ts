import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import sharp from 'sharp';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Temporary directory for storing processed images
const TEMP_DIR = path.join(__dirname, '../../temp');

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
    // return mockImageProcessing(inputImagePath, outputImagePath);

    // Call OpenAI API to create edit
    console.log('Calling OpenAI API to process image...');

    // Convert image to proper PNG format to ensure correct mimetype
    const sharp = require('sharp');
    const processedInputPath = path.join(TEMP_DIR, `${inputImageId}_processed.png`);
    const processedMaskPath = path.join(TEMP_DIR, `${inputImageId}_mask_processed.png`);

    // Process and save input image as proper PNG
    await sharp(inputImagePath)
      .png()
      .toFile(processedInputPath);

    // Process and save mask image as proper PNG
    await sharp(maskImagePath)
      .png()
      .toFile(processedMaskPath);

    console.log('Images converted to proper PNG format');

    const response = await openai.images.edit({
      image: fs.createReadStream(processedInputPath),
      mask: fs.createReadStream(processedMaskPath),
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
  } catch (error) {
    console.error('Error processing image with OpenAI:', error);
    throw error;
  }
}

/**
 * Mock function for local testing without OpenAI API
 * This simply inverts the colors of the input image as a placeholder
 */
const mockImageProcessing = async (
  inputImagePath: string,
  outputImagePath: string
): Promise<{ processedImageUrl: string; processedImagePath: string }> => {
  console.log('Using mock image processing (for testing only)');

  // For simplicity, just copy the file in this mock
  fs.copyFileSync(inputImagePath, outputImagePath);

  // In a real implementation, you would process the image here
  // For example, you could use sharp to invert colors or apply filters

  // Create a mock URL
  const mockUrl = `file://${outputImagePath}`;

  return {
    processedImageUrl: mockUrl,
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
