import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    emailVerified: boolean | null;
    profileImageUrl: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Extract access token from cookies
    const accessToken = req.cookies?.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Verify access token
    const decoded = jwt.verify(accessToken, secret) as { userId: string };
    
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Remove password hash from user object and attach to request
    const { passwordHash, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
};