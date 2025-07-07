'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface MypageData {
  user: {
    id: number
    name: string
    email: string
    avatar_url?: string
    provider: string
  }
  statistics: {
    reviews_count: number
    total_thanks_received: number
    latest_review?: any
  }
  bookmarked_lectures: Array<{
    id: number
    title: string
    lecturer: string
    faculty: string
    bookmarked_at: string
    review_count: number
    avg_rating: number
  }>
  ranking_position: {
    position: number
    total_users: number
    user_reviews_count: number
  }
}

export default function MyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mypageData, setMypageData] = useState<MypageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 未認証の場合はログインページにリダイレクト
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    // 認証済みの場合にマイページデータを取得
    if (session && status === 'authenticated') {
      fetchMypageData()
    }
  }, [session, status])

  const fetchMypageData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/mypage`, {
        headers: {
          'Authorization': `Bearer ${session?.backendToken}`,
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        setMypageData(data)
      } else {
        throw new Error('データの取得に失敗しました')
      }
    } catch (error) {
      console.error('マイページデータの取得に失敗:', error)
      setError('データの取得に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('ログアウトエラー:', error)
      setIsLoggingOut(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600">読み込み中...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // useEffectでリダイレクトされるまで何も表示しない
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchMypageData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link href="/" className="text-green-600 hover:text-green-500 font-medium flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
          <p className="text-gray-600 mt-2">アカウント情報とレビュー管理</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ユーザー情報カード */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="text-center">
                {/* アバター */}
                <div className="mb-6">
                  {mypageData?.user?.avatar_url ? (
                    <img
                      src={mypageData.user.avatar_url}
                      alt={mypageData.user.name || 'ユーザー'}
                      className="w-24 h-24 rounded-full mx-auto border-4 border-green-500 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-green-500 rounded-full mx-auto flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* ユーザー情報 */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {mypageData?.user?.name || '名前未設定'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {mypageData?.user?.email || 'メールアドレス未設定'}
                </p>

                {/* ログアウトボタン */}
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoggingOut ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ログアウト中...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      ログアウト
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* アカウント詳細 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">アカウント詳細</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">ユーザーID</span>
                  <span className="font-medium text-gray-900">{mypageData?.user?.id || '未設定'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">表示名</span>
                  <span className="font-medium text-gray-900">{mypageData?.user?.name || '未設定'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">メールアドレス</span>
                  <span className="font-medium text-gray-900">{mypageData?.user?.email || '未設定'}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">認証プロバイダー</span>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                    <span className="font-medium text-gray-900">{mypageData?.user?.provider || 'Google'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 統計情報 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">あなたの貢献</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">{mypageData?.statistics?.reviews_count || 0}</div>
                  <div className="text-sm text-gray-600">投稿したレビュー</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">{mypageData?.statistics?.total_thanks_received || 0}</div>
                  <div className="text-sm text-gray-600">もらったありがとう</div>
                </div>
              </div>
              
              {/* ランキング情報 */}
              {mypageData?.ranking_position && (
                <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      レビュー投稿数ランキング
                    </div>
                    <div className="text-2xl font-bold text-yellow-700 mt-1">
                      {mypageData.ranking_position.position}位
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      全{mypageData.ranking_position.total_users}人中
                    </div>
                  </div>
                </div>
              )}
              
              {/* 励ましメッセージ */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="text-center">
                  <div className="text-blue-600 font-medium">
                    {(mypageData?.statistics?.reviews_count || 0) > 0 
                      ? `あなたのレビューは${mypageData?.statistics?.total_thanks_received || 0}人の役に立っています！`
                      : 'レビューを投稿して新潟大学生の役に立ちましょう！'
                    }
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Link 
                  href="/lectures"
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  新しいレビューを投稿
                </Link>
              </div>
            </div>

            {/* ブックマークした授業 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">ブックマークした授業</h3>
              {mypageData?.bookmarked_lectures?.length > 0 ? (
                <div className="space-y-4">
                  {mypageData.bookmarked_lectures.slice(0, 5).map((lecture) => (
                    <Link 
                      key={lecture.id}
                      href={`/lectures/${lecture.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">{lecture.title}</h4>
                          <p className="text-sm text-gray-600">{lecture.lecturer} | {lecture.faculty}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>レビュー数: {lecture.review_count}</span>
                            <span>平均評価: {lecture.avg_rating}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(lecture.bookmarked_at).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {mypageData.bookmarked_lectures.length > 5 && (
                    <div className="text-center pt-4">
                      <span className="text-sm text-gray-500">
                        他 {mypageData.bookmarked_lectures.length - 5} 件のブックマーク
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <p className="text-gray-500 mb-4">まだブックマークした授業がありません</p>
                  <Link 
                    href="/lectures"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    授業を探す
                  </Link>
                </div>
              )}
            </div>

            {/* 設定・その他 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">設定・その他</h3>
              <div className="space-y-3">
                <Link 
                  href="/privacy"
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">プライバシーポリシー</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <Link 
                  href="/terms"
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-gray-700">利用規約</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}