'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { FaBookmark, FaRegBookmark, FaSpinner } from 'react-icons/fa'
import LoginPromptModal from './LoginPromptModal'

interface BookmarkButtonProps {
  lectureId: number
  initialBookmarked?: boolean
  onBookmarkChange?: (bookmarked: boolean) => void
}

export default function BookmarkButton({ 
  lectureId, 
  initialBookmarked = false,
  onBookmarkChange 
}: BookmarkButtonProps) {
  const { data: session } = useSession()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const fetchBookmarkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${lectureId}/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${session?.backendToken}`,
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        setBookmarked(data.bookmarked)
      }
    } catch (error) {
      console.error('ブックマーク状態の取得に失敗:', error)
    }
  }, [lectureId, session])

  useEffect(() => {
    // ログイン時に現在の状態を取得
    if (session) {
      fetchBookmarkStatus()
    }
  }, [session, fetchBookmarkStatus])

  const handleBookmarkToggle = async () => {
    if (!session) {
      setShowLoginModal(true)
      return
    }

    setIsLoading(true)
    
    try {
      const url = `${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${lectureId}/bookmarks`
      const method = bookmarked ? 'DELETE' : 'POST'
      
      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${session.backendToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (res.ok) {
        const newBookmarked = !bookmarked
        setBookmarked(newBookmarked)
        onBookmarkChange?.(newBookmarked)
      } else {
        const errorData = await res.json()
        alert(errorData.errors?.[0] || 'エラーが発生しました')
      }
    } catch (error) {
      console.error('ブックマークの操作に失敗:', error)
      alert('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <>
        <button
          onClick={handleBookmarkToggle}
          className="group flex items-center justify-center px-4 py-3 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 hover:from-gray-100 hover:to-gray-200 shadow-sm border border-gray-200/50 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        >
          <FaRegBookmark className="w-4 h-4 mr-2 opacity-60 group-hover:opacity-80" />
          <span className="text-sm font-medium">ブックマーク</span>
        </button>
        
        <LoginPromptModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          featureType="bookmark"
        />
      </>
    )
  }

  return (
    <button
      onClick={handleBookmarkToggle}
      disabled={isLoading}
      className={`group relative flex items-center justify-center px-4 py-3 rounded-2xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden ${
        bookmarked
          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200/50 hover:from-amber-100 hover:to-yellow-100 hover:shadow-amber-200/25'
          : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200/50 hover:from-slate-100 hover:to-gray-100 hover:shadow-slate-200/25'
      } ${isLoading ? 'cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      
      <div className="relative flex items-center">
        {isLoading ? (
          <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
        ) : bookmarked ? (
          <FaBookmark className="w-4 h-4 mr-2 transform group-hover:scale-110 transition-transform duration-200" />
        ) : (
          <FaRegBookmark className="w-4 h-4 mr-2 transform group-hover:scale-110 transition-transform duration-200" />
        )}
        <span className="text-sm relative">
          {isLoading ? '処理中...' : bookmarked ? 'ブックマーク済み' : 'ブックマーク'}
        </span>
      </div>

      {/* Subtle glow effect */}
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
        bookmarked 
          ? 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20 opacity-0 group-hover:opacity-100' 
          : 'bg-gradient-to-r from-slate-400/10 to-gray-400/10 opacity-0 group-hover:opacity-100'
      }`} />
    </button>
  )
}