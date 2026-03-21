'use client'

import React from 'react'

// コメントの部分表示用コンポーネント
export const PartialComment = ({ content }: { content: string }) => {
  if (!content) return null

  // ダミーテキスト（十分な長さを確保）
  const dummyText = 'この授業は非常に興味深く、講義内容も充実していました。課題の量も適切で、理解を深めることができました。テストは授業内容をしっかり復習すれば対応可能です。'

  // 30文字未満のコメントは全文ぼかし表示（ダミーテキスト付き）
  if (content.length < 30) {
    return (
      <div className="min-h-16 md:min-h-16 h-40 md:h-auto overflow-hidden md:overflow-visible flex items-start">
        <p className="text-gray-800 leading-relaxed w-full" style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>
          <span className="filter blur-sm select-none opacity-60">
            {content + dummyText}
          </span>
        </p>
      </div>
    )
  }

  // 30文字以上のコメントは最初の30文字のみ表示（それ以降はダミーテキストでぼかし）
  const visibleText = content.substring(0, 30)
  const hiddenText = dummyText

  return (
    <div className="min-h-16 md:min-h-16 h-40 md:h-auto overflow-hidden md:overflow-visible flex items-start">
      <p className="text-gray-800 leading-relaxed w-full" style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>
        <span>{visibleText}</span>
        <span className="filter blur-sm select-none opacity-60">
          {hiddenText}
        </span>
      </p>
    </div>
  )
}

export default function ReviewAccessBlur({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
