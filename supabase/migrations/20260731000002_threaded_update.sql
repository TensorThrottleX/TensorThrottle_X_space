-- ═══════════════════════════════════════════════════════════════════════════
-- TensorThrottleX — Threaded Discussion Schema Extension
-- Safe, additive, idempotent migration. Run in the Supabase SQL editor.
-- Does NOT alter or remove any existing columns/queries.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Threading + lifecycle columns on `comments`
--    (parent_id is already used by the API — this closes the earlier schema gap)
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS edit_token TEXT;

-- Index for reply lookups and soft-delete filtering
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at) WHERE deleted_at IS NOT NULL;

-- 2. Likes (anonymous, fingerprint-keyed; one like per comment per fingerprint)
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_fingerprint ON comment_likes(fingerprint);

-- 3. Moderation reports (feed for the future admin/review queue)
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_created ON comment_reports(created_at DESC);

-- 4. Row-level security for the new tables (mirrors the existing comments RLS style)
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comment_likes' AND policyname = 'Allow read comment_likes'
  ) THEN
    CREATE POLICY "Allow read comment_likes" ON comment_likes FOR SELECT USING (TRUE);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comment_likes' AND policyname = 'Allow insert comment_likes'
  ) THEN
    CREATE POLICY "Allow insert comment_likes" ON comment_likes FOR INSERT WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comment_likes' AND policyname = 'Allow delete own comment_likes'
  ) THEN
    CREATE POLICY "Allow delete own comment_likes" ON comment_likes FOR DELETE USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comment_reports' AND policyname = 'Allow read comment_reports'
  ) THEN
    CREATE POLICY "Allow read comment_reports" ON comment_reports FOR SELECT USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comment_reports' AND policyname = 'Allow insert comment_reports'
  ) THEN
    CREATE POLICY "Allow insert comment_reports" ON comment_reports FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

-- 5. Moderation queue view — future admin surface over flagged content
CREATE OR REPLACE VIEW comment_moderation_queue AS
SELECT
  c.id,
  c.post_slug,
  c.name,
  c.message,
  c.created_at,
  c.risk_score,
  c.is_shadow_banned,
  c.metadata,
  (SELECT COUNT(*) FROM comment_reports r WHERE r.comment_id = c.id) AS report_count
FROM comments c
WHERE c.deleted_at IS NULL
  AND c.expires_at > NOW()
  AND (c.is_shadow_banned = TRUE OR c.metadata->>'review_state' IN ('queued', 'escalated') OR c.risk_score > 0);
