'use client'

import React, { useState } from 'react'
import { FaEye, FaLock } from 'react-icons/fa'
import { useAuth } from '../_hooks/useAuth'
import { canAccessReviews, canAccessReviewsUnified } from '../_helpers/reviewAccessManager'
import ReviewPromptModal from './ReviewPromptModal'

interface ReviewAccessBlurProps {
  children: React.ReactNode
  lectureId: number
  reviewsData?: any[]
}

// コメントの部分表示用コンポーネント
export const PartialComment = ({ content }: { content: string }) => {
  if (!content) return null

  // 短いコメントの場合（50文字以下）は30%まで表示
  if (content.length <= 50) {
    const visibleLength = Math.floor(content.length * 0.3)
    const visibleText = content.substring(0, visibleLength)
    const hiddenText = content.substring(visibleLength)
    
    return (
      <div className="min-h-24 flex items-start">
        <p className="text-gray-800 leading-relaxed break-words">
          <span>{visibleText}</span>
          <span className="filter blur-sm select-none opacity-60">
            {hiddenText}
          </span>
        </p>
      </div>
    )
  }

  // 長いコメントの場合は1行目の半分まで表示
  const firstLineEnd = content.indexOf('\n') !== -1 ? content.indexOf('\n') : Math.min(content.length, 80)
  const firstLine = content.substring(0, firstLineEnd)
  const visibleLength = Math.floor(firstLine.length * 0.5)
  const visibleText = firstLine.substring(0, visibleLength)
  const hiddenPart = content.substring(visibleLength)

  return (
    <div className="min-h-16 flex items-start">
      <p className="text-gray-800 leading-relaxed break-words">
        <span>{visibleText}</span>
        <span className="filter blur-sm select-none opacity-60">
          {hiddenPart}
        </span>
      </p>
    </div>
  )
}

export default function ReviewAccessBlur({ children, lectureId, reviewsData }: ReviewAccessBlurProps) {
  const { user, isAuthenticated } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // レビュー閲覧権限をチェック（期間ベースAPI優先、フォールバックでセッション認証またはローカルストレージの権限）
  const canViewReviews = canAccessReviewsUnified(reviewsData || null, isAuthenticated, user?.reviews_count)

  if (canViewReviews) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* レビュー表示（コメント部分のみ特殊処理） */}
      <div style={{
        '--mask-gradient': 'linear-gradient(to right, black 50%, transparent 100%)'
      } as React.CSSProperties}>
        {children}
      </div>

      {/* コメントセクションにオーバーレイを適用 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 60%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0.6) 90%, rgba(255,255,255,0.9) 100%)'
        }}
      ></div>

      {/* オーバーレイとボタンを配置 */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-gray-200/50 text-center max-w-sm mx-4 pointer-events-auto">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <FaLock className="text-white text-lg" />
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            続きを見るには
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {!isAuthenticated ? 'ログイン&1レビューが必要です' : '1レビューが必要です'}
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-green-500/25 flex items-center justify-center group"
          >
            <FaEye className="mr-2 group-hover:scale-110 transition-transform duration-300" />
            <span>
              {!isAuthenticated ? 'ログイン&1レビューする' : 'レビューを投稿する'}
            </span>
          </button>
        </div>
      </div>

      {/* モーダル */}
      <ReviewPromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lectureId={lectureId}
      />
    </div>
  )
}