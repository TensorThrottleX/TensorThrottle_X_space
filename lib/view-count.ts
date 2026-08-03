// View-count formatting only.
// Counts themselves are REAL data from the discussion_views table
// (lib/supabase.ts) — there are no placeholder/derived values anymore.

export function formatCompactCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}M`
  }
  if (n >= 1_000) {
    const v = n / 1_000
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}K`
  }
  return String(n)
}
