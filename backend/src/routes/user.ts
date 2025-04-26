import express from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../utils/authMiddleware';

const router = express.Router();

// User routes - using Clerk for authentication, but we still need endpoints
// to create and manage user profiles in our database

// Create user profile after Clerk authentication
router.post('/profile', authMiddleware, userController.createProfile);

// Get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update user profile
router.put('/profile', authMiddleware, userController.updateProfile);

// Get download URL for digital orders
router.get('/downloads/:orderId', authMiddleware, userController.getDownloadUrl);

export default router;
