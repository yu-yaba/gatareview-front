import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'よくある質問 - ガタレビュ！新潟大学授業レビューサイト',
  description: 'ガタレビュ！についてよくある質問をまとめました。新潟大学の授業レビューサイトの使い方、投稿方法、利用料金などについて詳しく解説しています。',
  keywords: [
    'ガタレビュ FAQ',
    '新潟大学 授業レビュー FAQ',
    'よくある質問',
    '使い方',
    '投稿方法',
    '新潟大学',
    '授業レビューサイト'
  ],
  openGraph: {
    title: 'よくある質問 - ガタレビュ！',
    description: 'ガタレビュ！についてよくある質問をまとめました。新潟大学の授業レビューサイトの使い方や機能について詳しく解説。',
    url: '/faq',
    type: 'article',
  },
  twitter: {
    title: 'よくある質問 - ガタレビュ！',
    description: 'ガタレビュ！についてよくある質問をまとめました。',
  },
  alternates: {
    canonical: '/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 