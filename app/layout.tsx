import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from './header'
import Footer from './footer'
import { ToastContainer } from 'react-toastify';
import ScriptGa from './_components/ScriptGa'
import GoogleAdsense from './components/GoogleAdsense';
import GoogleAdsenseScript from './components/GoogleAdsenseScript';
import { ADSENSE_CONFIG } from './config/adsense';

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
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/icon.png'
  },
  manifest: '/manifest.json',
  themeColor: '#1DBE67',
  colorScheme: 'light',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  verification: {
    google: 'google-site-verification-code', // 実際のコードに置き換える
    // yandex: 'yandex-verification-code',
    // bing: 'bing-verification-code',
  },
  other: {
    'geo.region': 'JP-15',
    'geo.placename': 'Niigata',
    'geo.position': '37.9161;139.0364',
    'ICBM': '37.9161, 139.0364',
    'revisit-after': '1 day',
    'rating': 'general',
    'distribution': 'global',
    'language': 'ja',
    'copyright': 'ガタレビュ運営チーム',
  },
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
    countryName: 'Japan',
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
    languages: {
      'ja-JP': 'https://gatareview.com',
    },
  },
  category: 'education',
  classification: 'education',
  referrer: 'origin-when-cross-origin',
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
        <GoogleAdsenseScript />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              // メインのWebサイト情報
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                '@id': 'https://gatareview.com/#website',
                name: 'ガタレビュ！',
                description: '新潟大学生のための授業レビューサイト',
                url: 'https://gatareview.com',
                inLanguage: 'ja-JP',
                publisher: {
                  '@type': 'Organization',
                  '@id': 'https://gatareview.com/#organization',
                },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://gatareview.com/lectures?search={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
              // 組織情報
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                '@id': 'https://gatareview.com/#organization',
                name: 'ガタレビュ運営チーム',
                description: '新潟大学生のための授業レビューサイト運営',
                url: 'https://gatareview.com',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://gatareview.com/icon.png',
                  width: 180,
                  height: 180,
                },
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
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 37.9161,
                    longitude: 139.0364,
                  },
                },
                foundingDate: '2024',
                email: 'contact@gatareview.com',
              },
              // 教育組織としての情報
              {
                '@context': 'https://schema.org',
                '@type': 'EducationalOrganization',
                '@id': 'https://gatareview.com/#educationalorg',
                name: 'ガタレビュ！',
                description: '新潟大学生のための授業レビューサイト',
                url: 'https://gatareview.com',
                logo: 'https://gatareview.com/icon.png',
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': 'https://gatareview.com',
                },
                audience: {
                  '@type': 'EducationalAudience',
                  educationalRole: 'student',
                  audienceType: '新潟大学生',
                },
                provider: {
                  '@type': 'Organization',
                  '@id': 'https://gatareview.com/#organization',
                },
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'JPY',
                  description: '無料で利用可能な授業レビューサービス',
                  availability: 'https://schema.org/InStock',
                  validFrom: '2024-01-01',
                },
                knowsAbout: [
                  '新潟大学',
                  '授業評価',
                  '履修支援',
                  '学生レビュー',
                  '教育情報'
                ],
              },
              // BreadcrumbList
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'ホーム',
                    item: 'https://gatareview.com',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: '授業レビュー',
                    item: 'https://gatareview.com/lectures',
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: 'よくある質問',
                    item: 'https://gatareview.com/faq',
                  },
                ],
              },
              // FAQ情報
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'ガタレビュ！とは何ですか？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'ガタレビュ！は新潟大学の学生のための授業レビューサイトです。シラバスではわからないリアルな授業情報を学生同士で共有しましょう。',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: '利用料金はかかりますか？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'ガタレビュ！は完全無料でご利用いただけます。新潟大学生の学習環境向上を目的として運営されています。',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: '授業の検索はどのように行えますか？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '授業名、教授名、学部名での検索が可能です。また、学部別でのフィルタリングも可能で、効率的に授業を見つけることができます。',
                    },
                  },
                ],
              },
            ])
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">
          <div className="">
            {children}
          </div>
        </main>

        {/* フッター広告 */}
        {ADSENSE_CONFIG.DISPLAY_SETTINGS.ENABLED && (
          <section className="ad-section" aria-label="広告">
            <div className="px-4">
              <GoogleAdsense
                adSlot={ADSENSE_CONFIG.AD_SLOTS.FOOTER}
                adClient={ADSENSE_CONFIG.CLIENT_ID}
                style={{
                  margin: '2rem 0',
                  textAlign: 'center' as const,
                }}
                className="footer-ad"
                responsive={ADSENSE_CONFIG.DISPLAY_SETTINGS.RESPONSIVE}
              />
            </div>
          </section>
        )}

        <Footer />
        <ToastContainer />
      </body>
    </html>
  )
}