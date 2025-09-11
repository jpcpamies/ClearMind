import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid Authorization header found');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Processing token:', token.substring(0, 20) + '...');
    
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Internal server error' });
    }

    const decoded = jwt.verify(token, secret as jwt.Secret) as { userId: string };
    console.log('Token decoded successfully for user:', decoded.userId);
    
    // For test user, use mock data instead of database lookup
    if (decoded.userId === 'test-user-id') {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'test',
        displayName: 'Test User',
        emailVerified: true,
        profileImageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Test user authenticated successfully:', mockUser.displayName);
      req.user = mockUser;
    } else {
      // Get user from database for real users
      const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
      
      if (!user) {
        console.log('User not found in database:', decoded.userId);
        return res.status(401).json({ message: 'Invalid token. User not found.' });
      }

      console.log('User authenticated successfully:', user.displayName);
      // Remove password hash from user object
      const { passwordHash, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
    }
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};