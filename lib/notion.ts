import { Client } from '@notionhq/client'
import type { Post } from '@/types/post'

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID || ''

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY CACHE — avoids redundant Notion API calls
// TTL: 60s (matches ISR revalidation period)
// This prevents N+1 calls when feed, category, and posts API
// all call getAllPosts() within the same revalidation window.
// ═══════════════════════════════════════════════════════════════
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL_MS = 60_000 // 60 seconds
let postsCache: CacheEntry<Post[]> | null = null

function getCachedPosts(): Post[] | null {
  if (!postsCache) return null
  if (Date.now() - postsCache.timestamp > CACHE_TTL_MS) {
    postsCache = null
    return null
  }
  return postsCache.data
}

function setCachedPosts(posts: Post[]): void {
  postsCache = { data: posts, timestamp: Date.now() }
}

/**
 * Fetch all published posts from Notion database with pagination
 * Filters: published = true
 * Sort: date descending (timestamp fallback)
 * 
 * CRITICAL FIX:
 * - Changed 'property: created_time' to 'timestamp: created_time' (correct Notion syntax)
 * - Implemented cursor-based pagination to handle databases > 100 items
 * - Fetches all pages until has_more is false
 */
export async function getAllPosts(): Promise<Post[]> {
  // Return cached data if valid
  const cached = getCachedPosts()
  if (cached) return cached

  if (!DATABASE_ID || !process.env.NOTION_TOKEN) {
    console.error('Notion configuration missing')
    return []
  }

  const allResults: any[] = []
  let cursor: string | undefined = undefined

  try {
    // Paginate through all results
    while (true) {
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        filter: {
          property: 'published',
          checkbox: {
            equals: true,
          },
        },
        sorts: [
          {
            property: 'date',
            direction: 'descending',
          },
          {
            timestamp: 'created_time',
            direction: 'descending',
          },
        ],
        start_cursor: cursor,
        page_size: 100, // Max allowed by Notion API
      })

      allResults.push(...response.results)

      // Stop if no more results
      if (!response.has_more) {
        break
      }

      cursor = response.next_cursor || undefined
    }

    // Normalize all findings
    const ALLOWED_CATEGORIES = ['thoughts', 'projects', 'experiments', 'manifold'];

    const posts = allResults
      .map((page: any) => normalizePage(page))
      .filter(post => {
        const cat = post.category ? post.category.trim().toLowerCase() : '';
        return ALLOWED_CATEGORIES.includes(cat);
      });

    // Cache the result
    setCachedPosts(posts)
    return posts

  } catch (error) {
    console.error('Failed to fetch posts from Notion:', error)
    return []
  }
}


/**
 * Fetch single post by slug with full content blocks
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!DATABASE_ID || !process.env.NOTION_TOKEN) {
    console.error('Notion configuration missing')
    return null
  }

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: 'slug',
            rich_text: {
              equals: slug,
            },
          },
          {
            property: 'published',
            checkbox: {
              equals: true,
            },
          },
        ],
      },
    })

    if (response.results.length === 0) {
      return null
    }

    const page = response.results[0] as any
    const post = normalizePage(page)

    // Fetch full content blocks
    const blocks = await notion.blocks.children.list({
      block_id: page.id,
    })

    post.content = blocks.results

    return post
  } catch (error) {
    console.error(`Failed to fetch post by slug "${slug}":`, error)
    return null
  }
}

/**
 * Fetch posts filtered by category
 * Uses in-memory filtering for robustness against Notion schema types (Select vs Text)
 */
export async function getPostsByCategory(category: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  // Filter by category case-insensitively and trim for robustness
  const realPosts = allPosts.filter(post =>
    post.category.trim().toLowerCase() === category.trim().toLowerCase()
  );

  return realPosts;
}

/**
 * Get all unique categories
 * Optimized: Reuses cached getAllPosts() instead of making a separate API call
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    const allPosts = await getAllPosts();
    const categories = new Set<string>()
    allPosts.forEach(post => {
      if (post.category) categories.add(post.category)
    })
    return Array.from(categories).sort()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

/**
 * Normalize Notion page to Post type
 */
function normalizePage(page: any): Post {
  const properties = page.properties;

  // 1. Find the TITLE property
  // Robust method: Find the one property with type="title"
  // This handles typos like "titlle" or arbitrary renames like "Name"
  const titleKey = Object.keys(properties).find(key => properties[key].type === 'title') || 'title';
  const titleProp = properties[titleKey];

  // DEBUG: Print all property keys to identify the correct cover name
  // console.log('DEBUG: Post Properties Keys:', Object.keys(properties));

  // 2. Find the CATEGORY property
  // Robust method: Check keys case-insensitively
  const categoryKey = Object.keys(properties).find(key => key.toLowerCase() === 'category') || 'category';
  const categoryProp = properties[categoryKey];

  // Helper to extract category regardless of type (Select, Multi-Select, or Rich Text)
  const extractCategory = (prop: any): string => {
    if (!prop) return 'Uncategorized';
    if (prop.type === 'select') return prop.select?.name?.trim() || 'Uncategorized';
    if (prop.type === 'multi_select') return prop.multi_select?.[0]?.name?.trim() || 'Uncategorized';
    if (prop.type === 'rich_text') return extractText(prop.rich_text)?.trim() || 'Uncategorized';
    return 'Uncategorized';
  };

  // Helper to extract image URL safely from ANY property type
  const extractCoverImage = (prop: any): string | undefined => {
    if (!prop) return undefined;

    // 1. Handle "Files & Media" (files)
    if (prop.type === 'files' && prop.files?.length > 0) {
      const file = prop.files[0];
      return file.type === 'external' ? file.external.url : file.file?.url;
    }

    // 2. Handle "URL" property
    if (prop.type === 'url') {
      return prop.url || undefined;
    }

    // 3. Handle "Text" / "Rich Text" property (User pasted URL in text column)
    if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
      return prop.rich_text[0].plain_text || undefined;
    }

    // 4. Handle "Title" property (unlikely for cover image, but robust)
    if (prop.type === 'title' && prop.title?.length > 0) {
      return prop.title[0].plain_text || undefined;
    }

    return undefined;
  };

  const getProp = (key: string) => properties[key] || properties[key.toLowerCase()];

  // Ultra-robust fuzzy search for cover image property
  // Finds any property containing "cover" or "image" in its name (e.g. "Cover", "coverimage", "Header Image")
  const coverKey = Object.keys(properties).find(key =>
    key.toLowerCase().includes('cover') ||
    (key.toLowerCase().includes('image') && key.toLowerCase() !== 'slug') // Avoid 'slug' if it oddly contains image? No, mostly fine.
  );

  const coverProp = coverKey ? properties[coverKey] : undefined;

  return {
    id: page.id,
    title: extractText(titleProp?.title) || 'Untitled',
    slug: extractText(getProp('slug')?.rich_text) || '',
    category: extractCategory(categoryProp),
    excerpt: extractText(getProp('excerpt')?.rich_text) || '',
    coverImage: extractCoverImage(coverProp),
    publishedAt: getProp('date')?.date?.start || page.created_time,
    content: [], // Will be populated separately if needed
  };
}

/**
 * Extract text from Notion rich text or title arrays
 */
function extractText(blocks?: any[]): string {
  if (!blocks || blocks.length === 0) return ''
  return blocks.map((block) => block.plain_text).join('')
}
