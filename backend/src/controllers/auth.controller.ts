import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { ENV } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, handle, role } = req.body;
    if (!email || !password || !name || !handle) {
      res.status(400).json({ error: 'All fields (email, password, name, handle) are required.' });
      return;
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { handle: handle.toLowerCase() }],
    });
    if (existing) {
      res.status(409).json({ error: 'A user with that email or handle already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      handle: handle.toLowerCase(),
      role: role || 'dual',
    });

    if (user.role === 'freelancer' || user.role === 'dual') {
      await TalentProfile.create({
        userId: user._id,
        headline: 'Creative & Technical Consultant',
        bio: 'Passionate about delivering exceptional outcomes via discovery-first workflows.',
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to register user.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to login.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const profile = await TalentProfile.findOne({ userId: user._id });
    res.json({ user, profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
}

