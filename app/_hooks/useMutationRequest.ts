import { useCallback, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { SessionBoundRequestConfig } from '../_helpers/api'

export interface MutationRequest extends SessionBoundRequestConfig {
  signal: AbortSignal
  finish: () => void
}

// アカウント切替で再マウントされる画面の、待機中の更新処理を取り消す。
export function useMutationRequest() {
  const { data: session, status } = useSession()
  const backendToken = session?.backendToken?.trim() || null
  const active = useRef(new Set<AbortController>())
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const requests = active.current
    return () => {
      mounted.current = false
      requests.forEach(controller => controller.abort())
      requests.clear()
    }
  }, [backendToken])

  const beginMutation = useCallback((): MutationRequest | null => {
    if (status === 'loading' || !mounted.current || active.current.size > 0) return null
    const controller = new AbortController()
    active.current.add(controller)
    return {
      expectedBackendToken: backendToken,
      signal: controller.signal,
      finish: () => active.current.delete(controller),
    }
  }, [backendToken, status])

  return { beginMutation, isSessionLoading: status === 'loading' }
}
