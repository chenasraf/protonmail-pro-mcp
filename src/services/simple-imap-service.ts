/**
 * Simple IMAP Service for reading emails via Proton Bridge
 */

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import type { Email, Folder, SearchOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { generateId } from '../utils/helpers.js';

export class SimpleIMAPService {
  private client: ImapFlow | null = null;
  private isConnected: boolean = false;
  private emailCache: Map<string, Email> = new Map();
  private folderCache: Folder[] = [];

  async connect(): Promise<void> {
    const host = process.env.PROTONMAIL_IMAP_HOST || 'localhost';
    const port = parseInt(process.env.PROTONMAIL_IMAP_PORT || '1143', 10);
    const username = process.env.PROTONMAIL_USERNAME || '';
    const password = process.env.PROTONMAIL_PASSWORD || '';

    this.client = new ImapFlow({
      host,
      port,
      secure: false,
      auth: {
        user: username,
        pass: password,
      },
      logger: false,
      tls: {
        rejectUnauthorized: false, // ProtonMail Bridge uses self-signed certificates
      },
    });

    try {
      await this.client.connect();
      this.isConnected = true;
      logger.info('IMAP connection established', 'IMAPService');
    } catch (error) {
      this.isConnected = false;
      logger.error('IMAP connection failed', 'IMAPService', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.logout();
      this.isConnected = false;
      this.client = null;
      logger.info('IMAP connection closed', 'IMAPService');
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  async getFolders(): Promise<Folder[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('IMAP not connected');
    }

    try {
      const mailboxes = await this.client.list();
      this.folderCache = mailboxes.map(mb => ({
        name: mb.name,
        path: mb.path,
        delimiter: mb.delimiter,
        totalMessages: 0,
        unreadMessages: 0,
      }));
      return this.folderCache;
    } catch (error) {
      logger.error('Failed to get folders', 'IMAPService', error);
      throw error;
    }
  }

  async getEmails(folder: string = 'INBOX', limit: number = 50, offset: number = 0): Promise<Email[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('IMAP not connected');
    }

    const emails: Email[] = [];

    try {
      const lock = await this.client.getMailboxLock(folder);
      try {
        const status = await this.client.status(folder, { messages: true });
        const total = status.messages || 0;

        if (total === 0) {
          return emails;
        }

        const start = Math.max(1, total - offset - limit + 1);
        const end = Math.max(1, total - offset);

        if (start > end) {
          return emails;
        }

        for await (const message of this.client.fetch(`${start}:${end}`, {
          envelope: true,
          source: true,
          flags: true,
        })) {
          try {
            if (!message.source) continue;
            const parsed = await simpleParser(message.source);
            const email = this.parsedMailToEmail(parsed, message, folder);
            emails.push(email);
            this.emailCache.set(email.id, email);
          } catch (parseError) {
            logger.warn('Failed to parse email', 'IMAPService', parseError);
          }
        }
      } finally {
        lock.release();
      }
    } catch (error) {
      logger.error('Failed to get emails', 'IMAPService', error);
      throw error;
    }

    return emails.reverse();
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    if (this.emailCache.has(emailId)) {
      return this.emailCache.get(emailId) || null;
    }
    return null;
  }

  async searchEmails(options: SearchOptions): Promise<Email[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('IMAP not connected');
    }

    const folder = options.folder || 'INBOX';
    const emails: Email[] = [];

    try {
      const lock = await this.client.getMailboxLock(folder);
      try {
        // Build search query
        const searchQuery: Record<string, unknown> = {};

        if (options.from) {
          searchQuery.from = options.from;
        }
        if (options.to) {
          searchQuery.to = options.to;
        }
        if (options.subject) {
          searchQuery.subject = options.subject;
        }
        if (options.isRead === true) {
          searchQuery.seen = true;
        } else if (options.isRead === false) {
          searchQuery.unseen = true;
        }
        if (options.isStarred === true) {
          searchQuery.flagged = true;
        }
        if (options.dateFrom) {
          searchQuery.since = options.dateFrom;
        }
        if (options.dateTo) {
          searchQuery.before = options.dateTo;
        }

        // If no criteria, search all
        if (Object.keys(searchQuery).length === 0) {
          searchQuery.all = true;
        }

        const results = await this.client.search(searchQuery as any);

        const limit = options.limit || 100;
        if (!results || !Array.isArray(results) || results.length === 0) {
          return emails;
        }
        const uids = results.slice(-limit);

        for await (const message of this.client.fetch(uids, {
          envelope: true,
          source: true,
          flags: true,
        })) {
          try {
            if (!message.source) continue;
            const parsed = await simpleParser(message.source);
            const email = this.parsedMailToEmail(parsed, message, folder);

            // Additional filtering for query text
            if (options.query) {
              const queryLower = options.query.toLowerCase();
              const matchesQuery =
                email.subject.toLowerCase().includes(queryLower) ||
                email.body.toLowerCase().includes(queryLower);
              if (!matchesQuery) continue;
            }

            emails.push(email);
            this.emailCache.set(email.id, email);
          } catch (parseError) {
            logger.warn('Failed to parse email in search', 'IMAPService', parseError);
          }
        }
      } finally {
        lock.release();
      }
    } catch (error) {
      logger.error('Failed to search emails', 'IMAPService', error);
      throw error;
    }

    return emails;
  }

  async markAsRead(emailId: string, isRead: boolean = true): Promise<void> {
    logger.info(`Mark as read not fully implemented: ${emailId} -> ${isRead}`, 'IMAPService');
    const email = this.emailCache.get(emailId);
    if (email) {
      email.isRead = isRead;
    }
  }

  async starEmail(emailId: string, isStarred: boolean = true): Promise<void> {
    logger.info(`Star email not fully implemented: ${emailId} -> ${isStarred}`, 'IMAPService');
    const email = this.emailCache.get(emailId);
    if (email) {
      email.isStarred = isStarred;
    }
  }

  async moveEmail(emailId: string, targetFolder: string): Promise<void> {
    logger.info(`Move email not fully implemented: ${emailId} -> ${targetFolder}`, 'IMAPService');
  }

  async deleteEmail(emailId: string): Promise<void> {
    logger.info(`Delete email not fully implemented: ${emailId}`, 'IMAPService');
    this.emailCache.delete(emailId);
  }

  async syncFolder(folder: string): Promise<void> {
    await this.getEmails(folder, 100, 0);
    logger.info(`Synced folder: ${folder}`, 'IMAPService');
  }

  clearCache(): void {
    this.emailCache.clear();
    this.folderCache = [];
    logger.info('Cache cleared', 'IMAPService');
  }

  private extractAddresses(addressField: unknown): { name?: string; address: string }[] {
    if (!addressField) return [];

    // Handle AddressObject (has 'value' property with array of addresses)
    const field = addressField as any;
    if (field.value && Array.isArray(field.value)) {
      return field.value.map((addr: any) => ({
        name: addr.name,
        address: addr.address || '',
      }));
    }

    // Handle array of AddressObject
    if (Array.isArray(field)) {
      return field.flatMap((item: any) => {
        if (item.value && Array.isArray(item.value)) {
          return item.value.map((addr: any) => ({
            name: addr.name,
            address: addr.address || '',
          }));
        }
        return [];
      });
    }

    return [];
  }

  private parsedMailToEmail(parsed: any, message: any, folder: string): Email {
    const flags = message.flags || new Set();

    return {
      id: message.uid?.toString() || generateId(),
      messageId: parsed.messageId,
      from: this.extractAddresses(parsed.from),
      to: this.extractAddresses(parsed.to),
      cc: this.extractAddresses(parsed.cc),
      subject: parsed.subject || '(No Subject)',
      body: parsed.text || '',
      html: parsed.html || undefined,
      date: parsed.date || new Date(),
      isRead: flags.has('\\Seen'),
      isStarred: flags.has('\\Flagged'),
      folder,
      attachments: parsed.attachments?.map((att: any) => ({
        filename: att.filename || 'attachment',
        content: att.content.toString('base64'),
        contentType: att.contentType,
      })),
    };
  }
}
