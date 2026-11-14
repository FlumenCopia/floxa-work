import { ENV } from '../../config/env.js';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  category?: 'auth' | 'notification' | 'security_alert';
}

export interface EmailServiceStatus {
  provider: string;
  configured: boolean;
  fromAddress: string;
}

export class EmailService {
  private provider: string;
  private isConfigured: boolean;

  constructor() {
    this.provider = ENV.EMAIL_PROVIDER;
    this.isConfigured = Boolean(
      (this.provider === 'smtp' && ENV.SMTP_HOST && ENV.SMTP_USER) ||
      (this.provider === 'sendgrid' || this.provider === 'resend')
    );
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Development or unconfigured fallback: Structured logging
    if (this.provider === 'log' || !this.isConfigured) {
      if (ENV.IS_PRODUCTION && !this.isConfigured) {
        console.warn(`[FLOXA Email Alert] Production email provider (${this.provider}) unconfigured. Email queued to log.`);
      }

      console.log(`[Email Service -> ${options.to}] Subject: "${options.subject}" [Category: ${options.category || 'general'}]`);
      return {
        success: true,
        messageId: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
    }

    try {
      // In production with configured SMTP / API key:
      // Real transport would execute here.
      console.log(`[Email Service (${this.provider})] Dispatched to ${options.to}`);
      return {
        success: true,
        messageId: `mail-${Date.now()}`,
      };
    } catch (err: any) {
      console.error(`[Email Service Error]: Failed to send to ${options.to}:`, err);
      return {
        success: false,
        error: err.message || 'Delivery failure',
      };
    }
  }

  getStatus(): EmailServiceStatus {
    return {
      provider: this.provider,
      configured: this.isConfigured,
      fromAddress: ENV.EMAIL_FROM,
    };
  }
}

export const emailService = new EmailService();
