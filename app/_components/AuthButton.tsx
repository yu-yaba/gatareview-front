'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AuthButton() {
  const { data: session, status } = useSession()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (status !== 'loading') {
      setIsInitialized(true)
    }
  }, [status])

  // 初期ロード完了まではスピナーを表示しない（点滅防止）
  // セッションが既にある場合は、ロード中でも該当のUIを表示
  if (!isInitialized || (status === 'loading' && !session)) {
    return (
      <div className="flex items-center justify-center px-5 py-3 sm:px-6 sm:py-3 md:px-7 md:py-3 lg:px-8 lg:py-3.5">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (session) {
    return (
      <Link href="/mypage">
        <div className="group relative flex items-center px-5 py-3 sm:px-6 sm:py-3 md:px-7 md:py-3 lg:px-8 lg:py-3.5 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg border border-green-400/50 transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400/50 backdrop-blur-sm overflow-hidden min-w-0">
          {/* 光沢エフェクト */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

          {/* ユーザーアイコン */}
          <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>

          {/* ユーザー情報 */}
          <div className="flex flex-col ml-2">
            <span className="text-sm lg:text-base font-bold text-white hidden sm:inline relative">
              {session.user?.name}
            </span>
            <span className="text-xs text-green-200 hidden sm:inline relative">
              マイページ
            </span>
          </div>

          {/* アイコン */}
          <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white ml-2 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    )
  }

  return (
    <Link href="/auth/signin">
      <button className="group relative flex items-center space-x-2 px-3 py-3 sm:px-6 sm:py-3 md:px-7 md:py-3 lg:px-8 lg:py-3.5 text-sm lg:text-base font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg border border-green-400/50 transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400/50 backdrop-blur-sm overflow-hidden whitespace-nowrap">
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
        <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>ログイン</span>
      </button>
    </Link>
  )
}
