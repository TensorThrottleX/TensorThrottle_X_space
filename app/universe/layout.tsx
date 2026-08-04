import UniverseTransition from '@/components/universe/UniverseTransitionClient'

export default function UniverseLayout({ children }: { children: React.ReactNode }) {
  return (
    <UniverseTransition>
      {children}
    </UniverseTransition>
  )
}
