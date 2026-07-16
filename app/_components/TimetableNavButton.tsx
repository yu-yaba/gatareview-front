'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { FaCalendarAlt } from 'react-icons/fa'
import LoginPromptModal from './LoginPromptModal'

export default function TimetableNavButton() {
  const { data: session, status } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const className = 'group relative flex items-center overflow-hidden rounded-xl border border-white/30 bg-white/95 px-4 py-3 font-bold text-green-600 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white hover:text-green-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50'

  if (status === 'loading') return <button type="button" disabled className={`${className} opacity-70`} aria-label="ログイン状態を確認中"><FaCalendarAlt /></button>
  if (session) return <Link href="/timetable" className={className}><FaCalendarAlt /><span className="ml-2 hidden text-sm lg:inline">時間割</span></Link>

  return (
    <>
      <button type="button" onClick={() => setShowLoginModal(true)} className={className}><FaCalendarAlt /><span className="ml-2 hidden text-sm lg:inline">時間割</span></button>
      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} featureType="timetable" />
    </>
  )
}
