/**
 * Next.js Instrumentation — runs once when the server starts.
 * Used to pre-warm the ML classifier model so the first user request
 * doesn't suffer a 30-60s cold start.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
    // Only warm up on the server (Node.js runtime), not on Edge
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            const { warmUpClassifier } = await import('@/lib/moderation/classifier');
            // Fire and forget — don't block server startup
            warmUpClassifier().then((ready) => {
                if (ready) {
                    console.log('[Instrumentation] ML Classifier pre-warmed successfully.');
                } else {
                    console.warn('[Instrumentation] ML Classifier warm-up incomplete, will finish in background.');
                }
            });
        } catch (error) {
            console.warn('[Instrumentation] Failed to initiate classifier warm-up:', error);
        }
    }
}
