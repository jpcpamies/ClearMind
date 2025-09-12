const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const { db } = require('../db');
const { users } = require('../../shared/schema');
const { eq } = require('drizzle-orm');
const auth = require('../middleware/auth');

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

// Password validation function
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long';
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  return null;
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, displayName } = req.body;

    // Validate required fields
    if (!email || !password || !username || !displayName) {
      return res.status(400).json({
        error: 'Email, password, username, and display name are required',
      });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address',
      });
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
      });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists',
      });
    }

    // Check if username already exists
    const [existingUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (existingUsername) {
      return res.status(400).json({
        error: 'Username already taken',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        username,
        displayName,
        emailVerified: false,
      })
      .returning();

    // Generate token
    const token = generateToken(newUser.id);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

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
router.get('/me', auth, (req, res) => {
  res.json({
    user: req.user,
  });
});

module.exports = router;