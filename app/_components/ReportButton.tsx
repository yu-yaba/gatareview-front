'use client'

import { FaFlag, FaExclamationTriangle } from 'react-icons/fa'

interface ReportButtonProps {
  reviewId?: number
  lectureId?: number
}

export default function ReportButton({ reviewId, lectureId }: ReportButtonProps) {
  const handleReport = () => {
    // Googleフォームへのリンク
    const reportUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScVtFHaAtl3iAaqTfjjv691aU8nTiGgSAr5OEoEJLIMkCxc9Q/viewform'
    
    // 新しいタブで開く
    window.open(reportUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleReport}
      className="group relative flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200/50 hover:from-orange-50 hover:to-red-50 hover:text-orange-700 hover:border-orange-200/50 hover:shadow-orange-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
      title="不適切な内容を報告する"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      
      <div className="relative flex items-center gap-2">
        <FaFlag className="w-3.5 h-3.5 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-200" />
        <span className="text-sm relative">報告</span>
      </div>

      {/* Warning indicator on hover */}
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <FaExclamationTriangle className="w-3 h-3 text-orange-500 animate-pulse" />
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  )
}