// [TRANSMISSION_ENGINE] — Multi-Relay Decoupled Service
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { EmailPayload } from './email-types';
import { sanitizeContent } from './email-guard';
import { NextRequest } from 'next/server';
import { getEnv } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Normalization (Ensures invisible chars don't break the system)
const RESEND_API_KEY = getEnv('RESEND_API_KEY');
const EMAIL_RECIPIENT = getEnv('EMAIL_RECIPIENT', 'tensorthrottleX@proton.me');
const FROM_EMAIL = getEnv('RESEND_FROM', 'onboarding@resend.dev');

// Secondary (Unbreakable SMTP)
const SMTP_HOST = getEnv('EMAIL_HOST');
const SMTP_PORT = parseInt(getEnv('EMAIL_PORT', '587'));
const SMTP_USER = getEnv('EMAIL_USER');
const SMTP_PASS = getEnv('EMAIL_PASS');

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  relay?: 'resend' | 'smtp' | 'none';
  stored?: boolean;
}

/**
 * [VAULT_SYSTEM] – Store message in Supabase before transmission
 */
async function storeInDatabase(payload: EmailPayload): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        identity: payload.identity,
        email: payload.email || null,
        message: payload.message,
        status: 'stored'
      });
    return !error;
  } catch (err) {
    console.error('[VAULT_ERROR] Database persistence failed:', err);
    return false;
  }
}

/**
 * [PRIMARY_RELAY] – Resend Dispatcher
 */
async function tryResend(payload: EmailPayload, html: string, text: string): Promise<SendResult> {
  if (!RESEND_API_KEY) return { success: false, error: 'API Key Missing' };

  const resend = new Resend(RESEND_API_KEY);
  const result = await resend.emails.send({
    from: `TensorThrottleX <${FROM_EMAIL}>`,
    to: EMAIL_RECIPIENT.split(',').map(e => e.trim()),
    replyTo: payload.email,
    subject: `[Project Contact] Message from ${sanitizeContent(payload.identity)}`,
    html,
    text,
    tags: [{ name: 'category', value: 'contact_form' }]
  });

  if (result.error) return { success: false, error: result.error.message };
  return { success: true, messageId: result.data?.id, relay: 'resend' };
}

/**
 * [SECONDARY_RELAY] – SMTP / Nodemailer (Unbreakable Fallback)
 */
async function trySMTP(payload: EmailPayload, html: string, text: string): Promise<SendResult> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return { success: false, error: 'SMTP Unconfigured' };

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  try {
    const info = await transporter.sendMail({
      from: `"TensorThrottleX" <${SMTP_USER}>`,
      to: EMAIL_RECIPIENT,
      replyTo: payload.email,
      subject: `[SMTP FALLBACK] Contact from ${payload.identity}`,
      html,
      text
    });
    return { success: true, messageId: info.messageId, relay: 'smtp' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendEmail(
  req: NextRequest,
  payload: EmailPayload
): Promise<SendResult> {

  // 1. [DATA_VAULT] - Persistence First
  // We save to Supabase before anything else so your message is never lost.
  const isStored = await storeInDatabase(payload);

  const html = `
    <body style="font-family: monospace; background: #111; color: #eee; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #222; padding: 30px; border-radius: 8px; border: 1px solid #444;">
        <h2 style="color: #64f4ac; margin-top: 0;">[Project Contact]</h2>
        <div style="margin: 20px 0; padding: 15px; background: #333; border-left: 4px solid #64f4ac;">
          <p style="margin: 0; color: #aaa; font-size: 11px;">SENDER</p>
          <strong style="color: #fff; font-size: 15px;">${sanitizeContent(payload.identity)}</strong>
          <br/><span style="color: #888; font-size: 13px;">${payload.email || 'Anonymous'}</span>
        </div>
        <div style="margin: 20px 0;">
          <p style="margin: 0; color: #aaa; font-size: 11px; margin-bottom: 8px;">MESSAGE</p>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #ddd;">${sanitizeContent(payload.message)}</div>
        </div>
        <div style="font-size: 10px; color: #555; margin-top: 30px; border-top: 1px solid #333; pt: 10px;">
          DECOUPLED_ENGINE_TRANSMISSION | ${new Date().toISOString()} | RECIPIENT: ${EMAIL_RECIPIENT}
        </div>
      </div>
    </body>
  `;
  const text = `SENDER: ${payload.identity}\nREPLY-TO: ${payload.email}\n\nMESSAGE:\n${payload.message}`;

  // 2. [PRIMARY_RELAY] - Resend
  let result = await tryResend(payload, html, text);

  // 3. [SECONDARY_RELAY] - SMTP Failover (THE UNBREAKABLE LINK)
  // If Resend fails, we immediately try the direct SMTP route.
  if (!result.success) {
    const primaryError = result.error;
    console.warn(`[RELAY_FAILOVER] Resend failed (${primaryError}). Initiating SMTP Fallback...`);

    const smtpResult = await trySMTP(payload, html, text);

    if (!smtpResult.success) {
      // Both failed. We return a status that confirms the vault status.
      return {
        ...smtpResult,
        error: isStored
          ? `Relay failure (Resend & SMTP). Message safely VAULTED in Database.`
          : `Total transmission failure. Primary: ${primaryError}, Fallback: ${smtpResult.error}`,
        stored: isStored
      };
    }
    result = smtpResult;
  }

  return { ...result, stored: isStored };
}
