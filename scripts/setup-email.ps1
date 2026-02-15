# Quick Email Setup Script for TensorThrottleX
# This script helps you create the .env.local file interactively

Write-Host "`n🚀 TensorThrottleX Email Setup Wizard`n" -ForegroundColor Cyan

Write-Host "Choose your email provider:`n" -ForegroundColor Yellow
Write-Host "1. Gmail (Easiest for testing)" -ForegroundColor White
Write-Host "2. Resend (Recommended for production)" -ForegroundColor White
Write-Host "3. SendGrid" -ForegroundColor White
Write-Host "4. Custom SMTP" -ForegroundColor White
Write-Host "5. Skip (I'll configure manually)`n" -ForegroundColor White

$choice = Read-Host "Enter choice (1-5)"

$envContent = ""

switch ($choice) {
    "1" {
        Write-Host "`n📧 Gmail Setup`n" -ForegroundColor Cyan
        Write-Host "Before continuing, generate an App Password:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://myaccount.google.com/apppasswords" -ForegroundColor White
        Write-Host "2. Select app: Mail" -ForegroundColor White
        Write-Host "3. Select device: Other (Custom name)" -ForegroundColor White
        Write-Host "4. Click Generate`n" -ForegroundColor White
        
        $email = Read-Host "Enter your Gmail address"
        $password = Read-Host "Enter your 16-character App Password (no spaces)" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        
        $envContent = @"
# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=$email
EMAIL_PASS=$passwordPlain
"@
    }
    "2" {
        Write-Host "`n🎯 Resend Setup`n" -ForegroundColor Cyan
        Write-Host "Before continuing:" -ForegroundColor Yellow
        Write-Host "1. Sign up at: https://resend.com" -ForegroundColor White
        Write-Host "2. Go to API Keys section" -ForegroundColor White
        Write-Host "3. Create a new API key`n" -ForegroundColor White
        
        $apiKey = Read-Host "Enter your Resend API key (starts with re_)" -AsSecureString
        $apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey))
        
        Write-Host "`nFor production, verify your domain in Resend dashboard`n" -ForegroundColor Yellow
        
        $fromEmail = Read-Host "Enter FROM email (e.g., secure@tensorthrottlex.in)"
        if ([string]::IsNullOrWhiteSpace($fromEmail)) {
            $fromEmail = "secure@tensorthrottlex.in"
        }
        
        $envContent = @"
# Resend API Configuration
EMAIL_SERVICE=resend
RESEND_API_KEY=$apiKeyPlain
RESEND_FROM_EMAIL=$fromEmail
"@
    }
    "3" {
        Write-Host "`n📮 SendGrid Setup`n" -ForegroundColor Cyan
        Write-Host "Before continuing:" -ForegroundColor Yellow
        Write-Host "1. Sign up at: https://sendgrid.com" -ForegroundColor White
        Write-Host "2. Create an API key in Settings > API Keys`n" -ForegroundColor White
        
        $apiKey = Read-Host "Enter your SendGrid API key (starts with SG.)" -AsSecureString
        $apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey))
        
        $envContent = @"
# SendGrid SMTP Configuration
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=$apiKeyPlain
"@
    }
    "4" {
        Write-Host "`n🔧 Custom SMTP Setup`n" -ForegroundColor Cyan
        
        $host = Read-Host "Enter SMTP host (e.g., smtp.example.com)"
        $port = Read-Host "Enter SMTP port (default: 587)"
        if ([string]::IsNullOrWhiteSpace($port)) {
            $port = "587"
        }
        $user = Read-Host "Enter SMTP username"
        $password = Read-Host "Enter SMTP password" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        
        $envContent = @"
# Custom SMTP Configuration
EMAIL_HOST=$host
EMAIL_PORT=$port
EMAIL_USER=$user
EMAIL_PASS=$passwordPlain
"@
    }
    "5" {
        Write-Host "`n📝 Skipping automatic setup." -ForegroundColor Yellow
        Write-Host "Please manually create .env.local file." -ForegroundColor White
        Write-Host "See .env.local.example for reference.`n" -ForegroundColor White
        exit
    }
    default {
        Write-Host "`n❌ Invalid choice. Exiting.`n" -ForegroundColor Red
        exit
    }
}

# Write to .env.local
$envPath = Join-Path $PSScriptRoot ".env.local"

if (Test-Path $envPath) {
    Write-Host "`n⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "`n❌ Setup cancelled.`n" -ForegroundColor Red
        exit
    }
}

$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host "`n✅ .env.local created successfully!`n" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: pnpm dev" -ForegroundColor White
Write-Host "2. Navigate to the Msg section" -ForegroundColor White
Write-Host "3. Send a test message`n" -ForegroundColor White

Write-Host "🔒 Security reminder: .env.local is in .gitignore and won't be committed.`n" -ForegroundColor Yellow
