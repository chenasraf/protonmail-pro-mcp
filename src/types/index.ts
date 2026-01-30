/**
 * Type definitions for Proton Mail MCP Server
 */

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface ProtonMailConfig {
  smtp: SMTPConfig;
  imap: IMAPConfig;
  debug: boolean;
  cacheEnabled: boolean;
  analyticsEnabled: boolean;
  autoSync: boolean;
  syncInterval: number;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Attachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

export interface Email {
  id: string;
  messageId?: string;
  from: EmailAddress[];
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  html?: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
  attachments?: Attachment[];
  headers?: Record<string, string>;
}

export interface Folder {
  name: string;
  path: string;
  delimiter: string;
  totalMessages: number;
  unreadMessages: number;
  children?: Folder[];
}

export interface Contact {
  email: string;
  name?: string;
  sentCount: number;
  receivedCount: number;
  lastInteraction: Date;
}

export interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  sentEmails: number;
  receivedEmails: number;
  starredEmails: number;
  folderCounts: Record<string, number>;
}

export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  priority?: 'high' | 'normal' | 'low';
  replyTo?: string;
  attachments?: Attachment[];
}

export interface SearchOptions {
  query?: string;
  folder?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}
