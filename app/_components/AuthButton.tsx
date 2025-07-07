'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">読み込み中...</span>
      </div>
    )
  }

  if (session) {
    return (
      <Link href="/mypage">
        <div className="flex items-center space-x-3 px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl shadow-lg transition-all duration-300 hover:bg-white hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50">
          {/* ユーザーアバター */}
          {session.user?.avatar_url && (
            <img
              src={session.user.avatar_url}
              alt={session.user.name || 'ユーザー'}
              className="w-8 h-8 rounded-full border-2 border-green-500"
            />
          )}
          
          {/* ユーザー情報 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-green-600 hidden sm:inline">
              {session.user?.name}
            </span>
            <span className="text-xs text-green-500 hidden sm:inline">
              マイページ
            </span>
          </div>
          
          {/* アイコン */}
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    )
  }

  return (
    <Link href="/auth/signin">
      <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105">
        <svg className="w-4 h-4" viewBox="0 0 24 24">
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