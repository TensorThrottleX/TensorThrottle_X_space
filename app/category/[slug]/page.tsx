
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { LabContainer } from '@/components/layout/LabContainer'
import { CategoryPostCard } from '@/components/content/CategoryPostCard'
import { getPostsByCategory } from '@/lib/notion'
import { enrichPostsWithCounts } from '@/lib/enrich-posts'
import { ResponsiveContentWrapper } from '@/components/layout/ResponsiveContentWrapper'
import { PageHeader } from '@/components/layout/PageHeader'
import { BookOpen, Clock, FlaskConical, GitBranch } from 'lucide-react'

// ISR: Revalidate every 1 minute
export const revalidate = 60

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

const VALID_CATEGORIES = ['thoughts', 'projects', 'experiments', 'manifold']

const CATEGORY_CONFIG: Record<string, { title: string; description: string; accent: string; icon: React.ReactNode }> = {
  thoughts: {
    title: 'Thoughts',
    description: 'Unfiltered ideas, reflections, and mental models.',
    accent: 'rgb(34,211,238)',
    icon: <BookOpen size={12} strokeWidth={2} />,
  },
  projects: {
    title: 'Projects',
    description: 'Built things, past and present.',
    accent: 'rgb(168,85,247)',
    icon: <FlaskConical size={12} strokeWidth={2} />,
  },
  experiments: {
    title: 'Experiments',
    description: 'Prototypes, failures, and breakthroughs.',
    accent: 'rgb(168,85,247)',
    icon: <FlaskConical size={12} strokeWidth={2} />,
  },
  manifold: {
    title: 'Manifold',
    description: 'Connected ideas across disciplines.',
    accent: 'rgb(52,211,153)',
    icon: <GitBranch size={12} strokeWidth={2} />,
  },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
    description: `Articles in the ${categoryName} category`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  if (!VALID_CATEGORIES.includes(slug)) {
    notFound()
  }

  const displayCategory = slug.charAt(0).toUpperCase() + slug.slice(1)
  const posts = await getPostsByCategory(slug)
  const postsWithCounts = await enrichPostsWithCounts(posts)

  const hasPosts = postsWithCounts.length > 0
  const latestPost = hasPosts ? postsWithCounts[0].publishedAt : undefined
  const config = CATEGORY_CONFIG[slug]

  return (
    <ResponsiveContentWrapper
      pageTitle={displayCategory}
      articleCount={hasPosts ? posts.length : 0}
      latestPublishedAt={latestPost}
    >
      <PageHeader
        title={config.title}
        description={config.description}
        accent={config.accent}
        metrics={[
          { icon: config.icon, label: slug === 'manifold' ? 'Nodes' : 'Articles', value: posts.length },
          ...(latestPost ? [{ icon: <Clock size={12} strokeWidth={2} />, label: 'Updated', value: formatDate(latestPost) }] : []),
        ]}
        status={slug === 'thoughts'
          ? (hasPosts ? { label: 'Writing', state: 'writing', color: 'rgb(168,85,247)' } : { label: 'Inactive', state: 'inactive', color: 'rgb(107,114,128)' })
          : slug === 'experiments'
            ? (hasPosts ? { label: 'Active', state: 'active', color: 'rgb(34,197,94)' } : { label: 'Archived', state: 'archived', color: 'rgb(107,114,128)' })
            : (hasPosts ? { label: 'Active', state: 'active', color: 'rgb(34,197,94)' } : { label: 'Inactive', state: 'inactive', color: 'rgb(107,114,128)' })
        }
      />
      <LabContainer videoSrc="/media/videos/default-background.mp4">
        {/* Main Content Area */}
        <div className="flex-1 w-full relative z-10 transition-colors duration-500 overflow-visible"
          style={{ backgroundColor: 'var(--background)' }}>
          <div className="max-w-[42rem] mx-auto p-fluid">

            {/* Posts Archive Stack */}
            {hasPosts ? (
              <div className="space-y-8 mt-6">
                <Suspense fallback={<div className="py-10 text-center text-sm text-[var(--muted-foreground)]">Loading articles...</div>}>
                  {postsWithCounts.map((post) => (
                    <CategoryPostCard key={post.id} post={post} />
                  ))}
                </Suspense>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-2xl border px-10 py-12 backdrop-blur-sm max-w-md w-full transition-all duration-500"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-soft)',
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
    </ResponsiveContentWrapper>
  )
}

