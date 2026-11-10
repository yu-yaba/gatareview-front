import type { Metadata } from 'next'
import JsonLd from '../_components/JsonLd'
import { HOME_BREADCRUMB, breadcrumbJsonLd, indexablePageMetadata } from '../_helpers/seo'
import { faqData } from './faqData'

export const metadata: Metadata = indexablePageMetadata({
  title: 'よくある質問 - ガタレビュ！新潟大学授業レビューサイト',
  description: 'ガタレビュ！についてよくある質問をまとめました。新潟大学の授業レビューサイトの使い方、投稿方法、利用料金などについて詳しく解説しています。',
  path: '/faq',
  keywords: [
    'ガタレビュ FAQ',
    '新潟大学 授業レビュー FAQ',
    'よくある質問',
    '使い方',
    '投稿方法',
    '新潟大学',
    '授業レビューサイト'
  ],
  openGraphType: 'article',
})

// FAQPage はこのページにだけ置き、画面に表示している質問と回答をそのまま使う。
const faqPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqData.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

const faqBreadcrumbJsonLd = breadcrumbJsonLd([
  HOME_BREADCRUMB,
  { name: 'よくある質問', path: '/faq' },
])

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={[faqPageJsonLd, faqBreadcrumbJsonLd]} />
      {children}
    </>
  )
}
