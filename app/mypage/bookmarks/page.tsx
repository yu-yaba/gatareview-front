'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, memo } from 'react'
import Link from 'next/link'
import Loading from 'react-loading'
import { mypageApi } from '../../_helpers/api'
import {
  FaArrowLeft,
  FaBookmark,
  FaUser,
  FaUniversity,
  FaStar,
  FaCommentAlt,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaSearch
} from 'react-icons/fa'
import BookmarkButton from '../../_components/BookmarkButton'
import type { BookmarkedLectureData, BookmarksApiResponse } from '../../_types/BookmarkedLectureData'

const LoadingSpinner = memo(() => (
  <div className="flex justify-center items-center h-64">
    <Loading type={"bubbles"} width={100} height={100} color={"#1DBE67"} />
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

export default function MyBookmarksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookmarksData, setBookmarksData] = useState<BookmarksApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    // 未認証の場合はログインページにリダイレクト
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const validateBookmarksResponse = (data: any): data is BookmarksApiResponse => {
    return data &&
           typeof data === 'object' &&
           Array.isArray(data.bookmarks) &&
           data.pagination &&
           typeof data.pagination.current_page === 'number' &&
           typeof data.pagination.total_pages === 'number' &&
           data.statistics &&
           typeof data.statistics.total_bookmarks === 'number'
  }

  const fetchBookmarks = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await mypageApi.getBookmarks(page, 10)
      
      // レスポンス構造の検証
      if (!validateBookmarksResponse(response.data)) {
        console.error('無効なレスポンス構造:', response.data)
        throw new Error('INVALID_RESPONSE_STRUCTURE')
      }

      setBookmarksData(response.data)
      setCurrentPage(page)
    } catch (error: any) {
      // セキュリティ: AxiosError の全体出力はAuthorizationヘッダー等が含まれ得るため避ける
      console.error('ブックマークデータの取得に失敗:', error?.response?.status, error?.message)

      // ネットワークエラーの詳細分類
      if (!error.response) {
        // ネットワーク接続エラー
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
          setError('ネットワーク接続に問題があります。インターネット接続を確認してください。')
        } else if (error.message === 'INVALID_RESPONSE_STRUCTURE') {
          setError('サーバーからの無効な応答です。管理者にお問い合わせください。')
        } else {
          setError('接続がタイムアウトしました。しばらく待ってから再度お試しください。')
        }
      } else {
        // HTTPエラーレスポンス
        const status = error.response.status
        const errorData = error.response.data
        
        switch (status) {
          case 401:
            setError('セッションの有効期限が切れました。再度ログインしてください。')
            break
          case 403:
            setError('アクセスが拒否されました。権限を確認してください。')
            break
          case 404:
            setError('ブックマークデータが見つかりません。')
            break
          case 422:
            setError(`入力エラー: ${errorData?.message || 'パラメータを確認してください。'}`)
            break
          case 429:
            setError('リクエストが多すぎます。しばらく待ってから再度お試しください。')
            break
          case 500:
          case 502:
          case 503:
            setError('サーバーでエラーが発生しました。時間をおいて再度お試しください。')
            break
          default:
            setError(`予期しないエラーが発生しました (${status})。管理者にお問い合わせください。`)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session && status === 'authenticated') {
      fetchBookmarks(currentPage)
    }
  }, [session, status, currentPage])

  // ブックマーク削除機能
  const handleBookmarkRemoved = (lectureId: number) => {
    if (bookmarksData) {
      // ページを遷移するまでリストからは消さない
    }
  }

  // ページネーション
  const handlePageChange = (page: number) => {
    if (page >= 1 && bookmarksData && bookmarksData.pagination && page <= (bookmarksData.pagination.total_pages || 0)) {
      fetchBookmarks(page)
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
                onClick={() => fetchBookmarks(currentPage)}
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ブックマークした授業</h1>
          <p className="text-gray-600 text-lg">あなたがブックマークした授業の一覧</p>
        </div>

        {/* 統計情報 */}
        {bookmarksData && bookmarksData.statistics && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300 mb-8">
            <div className="flex justify-center">
              <div className="group bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl p-6 text-center border border-yellow-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] w-full max-w-sm">
                <FaBookmark className="w-8 h-8 mx-auto mb-3 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
                <div className="text-3xl font-bold text-yellow-700 mb-2">{bookmarksData.statistics?.total_bookmarks || 0}</div>
                <div className="text-sm text-gray-600 font-medium">総ブックマーク数</div>
              </div>
            </div>
          </div>
        )}

        {/* ブックマーク一覧 */}
        {bookmarksData && bookmarksData.bookmarks && Array.isArray(bookmarksData.bookmarks) && bookmarksData.bookmarks.length > 0 ? (
          <div className="space-y-6">
            {bookmarksData.bookmarks.map((lecture, index) => (
              <div
                key={lecture.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="block w-full bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative">
                  {/* ブックマークボタン（右上） */}
                  <div className="absolute top-4 right-4 z-10">
                    <BookmarkButton
                      lectureId={lecture.id}
                      onBookmarkChange={(isBookmarked) => {
                        if (!isBookmarked) {
                          handleBookmarkRemoved(lecture.id);
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-4 h-full flex flex-col pr-12">
                    <div className="space-y-2 flex-grow">
                      <Link
                        href={`/lectures/${lecture.id}`}
                        className="block hover:text-green-600 transition-colors duration-300"
                      >
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors duration-300 leading-tight">
                          {lecture.title}
                        </h3>
                      </Link>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <FaUser className="text-blue-500 mr-2 text-sm" />
                          <p className="text-sm text-gray-700 font-medium">
                            {lecture.lecturer}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <FaUniversity className="text-purple-500 mr-2 text-sm" />
                          <p className="text-sm font-semibold text-green-600">
                            {lecture.faculty}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                          <FaStar className={lecture.avg_rating > 0 ? "text-yellow-400 text-sm" : "text-gray-400 text-sm"} />
                          <span className="text-xs font-bold text-gray-800">
                            {lecture.avg_rating > 0 ? lecture.avg_rating.toFixed(1) : '未評価'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                          <FaCommentAlt className="text-green-500 text-sm" />
                          <span className="text-xs font-bold text-gray-800">{lecture.review_count}件</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 flex items-center">
                        <FaBookmark className="mr-1 text-blue-500" />
                        ブックマーク日: {new Date(lecture.bookmarked_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-4">
              <FaBookmark className="mx-auto text-5xl text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-500 mb-2">まだブックマークした授業がありません</h3>
            <p className="text-gray-400 mb-6">気になる授業をブックマークしてみませんか？</p>
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

        {/* ページネーション */}
        {bookmarksData && bookmarksData.pagination && (bookmarksData.pagination.total_pages || 0) > 1 && (
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

              {Array.from({ length: bookmarksData.pagination?.total_pages || 0 }, (_, i) => i + 1).map((page) => (
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
                disabled={currentPage === (bookmarksData.pagination?.total_pages || 0)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">次へ</span>
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
