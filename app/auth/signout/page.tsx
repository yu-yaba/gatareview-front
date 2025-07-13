'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { FaSignOutAlt, FaUser, FaHome, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

export default function SignOutPage() {
  const { data: session, status } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('ログアウトエラー:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 relative overflow-hidden">
      {/* 背景エフェクト */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <div className="w-full h-full bg-gradient-to-br from-green-50/20 via-transparent to-green-100/20"></div>
        </div>
        <div className="absolute top-10 left-10 w-3 h-3 bg-green-300 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-green-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-32 w-4 h-4 bg-green-500 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* メインカード */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-green-100/50 hover:shadow-green-500/10 transition-all duration-500">
            {/* ヘッダー */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full text-white text-3xl shadow-lg">
                  <FaSignOutAlt />
                </div>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                サインアウト
              </h1>
              <p className="text-gray-600">
                開発用ログアウトページ
              </p>
            </div>

            {/* セッション状態表示 */}
            <div className="mb-8">
              {status === 'loading' ? (
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="w-6 h-6 text-green-500 animate-spin mr-3" />
                  <span className="text-gray-600">セッション確認中...</span>
                </div>
              ) : session ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50">
                  <div className="flex items-center mb-3">
                    <FaCheckCircle className="text-green-600 text-xl mr-2" />
                    <h3 className="text-lg font-bold text-green-800">ログイン中</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-700">
                      <FaUser className="w-4 h-4 mr-2" />
                      <span className="font-medium">ユーザー:</span>
                      <span className="ml-2">{session.user?.name || '不明'}</span>
                    </div>
                    <div className="flex items-center text-green-700">
                      <span className="font-medium">メール:</span>
                      <span className="ml-2">{session.user?.email || '不明'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-4 border border-gray-200/50">
                  <div className="flex items-center mb-2">
                    <FaExclamationTriangle className="text-gray-500 text-xl mr-2" />
                    <h3 className="text-lg font-bold text-gray-700">未ログイン</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    現在ログインしていません
                  </p>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="space-y-4">
              {session ? (
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="group relative flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  {isLoggingOut ? (
                    <div className="flex items-center relative">
                      <FaSpinner className="w-5 h-5 mr-3 animate-spin" />
                      ログアウト中...
                    </div>
                  ) : (
                    <div className="flex items-center relative">
                      <FaSignOutAlt className="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform duration-200" />
                      ログアウト
                    </div>
                  )}
                </button>
              ) : (
                <Link href="/auth/signin">
                  <button className="group relative flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/25 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <div className="flex items-center relative">
                      <FaUser className="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform duration-200" />
                      ログイン
                    </div>
                  </button>
                </Link>
              )}

              {/* ホームに戻るボタン */}
              <Link href="/">
                <button className="group relative flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-2xl hover:from-gray-200 hover:to-gray-300 transform hover:scale-105 transition-all duration-300 shadow-md overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="flex items-center relative">
                    <FaHome className="w-4 h-4 mr-2 transform group-hover:scale-110 transition-transform duration-200" />
                    ホームに戻る
                  </div>
                </button>
              </Link>
            </div>

            {/* 注意書き */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                このページは開発用です。<br />
                通常は
                <Link href="/mypage" className="text-green-600 hover:text-green-500 font-medium transition-colors duration-200 underline">
                  マイページ
                </Link>
                からログアウトしてください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}