import { normalizeText } from './normalize';
import { getProfanityBoost } from './lexicon';
import { classifyText, ToxicityScore } from './classifier';

export type ModerationResult = {
    severity: 'normal' | 'moderate' | 'high';
    allow: boolean;
    scores: {
        normal: number;
        moderate: number;
        high: number;
    };
};

export async function moderateContent(text: string): Promise<ModerationResult> {
    // 1. Normalize
    const normalized = normalizeText(text);

    // 2. Lexicon Boost
    const boost = getProfanityBoost(normalized);

    // 3. Classifier
    let scoresRaw: ToxicityScore[] = [];
    try {
        scoresRaw = await classifyText(normalized);
    } catch (error) {
        console.error("Moderation classifier error:", error);
        // Fallback: use only lexicon boost + default 0 scores?
        // Or fail open/closed?
        // Let's assume 0 scores if model fails but lexicon matched.
    }

    // 4. Score Mapping
    // toxic-bert labels: toxic, severe_toxic, obscene, threat, insult, identity_hate
    const scoreMap: Record<string, number> = {};
    scoresRaw.forEach((item) => {
        scoreMap[item.label] = item.score;
    });

    const getScore = (key: string) => scoreMap[key] || 0;

    // High Severity Components: severe_toxic, threat, identity_hate
    // We use the maximum signal for the category
    let highProb = Math.max(
        getScore('severe_toxic'),
        getScore('threat'),
        getScore('identity_hate')
    );

    // Moderate Severity Components: toxic, obscene, insult
    let moderateProb = Math.max(
        getScore('toxic'),
        getScore('obscene'),
        getScore('insult')
    );

    // 5. Apply Boost
    highProb += boost.high;
    moderateProb += boost.moderate;

    // 6. Decision Logic (Thresholds)
    // Configurable thresholds could be environment variables, using hardcoded defaults for now per spec.
    const HIGH_THRESHOLD = 0.40; // Spec: 0.40
    const MODERATE_THRESHOLD = 0.60; // Spec: 0.60

    let severity: 'normal' | 'moderate' | 'high' = 'normal';
    let allow = true;

    if (highProb >= HIGH_THRESHOLD) {
        severity = 'high';
        allow = false;
    } else if (moderateProb >= MODERATE_THRESHOLD) {
        severity = 'moderate';
        allow = false;
    }

    // 7. Synthesize Normalized Scores for Output
    // Create a probability distribution that sums to ~1 for UI/Logging
    // We clamp raw probabilities to [0, 1] for the distribution calculation
    const clampedHigh = Math.min(highProb, 1);
    const clampedMod = Math.min(moderateProb, 1);

    // Estimate Normal probability as 1 - max(badness)
    const maxBadness = Math.max(clampedHigh, clampedMod);
    const estimatedNormal = Math.max(0, 1 - maxBadness);

    const sum = estimatedNormal + clampedMod + clampedHigh;
    // If sum is 0 (unlikely), default to normal=1
    const normFactors = sum > 0 ? sum : 1;

    const finalScores = {
        normal: estimatedNormal / normFactors,
        moderate: clampedMod / normFactors,
        high: clampedHigh / normFactors
    };

    return {
        severity,
        allow,
        scores: finalScores,
    };
}
