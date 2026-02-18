# Vercel Deployment Guide for TensorThrottleX

## 1. Environment Variables
Your application relies on several environment variables to function correctly. When you import your project into Vercel, you **MUST** add the following variables in the **Settings > Environment Variables** section.

**Copy these values from your local `.env.local` file:**

| Variable | Description |
| :--- | :--- |
| `NOTION_TOKEN` | Your Notion Integration Token. |
| `NOTION_DATABASE_ID` | The ID of your Notion Database. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL for comments/likes. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key. |
| `RESEND_API_KEY` | Your PROD Resend API Key. |
| `RESEND_FROM` | `contact@tensorthrottlex.in` (Your verified domain). |
| `EMAIL_RECIPIENT` | `tensorthrottleX@proton.me,bhattayush.tech@gmail.com` |
| `EMAIL_USER` | Your Gmail Address (for fallback). |
| `EMAIL_PASS` | Your Gmail App Password (for fallback). |

> **Note:** Do NOT commit your `.env.local` file to GitHub. It is securely ignored. You must manually input these into Vercel.

## 2. Build Settings (Vercel)
Vercel should automatically detect Next.js.
*   **Framework Preset:** Next.js
*   **Build Command:** `next build`
*   **Install Command:** `npm install` (or `pnpm install`)
*   **Output Directory:** `.next`

## 3. Domain Configuration
1.  Go to **Vercel Project Settings > Domains**.
2.  Add your domain `tensorthrottlex.in`.
3.  Vercel will provide DNS records (A Record and CNAME).
4.  Login to **Hostinger** and update your DNS records to point to Vercel.
    *   *Note:* You likely already did this if you set up `ns1.vercel-dns.com` nameservers!

## 4. Email Verification
*   Ensure your `RESEND_FROM` variable in Vercel matches exactly what you verified in Resend (`contact@tensorthrottlex.in`).
*   If you see "Identity mismatch" errors, check this variable first.

## 5. Media Assets
*   Your background videos and audio are in `public/media`.
*   The API route `/api/media` reads these files dynamically.
*   Next.js on Vercel usually handles this fine, but if you notice backgrounds missing, ensure the `public` folder is committed to Git (it should be).

## Checklist Before Push
- [ ] All code committed to GitHub?
- [ ] `.env.local` variables copied to a safe place (or open)?
- [ ] `npm run build` ran successfully locally (Optional but recommended)?

---
**Ready to Deploy!** 🚀
