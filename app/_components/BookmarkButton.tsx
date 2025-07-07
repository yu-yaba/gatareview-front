'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FaBookmark, FaRegBookmark } from 'react-icons/fa'

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

  useEffect(() => {
    // ログイン時に現在の状態を取得
    if (session) {
      fetchBookmarkStatus()
    }
  }, [session, lectureId])

  const fetchBookmarkStatus = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/lectures/${lectureId}/bookmarks`, {
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
  }

  const handleBookmarkToggle = async () => {
    if (!session) {
      alert('ログインが必要です')
      return
    }

    setIsLoading(true)
    
    try {
      const url = `${process.env.NEXT_PUBLIC_ENV}/lectures/${lectureId}/bookmarks`
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
      <div className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
        <FaRegBookmark className="w-5 h-5 mr-2" />
        <span className="text-sm">ブックマーク</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleBookmarkToggle}
      disabled={isLoading}
      className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        bookmarked
          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
    >
      {bookmarked ? (
        <FaBookmark className="w-5 h-5 mr-2" />
      ) : (
        <FaRegBookmark className="w-5 h-5 mr-2" />
      )}
      <span className="text-sm">
        {bookmarked ? 'ブックマーク済み' : 'ブックマーク'}
      </span>
    </button>
  )
}