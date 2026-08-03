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
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' AND policyname = 'Allow read non-expired comments'
  ) THEN
    CREATE POLICY "Allow read non-expired comments" ON comments
      FOR SELECT
      USING (expires_at > NOW());
  END IF;
END $$;

-- Allow anyone to insert comments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' AND policyname = 'Allow insert comments'
  ) THEN
    CREATE POLICY "Allow insert comments" ON comments
      FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END $$;
