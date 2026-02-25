// Lazy-loaded classifier — avoids importing @xenova/transformers at build time
// which causes native module failures on Vercel's serverless build environment.

export interface ToxicityScore {
    label: string;
    score: number;
}

// Timeout for model loading / inference (ms)
const MODEL_TIMEOUT_MS = 15_000; // 15 seconds max wait per request
const WARMUP_TIMEOUT_MS = 60_000; // 60 seconds for initial warm-up (model download)

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't settle
 * within the specified duration.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`[Classifier] ${label} timed out after ${ms}ms`));
        }, ms);

        promise
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

// Singleton for the classifier
class ToxicityClassifier {
    static instance: any = null;
    static loadingPromise: Promise<any> | null = null;
    static isReady: boolean = false;
    static loadFailed: boolean = false;

    // Using Xenova/multilingual-toxic-xlm-roberta for multilingual support
    // If not available, fallback to Xenova/toxic-bert
    static modelName = 'Xenova/multilingual-toxic-xlm-roberta';

    static async getInstance(timeoutMs: number = MODEL_TIMEOUT_MS) {
        if (this.instance) return this.instance;
        if (this.loadFailed) return null; // Don't retry after permanent failure

        // If already loading, wait for the existing promise (avoids duplicate downloads)
        if (this.loadingPromise) {
            return withTimeout(this.loadingPromise, timeoutMs, 'Waiting for model load');
        }

        // Start loading
        this.loadingPromise = this._loadModel();

        try {
            this.instance = await withTimeout(this.loadingPromise, timeoutMs, 'Model loading');
            this.isReady = true;
            return this.instance;
        } catch (error) {
            // Don't null out loadingPromise if it's still downloading in background
            // (warm-up will complete it). Only null if it actually failed.
            if (this.loadingPromise) {
                this.loadingPromise.then((inst) => {
                    this.instance = inst;
                    this.isReady = true;
                    console.warn('[Classifier] Background model load completed.');
                }).catch(() => {
                    this.loadingPromise = null;
                    this.loadFailed = true;
                    console.error('[Classifier] Background model load failed permanently.');
                });
            }
            throw error;
        }
    }

    private static async _loadModel() {
        try {
            // Dynamic import to avoid importing native modules at build time
            const { pipeline, env } = await import('@xenova/transformers');

            // Configure environment for serverless compatibility (Vercel)
            env.allowLocalModels = false;
            env.useBrowserCache = false;

            console.warn(`[Classifier] Loading model: ${this.modelName}...`);
            const inst = await pipeline('text-classification', this.modelName, {
                quantized: true,
            });
            console.warn('[Classifier] Multilingual model loaded successfully.');
            return inst;
        } catch (error) {
            console.warn(`[Classifier] Failed to load ${this.modelName}, falling back to toxic-bert:`, error);
            try {
                const { pipeline } = await import('@xenova/transformers');
                const inst = await pipeline('text-classification', 'Xenova/toxic-bert', {
                    quantized: true,
                });
                console.warn('[Classifier] Fallback model loaded successfully.');
                return inst;
            } catch (fallbackError) {
                console.error('[Classifier] Failed to load fallback model:', fallbackError);
                throw fallbackError;
            }
        }
    }

    /**
     * Pre-warm the model. Called at server startup.
     * Uses a longer timeout since this runs in the background.
     */
    static async warmUp(): Promise<boolean> {
        try {
            console.warn('[Classifier] Warm-up: Starting model pre-load...');
            await this.getInstance(WARMUP_TIMEOUT_MS);
            console.warn('[Classifier] Warm-up: Model ready.');
            return true;
        } catch (error) {
            console.warn('[Classifier] Warm-up: Model not ready yet, will continue loading in background.');
            return false;
        }
    }
}

/**
 * Classify text for toxicity. Returns empty array if model isn't ready
 * or times out (graceful degradation — heuristics still protect).
 */
export async function classifyText(text: string): Promise<ToxicityScore[]> {
    if (!text || text.trim().length === 0) return [];

    try {
        const classifier = await ToxicityClassifier.getInstance();
        if (!classifier) return []; // Model failed to load, degrade gracefully

        const results = await withTimeout(
            classifier(text, { topk: null }),
            MODEL_TIMEOUT_MS,
            'Inference'
        );

        // Flatten if strictly needed, but usually it returns [ {label, score}, ... ]
        return Array.isArray(results) ? results.flat() : [];
    } catch (error) {
        console.warn('[Classifier] classifyText failed (timeout or error), returning empty:', error instanceof Error ? error.message : error);
        return []; // Graceful degradation — lexicon + heuristics still work
    }
}

/**
 * Export warm-up function for use in instrumentation or API health checks.
 */
export async function warmUpClassifier(): Promise<boolean> {
    return ToxicityClassifier.warmUp();
}
