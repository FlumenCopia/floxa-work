import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { Session } from '../models/Session.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { ENV } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { emailService } from '../services/email/emailService.js';

// Helper to hash refresh tokens
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper to create and store session
async function createSession(
  userId: any,
  familyId: string,
  userAgent: string = 'Unknown',
  ipAddress: string = '127.0.0.1'
): Promise<{ refreshToken: string; session: any }> {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await Session.create({
    userId,
    familyId,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
    lastActiveAt: new Date(),
  });

  return { refreshToken, session };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, handle, role, adminRole } = req.body;
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
      adminRole: role === 'admin' ? (adminRole || 'super_admin') : undefined,
    });

    if (user.role === 'freelancer' || user.role === 'dual') {
      await TalentProfile.create({
        userId: user._id,
        headline: 'Creative & Technical Consultant',
        bio: 'Passionate about delivering exceptional outcomes via discovery-first workflows.',
      });
    }

    // Access token (15m for production security, or longer if backward-compatible; using 15m with rotation)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole || (user.role === 'admin' ? 'super_admin' : undefined),
        name: user.name,
      },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Create session family & refresh token
    const familyId = crypto.randomUUID();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const { refreshToken } = await createSession(user._id, familyId, userAgent, ipAddress);

    await AuditLog.create({
      actorId: user._id,
      action: 'AUTH_REGISTER',
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email, role: user.role },
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      refreshToken,
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

    if (user.status === 'suspended') {
      res.status(403).json({
        error: `Account suspended. Reason: ${user.suspensionReason || 'Please contact platform administration.'}`,
        suspended: true,
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole || (user.role === 'admin' ? 'super_admin' : undefined),
        name: user.name,
      },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const familyId = crypto.randomUUID();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const { refreshToken } = await createSession(user._id, familyId, userAgent, ipAddress);

    await AuditLog.create({
      actorId: user._id,
      action: 'AUTH_LOGIN',
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    });

    res.json({
      message: 'Logged in successfully',
      token,
      refreshToken,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to login.' });
  }
}

export async function refreshTokenHandler(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required.' });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const existingSession = await Session.findOne({ refreshTokenHash: tokenHash });

    if (!existingSession) {
      res.status(401).json({ error: 'Invalid or unrecognized refresh token.' });
      return;
    }

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    // REUSE DETECTION: If this token was already revoked, someone is reusing an invalidated token!
    if (existingSession.isRevoked) {
      // Security compromise: revoke all sessions in this token family or for this user!
      await Session.updateMany({ userId: existingSession.userId }, { isRevoked: true });

      await AuditLog.create({
        actorId: existingSession.userId,
        action: 'AUTH_TOKEN_REUSE_DETECTED',
        targetType: 'Session',
        targetId: existingSession.id,
        ipAddress,
        userAgent,
        metadata: { familyId: existingSession.familyId, alert: 'Potential token theft. All sessions invalidated.' },
      });

      res.status(403).json({
        error: 'Security breach detected: refresh token reuse. All active sessions have been invalidated. Please log in again.',
      });
      return;
    }

    // Check expiration
    if (new Date() > existingSession.expiresAt) {
      res.status(401).json({ error: 'Refresh token has expired. Please log in again.' });
      return;
    }

    // Rotate token: invalidate the used session and issue a new one in the same family
    existingSession.isRevoked = true;
    await existingSession.save();

    const user = await User.findById(existingSession.userId);
    if (!user) {
      res.status(401).json({ error: 'User associated with session not found.' });
      return;
    }

    const newAccessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole || (user.role === 'admin' ? 'super_admin' : undefined),
        name: user.name,
      },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const { refreshToken: newRefreshToken } = await createSession(
      user._id,
      existingSession.familyId,
      userAgent,
      ipAddress
    );

    await AuditLog.create({
      actorId: user._id,
      action: 'AUTH_REFRESH_TOKEN',
      targetType: 'Session',
      targetId: existingSession.id,
      ipAddress,
      userAgent,
    });

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Token refresh failed.' });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await Session.findOneAndUpdate({ refreshTokenHash: tokenHash }, { isRevoked: true });
    } else if (req.user?.id) {
      // Revoke latest session for user
      await Session.updateMany({ userId: req.user.id }, { isRevoked: true });
    }

    if (req.user?.id) {
      await AuditLog.create({
        actorId: req.user.id,
        action: 'AUTH_LOGOUT',
        targetType: 'User',
        targetId: req.user.id,
        ipAddress,
        userAgent,
      });
    }

    res.json({ message: 'Logged out successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Logout failed.' });
  }
}

export async function getActiveSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sessions = await Session.find({
      userId: req.user.id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActiveAt: -1 });

    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve active sessions.' });
  }
}

export async function revokeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { sessionId } = req.params;
    const session = await Session.findOne({ _id: sessionId, userId: req.user.id });

    if (!session) {
      res.status(404).json({ error: 'Session not found or already revoked.' });
      return;
    }

    session.isRevoked = true;
    await session.save();

    await AuditLog.create({
      actorId: req.user.id,
      action: 'SESSION_REVOKED',
      targetType: 'Session',
      targetId: session.id,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown',
    });

    res.json({ message: 'Session revoked successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to revoke session.' });
  }
}

export async function revokeAllOtherSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentRefreshToken } = req.body;
    let excludeSessionId: any = null;

    if (currentRefreshToken) {
      const currentHash = hashToken(currentRefreshToken);
      const cur = await Session.findOne({ refreshTokenHash: currentHash });
      if (cur) excludeSessionId = cur._id;
    }

    const query: any = { userId: req.user.id, isRevoked: false };
    if (excludeSessionId) {
      query._id = { $ne: excludeSessionId };
    }

    await Session.updateMany(query, { isRevoked: true });

    await AuditLog.create({
      actorId: req.user.id,
      action: 'SESSIONS_REVOKE_OTHERS',
      targetType: 'User',
      targetId: req.user.id,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown',
    });

    res.json({ message: 'All other sessions have been revoked.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to revoke other sessions.' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Account enumeration prevention: always return identical success response
    if (!user) {
      res.json({
        message: 'If that email is registered, password reset instructions have been sent.',
      });
      return;
    }

    // Generate cryptographic token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);

    user.passwordResetTokenHash = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity
    await user.save();

    await AuditLog.create({
      actorId: user._id,
      action: 'PASSWORD_RESET_REQUEST',
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    });

    // Non-blocking transactional email dispatch
    emailService.sendEmail({
      to: user.email,
      subject: 'FLOXA Work — Password Reset Request',
      text: `Hello ${user.name},\n\nYou requested a password reset for your FLOXA Work account. Use the following token to reset your password within 1 hour:\n\n${resetToken}\n\nIf you did not request this, please ignore this email.`,
      category: 'security_alert',
    }).catch((err) => {
      console.warn('[Email Warning] Failed to dispatch password reset email:', err.message);
    });

    res.json({
      message: 'If that email is registered, password reset instructions have been sent.',
      ...(ENV.IS_PRODUCTION ? {} : { resetToken }), // Omitted in production to prevent account takeover
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Password reset request failed.' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and newPassword are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired password reset token.' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordResetTokenHash = undefined as any;
    user.passwordResetExpires = undefined as any;
    await user.save();

    // Security hardening: Revoke ALL sessions for this user upon password change
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: user._id,
      action: 'PASSWORD_RESET_SUCCESS',
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    });

    res.json({
      message: 'Password reset successfully. All active sessions have been closed. Please log in with your new password.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Password reset failed.' });
  }
}

export async function requestEmailVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(verificationToken);

    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Non-blocking transactional email dispatch
    emailService.sendEmail({
      to: user.email,
      subject: 'FLOXA Work — Verify Your Email Address',
      text: `Hello ${user.name},\n\nPlease verify your email address on FLOXA Work using the following token:\n\n${verificationToken}\n\nThis token will expire in 24 hours.`,
      category: 'auth',
    }).catch((err) => {
      console.warn('[Email Warning] Failed to dispatch email verification:', err.message);
    });

    res.json({
      message: 'Email verification token generated.',
      ...(ENV.IS_PRODUCTION ? {} : { verificationToken }), // Omitted in production
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to request email verification.' });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Verification token is required.' });
      return;
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired email verification token.' });
      return;
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined as any;
    user.emailVerificationExpires = undefined as any;
    await user.save();

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: user._id,
      action: 'EMAIL_VERIFIED',
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    });

    res.json({ message: 'Email address verified successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Email verification failed.' });
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


