'use client'

import { useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { readPageNumber } from '../_helpers/pagination'

export function useUrlPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = readPageNumber(searchParams.get('page'))
  const setPage = useCallback((nextPage: number) => {
    const params = new URLSearchParams(window.location.search)
    if (nextPage === 1) params.delete('page')
    else params.set('page', String(nextPage))
    const query = params.toString()
    const url = pathname + (query ? '?' + query : '')
    if (url !== window.location.pathname + window.location.search) window.history.pushState(null, '', url)
  }, [pathname])
  return [page, setPage] as const
}
