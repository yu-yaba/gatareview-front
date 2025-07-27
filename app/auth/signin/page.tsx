'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaBookOpen, FaStar, FaHeart, FaUsers, FaCheckCircle, FaBolt, FaShieldAlt, FaRocket, FaBookmark, FaEdit } from 'react-icons/fa'
import Cookies from 'js-cookie'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 既にログイン済みの場合はホームページにリダイレクト
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      Cookies.set('remember_me', rememberMe ? 'true' : 'false', { expires: 1 }) // Cookieに1日間保存
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      console.error('ログインエラー:', error)
    } finally {
      setIsLoading(false)
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

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* 左側: ログインフォーム */}
        <div className="lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-md mx-auto w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* ロゴとタイトル */}
            <div className="text-center mb-8 lg:mb-12">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                ログインして
                <br />
                <span className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 bg-clip-text text-transparent">
                  全ての機能を解放しよう
                </span>
              </h1>
            </div>
            <div className="bg-white/90 backdrop-blur-sm py-8 px-6 lg:px-8 shadow-2xl rounded-3xl border border-green-100/50 relative overflow-hidden group hover:shadow-green-500/10 transition-all duration-500">
              {/* カード内背景エフェクト */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-4 right-4 w-3 h-3 border border-green-300 rotate-45 opacity-40"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-green-400 rounded-full opacity-50"></div>

              <div className="relative z-10 space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full text-white text-2xl shadow-lg">
                      <FaShieldAlt />
                    </div>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                    ガタレビュにログイン
                  </h2>
                  <p className="text-gray-600 font-medium">
                    Googleアカウントで安全にログイン
                  </p>
                </div>

                <div>
                  <div className="mb-4 flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      ログイン状態を記憶する
                    </label>
                  </div>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-4 px-6 border-2 border-gray-200 rounded-2xl shadow-lg bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                        <span className="text-lg">ログイン中...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span className="text-lg font-semibold">Googleでログイン</span>
                      </div>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-3 text-gray-500 font-medium">または</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center text-green-600 hover:text-green-500 font-semibold transition-colors duration-200 group"
                  >
                    <FaRocket className="mr-2 text-sm group-hover:animate-bounce" />
                    ホームページに戻る
                  </Link>
                </div>
              </div>
            </div>

            {/* 利用規約 */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                ログインすることで、
                <Link href="/terms" className="text-green-600 hover:text-green-500 font-medium transition-colors duration-200">
                  利用規約
                </Link>
                および
                <Link href="/privacy" className="text-green-600 hover:text-green-500 font-medium transition-colors duration-200">
                  プライバシーポリシー
                </Link>
                に同意したものとみなされます。
              </p>
            </div>
          </div>
        </div>

        {/* 右側: 機能紹介セクション */}
        <div className="lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-md mx-auto lg:max-w-none animate-fade-in">
            {/* 機能紹介 */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                  <FaEdit />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">レビューの編集</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">投稿したレビューを後から編集・更新できます</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg group-hover:shadow-amber-500/25 transition-all duration-300">
                  <FaBookmark />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">ブックマーク登録</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">気になる授業をブックマークして後で確認できます</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
                  <FaHeart />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">ありがとう機能</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">役に立ったレビューに「ありがとう」を送って感謝を伝えられます</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
