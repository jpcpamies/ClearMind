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

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
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

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // Since we're using JWT tokens, logout is handled on the client side
  // by removing the token from localStorage
  res.json({
    message: 'Logout successful',
  });
});

// Get current user endpoint (protected)
router.get('/me', auth, (req: any, res) => {
  res.json({
    user: req.user,
  });
});

export default router;