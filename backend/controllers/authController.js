import express from 'express';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { redis } from '../lib/redis.js';
import crypto from 'crypto';
dotenv.config();

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const isProd = process.env.NODE_ENV === 'production';

// Generate cryptographically-strong JTI (token id)
const genJti = () => (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

const generateTokens = (userId) => {
  const jti = genJti();
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  // include jti in the refresh token payload
  const refreshToken = jwt.sign({ userId, jti }, process.env.JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken, jti };
};

const storeRefreshToken = async (jti, userId) => {
  // store per-token so multiple sessions can coexist
  await redis.set(`refresh_token:${jti}`, String(userId), 'EX', REFRESH_TTL_SECONDS);
};

const revokeRefreshToken = async (jti) => {
  if (!jti) return;
  await redis.del(`refresh_token:${jti}`);
};

const setCookies = (req, res, accessToken, refreshToken) => {
  // Be resilient in dev and behind proxies: only mark secure if actually on HTTPS
  const forwardedProto = req.get('x-forwarded-proto');
  const onHttps = req.secure || forwardedProto === 'https';
  const secure = isProd && onHttps; // never set Secure over plain HTTP
  const sameSite = isProd ? 'strict' : 'lax';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 15 * 60 * 1000, // 15 min
    path: '/',
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: REFRESH_TTL_SECONDS * 1000, // 7 days
    path: '/',
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'user already exists' });

    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken, jti } = generateTokens(user._id);
    await storeRefreshToken(jti, user._id);
    setCookies(req, res, accessToken, refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'user created successfully',
    });
  } catch (err) {
    console.log('Error in signup controller', err.message);
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken, jti } = generateTokens(user._id);
      await storeRefreshToken(jti, user._id);
      setCookies(req, res, accessToken, refreshToken);

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'Logged in successfully',
      });
    } else {
      res.status(400).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.log('Error in login controller', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken) {
      try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_SECRET); // { userId, jti, iat, exp }
        await revokeRefreshToken(decoded.jti); // only this session
      } catch(err) {
        return res.status(401).json({ message: err.name === 'TokenExpiredError' ? 
            'Refresh token expired' : 'Invalid refresh token' });
      }
    }

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log('Error in logout controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Refresh with ROTATION
export const refreshToken = async (req, res) => {
  try {
    const incoming = req.cookies?.refreshToken;
    if (!incoming) return res.status(401).json({ message: 'No refresh token provided' });

    let decoded;
    try {
      decoded = jwt.verify(incoming, process.env.JWT_SECRET); // { userId, jti, iat, exp }
    } catch (err) {
      return res.status(401).json({
        message: err.name === 'TokenExpiredError' ? 'Refresh token expired' : 'Invalid refresh token',
      });
    }

    // Check that this exact refresh token (by jti) is still valid in Redis
    const exists = await redis.get(`refresh_token:${decoded.jti}`);
    if (!exists) {
      // Token reuse or already rotated → reject
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Rotate: revoke old refresh token, issue fresh access+refresh tokens
    await revokeRefreshToken(decoded.jti);

    const { accessToken, refreshToken, jti } = generateTokens(decoded.userId);
    await storeRefreshToken(jti, decoded.userId);
    setCookies(req, res, accessToken, refreshToken);

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.log('Error in refreshToken controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// 6901fd8358e33119b7022262
//6901fd8358e33119b7022262
