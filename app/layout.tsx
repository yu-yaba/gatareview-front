import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from './header'
import Footer from './footer'
import { ToastContainer } from 'react-toastify';
import ScriptGa from './_components/ScriptGa'
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://gatareview.com'),
  title: 'ガタレビュ！ - 新潟大学の授業レビューサイト',
  description: '新潟大学生のための授業レビューサイトです。シラバスではわからないリアルな授業情報を共有しましょう。履修選択に役立つ学生の生の声をお届けします。',
  keywords: [
    '新潟大学',
    '授業レビュー',
    '授業レビューサイト',
    '新潟大学 授業',
    '履修',
    'シラバス',
    '新大',
    '授業評価',
    '学生の声',
    '履修選択',
    '新潟大学生',
    '授業情報',
    'ガタレビュ'
  ],
  authors: [{ name: 'ガタレビュ運営チーム' }],
  creator: 'ガタレビュ運営チーム',
  publisher: 'ガタレビュ',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png'
  },
  manifest: '/manifest.json',
  themeColor: '#1DBE67',
  colorScheme: 'light',
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'ガタレビュ！ - 新潟大学の授業レビューサイト',
    description: '新潟大学生のための授業レビューサイト。シラバスではわからないリアルな授業情報を学生同士で共有。履修選択に役立つ詳細な授業評価とレビューを提供します。',
    url: 'https://gatareview.com',
    siteName: 'ガタレビュ！',
    images: [
      {
        url: '/ogp.png',
        width: 1200,
        height: 630,
        alt: 'ガタレビュ！ - 新潟大学の授業レビューサイト',
      }
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ガタレビュ！ - 新潟大学の授業レビューサイト',
    description: '新潟大学生のための授業レビューサイト。履修選択に役立つリアルな授業情報を共有。',
    images: ['/ogp.png'],
    creator: '@gatareview',
    site: '@gatareview',
  },
  alternates: {
    canonical: 'https://gatareview.com',
  },
  category: 'education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <ScriptGa />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'ガタレビュ！',
              description: '新潟大学生のための授業レビューサイト',
              url: 'https://gatareview.com',
              logo: 'https://gatareview.com/icon.png',
              sameAs: [
                'https://twitter.com/gatareview',
              ],
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'JP',
                addressRegion: '新潟県',
                addressLocality: '新潟市',
              },
              areaServed: {
                '@type': 'Place',
                name: '新潟大学',
              },
              audience: {
                '@type': 'EducationalAudience',
                educationalRole: 'student',
              },
              provider: {
                '@type': 'Organization',
                name: 'ガタレビュ運営チーム',
                url: 'https://gatareview.com',
              },
              mainEntityOfPage: {
                '@type': 'WebSite',
                '@id': 'https://gatareview.com',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://gatareview.com/lectures?search={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'JPY',
                description: '無料で利用可能な授業レビューサービス',
              },
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <Header />
        <ToastContainer />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}