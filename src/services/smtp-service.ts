/**
 * SMTP Service for sending emails via Proton Mail
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { ProtonMailConfig, SendEmailOptions, Attachment } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { parseEmails, isValidEmail } from '../utils/helpers.js';

export class SMTPService {
  private transporter: Transporter;
  private config: ProtonMailConfig;
  private isConnected: boolean = false;

  constructor(config: ProtonMailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.username,
        pass: config.smtp.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.isConnected = true;
      logger.info('SMTP connection verified successfully', 'SMTPService');
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error('SMTP connection verification failed', 'SMTPService', error);
      throw error;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<{ messageId: string; accepted: string[] }> {
    const toAddresses = parseEmails(options.to);
    const ccAddresses = parseEmails(options.cc);
    const bccAddresses = parseEmails(options.bcc);

    // Validate email addresses
    const allAddresses = [...toAddresses, ...ccAddresses, ...bccAddresses];
    for (const addr of allAddresses) {
      if (!isValidEmail(addr)) {
        throw new Error(`Invalid email address: ${addr}`);
      }
    }

    if (toAddresses.length === 0) {
      throw new Error('At least one recipient is required');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.config.smtp.username,
      to: toAddresses.join(', '),
      subject: options.subject,
    };

    if (ccAddresses.length > 0) {
      mailOptions.cc = ccAddresses.join(', ');
    }

    if (bccAddresses.length > 0) {
      mailOptions.bcc = bccAddresses.join(', ');
    }

    if (options.isHtml) {
      mailOptions.html = options.body;
    } else {
      mailOptions.text = options.body;
    }

    if (options.replyTo) {
      mailOptions.replyTo = options.replyTo;
    }

    if (options.priority) {
      mailOptions.priority = options.priority;
    }

    if (options.attachments && options.attachments.length > 0) {
      mailOptions.attachments = options.attachments.map((att: Attachment) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
        encoding: att.encoding || 'base64',
      }));
    }

    try {
      logger.debug(`Sending email to: ${toAddresses.join(', ')}`, 'SMTPService');
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${result.messageId}`, 'SMTPService');
      return {
        messageId: result.messageId,
        accepted: result.accepted as string[],
      };
    } catch (error) {
      logger.error('Failed to send email', 'SMTPService', error);
      throw error;
    }
  }

  async sendTestEmail(to: string, customMessage?: string): Promise<{ messageId: string }> {
    const result = await this.sendEmail({
      to,
      subject: '🧪 Proton Mail MCP Test Email',
      body: customMessage || `
Hello!

This is a test email from the Sirency Proton Mail MCP Server.

If you received this email, your SMTP configuration is working correctly!

Sent at: ${new Date().toISOString()}

Best regards,
Proton Mail MCP Server
      `.trim(),
      isHtml: false,
    });

    return { messageId: result.messageId };
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    this.transporter.close();
    this.isConnected = false;
    logger.info('SMTP connection closed', 'SMTPService');
  }
}
