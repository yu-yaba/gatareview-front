'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FaHeart, FaRegHeart, FaSpinner } from 'react-icons/fa'

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/${reviewId}/thanks`, {
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
      const url = `${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/${reviewId}/thanks`
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
      <div className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 text-gray-500 shadow-sm border border-gray-200/50 backdrop-blur-sm">
        <FaRegHeart className="w-4 h-4 opacity-60" />
        <span className="text-sm font-medium min-w-[20px] text-center">
          {thanksCount}
        </span>
        <span className="text-xs hidden sm:inline font-medium">ありがとう</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleThanksToggle}
      disabled={isLoading}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden ${
        thanked
          ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 border-rose-200/50 hover:from-rose-100 hover:to-pink-100 hover:shadow-rose-200/25'
          : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200/50 hover:from-slate-100 hover:to-gray-100 hover:shadow-slate-200/25'
      } ${isLoading ? 'cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      
      <div className="relative flex items-center gap-2">
        {isLoading ? (
          <FaSpinner className="w-4 h-4 animate-spin" />
        ) : thanked ? (
          <FaHeart className={`w-4 h-4 transform transition-all duration-200 group-hover:scale-110 ${thanked ? 'animate-pulse' : ''}`} />
        ) : (
          <FaRegHeart className="w-4 h-4 transform group-hover:scale-110 transition-transform duration-200" />
        )}
        
        <div className={`flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
          thanked 
            ? 'bg-rose-100 text-rose-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {thanksCount}
        </div>
        
        <span className="text-xs hidden sm:inline relative">
          {isLoading ? '処理中...' : thanked ? 'ありがとう済み' : 'ありがとう'}
        </span>
      </div>

      {/* Pulse effect for liked state */}
      {thanked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-400/20 to-pink-400/20 animate-ping opacity-20" />
      )}

      {/* Subtle glow effect */}
      <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
        thanked 
          ? 'bg-gradient-to-r from-rose-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100' 
          : 'bg-gradient-to-r from-slate-400/10 to-gray-400/10 opacity-0 group-hover:opacity-100'
      }`} />
    </button>
  )
}