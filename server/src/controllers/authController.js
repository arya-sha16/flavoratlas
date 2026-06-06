import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import emailService from '../services/emailService.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'flavoratlas-very-long-secret-key-for-jwt-access-token-generation-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'flavoratlas-very-long-secret-key-for-jwt-refresh-token-rotation-2026';

// Helper to generate access & refresh tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Set refresh token in HTTP-only cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, country, dietaryPreferences } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create verification token (simple JWT)
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        country: country || null,
        dietaryPreferences: dietaryPreferences || [],
        role: 'USER',
        isVerified: false
      }
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      userId: newUser.id
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        country: user.country,
        dietaryPreferences: user.dietaryPreferences,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Refresh token not found.' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User session invalid.' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Rotate refresh token cookie
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak user existence in prod, but return success
      return res.json({ message: 'If this email exists in our records, a reset link has been sent.' });
    }

    // Reset token valid for 1 hour
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    // Send reset email
    await emailService.sendPasswordResetEmail(email, user.name, resetToken);

    res.json({ message: 'If this email exists in our records, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    // Verify reset token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update user
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash }
    });

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset link has expired. Please request another one.' });
    }
    return res.status(400).json({ error: 'Invalid reset link.' });
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token is required.' });
    }

    // Verify verification token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Update user to verified
    await prisma.user.update({
      where: { email: decoded.email },
      data: { isVerified: true }
    });

    res.json({ message: 'Your email has been verified successfully!' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Verification link has expired. Please register again.' });
    }
    return res.status(400).json({ error: 'Invalid verification link.' });
  }
};

// Google OAuth success callback simulated handler
export const googleSuccess = async (req, res, next) => {
  try {
    // In Passport, req.user would be attached on successful callback
    if (!req.user) {
      return res.status(400).json({ error: 'Google authentication failed.' });
    }

    const { accessToken, refreshToken } = generateTokens(req.user);
    setRefreshTokenCookie(res, refreshToken);

    // Redirect back to frontend with the token
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${accessToken}`);
  } catch (error) {
    next(error);
  }
};
