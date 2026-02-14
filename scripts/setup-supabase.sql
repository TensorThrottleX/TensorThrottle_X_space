-- Create comments table for the portfolio
-- This table stores user comments with auto-expiration

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_expires_at ON comments(expires_at);

-- Enable RLS if needed
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read non-expired comments
CREATE POLICY "Allow read non-expired comments" ON comments
  FOR SELECT
  USING (expires_at > NOW());

-- Allow anyone to insert comments
CREATE POLICY "Allow insert comments" ON comments
  FOR INSERT
  WITH CHECK (TRUE);
