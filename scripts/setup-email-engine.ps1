# ============================================
# EMAIL TRANSMISSION ENGINE - QUICK SETUP
# ============================================
# This script helps you set up the email configuration

Write-Host "🔒 Email Transmission Engine - Quick Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local already exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "📋 Choose your email provider:" -ForegroundColor Green
Write-Host "  1. Resend API (Recommended for production)" -ForegroundColor White
Write-Host "  2. SMTP (Gmail, SendGrid, etc.)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    # Resend Configuration
    Write-Host ""
    Write-Host "🚀 Resend API Configuration" -ForegroundColor Cyan
    Write-Host "----------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Sign up at https://resend.com" -ForegroundColor Yellow
    Write-Host "2. Get your API key from the dashboard" -ForegroundColor Yellow
    Write-Host "3. Verify your domain in the Resend dashboard" -ForegroundColor Yellow
    Write-Host ""

    $apiKey = Read-Host "Enter your Resend API key (re_...)"
    $primaryEmail = Read-Host "Enter your primary sender email (e.g., secure@tensorthrottlex.in)"
    
    if ([string]::IsNullOrWhiteSpace($primaryEmail)) {
        $primaryEmail = "secure@tensorthrottlex.in"
    }

    $fallbackEmail = Read-Host "Enter fallback sender email (press Enter for default: secure@tensorthrottlex.in)"
    if ([string]::IsNullOrWhiteSpace($fallbackEmail)) {
        $fallbackEmail = "secure@tensorthrottlex.in"
    }

    $recipient = Read-Host "Enter recipient email (press Enter for default: tensorthrottleX@proton.me)"
    if ([string]::IsNullOrWhiteSpace($recipient)) {
        $recipient = "tensorthrottleX@proton.me"
    }

    # Create .env.local
    $envContent = @"
# Email Transmission Engine Configuration
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

EMAIL_SERVICE=resend
RESEND_API_KEY=$apiKey
PRIMARY_FROM_EMAIL=$primaryEmail
FALLBACK_FROM_EMAIL=$fallbackEmail
EMAIL_RECIPIENT=$recipient
"@

    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host ""
    Write-Host "✅ Configuration saved to .env.local" -ForegroundColor Green

}
elseif ($choice -eq "2") {
    # SMTP Configuration
    Write-Host ""
    Write-Host "📧 SMTP Configuration" -ForegroundColor Cyan
    Write-Host "---------------------" -ForegroundColor Cyan
    Write-Host ""

    $smtpHost = Read-Host "Enter SMTP host (e.g., smtp.gmail.com)"
    $smtpPort = Read-Host "Enter SMTP port (default: 587)"
    if ([string]::IsNullOrWhiteSpace($smtpPort)) {
        $smtpPort = "587"
    }

    $user = Read-Host "Enter SMTP username/email"
    $pass = Read-Host "Enter SMTP password" -AsSecureString
    $passPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass))

    $recipient = Read-Host "Enter recipient email (press Enter for default: tensorthrottleX@proton.me)"
    if ([string]::IsNullOrWhiteSpace($recipient)) {
        $recipient = "tensorthrottleX@proton.me"
    }

    # Create .env.local
    $envContent = @"
# Email Transmission Engine Configuration
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

EMAIL_HOST=$smtpHost
EMAIL_PORT=$smtpPort
EMAIL_USER=$user
EMAIL_PASS=$passPlain
EMAIL_RECIPIENT=$recipient
"@

    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host ""
    Write-Host "✅ Configuration saved to .env.local" -ForegroundColor Green

}
else {
    Write-Host "❌ Invalid choice. Setup cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start dev server: npm run dev" -ForegroundColor White
Write-Host "  2. Test health check: http://localhost:3000/api/email-health" -ForegroundColor White
Write-Host "  3. Send test message through your contact form" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Never commit .env.local to version control!" -ForegroundColor Yellow
Write-Host ""
