import { useState, useEffect } from 'react'
import type { RouteContext } from '../types'
import { getRouteContext } from '../FoxBehaviour'

export function useRouteWatcher(): RouteContext {
  const [route, setRoute] = useState<RouteContext>('home')

  useEffect(() => {
    function checkRoute() {
      setRoute(getRouteContext(window.location.pathname))
    }
    checkRoute()
    const observer = new MutationObserver(checkRoute)
    observer.observe(document.querySelector('title') ?? document.head, {
      subtree: true,
      childList: true,
      characterData: true,
    })
    window.addEventListener('popstate', checkRoute)
    return () => {
      observer.disconnect()
      window.removeEventListener('popstate', checkRoute)
    }
  }, [])

  return route
}
