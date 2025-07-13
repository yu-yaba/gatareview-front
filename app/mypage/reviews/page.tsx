'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, memo } from 'react'
import Link from 'next/link'
import Loading from 'react-loading'
import ReactStars from 'react-stars'
import { mypageApi } from '../../_helpers/api'
import {
  FaArrowLeft,
  FaComments,
  FaUser,
  FaUniversity,
  FaStar,
  FaCalendar,
  FaBookOpen,
  FaClipboardList,
  FaGraduationCap,
  FaChartLine,
  FaEdit,
  FaHeart,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'
import ReviewEditModal from '../../_components/ReviewEditModal'
import type { UserReviewData, ReviewsApiResponse } from '../../_types/UserReviewData'

const LoadingSpinner = memo(() => (
  <div className="flex justify-center items-center h-64">
    <Loading type={"bubbles"} width={100} height={100} color={"#1DBE67"} />
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

export default function MyReviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reviewsData, setReviewsData] = useState<ReviewsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingReview, setEditingReview] = useState<UserReviewData | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    // 未認証の場合はログインページにリダイレクト
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await mypageApi.getReviews(page, 10)
      setReviewsData(response.data)
      setCurrentPage(page)
    } catch (error: any) {
      console.error('レビューデータの取得に失敗:', error)

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

  useEffect(() => {
    if (session && status === 'authenticated') {
      fetchReviews(currentPage)
    }
  }, [session, status, currentPage])

  // レビュー編集機能
  const handleEditReview = (review: UserReviewData) => {
    setEditingReview(review)
    setIsEditModalOpen(true)
  }

  // 編集後のレビュー更新
  const handleReviewUpdated = (updatedReview: any) => {
    if (reviewsData) {
      const updatedReviews = reviewsData.reviews.map(review =>
        review.id === updatedReview.id ? { ...review, ...updatedReview } : review
      )
      setReviewsData({
        ...reviewsData,
        reviews: updatedReviews
      })
    }
    setIsEditModalOpen(false)
    setEditingReview(null)
  }

  // レビュー削除機能
  const handleDeleteReview = (reviewId: number) => {
    if (reviewsData) {
      const updatedReviews = reviewsData.reviews.filter(review => review.id !== reviewId)
      setReviewsData({
        ...reviewsData,
        reviews: updatedReviews,
        pagination: {
          ...reviewsData.pagination,
          total_count: reviewsData.pagination.total_count - 1
        },
        statistics: {
          ...reviewsData.statistics,
          total_reviews: reviewsData.statistics.total_reviews - 1
        }
      })

      // 現在のページにレビューがなくなった場合、前のページに戻る
      if (updatedReviews.length === 0 && currentPage > 1) {
        fetchReviews(currentPage - 1)
      }
    }
    setIsEditModalOpen(false)
    setEditingReview(null)
  }

  // ページネーション
  const handlePageChange = (page: number) => {
    if (page >= 1 && reviewsData && page <= reviewsData.pagination.total_pages) {
      fetchReviews(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!session) {
    return null
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
                onClick={() => fetchReviews(currentPage)}
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
            href="/mypage"
            className="group inline-flex items-center mb-6 px-4 py-2 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:shadow-green-200/25 transition-all duration-300 hover:scale-[1.02]"
          >
            <FaArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">マイページに戻る</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">投稿したレビュー</h1>
          <p className="text-gray-600 text-lg">あなたが投稿したレビューの一覧</p>
        </div>

        {/* 統計情報 */}
        {reviewsData && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 text-center border border-green-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <FaComments className="w-8 h-8 mx-auto mb-3 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                <div className="text-3xl font-bold text-green-700 mb-2">{reviewsData.statistics.total_reviews}</div>
                <div className="text-sm text-gray-600 font-medium">総レビュー数</div>
              </div>
            </div>
          </div>
        )}

        {/* レビュー一覧 */}
        {reviewsData && reviewsData.reviews.length > 0 ? (
          <div className="space-y-6">
            {reviewsData.reviews.map((review, index) => (
              <div
                key={review.id}
                className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* レビューヘッダー */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="mb-4 lg:mb-0">
                    <Link
                      href={`/lectures/${review.lecture.id}`}
                      className="block hover:text-green-600 transition-colors duration-300"
                    >
                      <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors duration-300">
                        {review.lecture.title}
                      </h2>
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600">
                      <div className="flex items-center">
                        <FaUser className="text-blue-500 mr-2" />
                        <span className="font-medium">{review.lecture.lecturer}</span>
                      </div>
                      <div className="flex items-center">
                        <FaUniversity className="text-purple-500 mr-2" />
                        <span className="font-medium">{review.lecture.faculty}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:flex-col lg:items-end gap-4">
                    <div className="flex items-center gap-3">
                      <ReactStars
                        value={review.rating}
                        edit={false}
                        size={20}
                        className="flex"
                        half={true}
                      />
                      <span className="text-lg font-bold text-yellow-500">{review.rating}</span>
                    </div>
                    {(review.period_year || review.period_term) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendar className="mr-1" />
                        {review.period_year && `${review.period_year}年`}
                        {review.period_year && review.period_term && ' '}
                        {review.period_term}
                      </div>
                    )}
                  </div>
                </div>

                {/* レビュー詳細情報 */}
                {(review.textbook || review.attendance || review.grading_type || review.content_difficulty || review.content_quality) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      {review.textbook && (
                        <div className="flex items-center gap-3">
                          <FaBookOpen className="text-blue-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-gray-500 block">教科書</span>
                            <span className="font-medium text-gray-800">{review.textbook}</span>
                          </div>
                        </div>
                      )}
                      {review.attendance && (
                        <div className="flex items-center gap-3">
                          <FaClipboardList className="text-green-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-gray-500 block">出席確認</span>
                            <span className="font-medium text-gray-800">{review.attendance}</span>
                          </div>
                        </div>
                      )}
                      {review.grading_type && (
                        <div className="flex items-center gap-3">
                          <FaGraduationCap className="text-purple-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-gray-500 block">採点方法</span>
                            <span className="font-medium text-gray-800">{review.grading_type}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {review.content_difficulty && (
                        <div className="flex items-center gap-3">
                          <FaChartLine className="text-red-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-gray-500 block">難易度</span>
                            <span className="font-medium text-gray-800">{review.content_difficulty}</span>
                          </div>
                        </div>
                      )}
                      {review.content_quality && (
                        <div className="flex items-center gap-3">
                          <FaStar className="text-yellow-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-gray-500 block">内容の質</span>
                            <span className="font-medium text-gray-800">{review.content_quality}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* コメントセクション */}
                {review.content && (
                  <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 mb-4">
                    <div className="flex items-start gap-3">
                      <FaComments className="text-green-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-500 block mb-2">コメント</span>
                        <p className="text-gray-800 leading-relaxed break-words">{review.content && review.content.length > 80
                          ? `${review.content.substring(0, 80)}...`
                          : review.content || 'コメントなし'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2 bg-rose-100 rounded-full px-3 py-1">
                      <FaHeart className="text-rose-500 text-sm" />
                      <span className="text-xs font-bold text-gray-800">
                        {review.thanks_count}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleEditReview(review)}
                    className="group relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/50 hover:from-blue-100 hover:to-indigo-100 hover:shadow-blue-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    <FaEdit className="w-3.5 h-3.5 transform group-hover:scale-110 transition-transform duration-200 relative" />
                    <span className="text-sm relative">編集</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-4">
              <FaComments className="mx-auto text-5xl text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-500 mb-2">まだレビューがありません</h3>
            <p className="text-gray-400 mb-6">最初のレビューを投稿してみませんか？</p>
            <Link
              href="/reviews/new"
              className="group relative inline-flex items-center px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:shadow-green-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              <span className="relative">レビューを投稿</span>
            </Link>
          </div>
        )}

        {/* ページネーション */}
        {reviewsData && reviewsData.pagination.total_pages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">前へ</span>
              </button>

              {Array.from({ length: reviewsData.pagination.total_pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${page === currentPage
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === reviewsData.pagination.total_pages}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">次へ</span>
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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