'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import type { CustomUser } from '../_types/next-auth'

export interface AuthState {
  user: CustomUser | null
  isAuthenticated: boolean
  isLoading: boolean
  backendToken: string | null
}

export const useAuth = (): AuthState => {
  const { data: session, status } = useSession()

  const authState = useMemo((): AuthState => {
    const isLoading = status === 'loading'
    const isAuthenticated = !!session?.user && !!session?.backendToken
    
    const user: CustomUser | null = session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar_url: session.user.avatar_url || null
    } : null
    
    const backendToken = session?.backendToken || null

    return {
      user,
      isAuthenticated,
      isLoading,
      backendToken
    }
  }, [session, status])

  return authState
}

// 認証が必要なページでのガード用フック
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth()
  
  return {
    isAuthenticated,
    isLoading,
    shouldRedirect: !isLoading && !isAuthenticated
  }
}