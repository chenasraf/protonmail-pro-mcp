/**
 * Logger utility for Proton Mail MCP Server
 */

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

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
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

    switch (level) {
      case 'debug':
        console.error(`${timestamp} DEBUG ${prefix} ${message}`);
        break;
      case 'info':
        console.error(`${timestamp} INFO ${prefix} ${message}`);
        break;
      case 'warn':
        console.error(`${timestamp} WARN ${prefix} ${message}`);
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
