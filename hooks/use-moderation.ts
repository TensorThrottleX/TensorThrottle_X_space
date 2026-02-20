import { useState } from 'react';

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

export function useModeration() {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkContent = async (text: string, options?: { context?: string, userId?: string }): Promise<ModerationResult | null> => {
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
      });

      if (!response.ok) {
        throw new Error('Moderation service unavailable');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Moderation verification failed:', err);
      setError('Unable to verify content safety. Please try again.');
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  return { isChecking, error, checkContent };
}
