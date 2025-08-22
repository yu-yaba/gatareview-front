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
  const [userWithReviewsCount, setUserWithReviewsCount] = useState<CustomUser | null>(null)

  // バックエンドから最新のユーザー情報（reviews_count含む）を取得
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session?.backendToken) {
        setUserWithReviewsCount(null)
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
          setUserWithReviewsCount(data.user)
        } else {
          console.error('Failed to fetch user info:', response.status)
          // APIエラー時はセッション情報があればそれを維持し、reviews_countのみ不明扱い
          setUserWithReviewsCount(session?.user ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            avatar_url: session.user.avatar_url || null,
            reviews_count: undefined // API取得に失敗した場合はundefinedにして、ローカルストレージ判定を有効にする
          } : null)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
        // ネットワークエラー等の場合もセッション情報があればそれを維持し、reviews_countのみ不明扱い
        setUserWithReviewsCount(session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar_url: session.user.avatar_url || null,
          reviews_count: undefined // エラー時はundefinedにして、ローカルストレージ判定を有効にする
        } : null)
      }
    }

    fetchUserInfo()
  }, [session?.backendToken, session?.user])

  const authState = useMemo((): AuthState => {
    const isLoading = status === 'loading'
    const isAuthenticated = !!session?.user && !!session?.backendToken

    const user = userWithReviewsCount || (session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar_url: session.user.avatar_url || null,
      reviews_count: undefined // 初期状態では不明扱いにして、ローカルストレージ判定を有効にする
    } : null)

    const backendToken = session?.backendToken || null

    return {
      user,
      isAuthenticated,
      isLoading,
      backendToken
    }
  }, [session, status, userWithReviewsCount])

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