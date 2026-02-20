import { useState, useEffect, useRef } from 'react';
import { analyzeMessage, ScrutinyResult } from '@/lib/scrutiny';

const DEFAULT_RESULT: ScrutinyResult = {
    level: 0,
    score: 0,
    violations: [],
    offendingWords: [],
};

/**
 * useScrutiny — Real-time message scrutiny with debounce.
 * Runs analyzeMessage on the input text with a configurable debounce delay.
 * Returns the current ScrutinyResult and a convenience `isProfane` flag.
 *
 * @param text - The text to analyze
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 */
export function useScrutiny(text: string, debounceMs: number = 300) {
    const [scrutiny, setScrutiny] = useState<ScrutinyResult>(DEFAULT_RESULT);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Clear any pending debounce
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // If text is empty, reset immediately (no debounce needed)
        if (!text || !text.trim()) {
            setScrutiny(DEFAULT_RESULT);
            return;
        }

        // Debounced analysis
        timerRef.current = setTimeout(() => {
            const result = analyzeMessage(text);
            setScrutiny(result);
        }, debounceMs);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [text, debounceMs]);

    return {
        scrutiny,
        isProfane: scrutiny.level >= 2,
    };
}
