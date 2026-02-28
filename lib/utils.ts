import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date in IST (India Standard Time) 
 * Returns: 2026.02.12 | 5:30
 */
export function formatIST(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'WHILE_AGO';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return 'WHILE_AGO';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  };

  const parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(date);
  const p: Record<string, string> = {};
  parts.forEach(({ type, value }) => { p[type] = value; });

  return `${p.year}.${p.month}.${p.day} | ${p.hour}:${p.minute}`;
}

/**
 * Safely retrieve and sanitize environment variables.
 * Automatically strips whitespace and hidden characters (like \r from scripts).
 */
export function getEnv(key: string, defaultValue = ''): string {
  const value = process.env[key];
  if (!value) return defaultValue;
  // Strip control characters, whitespace, and carriage returns
  return value.replace(/[\x00-\x1F\x7F]/g, "").trim();
}

