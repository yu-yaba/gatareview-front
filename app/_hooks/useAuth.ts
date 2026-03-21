'use client'

import { useSession } from 'next-auth/react'
import { useMemo, useEffect, useState } from 'react'
import type { CustomUser } from '../_types/next-auth'

export interface AuthState {
  user: CustomUser | null
  isAuthenticated: boolean
  isLoading: boolean
  backendToken: string | null
}

export const useAuth = (): AuthState => {
  const { data: session, status } = useSession()
  const [userWithMetadata, setUserWithMetadata] = useState<CustomUser | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session?.backendToken) {
        setUserWithMetadata(null)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.backendToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUserWithMetadata(data.user)
        } else {
          console.error('Failed to fetch user info:', response.status)
          setUserWithMetadata(session?.user ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            avatar_url: session.user.avatar_url || null,
            reviews_count: undefined,
            admin: session.user.admin || false,
          } : null)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
        setUserWithMetadata(session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar_url: session.user.avatar_url || null,
          reviews_count: undefined,
          admin: session.user.admin || false,
        } : null)
      }
    }

    fetchUserInfo()
  }, [session?.backendToken, session?.user])

  const authState = useMemo((): AuthState => {
    const isLoading = status === 'loading'
    const isAuthenticated = !!session?.user && !!session?.backendToken

    const user = userWithMetadata || (session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar_url: session.user.avatar_url || null,
      reviews_count: undefined,
      admin: session.user.admin || false,
    } : null)

    const backendToken = session?.backendToken || null

    return {
      user,
      isAuthenticated,
      isLoading,
      backendToken
    }
  }, [session, status, userWithMetadata])

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
