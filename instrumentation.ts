/**
 * Next.js Instrumentation — runs once when the server starts.
 * Used to pre-warm the ML classifier model so the first user request
 * doesn't suffer a 30-60s cold start.
 *
 * Optimization:
 * - DEV mode: Skip warm-up entirely. The model loads lazily on first use.
 *   This avoids competing with Turbopack for CPU/memory during compilation.
 * - PROD mode: Warm-up after 30s delay to allow initial page serves first.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
    // Only warm up on the server (Node.js runtime), not on Edge
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Skip warm-up during build phase
        if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
            return;
        }

        // DEV: Skip warm-up — model loads lazily on first moderation request.
        // This saves ~15s startup time and ~500MB memory during compilation.
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Instrumentation] DEV mode — ML warm-up deferred to first use.');
            return;
        }

        try {
            const { warmUpClassifier } = await import('@/lib/moderation/classifier');
            // PROD: Start warm-up after 30s to avoid competing with initial page serves
            setTimeout(() => {
                warmUpClassifier().then((ready) => {
                    if (ready) {
                        console.warn('[Instrumentation] ML Classifier pre-warmed in background.');
                    }
                }).catch(err => {
                    console.warn('[Instrumentation] Background warm-up failed:', err.message);
                });
            }, 30000);

            console.warn('[Instrumentation] ML Classifier warm-up scheduled (T+30s).');
        } catch (error) {
            console.warn('[Instrumentation] Failed to initiate classifier warm-up:', error);
        }
    }
}
