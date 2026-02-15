# Portfolio Content Engine - Setup Guide

This is a production-ready Next.js 16 portfolio powered by **Notion** as a CMS and **Supabase** for comments.

## Quick Start

### 1. Install Dependencies

The required dependencies have been added to `package.json`:
- `@notionhq/client` - Notion SDK
- `@supabase/supabase-js` - Supabase client

Dependencies will auto-install when you first run the dev server.

### 2. Set Up Notion CMS

#### Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "Create new integration"
3. Name it "Portfolio Engine"
4. Copy the **Internal Integration Token** (this is your `NOTION_TOKEN`)

#### Create Your Notion Database

1. Create a new Notion page
2. Add a database with these properties:

| Property | Type | Description |
|----------|------|-------------|
| **title** | Title | Post title |
| **slug** | Text | URL slug (unique) |
| **category** | Select | Post category |
| **published** | Checkbox | Publish toggle |
| **date** | Date | Publication date (optional, uses created_at as fallback) |
| **excerpt** | Text | Short description |
| **coverImage** | URL | Cover image URL (optional) |

3. Share the database with your integration:
   - Click the 3-dot menu → "Add connections" → Select your integration
4. Copy the database ID from the URL: `https://notion.so/{DATABASE_ID}?v=...`

### 3. Set Up Supabase

#### Create Database Table

1. Log in to [Supabase](https://supabase.com)
2. Go to SQL Editor
3. Run the script from `/scripts/setup-supabase.sql`:

```sql
-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_expires_at ON comments(expires_at);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read non-expired comments" ON comments
  FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Allow insert comments" ON comments
  FOR INSERT
  WITH CHECK (TRUE);
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Notion CMS
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id

# Supabase Comments
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Project

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your portfolio.

## File Structure

```
/app
  page.tsx                 # Homepage with feed
  layout.tsx              # Root layout
  /post/[slug]/page.tsx   # Post detail page
  /category/[slug]/page.tsx # Category page
  /about/page.tsx         # About page
  /api
    /comments/route.ts    # Comments API (GET/POST)
    /posts/route.ts       # Posts pagination API

/components
  /layout                 # Structural layout components
    LabNavigation.tsx     # Navigation with categories
    LabContainer.tsx      # Three-layer background system
    ContentPanel.tsx      # Floating content workspace
  /content                # Post and feed components
    LabFeed.tsx           # Infinite scroll feed
    LabPostCard.tsx       # Individual post card card
    CommentSection.tsx    # Comments UI
  /dashboard              # Dashboard and bento components
  /visuals                # Interactive and visual elements
  /forms                  # Form components
  /providers              # Context providers
  /ui                     # Shadcn/UI primitives

/lib
  notion.ts               # Notion SDK integration
  supabase.ts             # Supabase client
  utils.ts                # Helper functions

/types
  post.ts                 # Post & Comment types

/scripts
  setup-supabase.sql      # Database migration
```

## Features

✅ **Notion-Powered CMS**
- Write posts in Notion
- Publish/unpublish with checkbox
- Categories, excerpts, cover images
- Auto-revalidate every 5 minutes (ISR)

✅ **Homepage Feed**
- Infinite scroll pagination
- 6 posts per batch
- Floating card design

✅ **Dynamic Categories**
- `/category/[slug]` routes
- Filter posts by category
- Navbar updates dynamically

✅ **Post Detail Pages**
- Full Notion content rendering
- Cover images, code blocks, headings
- Breadcrumb navigation

✅ **Comments System**
- Anonymous comments (name + message)
- Auto-expire after 7 days
- Rate limited (1 per IP per 5 min)
- Max 500 characters per comment
- No likes/replies/threading

✅ **Stability & Error Handling**
- Comments failure doesn't block page
- Notion failure gracefully returns empty array
- Try/catch on all integrations
- Loading states on client components

## Customization

### Change Design
- Update colors in `/app/globals.css`
- Modify Tailwind classes in components
- Adjust spacing and typography

### Change Content Structure
Edit the property mapping in `/lib/notion.ts` `normalizePage()` function.

### Adjust Comment Settings
- Max message length: `CommentSection.tsx` line 11
- Rate limit window: `/app/api/comments/route.ts` line 25
- Expiration days: `/lib/supabase.ts` line 34

## Deployment

### To Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

ISR caching works automatically with Vercel.

## Troubleshooting

**Posts not showing?**
- Check `NOTION_TOKEN` and `NOTION_DATABASE_ID` in `.env.local`
- Verify database is shared with integration
- Check posts have `published = true`

**Comments not working?**
- Verify Supabase URL and anon key
- Check `comments` table exists in Supabase
- Look for browser console errors

**Images not loading?**
- Use absolute URLs in Notion
- Check CORS headers
- Verify Notion image links are public

## API Routes

### GET /api/posts
Fetch paginated posts.

Query params:
- `page` (default: 1)
- `limit` (default: 6)

### GET /api/comments
Fetch comments for a post.

Query params:
- `slug` (required) - Post slug

### POST /api/comments
Create a comment.

Body:
```json
{
  "postSlug": "my-post",
  "name": "John",
  "message": "Great post!"
}
```

## Performance Notes

- **ISR**: Pages revalidate every 5 minutes
- **Caching**: Notion SDK caches responses
- **Pagination**: Client-side slicing (no refetch of all data)
- **Comments**: Supabase queries filtered by expiration

## Security

✅ Never expose Notion token (server-only)
✅ Supabase anon key is safe to expose (RLS enabled)
✅ Comments sanitized (HTML removed)
✅ Rate limiting on comment creation
✅ No user authentication needed

---

Built with Next.js 16, Notion API, and Supabase.
