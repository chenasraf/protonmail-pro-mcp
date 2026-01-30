/**
 * Helper utilities for Proton Mail MCP Server
 */

/**
 * Parse comma-separated email addresses into an array
 */
export function parseEmails(emails: string | string[] | undefined): string[] {
  if (!emails) return [];
  if (Array.isArray(emails)) return emails.filter(e => e && e.trim());
  return emails.split(',').map(e => e.trim()).filter(e => e);
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format email address for display
 */
export function formatEmailAddress(name: string | undefined, address: string): string {
  if (name) {
    return `"${name}" <${address}>`;
  }
  return address;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
