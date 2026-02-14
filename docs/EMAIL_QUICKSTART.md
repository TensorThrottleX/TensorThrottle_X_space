# 🎯 Quick Start - Email Setup

## Your system is 99% ready! Just add email credentials.

### ⚡ Fastest Setup (2 minutes)

#### Option 1: Use Gmail

1. **Run the setup wizard:**
   ```powershell
   .\setup-email.ps1
   ```
   Choose option `1` and follow prompts.

2. **Start the server:**
   ```bash
   pnpm dev
   ```

3. **Test it:**
   - Open http://localhost:3000
   - Go to "Msg" section
   - Send a test message

#### Option 2: Use Resend (Production-Ready)

1. **Sign up:** https://resend.com (free)
2. **Get API key:** https://resend.com/api-keys
3. **Run setup wizard:**
   ```powershell
   .\setup-email.ps1
   ```
   Choose option `2` and paste your API key.

4. **Start & test:**
   ```bash
   pnpm dev
   ```

---

## 🔍 Verify Configuration

Check if your email is configured correctly:

```bash
# Start dev server
pnpm dev

# In browser, visit:
http://localhost:3000/api/email-health
```

**Expected response:**
```json
{
  "status": "ready",
  "provider": "SMTP (Nodemailer)" or "Resend API",
  "configured": true,
  "details": [
    "✅ EMAIL_HOST: smtp.gmail.com",
    "✅ EMAIL_USER: you***",
    ...
  ]
}
```

---

## 📚 Full Documentation

- **Complete Guide:** See `EMAIL_SETUP_GUIDE.md`
- **Environment Variables:** See `.env.local.example`

---

## 🐛 Troubleshooting

### "Transmission engine offline"
→ Run `.\setup-email.ps1` or manually create `.env.local`

### "Transmission failed"
→ Check credentials in `.env.local`
→ Visit `/api/email-health` to diagnose

### Email not arriving
→ Check spam folder
→ Verify email provider dashboard

---

## ✅ What's Already Built

Your system includes:

- ✅ **Backend API** (`/app/api/contact/route.ts`)
- ✅ **Frontend Form** (`/components/MsgView.tsx`)
- ✅ **Validation** (client + server)
- ✅ **Security** (rate limiting, honeypot, profanity filter)
- ✅ **Multiple Providers** (SMTP, Resend, SendGrid, etc.)
- ✅ **Error Handling** (comprehensive logging)
- ✅ **Professional Emails** (styled HTML templates)

**All you need:** Email credentials in `.env.local`

---

## 🚀 Production Deployment

When deploying to Vercel/Netlify:

1. Add environment variables in dashboard
2. Use the same variables from `.env.local`
3. For production, use Resend or SendGrid (not Gmail)

---

**Need help?** Check `EMAIL_SETUP_GUIDE.md` for detailed instructions.
