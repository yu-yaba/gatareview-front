'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return (
    <html lang="ja">
      <body style={{ margin: '3rem auto', padding: '1rem', maxWidth: '40rem', fontFamily: 'sans-serif' }}>
        <main>
          <h1>エラーが発生しました</h1>
          <p>しばらく時間をおいてから、再度お試しください。</p>
          <button onClick={reset}>再試行</button>
          <p><Link href="/">ホームへ戻る</Link></p>
        </main>
      </body>
    </html>
  )
}
