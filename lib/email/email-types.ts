// Email specific types as requested
import { NextRequest } from "next/server";

export interface EmailPayload {
  identity: string;
  email?: string;
  message: string;
}

export interface EmailMetadata {
  timestamp: string;
  ipHash: string;
  userAgent: string;
  environment: string;
}

export interface ValidationSuccess {
  valid: true;
}

export interface ValidationFailure {
  valid: false;
  errors: string[];
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export interface SecurityFlags {
    honeypot: boolean;
    linkDensity: number;
    rateLimited: boolean;
    fastSubmission: boolean;
    profanity: boolean;
}

export interface SecurityResult {
    allowed: boolean;
    severity: 0 | 1 | 2;
    reason?: string;
    flags: SecurityFlags;
}

export interface LogEntry {
  status: "sent" | "blocked" | "failed";
  timestamp: string;
  validationPassed: boolean;
  messageId: string | null;
  ipHash: string;
  errorCode: string | null;
  relayUsed?: string;
  securityFlags?: SecurityFlags;
  debugContext?: unknown; 
}
