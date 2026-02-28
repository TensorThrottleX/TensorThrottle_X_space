// Email Sending Service (Resend ONLY)
import { Resend } from 'resend';
import { EmailPayload, EmailMetadata } from './email-types';
import { sanitizeContent, enrichMetadata } from './email-guard';
import { NextRequest } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL || process.env.PRIMARY_FROM_EMAIL || 'onboarding@resend.dev';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(
  req: NextRequest,
  payload: EmailPayload
): Promise<SendResult> {

  // 1. Initialize Client
  if (!RESEND_API_KEY) {
    console.error('[EMAIL] CRITICAL: RESEND_API_KEY Missing');
    return { success: false, error: 'Configuration Error' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: `TensorThrottleX <${FROM_EMAIL}>`,
      to: process.env.EMAIL_RECIPIENT || 'tensorthrottleX@proton.me',
      replyTo: payload.email, // Dynamic Reply-To allowed
      subject: `[Project Contact] Message from ${sanitizeContent(payload.identity)}`,
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"> 
      <title>New Contact Message</title>
    </head>
    <body style="font-family: monospace; background: #111; color: #eee; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #222; padding: 30px; border-radius: 8px;">
        <h2 style="color: #64f4ac; margin-top: 0;">[Project Contact]</h2>
        
        <div style="margin: 20px 0; padding: 15px; background: #333; border-left: 4px solid #64f4ac;">
          <p style="margin: 0; color: #aaa; font-size: 12px;">SENDER IDENTITY</p>
          <strong style="color: #fff; font-size: 16px;">${sanitizeContent(payload.identity)}</strong>
          <br/>
          <span style="color: #888; font-size: 14px;">${payload.email ? sanitizeContent(payload.email) : 'Not Provided'}</span>
        </div>

        <div style="margin: 20px 0;">
          <p style="margin: 0; color: #aaa; font-size: 12px; margin-bottom: 8px;">MESSAGE</p>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #ddd;">${sanitizeContent(payload.message)}</div>
        </div>

        <hr style="border: 0; border-top: 1px solid #444; margin: 30px 0;" />

        <table style="width: 100%; font-size: 11px; color: #666;">
          <tr><td>TIMESTAMP</td><td style="text-align: right;">${new Date().toISOString()}</td></tr>
          <tr><td>ENV</td><td style="text-align: right;">${process.env.NODE_ENV || 'development'}</td></tr>
        </table>
      </div>
    </body>
    </html>
    `,
      text: `Sender: ${sanitizeContent(payload.identity)} (${payload.email ? sanitizeContent(payload.email) : 'Not Provided'})\n\nMessage:\n${sanitizeContent(payload.message)}`, // Plain text fallback
      tags: [
        { name: 'category', value: 'contact_form' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' }
      ]
    });

    if (result.error) {
      // Log raw error internally, but return generic failure
      console.error('[EMAIL] Resend API Error:', JSON.stringify(result.error));
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };

  } catch (e: any) {
    console.error('[EMAIL] Network/Unexpected Error:', e);
    return { success: false, error: e.message || 'Unknown Error' };
  }
}
