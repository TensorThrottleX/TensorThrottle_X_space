import { NextRequest, NextResponse } from 'next/server'

// [MSG_PAGE] – Rate limit storage (In-memory, reset on server restart)
const rateLimitMap = new Map<string, number>()

/**
 * [MSG_PAGE] – API Route to handle secure message transmissions
 * Workflow:
 * 1. Extract IP for rate limiting
 * 2. Validate payload
 * 3. Sanitize content
 * 4. Send email via external API
 */
export async function POST(req: NextRequest) {
    try {
        // [MSG_PAGE] – Identify sender for rate limiting (Using IP)
        const ip = req.headers.get('x-forwarded-for') || 'anonymous'
        const now = Date.now()
        const lastSent = rateLimitMap.get(ip) || 0

        if (now - lastSent < 60000) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait 60 seconds.' },
                { status: 429 }
            )
        }

        const { name, email, message, scrutinyScore, behaviorSignals } = await req.json()

        // [MSG_PAGE] – Authoritative Server-Side Scrutiny
        const { analyzeMessage } = await import('@/lib/scrutiny')
        const scrutiny = analyzeMessage(message)

        if (scrutiny.level >= 2) {
            console.warn(`[MSG_PAGE] Authoritative block: Level ${scrutiny.level} violation detected from IP ${ip}`)
            return NextResponse.json({
                error: 'Transmission blocked due to policy violations.',
                details: scrutiny.violations
            }, { status: 403 })
        }

        // [MSG_PAGE] – Validation logic
        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: 'Message content is required.' }, { status: 400 })
        }

        const wordCount = message.trim().split(/\s+/).filter(Boolean).length
        if (wordCount > 1000) {
            return NextResponse.json({ error: 'Message exceeds 1000 word limit.' }, { status: 400 })
        }

        // [MSG_PAGE] – Content sanitation
        const sanitizedMessage = message
            .replace(/<[^>]*>?/gm, '') // Remove HTML tags
            .replace(/[^\w\s\.\?\!\@\#\%\^\&\*\(\)\-\+\=\[\]\{\}\:\;\'\"\,\.\/]/gi, '') // Strip suspicious unicode if any
            .trim()

        const sanitizedName = name ? name.substring(0, 100).replace(/<[^>]*>?/gm, '') : 'Anonymous'
        const sanitizedEmail = email ? email.substring(0, 100).replace(/<[^>]*>?/gm, '') : 'Not provided'

        // [MSG_PAGE] – Sending email to owner
        // Using Resend API (Direct Fetch to avoid dependency overhead)
        const RESEND_API_KEY = process.env.RESEND_API_KEY
        const OWNER_EMAIL = process.env.OWNER_EMAIL || 'tensorthrottleX@proton.me'

        if (!RESEND_API_KEY) {
            console.warn('[MSG_PAGE] RESEND_API_KEY not configured. Logging to console.')
            console.log('--- NEW MESSAGE ---')
            console.log(`From: ${sanitizedName} (${sanitizedEmail})`)
            console.log(`Message: ${sanitizedMessage}`)
            console.log('-------------------')

            // Still mark as sent in dev if key is missing
            rateLimitMap.set(ip, now)
            return NextResponse.json({ success: true, message: 'Message logged (Dev Mode)' })
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'System <onboarding@resend.dev>',
                to: [OWNER_EMAIL],
                subject: `New Website Message from ${sanitizedName}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #22d3ee;">New Secure Transmission</h2>
                        <p><strong>Name:</strong> ${sanitizedName}</p>
                        <p><strong>Email:</strong> ${sanitizedEmail}</p>
                        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="white-space: pre-wrap; line-height: 1.6;">${sanitizedMessage}</p>
                    </div>
                `
            })
        })

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text()
            console.error('[MSG_PAGE] Resend API Error:', errorText)
            return NextResponse.json({ error: 'Failed to transmit message via secure relay.' }, { status: 500 })
        }

        // [MSG_PAGE] – Update rate limit map
        rateLimitMap.set(ip, now)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[MSG_PAGE] Internal Server Error:', error)
        return NextResponse.json({ error: 'Critical system error during transmission.' }, { status: 500 })
    }
}
