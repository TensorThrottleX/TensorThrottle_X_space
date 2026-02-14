# Deployment Checklist

## Before Deploying

### Environment Variables ✅
- [ ] `NOTION_TOKEN` set in Vercel env
- [ ] `NOTION_DATABASE_ID` set in Vercel env
- [ ] `SUPABASE_URL` set in Vercel env
- [ ] `SUPABASE_ANON_KEY` set in Vercel env

### Supabase Setup ✅
- [ ] Database tables created (run `scripts/setup-supabase.sql`)
- [ ] Comments table exists with proper RLS
- [ ] Auto-expiration triggers configured (7 days)

### Notion Setup ✅
- [ ] Notion database shared with integration token
- [ ] Database has required properties:
  - `title` (Title)
  - `slug` (Rich text - unique)
  - `date` (Date)
  - `published` (Checkbox)
  - `category` (Select)
  - `excerpt` (Rich text)
  - `coverImage` (URL)

---

## What Changed

### Fixed
1. **Notion Sorting** (CRITICAL)
   - Changed `property: created_time` → `timestamp: created_time`
   - File: `lib/notion.ts`

2. **Pagination Scalability**
   - Implemented cursor-based pagination
   - Handles unlimited posts
   - File: `lib/notion.ts`

3. **Comments Validation**
   - Name: 50 char limit (was unlimited)
   - Slug: 100 char limit with validation
   - Better HTML sanitization
   - File: `app/api/comments/route.ts`

4. **Infinite Scroll** (MAJOR)
   - IntersectionObserver implementation
   - Cursor-based backend pagination
   - Prevent duplicate fetches
   - Error recovery with retry
   - File: `components/Feed.tsx`, `app/api/posts/route.ts`

5. **Rate Limiting**
   - Added memory cleanup mechanism
   - Prevents unbounded Map growth
   - Documented best-effort nature
   - File: `app/api/comments/route.ts`

6. **Stability**
   - Graceful degradation across components
   - Structured JSON responses
   - Better error messages
   - Files: `app/api/comments/route.ts`, `app/api/posts/route.ts`

---

## After Deployment

### Immediate Verification (1-2 min)
```bash
# Check homepage loads
curl https://your-domain.com

# Check posts API
curl https://your-domain.com/api/posts

# Check comments (needs slug)
curl https://your-domain.com/api/comments?slug=test-post
```

### Functional Testing (5 min)
- [ ] Homepage displays posts with correct sorting (newest first)
- [ ] Scroll to bottom → posts auto-load
- [ ] Manual "Load more" button works
- [ ] No duplicate posts appear
- [ ] Comments form accepts input
- [ ] Comment submission succeeds
- [ ] Rate limit prevents rapid submissions
- [ ] Navigation to post detail pages works
- [ ] Category filtering works
- [ ] About page loads

### Edge Cases (10 min)
- [ ] Try submitting comment twice quickly → second blocked
- [ ] Try HTML in comment → tags stripped
- [ ] Try message > 500 chars → rejected
- [ ] Try name > 50 chars → rejected
- [ ] Delete a post in Notion → disappears on next refresh
- [ ] Disable Supabase connection → comments UI still loads

---

## Performance Checklist

- [ ] Lighthouse performance score > 80
- [ ] ISR revalidation working (posts refresh every 5 min)
- [ ] Cold start < 1s
- [ ] Notion API calls < 200ms
- [ ] Supabase queries < 100ms
- [ ] No N+1 queries

---

## Monitoring

Watch for in first 24 hours:

1. **Notion API Errors**
   - Monitor `lib/notion.ts` logs
   - Check for sorting/pagination failures

2. **Supabase Errors**
   - Monitor rate limit cleanup
   - Check comment insertion success rate

3. **Feed Loading**
   - Verify cursor pagination works
   - Check for race conditions in infinite scroll

4. **Rate Limiting**
   - Monitor for false positives
   - Check Map memory usage

---

## Rollback Plan

If critical issue found:

1. Revert to previous commit
2. Check git diff for specific change that broke it
3. Review relevant test case
4. Fix and redeploy

Critical files to monitor:
- `lib/notion.ts` - Sorting/pagination
- `app/api/posts/route.ts` - API structure
- `components/Feed.tsx` - Infinite scroll
- `app/api/comments/route.ts` - Validation

---

## Support

**Issue?** Check these first:

1. **Posts not showing?**
   - Verify `NOTION_DATABASE_ID` correct
   - Check Notion properties exist
   - Verify at least one post has `published = true`

2. **Comments not working?**
   - Verify `scripts/setup-supabase.sql` was executed
   - Check Supabase RLS policies
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` correct

3. **Infinite scroll not working?**
   - Check browser console for fetch errors
   - Verify `cursor` parameter in API requests
   - Check rate limiting not blocking requests

4. **Sorting wrong?**
   - Verify `timestamp: 'created_time'` in lib/notion.ts
   - Check Notion `date` field populated on posts

---

**Deployment ready!** 🚀
