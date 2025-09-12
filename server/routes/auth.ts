import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import rateLimit from 'express-rate-limit';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { auth } from '../middleware/auth';

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate JWT tokens
const generateTokens = (userId: string) => {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { userId },
    accessSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    refreshSecret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Set secure cookie options
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax' as const,
    path: '/',
  };
};

// Login endpoint
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address',
      });
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Set cookies
    const cookieOptions = getCookieOptions();
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user profile (without password hash)
    const { passwordHash, ...userProfile } = user;
    res.json({
      message: 'Login successful',
      user: userProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'No refresh token provided',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string };
    
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user) {
      return res.status(401).json({
        message: 'Invalid refresh token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    // Set new cookies
    const cookieOptions = getCookieOptions();
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Tokens refreshed successfully',
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user endpoint  
router.get('/me', auth, async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    // Clear authentication cookies
    const cookieOptions = getCookieOptions();
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;