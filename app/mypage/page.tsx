'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { mypageApi } from '../_helpers/api'
import {
  FaUser,
  FaEnvelope,
  FaGoogle,
  FaSignOutAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaArrowLeft,
  FaHeart,
  FaTrophy,
  FaBookmark,
  FaStar,
  FaCalendarAlt,
  FaGraduationCap,
  FaUniversity,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaFileContract,
  FaChevronRight,
  FaChartLine,
  FaThumbsUp,
  FaEdit,
  FaCrown,
  FaMedal,
  FaTrash,
  FaEye,
  FaCommentAlt
} from 'react-icons/fa'
import ReactStars from 'react-stars'
import ReviewEditModal from '../_components/ReviewEditModal'

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
  user_reviews: Array<{
    id: number
    rating: number
    content: string
    created_at: string
    thanks_count: number
    textbook: string
    attendance: string
    grading_type: string
    content_difficulty: string
    content_quality: string
    period_year: string
    period_term: string
    lecture: {
      id: number
      title: string
      lecturer: string
      faculty: string
    }
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
  const [editingReview, setEditingReview] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    // 未認証の場合はログインページにリダイレクト
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    // 認証済みの場合にマイページデータを取得
    if (session && status === 'authenticated') {
      console.log('=== SESSION DEBUG ===')
      console.log('Full session object:', JSON.stringify(session, null, 2))
      console.log('Session backendToken:', session.backendToken)
      console.log('Session accessToken:', session.accessToken)
      console.log('Session user:', session.user)
      console.log('Status:', status)
      console.log('====================')
      fetchMypageData()
    }
  }, [session, status])

  const fetchMypageData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching mypage data...')
      console.log('Token:', session?.backendToken ? 'Token present' : 'Token missing')

      const response = await mypageApi.getMypage()
      console.log('Mypage data received:', response.data)
      setMypageData(response.data)
    } catch (error: any) {
      console.error('マイページデータの取得に失敗:', error)

      if (error.response?.status === 401) {
        setError('認証が必要です。ログインしてください。')
      } else if (error.response?.status === 403) {
        setError('アクセスが拒否されました。権限を確認してください。')
      } else {
        setError('データの取得に失敗しました。時間をおいて再度お試しください。')
      }
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

  // レビュー削除機能
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('このレビューを削除しますか？')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.backendToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // レビューリストを更新
        if (mypageData) {
          const updatedReviews = mypageData.user_reviews.filter(review => review.id !== reviewId)
          setMypageData({
            ...mypageData,
            user_reviews: updatedReviews,
            statistics: {
              ...mypageData.statistics,
              reviews_count: mypageData.statistics.reviews_count - 1
            }
          })
        }
        alert('レビューが削除されました')
      } else {
        throw new Error('削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('レビューの削除に失敗しました')
    }
  }

  // レビュー編集機能
  const handleEditReview = (review: any) => {
    setEditingReview(review)
    setIsEditModalOpen(true)
  }

  // 編集後のレビュー更新
  const handleReviewUpdated = (updatedReview: any) => {
    if (mypageData) {
      const updatedReviews = mypageData.user_reviews.map(review =>
        review.id === updatedReview.id ? { ...review, ...updatedReview } : review
      )
      setMypageData({
        ...mypageData,
        user_reviews: updatedReviews
      })
    }
    setIsEditModalOpen(false)
    setEditingReview(null)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-green-100/50">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <FaSpinner className="w-12 h-12 text-green-500 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-green-200 rounded-full animate-pulse"></div>
            </div>
            <span className="text-lg font-medium text-gray-700">読み込み中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // useEffectでリダイレクトされるまで何も表示しない
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-red-100/50">
            <div className="text-center">
              <div className="mb-6">
                <FaExclamationTriangle className="w-16 h-16 mx-auto text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-4">エラーが発生しました</h3>
              <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
              <button
                onClick={fetchMypageData}
                className="group relative flex items-center justify-center w-full px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50 hover:from-red-100 hover:to-rose-100 hover:shadow-red-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <span className="relative">再試行</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/"
            className="group inline-flex items-center mb-6 px-4 py-2 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:shadow-green-200/25 transition-all duration-300 hover:scale-[1.02]"
          >
            <FaArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">ホームに戻る</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">マイページ</h1>
          <p className="text-gray-600 text-lg">アカウント情報とレビュー管理</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ユーザー情報カード */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300">
              <div className="text-center">
                {/* アバター */}
                <div className="mb-8 relative">
                  {mypageData?.user?.avatar_url ? (
                    <div className="relative">
                      <img
                        src={mypageData.user.avatar_url}
                        alt={mypageData.user.name || 'ユーザー'}
                        className="w-28 h-28 rounded-full mx-auto border-4 border-green-400 shadow-lg transform hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 w-28 h-28 rounded-full mx-auto bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <FaUser className="w-14 h-14 text-white" />
                      </div>
                      <div className="absolute inset-0 w-28 h-28 rounded-full mx-auto bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* ユーザー情報 */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {mypageData?.user?.name || '名前未設定'}
                </h2>
                <p className="text-gray-600 mb-8 flex items-center justify-center">
                  <FaEnvelope className="w-4 h-4 mr-2" />
                  {mypageData?.user?.email || 'メールアドレス未設定'}
                </p>

                {/* ログアウトボタン */}
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="group relative flex items-center justify-center w-full px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50 hover:from-red-100 hover:to-rose-100 hover:shadow-red-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  {isLoggingOut ? (
                    <div className="flex items-center relative">
                      <FaSpinner className="w-5 h-5 mr-2 animate-spin" />
                      ログアウト中...
                    </div>
                  ) : (
                    <div className="flex items-center relative">
                      <FaSignOutAlt className="w-5 h-5 mr-2 transform group-hover:scale-110 transition-transform duration-200" />
                      ログアウト
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-8">

            {/* 統計情報 */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <FaChartLine className="w-6 h-6 mr-3 text-green-500" />
                あなたの貢献
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 text-center border border-green-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <FaEdit className="w-8 h-8 mx-auto mb-3 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                  <div className="text-3xl font-bold text-green-700 mb-2">{mypageData?.statistics?.reviews_count || 0}</div>
                  <div className="text-sm text-gray-600 font-medium">投稿したレビュー</div>
                </div>
                <div className="group bg-gradient-to-br from-rose-50 to-pink-100 rounded-2xl p-6 text-center border border-rose-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <FaThumbsUp className="w-8 h-8 mx-auto mb-3 text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                  <div className="text-3xl font-bold text-rose-700 mb-2">{mypageData?.statistics?.total_thanks_received || 0}</div>
                  <div className="text-sm text-gray-600 font-medium">もらったありがとう</div>
                </div>
              </div>

              {/* ランキング情報 */}
              {mypageData?.ranking_position && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-6 mb-8 border border-amber-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
                  <div className="text-center">
                    <FaTrophy className="w-10 h-10 mx-auto mb-3 text-amber-600 group-hover:scale-110 transition-transform duration-200" />
                    <div className="text-lg font-bold text-amber-700 mb-1">
                      レビュー投稿数ランキング
                    </div>
                    <div className="text-4xl font-bold text-amber-800 mb-1">
                      {mypageData.ranking_position.position}位
                    </div>
                    <div className="text-sm text-gray-600">
                      全{mypageData.ranking_position.total_users}人中
                    </div>
                  </div>
                </div>
              )}

              {/* 励ましメッセージ */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 mb-8 border border-green-200/50">
                <div className="text-center">
                  <FaHeart className="w-8 h-8 mx-auto mb-3 text-green-600 animate-pulse" />
                  <div className="text-green-700 font-medium text-lg">
                    {(mypageData?.statistics?.reviews_count || 0) > 0
                      ? `あなたのレビューは${mypageData?.statistics?.total_thanks_received || 0}人の役に立っています！`
                      : 'あなたのレビューがきっと誰かの役に立つはずです！'
                    }
                  </div>
                </div>
              </div>

              <Link
                href="/reviews/new"
                className="group relative flex items-center justify-center w-full px-6 py-4 rounded-2xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:shadow-green-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <FaPlus className="w-5 h-5 mr-2 transform group-hover:scale-110 transition-transform duration-200 relative" />
                <span className="relative">新しいレビューを投稿</span>
              </Link>
            </div>

            {/* 投稿したレビュー */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <FaCommentAlt className="w-6 h-6 mr-3 text-green-500" />
                投稿したレビュー
              </h3>
              {mypageData?.user_reviews?.length > 0 ? (
                <div className="space-y-4">
                  {mypageData.user_reviews.map((review, index) => (
                    <div
                      key={review.id}
                      className="group p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100/50 hover:from-slate-100 hover:to-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <Link
                            href={`/lectures/${review.lecture.id}`}
                            className="font-bold text-gray-900 mb-2 text-lg group-hover:text-green-600 transition-colors duration-200 hover:underline"
                          >
                            {review.lecture.title}
                          </Link>
                          <div className="flex items-center mb-3 text-gray-600">
                            <FaUser className="w-4 h-4 mr-2" />
                            <span className="mr-4">{review.lecture.lecturer}</span>
                            <FaUniversity className="w-4 h-4 mr-2" />
                            <span>{review.lecture.faculty}</span>
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center">
                              <ReactStars
                                value={review.rating}
                                edit={false}
                                size={18}
                                className="flex"
                                half={true}
                              />
                              <span className="ml-2 font-bold text-yellow-600">{review.rating}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FaCalendarAlt className="w-3 h-3 mr-1" />
                              {new Date(review.created_at).toLocaleDateString('ja-JP')}
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center justify-center min-w-[28px] h-6 px-2 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">
                                <FaHeart className="w-3 h-3 mr-1" />
                                {review.thanks_count}
                              </div>
                            </div>
                          </div>
                          {review.content && (
                            <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                              {review.content}
                            </p>
                          )}
                          {(review.period_year || review.period_term) && (
                            <div className="flex items-center text-xs text-gray-500">
                              <FaCalendarAlt className="w-3 h-3 mr-1" />
                              {review.period_year && `${review.period_year}年`}
                              {review.period_year && review.period_term && ' '}
                              {review.period_term}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Link
                            href={`/lectures/${review.lecture.id}`}
                            className="group/view relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200/50 hover:from-slate-100 hover:to-gray-100 hover:shadow-gray-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover/view:translate-x-full transition-transform duration-700 ease-out" />
                            <FaEye className="w-3.5 h-3.5 transform group-hover/view:scale-110 transition-transform duration-200 relative" />
                            <span className="text-sm relative">詳細</span>
                          </Link>
                          <button
                            onClick={() => handleEditReview(review)}
                            className="group/edit relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/50 hover:from-blue-100 hover:to-indigo-100 hover:shadow-blue-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover/edit:translate-x-full transition-transform duration-700 ease-out" />
                            <FaEdit className="w-3.5 h-3.5 transform group-hover/edit:scale-110 transition-transform duration-200 relative" />
                            <span className="text-sm relative">編集</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="group/delete relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50 hover:from-red-100 hover:to-rose-100 hover:shadow-red-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover/delete:translate-x-full transition-transform duration-700 ease-out" />
                            <FaTrash className="w-3.5 h-3.5 transform group-hover/delete:scale-110 group-hover/delete:rotate-12 transition-all duration-200 relative" />
                            <span className="text-sm relative">削除</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {mypageData.user_reviews.length >= 10 && (
                    <div className="text-center pt-6">
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-slate-100 rounded-xl text-sm text-gray-600 font-medium">
                        すべてのレビューを表示するには講義詳細ページをご確認ください
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaCommentAlt className="w-16 h-16 mx-auto text-gray-300 mb-6" />
                  <p className="text-gray-500 mb-6 text-lg">まだレビューを投稿していません</p>
                  <Link
                    href="/reviews/new"
                    className="group relative inline-flex items-center px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:shadow-green-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    <FaPlus className="w-4 h-4 mr-2 transform group-hover:scale-110 transition-transform duration-200 relative" />
                    <span className="relative">最初のレビューを投稿</span>
                  </Link>
                </div>
              )}
            </div>

            {/* ブックマークした授業 */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <FaBookmark className="w-6 h-6 mr-3 text-green-500" />
                ブックマークした授業
              </h3>
              {mypageData?.bookmarked_lectures?.length > 0 ? (
                <div className="space-y-4">
                  {mypageData.bookmarked_lectures.slice(0, 5).map((lecture, index) => (
                    <Link
                      key={lecture.id}
                      href={`/lectures/${lecture.id}`}
                      className="group block p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100/50 hover:from-slate-100 hover:to-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* デスクトップレイアウト */}
                      <div className="hidden sm:flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-green-600 transition-colors duration-200">{lecture.title}</h4>
                          <div className="flex items-center mb-3 text-gray-600">
                            <FaUser className="w-4 h-4 mr-2" />
                            <span className="mr-4">{lecture.lecturer}</span>
                            <FaUniversity className="w-4 h-4 mr-2" />
                            <span>{lecture.faculty}</span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <FaEdit className="w-3 h-3 mr-1" />
                              <span>レビュー数: {lecture.review_count}</span>
                            </div>
                            <div className="flex items-center">
                              <FaStar className="w-3 h-3 mr-1 text-yellow-500" />
                              <span>平均評価: {lecture.avg_rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center text-xs text-gray-400 mb-2">
                            <FaCalendarAlt className="w-3 h-3 mr-1" />
                            {new Date(lecture.bookmarked_at).toLocaleDateString('ja-JP')}
                          </div>
                          <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </div>

                      {/* スマホレイアウト */}
                      <div className="sm:hidden">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-gray-900 text-base group-hover:text-green-600 transition-colors duration-200 flex-1 pr-2 leading-tight">{lecture.title}</h4>
                          <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-0.5" />
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center text-gray-600 text-sm">
                            <FaUser className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                            <span className="truncate">{lecture.lecturer}</span>
                          </div>
                          <div className="flex items-center text-gray-600 text-sm">
                            <FaUniversity className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                            <span className="truncate">{lecture.faculty}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                          <div className="flex items-center">
                            <FaEdit className="w-3 h-3 mr-1" />
                            <span>レビュー数: {lecture.review_count}</span>
                          </div>
                          <div className="flex items-center">
                            <FaStar className="w-3 h-3 mr-1 text-yellow-500" />
                            <span>平均評価: {lecture.avg_rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center text-xs text-gray-400">
                          <FaCalendarAlt className="w-3 h-3 mr-1" />
                          <span>{new Date(lecture.bookmarked_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {mypageData.bookmarked_lectures.length > 5 && (
                    <div className="text-center pt-6">
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-slate-100 rounded-xl text-sm text-gray-600 font-medium">
                        他 {mypageData.bookmarked_lectures.length - 5} 件のブックマーク
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaBookmark className="w-16 h-16 mx-auto text-gray-300 mb-6" />
                  <p className="text-gray-500 mb-6 text-lg">まだブックマークした授業がありません</p>
                  <Link
                    href="/lectures"
                    className="group relative inline-flex items-center px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:shadow-green-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    <FaSearch className="w-4 h-4 mr-2 transform group-hover:scale-110 transition-transform duration-200 relative" />
                    <span className="relative">授業を探す</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* レビュー編集モーダル */}
      {isEditModalOpen && editingReview && (
        <ReviewEditModal
          review={editingReview}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingReview(null)
          }}
          onSave={handleReviewUpdated}
          onDelete={handleDeleteReview}
        />
      )}
    </div>
  )
}