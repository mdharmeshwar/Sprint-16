import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { getMemoryUserByEmail, makeId, memoryUsers, useMemoryStore } from '../utils/memoryStore.js';
import { buildErrorResponse } from '../utils/response.js';

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  const normalizedEmail = String(email).toLowerCase();

  if (useMemoryStore()) {
    const existingUser = getMemoryUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json(buildErrorResponse('User already exists.', 'CONFLICT'));
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const user = {
      _id: makeId(),
      name: String(name),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryUsers.push(user);
    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json(buildErrorResponse('User already exists.', 'CONFLICT'));
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);
  const user = await User.create({ name: String(name), email: normalizedEmail, password: hashedPassword });

  const token = signToken(user._id.toString());

  return res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json(buildErrorResponse('Email and password are required.', 'VALIDATION_ERROR'));
  }

  const normalizedEmail = String(email).toLowerCase();

  if (useMemoryStore()) {
    const user = getMemoryUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json(buildErrorResponse('Invalid email or password.', 'UNAUTHORIZED'));
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json(buildErrorResponse('Invalid email or password.', 'UNAUTHORIZED'));
    }

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json(buildErrorResponse('Invalid email or password.', 'UNAUTHORIZED'));
  }

  const isMatch = await bcrypt.compare(String(password), user.password);
  if (!isMatch) {
    return res.status(401).json(buildErrorResponse('Invalid email or password.', 'UNAUTHORIZED'));
  }

  const token = signToken(user._id.toString());

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

export const getCurrentUser = async (req: any, res: Response) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: 'user',
    },
  });
};
