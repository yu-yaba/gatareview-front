'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Modal from 'react-modal'
import ReactStars from 'react-stars'
import { FaTimes, FaSave } from 'react-icons/fa'

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
}

export default function ReviewEditModal({ isOpen, onClose, review, onSave }: ReviewEditModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
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
      alert('ログインが必要です')
      return
    }

    setIsLoading(true)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/reviews/${review.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.backendToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review: formData })
      })
      
      if (res.ok) {
        const data = await res.json()
        onSave(data.review)
        onClose()
      } else {
        const errorData = await res.json()
        alert(errorData.errors?.[0] || 'レビューの更新に失敗しました')
      }
    } catch (error) {
      console.error('レビューの更新に失敗:', error)
      alert('エラーが発生しました')
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

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="max-w-2xl mx-auto mt-8 bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 評価 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            総合評価 <span className="text-red-500">*</span>
          </label>
          <ReactStars
            count={5}
            value={formData.rating}
            onChange={(rating) => handleInputChange('rating', rating)}
            size={32}
            half={true}
            className="flex"
          />
        </div>

        {/* レビュー内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            レビュー内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="授業の感想を書いてください..."
            required
          />
        </div>

        {/* 選択項目 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">教科書</label>
            <select
              value={formData.textbook}
              onChange={(e) => handleInputChange('textbook', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">選択してください</option>
              <option value="必要">必要</option>
              <option value="不要">不要</option>
              <option value="どちらでも">どちらでも</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">出席</label>
            <select
              value={formData.attendance}
              onChange={(e) => handleInputChange('attendance', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">選択してください</option>
              <option value="必要">必要</option>
              <option value="不要">不要</option>
              <option value="どちらでも">どちらでも</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">成績評価</label>
            <select
              value={formData.grading_type}
              onChange={(e) => handleInputChange('grading_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">選択してください</option>
              <option value="テスト">テスト</option>
              <option value="レポート">レポート</option>
              <option value="発表">発表</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">内容の難易度</label>
            <select
              value={formData.content_difficulty}
              onChange={(e) => handleInputChange('content_difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">選択してください</option>
              <option value="易しい">易しい</option>
              <option value="普通">普通</option>
              <option value="難しい">難しい</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">内容の質</label>
            <select
              value={formData.content_quality}
              onChange={(e) => handleInputChange('content_quality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">選択してください</option>
              <option value="高い">高い</option>
              <option value="普通">普通</option>
              <option value="低い">低い</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">受講年度</label>
            <select
              value={formData.period_year}
              onChange={(e) => handleInputChange('period_year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">選択してください</option>
              <option value="2024">2024年度</option>
              <option value="2023">2023年度</option>
              <option value="2022">2022年度</option>
              <option value="2021">2021年度</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">受講学期</label>
            <select
              value={formData.period_term}
              onChange={(e) => handleInputChange('period_term', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">選択してください</option>
              <option value="前期">前期</option>
              <option value="後期">後期</option>
              <option value="通年">通年</option>
              <option value="集中">集中</option>
            </select>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <FaSave className="w-4 h-4 mr-2" />
            )}
            {isLoading ? '更新中...' : '更新'}
          </button>
        </div>
      </form>
    </Modal>
  )
}