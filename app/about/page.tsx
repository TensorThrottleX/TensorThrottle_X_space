import { LabContainer } from '@/components/layout/LabContainer'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { ResponsiveContentWrapper } from '@/components/layout/ResponsiveContentWrapper'

export const metadata = {
  description: 'Learn more about this experimental portfolio interface.',
}

export default function AboutPage() {
  return (
    <ResponsiveContentWrapper>
      <LabContainer videoSrc="/media/videos/default-background.mp4">
        {/* Left: Floating navigation panel (Now in Root Layout) */}

        {/* Right: Content panel */}
        <ContentPanel title="About" subtitle="This experimental portfolio">
          <article className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-2xl font-black tracking-tighter transition-colors duration-500" style={{ color: 'var(--foreground)' }}>Design Philosophy</h2>
              <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
                This portfolio reimagines the traditional blog layout as a focused, isolated content lab floating above a cinematic motion background. The interface emphasizes clarity, intentionality, and minimalism—without heavy animations or decorative UI.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black tracking-tighter transition-colors duration-500" style={{ color: 'var(--foreground)' }}>Three Visual Layers</h2>
              <div className="space-y-4">
                <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--foreground)' }}>Background:</strong> A full-screen cinematic video creates atmospheric depth and environmental motion without competing with content.
                </p>
                <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--foreground)' }}>Overlay:</strong> A dark overlay with subtle blur ensures text readability and maintains visual hierarchy.
                </p>
                <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--foreground)' }}>Content:</strong> A floating central panel with glass effect (rounded edges, shadow, backdrop blur) creates the sensation of working in an isolated, focused workspace.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black tracking-tighter transition-colors duration-500" style={{ color: 'var(--foreground)' }}>Navigation Controls</h2>
              <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
                The left-side floating navigation panel provides a minimal control interface. Feel like a lightweight control panel with four main switches: Home, Feed, Projects, and Experiments. Each represents a filtered view of the content system while maintaining consistent layout and design across all pages.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black tracking-tighter transition-colors duration-500" style={{ color: 'var(--foreground)' }}>Content Presentation</h2>
              <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
                All content lives within the central floating panel with internal scrolling only. The feed presents a clean timeline-style layout with posts stacked vertically. Each post shows title, excerpt, publication date, and comment count—minimal and thoughtful, with no social clutter or likes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black tracking-tighter transition-colors duration-500" style={{ color: 'var(--foreground)' }}>Technical Foundation</h2>
              <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
                Built with Next.js 16, Notion as a CMS, and Supabase for comments. Features cursor-based infinite scroll with automatic loading via IntersectionObserver, graceful error handling, and production-ready architecture. All data fetching happens server-side with ISR caching every 5 minutes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black tracking-tighter transition-colors duration-500" style={{ color: 'var(--foreground)' }}>Design Tone</h2>
              <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
                The interface feels experimental, clean, intentional, and engineered—not template-like, not blog-like, and not corporate. Every UI element serves a purpose. The layout lets content breathe naturally within the focused workspace.
              </p>
            </section>
          </article>
        </ContentPanel>
      </LabContainer>
    </ResponsiveContentWrapper>
  )
}
