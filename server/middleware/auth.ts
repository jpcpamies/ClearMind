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
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Internal server error' });
    }

    const decoded = jwt.verify(token, secret as jwt.Secret) as { userId: string };
    
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    // Remove password hash from user object
    const { passwordHash, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
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