import { notFound } from 'next/navigation'
import SessionDebugClient from './SessionDebugClient'

export default function SessionDebugPage() {
  // 本番環境ではデバッグページを公開しない
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return <SessionDebugClient />
}
