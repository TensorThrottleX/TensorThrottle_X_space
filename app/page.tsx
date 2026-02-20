import { ResponsiveHome } from '@/components/layout/ResponsiveHome'

export const metadata = {
  title: 'Home',
  description: 'An experimental portfolio powered by Notion and Next.js',
}

// ISR: Revalidate every 1 minute
export const revalidate = 60

export default function Home() {
  return <ResponsiveHome />
}
