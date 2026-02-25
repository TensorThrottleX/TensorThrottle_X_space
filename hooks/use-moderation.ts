import { useState, useRef, useCallback, useEffect } from 'react';

export interface ModerationResult {
  severity: 'normal' | 'moderate' | 'high';
  allow: boolean;
  scores: {
    normal: number;
    moderate: number;
    high: number;
  };
  duration_ms?: number;
}

// Request timeout (15s matches classifier timeout)
const MODERATION_TIMEOUT_MS = 15_000;

export function useModeration() {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkContent = useCallback(async (
    text: string, 
    options?: { context?: string, userId?: string }
  ): Promise<ModerationResult | null> => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout fallback
    const timeoutId = setTimeout(() => controller.abort(), MODERATION_TIMEOUT_MS);

    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          context: options?.context,
          userId: options?.userId
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Moderation service unavailable');
      }

      const result = await response.json();
      
      // Only update state if still mounted
      if (isMountedRef.current) {
        return result;
      }
      return null;
    } catch (err) {
      // Don't log abort errors (expected on unmount/new request)
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      console.error('Moderation verification failed:', err);
      if (isMountedRef.current) {
        setError('Unable to verify content safety. Please try again.');
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);

  return { isChecking, error, checkContent };
}
