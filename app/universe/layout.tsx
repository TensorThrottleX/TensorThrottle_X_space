import { UniverseTransition } from '@/components/universe/UniverseTransition'

export default function UniverseLayout({ children }: { children: React.ReactNode }) {
  return (
    <UniverseTransition>
      {children}
    </UniverseTransition>
  )
}
