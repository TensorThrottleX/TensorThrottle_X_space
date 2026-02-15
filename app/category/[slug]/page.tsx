
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { LabContainer } from '@/components/layout/LabContainer'
import { LabNavigation } from '@/components/layout/LabNavigation'
import { CategoryPostCard } from '@/components/content/CategoryPostCard'
import { getPostsByCategory } from '@/lib/notion'

// ISR: Revalidate every 5 minutes
export const revalidate = 300

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

// Allowed categories (lowercase slug)
const VALID_CATEGORIES = ['thoughts', 'projects', 'experiments', 'manifold']

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params

  if (!VALID_CATEGORIES.includes(slug)) {
    return { title: 'Not Found' }
  }

  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1)

  return {
    title: categoryName,
    description: `Articles in the ${categoryName} category`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  // 1. Strict Route Validation
  if (!VALID_CATEGORIES.includes(slug)) {
    notFound()
  }

  // 2. Fetch posts
  const displayCategory = slug.charAt(0).toUpperCase() + slug.slice(1)
  const posts = await getPostsByCategory(displayCategory)

  // 3. Handle Empty State (Zero posts) - Do NOT 404
  const hasPosts = posts.length > 0

  return (
    <LabContainer videoSrc="/media/videos/default-background.mp4">
      {/* Sidebar remains unchanged */}
      <LabNavigation />

      {/* Main Content Area - Custom Layout for Category Archive */}
      <div className="flex-1 w-full relative z-10 transition-colors duration-500 overflow-visible"
        style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-panel mx-auto p-fluid">

          {/* Header Section */}
          <div className="mb-fluid">
            <h1 className="text-h1 font-black tracking-tighter mb-2 transition-colors duration-500"
              style={{ color: 'var(--heading-primary)' }}>
              {displayCategory}
            </h1>
            <p className="text-body font-mono mb-6 transition-colors duration-500"
              style={{ color: 'var(--muted-foreground)' }}>
              {hasPosts ? `${posts.length} ${posts.length === 1 ? 'article' : 'articles'}` : '0 articles'}
            </p>
            <hr style={{ borderColor: 'var(--border)' }} />
          </div>

          {/* Posts Archive Stack */}
          {hasPosts ? (
            <div className="space-y-8">
              <Suspense fallback={<div className="py-10 text-center text-sm text-[var(--muted-foreground)]">Loading articles...</div>}>
                {posts.map((post) => (
                  <CategoryPostCard key={post.id} post={post} />
                ))}
              </Suspense>
            </div>
          ) : (
            /* Empty State Card */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-2xl border px-10 py-12 backdrop-blur-sm max-w-md w-full transition-all duration-500"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-soft)'
                }}>
                <h3 className="mb-3 text-xl font-bold tracking-tight transition-colors duration-500"
                  style={{ color: 'var(--foreground)' }}>
                  Nothing available.
                </h3>
                <p className="text-sm transition-colors duration-500"
                  style={{ color: 'var(--muted-foreground)' }}>
                  This topic is quiet for now. Check back later.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </LabContainer>
  )
}

