import { ReactNode } from 'react'
import UniverseTransition from '@/components/universe/UniverseTransitionClient'

export default function UniverseLayout({ children }: { children: ReactNode }) {
  return (
    <UniverseTransition>
      {children}
    </UniverseTransition>
  )
}
