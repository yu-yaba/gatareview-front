import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Header from './header'
import Footer from './footer'
import { ToastContainer } from 'react-toastify';
import ScriptGa from './_components/ScriptGa'
import ClientProviders from './_components/ClientProviders'
import Script from 'next/script';
import PWAInstall from './_components/PWAInstall';
import ServiceWorkerRegistration from './_components/ServiceWorkerRegistration';
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_URL, serializeJsonLd } from './_helpers/seo';

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1DBE67' },
    { media: '(prefers-color-scheme: dark)', color: '#10b981' },
  ],
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://www.gatareview.com' : 'http://localhost:3000'),
  // ここで設定した値は全ページ（404 を含む）に引き継がれる。canonical・robots・og:url はページごとに
  // 決める値なのでここでは設定しない（_helpers/seo.ts の indexablePageMetadata / noindexPageMetadata を使う）。
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
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
  icons: {
    icon: [
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon-120x120.png', sizes: '120x120', type: 'image/png' }
    ],
    shortcut: '/icon-96x96.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ガタレビュ',
    startupImage: [
      {
        url: '/icon-512x512.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icon-512x512.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icon-512x512.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
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
    siteName: SITE_NAME,
    images: [
      {
        url: '/ogp.png',
        width: 1200,
        height: 630,
        alt: 'ガタレビュ！ - 新潟大学の授業レビューサイト',
        type: 'image/png',
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
    images: {
      url: '/ogp.png',
      width: 1200,
      height: 630,
      alt: 'ガタレビュ！ - 新潟大学の授業レビューサイト',
    },
    creator: '@gatareview',
    site: '@gatareview',
  },
  category: 'education',
  classification: 'education',
  referrer: 'origin-when-cross-origin',
}

// 全ページ共通の構造化データ（サイトと運営者）。パンくず・FAQ はページごとに出す。
const siteJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    description: '新潟大学生のための授業レビューサイト',
    url: SITE_URL,
    inLanguage: 'ja-JP',
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/lectures?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'ガタレビュ運営チーム',
    description: '新潟大学生のための授業レビューサイト運営',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icon.png`,
      width: 500,
      height: 500,
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
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <ScriptGa />
        {process.env.NODE_ENV !== 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                  window.addEventListener('load', function () {
                    navigator.serviceWorker.getRegistrations()
                      .then(function (registrations) {
                        return Promise.all(registrations.map(function (registration) {
                          return registration.unregister();
                        }));
                      })
                      .catch(function () {});

                    if (window.caches && typeof window.caches.keys === 'function') {
                      window.caches.keys()
                        .then(function (cacheNames) {
                          return Promise.all(cacheNames.map(function (cacheName) {
                            return window.caches.delete(cacheName);
                          }));
                        })
                        .catch(function () {});
                    }
                  });
                }
              `,
            }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google.com" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          <div id="app-root">
            <Header />
            <ToastContainer />
            <main>
              {children}
            </main>
            <Footer />
            <PWAInstall />
          </div>
        </ClientProviders>
        <ServiceWorkerRegistration />
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
