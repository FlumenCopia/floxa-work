import nodemailer from 'nodemailer';
import { ENV } from '../../config/env.js';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  category?: 'auth' | 'notification' | 'security_alert';
  attachments?: Array<{ filename: string; content?: Buffer; path?: string; contentType?: string }>;
  fromName?: string;
  replyTo?: string;
}

export interface EmailServiceStatus {
  provider: string;
  configured: boolean;
  fromAddress: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeEmailError(error: any): string {
  if (!error) return 'Unknown email transmission error';
  const rawMsg = typeof error === 'string' ? error : (error.message || String(error));

  if (rawMsg.includes('not configured')) return 'Email service is not configured.';
  if (rawMsg.includes('recipient') || rawMsg.includes('No valid recipient')) {
    return 'No valid recipient email address available.';
  }
  if (rawMsg.includes('ETIMEDOUT') || rawMsg.includes('timeout') || rawMsg.includes('ECONNREFUSED')) {
    return 'Connection to email gateway failed or timed out.';
  }
  if (rawMsg.includes('auth') || rawMsg.includes('credential') || rawMsg.includes('535') || rawMsg.includes('Invalid login')) {
    return 'Email provider authentication failed.';
  }
  if (rawMsg.includes('quota') || rawMsg.includes('rate limit') || rawMsg.includes('421') || rawMsg.includes('451')) {
    return 'Email provider rate limit exceeded.';
  }

  // Strip filesystem paths and passwords/credentials
  let sanitized = rawMsg
    .replace(/[A-Za-z]:\\[^\s"'\\]+(?:\\[^\s"'\\]+)*/g, '[path]')
    .replace(/\/(?:[^\s"'\/]+\/)+[^\s"'\/]+/g, '[path]')
    .replace(/pass(?:word)?\s*[:=]\s*[^\s]+/gi, 'password=[redacted]')
    .replace(/user(?:name)?\s*[:=]\s*[^\s]+/gi, 'user=[redacted]');

  if (sanitized.length > 200 || /token|secret|key|bearer/i.test(sanitized)) {
    return 'Email transmission failed due to provider error.';
  }

  return sanitized;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const user = ENV.SMTP_USER;
    const pass = ENV.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_SECURE,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
      });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, subject, text, html, attachments, fromName, replyTo } = options;

    if (!this.isConfigured || !this.transporter) {
      console.warn(`[FLOXA Email Alert] SMTP not configured. Logged email to ${to}: "${subject}"`);
      return {
        success: true,
        messageId: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
    }

    const senderName = (fromName || 'FLOXA Work').trim();
    const fromAddress = `"${senderName}" <${ENV.SMTP_USER}>`;

    try {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to,
        replyTo: replyTo || undefined,
        subject,
        text: text || '',
        html: html || undefined,
        attachments: attachments || undefined,
      });

      console.log(`[Email Service (SMTP)] Dispatched email to ${to} (MessageId: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      const cleanError = sanitizeEmailError(err);
      console.error(`[Email Service Error] Failed to send email to ${to}:`, cleanError);
      return {
        success: false,
        error: cleanError,
      };
    }
  }

  async sendPasswordResetEmail(user: { email: string; name?: string }, rawToken: string, baseUrlOverride?: string) {
    if (!user || !user.email) return;

    const effectiveBase = (baseUrlOverride || ENV.FRONTEND_BASE_URL || 'https://work.flumenx.in').replace(/\/+$/, '');
    const resetUrl = `${effectiveBase}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const userName = user.name || 'there';

    const subject = 'Reset Your FLOXA Work Password';
    const text = `Hello ${userName},

We received a request to reset your password for your FLOXA Work account.

Click the link below to choose a new password:
${resetUrl}

This link is valid for 1 hour.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The FLOXA Work Team
https://work.flumenx.in`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0b1329; color: #f1f5f9; border-radius: 12px; border: 1px solid rgba(0, 132, 255, 0.25);">
        <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 8px;">
          <h2 style="margin: 0; color: #0084ff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">FLOXA <span style="background: #0084ff; color: #ffffff; font-size: 10px; padding: 2px 6px; border-radius: 4px; vertical-align: middle; text-transform: uppercase;">WORK</span></h2>
        </div>
        <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">Password Reset Request</h3>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Hello <strong style="color: #f1f5f9;">${escapeHtml(userName)}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
          We received a request to reset the password for your FLOXA Work account. Click the button below to choose a new password:
        </p>
        <div style="margin-bottom: 28px;">
          <a href="${escapeHtml(resetUrl)}" style="background-color: #0084ff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            Reset My Password &rarr;
          </a>
        </div>
        <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 1.5; color: #64748b;">
          Or copy and paste this link into your browser:<br/>
          <a href="${escapeHtml(resetUrl)}" style="color: #38bdf8; word-break: break-all;">${escapeHtml(resetUrl)}</a>
        </p>
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #475569; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px;">
          This link will expire in 1 hour. If you did not request this reset, your account is secure and no action is required.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html,
      category: 'security_alert',
    });
  }

  async sendPasswordChangedNotification(user: { email: string; name?: string }) {
    if (!user || !user.email) return;

    const userName = user.name || 'there';
    const subject = 'Your FLOXA Work Password Was Changed';
    const text = `Hello ${userName},

This is confirmation that the password for your FLOXA Work account (${user.email}) was recently changed.

If you made this change, you can safely disregard this email.

If you did NOT make this change, please reset your password immediately or contact support.

Best regards,
The FLOXA Work Team`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0b1329; color: #f1f5f9; border-radius: 12px; border: 1px solid rgba(0, 132, 255, 0.25);">
        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0; color: #0084ff; font-size: 20px; font-weight: 700;">FLOXA <span style="background: #0084ff; color: #ffffff; font-size: 10px; padding: 2px 6px; border-radius: 4px; vertical-align: middle;">WORK</span></h2>
        </div>
        <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px;">Security Alert: Password Changed</h3>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Hello <strong style="color: #f1f5f9;">${escapeHtml(userName)}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
          The password for your FLOXA Work account was successfully updated. All active sessions have been securely closed.
        </p>
        <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 12px;">
          If you did not perform this change, please request a password reset immediately.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html,
      category: 'security_alert',
    });
  }

  getStatus(): EmailServiceStatus {
    return {
      provider: 'smtp',
      configured: this.isConfigured,
      fromAddress: ENV.SMTP_USER ? `FLOXA Work <${ENV.SMTP_USER}>` : ENV.EMAIL_FROM,
    };
  }
}

export const emailService = new EmailService();
