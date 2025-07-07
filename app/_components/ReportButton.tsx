'use client'

import { FaFlag } from 'react-icons/fa'

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
      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 font-medium transition-all duration-200 hover:scale-105"
      title="不適切な内容を報告する"
    >
      <FaFlag className="w-4 h-4" />
      <span className="text-sm">報告</span>
    </button>
  )
}