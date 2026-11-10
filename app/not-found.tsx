import type { Metadata } from 'next'
import NotFoundContent from './_components/NotFoundContent'

// robots は Next.js が 404 応答に noindex を1つだけ付ける。canonical は付けない。
export const metadata: Metadata = {
  title: 'ページが見つかりません - ガタレビュ！',
}

export default function NotFound() {
  return <NotFoundContent />
}
