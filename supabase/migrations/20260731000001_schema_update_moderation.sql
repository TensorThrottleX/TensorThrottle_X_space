-- Run this in your Supabase SQL Editor to enable the advanced moderation features

-- 1. Add new columns to the comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS fingerprint TEXT,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 2. Create an index for faster moderation lookups
CREATE INDEX IF NOT EXISTS idx_comments_fingerprint ON comments(fingerprint);
CREATE INDEX IF NOT EXISTS idx_comments_is_shadow_banned ON comments(is_shadow_banned);

-- 3. (Optional) Create a view for Admins to see all comments including shadow banned ones
CREATE OR REPLACE VIEW admin_comments_view AS
SELECT * FROM comments;
