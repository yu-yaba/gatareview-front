'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Modal from 'react-modal'
import ReactStars from 'react-stars'
import { FaTimes, FaSave, FaTrash } from 'react-icons/fa'
import { success, error } from '@/app/_helpers/notifications'

interface ReviewEditModalProps {
  isOpen: boolean
  onClose: () => void
  review: {
    id: number
    rating: number
    content: string
    textbook: string
    attendance: string
    grading_type: string
    content_difficulty: string
    content_quality: string
    period_year: string
    period_term: string
  }
  onSave: (updatedReview: any) => void
  onDelete?: (reviewId: number) => void
}

export default function ReviewEditModal({ isOpen, onClose, review, onSave, onDelete }: ReviewEditModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    rating: review.rating,
    content: review.content,
    textbook: review.textbook,
    attendance: review.attendance,
    grading_type: review.grading_type,
    content_difficulty: review.content_difficulty,
    content_quality: review.content_quality,
    period_year: review.period_year,
    period_term: review.period_term
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      error('ログインが必要です')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('Updating review:', {
        reviewId: review.id,
        token: session.backendToken ? 'Present' : 'Missing',
        formData
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/${review.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.backendToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review: formData })
      })
      
      console.log('Response status:', res.status);
      const responseData = await res.json();
      console.log('Response data:', responseData);
      
      if (res.ok) {
        onSave(responseData.review)
        onClose()
        success('レビューが更新されました')
      } else {
        error(responseData.errors?.[0] || responseData.error || 'レビューの更新に失敗しました')
      }
    } catch (err) {
      console.error('レビューの更新に失敗:', err)
      error('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDelete = async () => {
    if (!confirm('このレビューを削除しますか？この操作は取り消せません。')) {
      return
    }

    if (!session) {
      error('ログインが必要です')
      return
    }

    setIsDeleting(true)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/${review.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.backendToken}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (res.ok) {
        if (onDelete) {
          onDelete(review.id)
        }
        onClose()
        success('レビューが削除されました')
      } else {
        const errorData = await res.json()
        error(errorData.message || 'レビューの削除に失敗しました')
      }
    } catch (err) {
      console.error('レビューの削除に失敗:', err)
      error('エラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="w-full max-w-6xl mx-auto mt-2 sm:mt-8 lg:mt-0 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-green-100/50 p-6 md:p-8 lg:p-10 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start lg:items-center justify-center p-2 sm:p-4 z-50"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">レビューを編集</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaTimes className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-8">
            {/* 評価 */}
            <div>
              <label className="block">
                <p className="font-bold mb-4 text-gray-800 text-lg">
                  総合評価
                  <span className="ml-3 text-sm font-normal text-red-500 bg-red-100 px-3 py-1 rounded-full">
                    必須
                  </span>
                </p>
                <div className="flex flex-col items-center justify-center p-8 rounded-3xl shadow-lg border border-yellow-200/50 backdrop-blur-sm">
                  <ReactStars
                    count={5}
                    value={formData.rating}
                    onChange={(rating) => handleInputChange('rating', rating)}
                    size={40}
                    half={true}
                    className="flex mb-4"
                  />
                  <div className="text-center">
                    <span className="text-2xl font-bold text-yellow-400">{formData.rating}</span>
                    <span className="text-lg text-gray-600 ml-1">/ 5</span>
                  </div>
                </div>
              </label>
            </div>

            {/* レビュー内容 */}
            <div>
              <label className="block">
                <p className="font-bold mb-4 text-gray-800 text-lg">
                  レビュー内容
                  <span className="ml-3 text-sm font-normal text-red-500 bg-red-100 px-3 py-1 rounded-full">
                    必須
                  </span>
                </p>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={6}
                  className="p-4 w-full rounded-2xl shadow-lg bg-white/95 backdrop-blur-md border border-green-100/50 focus:ring-2 focus:outline-none text-gray-800 font-medium transition-all duration-300 resize-none hover:shadow-xl focus:border-green-500 focus:ring-green-200 hover:border-green-300 lg:min-h-[220px]"
                  placeholder="授業の感想やアドバイスなどを150文字以内で入力してください..."
                  required
                />
              </label>
            </div>
          </div>

          {/* 選択項目 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <p className="font-bold mb-3 text-gray-800">
                教科書
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  任意
                </span>
              </p>
              <div className="relative">
                <select
                  value={formData.textbook}
                  onChange={(e) => handleInputChange('textbook', e.target.value)}
                  className="block appearance-none w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-green-100/50 focus:ring-2 focus:outline-none cursor-pointer text-gray-800 font-medium transition-all duration-300 hover:shadow-xl focus:border-green-500 focus:ring-green-200 hover:border-green-300"
                >
                  <option value="">選択してください</option>
                  <option value="必要">必要</option>
                  <option value="不要">不要</option>
                  <option value="どちらでも">どちらでも</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-green-600">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-3 text-gray-800">
                出席確認
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  任意
                </span>
              </p>
              <div className="relative">
                <select
                  value={formData.attendance}
                  onChange={(e) => handleInputChange('attendance', e.target.value)}
                  className="block appearance-none w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-green-100/50 focus:ring-2 focus:outline-none cursor-pointer text-gray-800 font-medium transition-all duration-300 hover:shadow-xl focus:border-green-500 focus:ring-green-200 hover:border-green-300"
                >
                  <option value="">選択してください</option>
                  <option value="毎回確認">毎回確認</option>
                  <option value="たまに確認">たまに確認</option>
                  <option value="なし">なし</option>
                  <option value="その他・不明">その他・不明</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-green-600">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-3 text-gray-800">
                採点方法
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  任意
                </span>
              </p>
              <div className="relative">
                <select
                  value={formData.grading_type}
                  onChange={(e) => handleInputChange('grading_type', e.target.value)}
                  className="block appearance-none w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-green-100/50 focus:ring-2 focus:outline-none cursor-pointer text-gray-800 font-medium transition-all duration-300 hover:shadow-xl focus:border-green-500 focus:ring-green-200 hover:border-green-300"
                >
                  <option value="">選択してください</option>
                  <option value="テストのみ">テストのみ</option>
                  <option value="レポートのみ">レポートのみ</option>
                  <option value="テスト,レポート">テスト,レポート</option>
                  <option value="その他・不明">その他・不明</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-green-600">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-3 text-gray-800">
                単位取得難易度
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  任意
                </span>
              </p>
              <div className="relative">
                <select
                  value={formData.content_difficulty}
                  onChange={(e) => handleInputChange('content_difficulty', e.target.value)}
                  className="block appearance-none w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-green-100/50 focus:ring-2 focus:outline-none cursor-pointer text-gray-800 font-medium transition-all duration-300 hover:shadow-xl focus:border-green-500 focus:ring-green-200 hover:border-green-300"
                >
                  <option value="">選択してください</option>
                  <option value="とても楽">とても楽</option>
                  <option value="楽">楽</option>
                  <option value="普通">普通</option>
                  <option value="難">難</option>
                  <option value="とても難しい">とても難しい</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-green-600">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-3 text-gray-800">
                内容充実度
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  任意
                </span>
              </p>
              <div className="relative">
                <select
                  value={formData.content_quality}
                  onChange={(e) => handleInputChange('content_quality', e.target.value)}
                  className="block appearance-none w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-green-100/50 focus:ring-2 focus:outline-none cursor-pointer text-gray-800 font-medium transition-all duration-300 hover:shadow-xl focus:border-green-500 focus:ring-green-200 hover:border-green-300"
                >
                  <option value="">選択してください</option>
                  <option value="とても良い">とても良い</option>
                  <option value="良い">良い</option>
                  <option value="普通">普通</option>
                  <option value="悪い">悪い</option>
                  <option value="とても悪い">とても悪い</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-green-600">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-3 text-gray-800">
                受講年度
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  任意
                </span>
              </p>
              <div className="relative">
                <select
                  value={formData.period_year}
                  onChange={(e) => handleInputChange('period_year', e.target.value)}
                  className="block appearance-none w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-green-100/50 focus:ring-2 focus:outline-none cursor-pointer text-gray-800 font-medium transition-all duration-300 hover:shadow-xl focus:border-green-500 focus:ring-green-200 hover:border-green-300"
                >
                  <option value="">選択してください</option>
                  <option value="2025">2025年度</option>
                  <option value="2024">2024年度</option>
                  <option value="2023">2023年度</option>
                  <option value="2022">2022年度</option>
                  <option value="2021">2021年度</option>
                  <option value="その他・不明">その他・不明</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-green-600">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-3 text-gray-800">
                開講学期
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  任意
                </span>
              </p>
              <div className="relative">
                <select
                  value={formData.period_term}
                  onChange={(e) => handleInputChange('period_term', e.target.value)}
                  className="block appearance-none w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-green-100/50 focus:ring-2 focus:outline-none cursor-pointer text-gray-800 font-medium transition-all duration-300 hover:shadow-xl focus:border-green-500 focus:ring-green-200 hover:border-green-300"
                >
                  <option value="">選択してください</option>
                  <option value="1ターム">1ターム</option>
                  <option value="2ターム">2ターム</option>
                  <option value="1, 2ターム">1, 2ターム</option>
                  <option value="3ターム">3ターム</option>
                  <option value="4ターム">4ターム</option>
                  <option value="3, 4ターム">3, 4ターム</option>
                  <option value="通年">通年</option>
                  <option value="集中">集中</option>
                  <option value="その他・不明">その他・不明</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-green-600">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-8 py-4 bg-white/95 backdrop-blur-md border border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <FaTimes className="mr-2 relative z-10" />
            <span className="relative z-10">キャンセル</span>
          </button>
          
          {/* 削除ボタン（onDeleteが提供されている場合のみ表示） */}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-red-500/25 flex items-center justify-center relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
              {isDeleting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 relative z-10"></div>
              ) : (
                <FaTrash className="w-4 h-4 mr-2 relative z-10 transform group-hover:scale-110 transition-transform duration-200" />
              )}
              <span className="relative z-10">{isDeleting ? '削除中...' : '削除'}</span>
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading || isDeleting}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 flex items-center justify-center relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 relative z-10"></div>
            ) : (
              <FaSave className="w-4 h-4 mr-2 relative z-10 transform group-hover:scale-110 transition-transform duration-200" />
            )}
            <span className="relative z-10">{isLoading ? '更新中...' : '更新'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
