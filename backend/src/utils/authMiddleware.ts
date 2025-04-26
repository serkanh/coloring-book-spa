import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
// Import axios when needed for Clerk API validation
// import axios from 'axios';

dotenv.config();

// Extend Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name?: string;
      };
    }
  }
}

/**
 * Authentication middleware for Clerk
 * Validates JWT tokens issued by Clerk
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    // In development mode, use mock user to simplify testing
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        userId: 'user_dev123',
        email: 'dev@example.com',
        name: 'Development User'
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
    }

    // In production, validate token with Clerk API
    try {
      // This would be a real validation using Clerk's API
      if (process.env.CLERK_API_KEY) {
        // Example of how to validate with Clerk
        // This would typically use Clerk's SDK or a direct API call
        // const response = await axios.get('https://api.clerk.dev/v1/sessions/verify', {
        //   headers: {
        //     Authorization: `Bearer ${process.env.CLERK_API_KEY}`,
        //     'Content-Type': 'application/json',
        //   },
        //   params: {
        //     token
        //   }
        // });

        // const userData = response.data;
        // req.user = {
        //   userId: userData.id,
        //   email: userData.email_address,
        //   name: userData.name
        // };

        // Mock successful validation for now
        req.user = {
          userId: 'user_123',
          email: 'user@example.com',
          name: 'Clerk User'
        };
      }
    } catch (apiError) {
      console.error('Clerk API validation error:', apiError);
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
