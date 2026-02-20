import { ResponsiveHome } from '@/components/layout/ResponsiveHome'
import { getAllPosts } from '@/lib/notion'

export const metadata = {
  title: 'Home',
  description: 'An experimental portfolio powered by Notion and Next.js',
}

// ISR: Revalidate every 1 minute
export const revalidate = 60

export default async function Home() {
  const posts = await getAllPosts()
  const latestPost = posts.length > 0 ? posts[0].publishedAt : undefined

  return <ResponsiveHome latestPublishedAt={latestPost} />
}
