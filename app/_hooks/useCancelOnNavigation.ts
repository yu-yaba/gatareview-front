'use client'

import { useEffect } from 'react'

// Link navigation can wait for a server payload while the old page stays mounted.
export function useCancelOnNavigation(cancel: () => void, cancelHistory?: () => void) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return
      cancel()
    }
    document.addEventListener('click', onClick, true)
    // URL-driven reads restart during popstate; do not abort the new read.
    if (cancelHistory) window.addEventListener('popstate', cancelHistory, true)
    window.addEventListener('pagehide', cancel)
    return () => {
      document.removeEventListener('click', onClick, true)
      if (cancelHistory) window.removeEventListener('popstate', cancelHistory, true)
      window.removeEventListener('pagehide', cancel)
      cancel()
    }
  }, [cancel, cancelHistory])
}
