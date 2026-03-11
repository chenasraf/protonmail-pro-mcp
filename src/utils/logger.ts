/**
 * Logger utility for Proton Mail MCP Server
 */

import { appendFileSync } from 'fs';
import { resolve, isAbsolute } from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class LoggerClass {
  private debugMode: boolean = false;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private logFile: string | undefined = process.env.LOG_FILE
    ? isAbsolute(process.env.LOG_FILE)
      ? process.env.LOG_FILE
      : resolve(__dirname, '../..', process.env.LOG_FILE)
    : undefined;

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  private writeToFile(line: string): void {
    if (this.logFile) {
      try {
        appendFileSync(this.logFile, line + '\n');
      } catch {
        // ignore file write errors
      }
    }
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (level === 'debug' && !this.debugMode) {
      return;
    }

    const prefix = context ? `[${context}]` : '';
    const timestamp = entry.timestamp.toISOString();
    const levelStr = level.toUpperCase();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const line = `${timestamp} ${levelStr} ${prefix} ${message}${dataStr}`;

    this.writeToFile(line);

    switch (level) {
      case 'debug':
      case 'info':
      case 'warn':
        console.error(`${timestamp} ${levelStr} ${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${timestamp} ERROR ${prefix} ${message}`, data || '');
        break;
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data);
  }

  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }
    return filtered.slice(-limit);
  }

  clear(): void {
    this.logs = [];
  }
}

export const logger = new LoggerClass();
export { LoggerClass as Logger };
