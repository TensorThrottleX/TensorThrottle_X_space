/**
 * Email System Test Script
 * 
 * This script tests the email configuration and sends a test email.
 * Run with: node test-email.mjs
 * 
 * Make sure your dev server is running first: pnpm dev
 */

const API_BASE = 'http://localhost:3000';

async function testEmailHealth() {
    console.log('\n🔍 Checking email configuration...\n');

    try {
        const response = await fetch(`${API_BASE}/api/email-health`);
        const data = await response.json();

        console.log(`Status: ${data.status}`);
        console.log(`Provider: ${data.provider}`);
        console.log(`Configured: ${data.configured ? '✅' : '❌'}\n`);

        data.details.forEach(detail => console.log(detail));

        if (!data.configured) {
            console.log('\n❌ Email not configured. Please run: .\\setup-email.ps1\n');
            return false;
        }

        console.log('\n✅ Email configuration looks good!\n');
        return true;
    } catch (error) {
        console.error('❌ Error checking email health:', error.message);
        console.log('\nMake sure your dev server is running: pnpm dev\n');
        return false;
    }
}

async function sendTestEmail() {
    console.log('📧 Sending test email...\n');

    const testData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is an automated test message from the TensorThrottleX email system. If you receive this, the system is working correctly!',
        h_field: '' // Honeypot field
    };

    try {
        const response = await fetch(`${API_BASE}/api/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Test email sent successfully!');
            console.log(`   Message: ${data.message}\n`);
            console.log('📬 Check tensorthrottleX@proton.me inbox\n');
            return true;
        } else {
            console.log(`❌ Failed to send test email`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error}\n`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending test email:', error.message);
        console.log('\nMake sure your dev server is running: pnpm dev\n');
        return false;
    }
}

async function main() {
    console.log('\n🚀 TensorThrottleX Email System Test\n');
    console.log('━'.repeat(50));

    // Step 1: Check configuration
    const isConfigured = await testEmailHealth();

    if (!isConfigured) {
        process.exit(1);
    }

    console.log('━'.repeat(50));

    // Step 2: Ask user if they want to send test email
    console.log('\nDo you want to send a test email to tensorthrottleX@proton.me?');
    console.log('This will count against your rate limit (3 per 5 minutes).\n');

    // In Node.js, we'll just send it automatically for testing
    // In a real scenario, you'd use readline to ask for confirmation

    const shouldSend = true; // Set to false if you don't want to auto-send

    if (shouldSend) {
        console.log('Proceeding with test email...\n');
        console.log('━'.repeat(50));
        await sendTestEmail();
    } else {
        console.log('Skipping test email send.\n');
    }

    console.log('━'.repeat(50));
    console.log('\n✨ Test complete!\n');
}

main().catch(console.error);
