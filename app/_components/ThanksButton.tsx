'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FaHeart, FaRegHeart } from 'react-icons/fa'

interface ThanksButtonProps {
  reviewId: number
  initialThanked?: boolean
  initialThanksCount?: number
  onThanksChange?: (thanked: boolean, thanksCount: number) => void
}

export default function ThanksButton({ 
  reviewId, 
  initialThanked = false, 
  initialThanksCount = 0,
  onThanksChange 
}: ThanksButtonProps) {
  const { data: session } = useSession()
  const [thanked, setThanked] = useState(initialThanked)
  const [thanksCount, setThanksCount] = useState(initialThanksCount)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // ログイン時に現在の状態を取得
    if (session) {
      fetchThanksStatus()
    }
  }, [session, reviewId])

  const fetchThanksStatus = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/reviews/${reviewId}/thanks`, {
        headers: {
          'Authorization': `Bearer ${session?.backendToken}`,
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        setThanked(data.thanked)
        setThanksCount(data.thanks_count)
      }
    } catch (error) {
      console.error('ありがとう状態の取得に失敗:', error)
    }
  }

  const handleThanksToggle = async () => {
    if (!session) {
      alert('ログインが必要です')
      return
    }

    setIsLoading(true)
    
    try {
      const url = `${process.env.NEXT_PUBLIC_ENV}/reviews/${reviewId}/thanks`
      const method = thanked ? 'DELETE' : 'POST'
      
      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${session.backendToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        const newThanked = !thanked
        const newThanksCount = data.thanks_count
        
        setThanked(newThanked)
        setThanksCount(newThanksCount)
        
        onThanksChange?.(newThanked, newThanksCount)
      } else {
        const errorData = await res.json()
        alert(errorData.errors?.[0] || 'エラーが発生しました')
      }
    } catch (error) {
      console.error('ありがとうの送信に失敗:', error)
      alert('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <FaRegHeart className="w-5 h-5" />
        <span className="text-sm">{thanksCount}</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleThanksToggle}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
        thanked
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
    >
      {thanked ? (
        <FaHeart className="w-5 h-5" />
      ) : (
        <FaRegHeart className="w-5 h-5" />
      )}
      <span className="text-sm">{thanksCount}</span>
      <span className="text-xs hidden sm:inline">
        {thanked ? 'ありがとう済み' : 'ありがとう'}
      </span>
    </button>
  )
}