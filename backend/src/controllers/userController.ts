import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

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

// Mock user database
const userDb: Record<string, any> = {};

export const userController = {
  /**
   * Create user profile
   * This would be called after a successful Clerk authentication
   */
  createProfile: async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        phoneNumber,
        address
      } = req.body;

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if user already exists
      const existingUser = userDb[userId];
      if (existingUser) {
        return res.status(409).json({ message: 'Profile already exists' });
      }

      // Create user profile
      const userProfile = {
        userId,
        name,
        email,
        phoneNumber,
        address,
        orders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // In a real app, save to database
      // For now, save to our mock database
      userDb[userId] = userProfile;

      return res.status(201).json({
        message: 'Profile created successfully',
        profile: {
          userId,
          name,
          email,
          phoneNumber,
        }
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      return res.status(500).json({ message: 'Error creating profile' });
    }
  },

  /**
   * Get user profile
   */
  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // In a real app, query database for user
      // For now, check our mock database
      const userProfile = userDb[userId];

      if (!userProfile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      return res.status(200).json({
        profile: {
          userId: userProfile.userId,
          name: userProfile.name,
          email: userProfile.email,
          phoneNumber: userProfile.phoneNumber,
          address: userProfile.address,
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ message: 'Error fetching profile' });
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (req: Request, res: Response) => {
    try {
      const {
        name,
        phoneNumber,
        address
      } = req.body;

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // In a real app, query database for user
      // For now, check our mock database
      const userProfile = userDb[userId];

      if (!userProfile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Update profile
      if (name) userProfile.name = name;
      if (phoneNumber) userProfile.phoneNumber = phoneNumber;
      if (address) userProfile.address = address;

      userProfile.updatedAt = new Date().toISOString();

      return res.status(200).json({
        message: 'Profile updated successfully',
        profile: {
          userId: userProfile.userId,
          name: userProfile.name,
          email: userProfile.email,
          phoneNumber: userProfile.phoneNumber,
          address: userProfile.address,
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: 'Error updating profile' });
    }
  },

  /**
   * Get download URL for an order PDF
   */
  getDownloadUrl: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // In a real app, we would:
      // 1. Check if the user has a paid order with this ID
      // 2. Get the S3 key for the order's PDF
      // 3. Generate a pre-signed URL for downloading

      // For now, mock this process
      const mockPdfKey = `final-pdfs/${userId}/${orderId}/coloring-book.pdf`;

      // Generate pre-signed URL for downloading
      const params = {
        Bucket: process.env.S3_FINAL_BUCKET || 'coloringbook-final-pdfs',
        Key: mockPdfKey,
        Expires: 3600, // URL valid for 1 hour
      };

      // Generate the pre-signed URL
      const downloadUrl = s3.getSignedUrl('getObject', params);

      return res.status(200).json({
        orderId,
        downloadUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    } catch (error) {
      console.error('Error generating download URL:', error);
      return res.status(500).json({ message: 'Error generating download URL' });
    }
  },
};
