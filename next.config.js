/** @type {import('next').NextConfig} */
const { createContentSecurityPolicy } = require('./config/content-security-policy.cjs');
const { excludeUnusedRouteJavaScript, addOfflinePageToPrecache } = require('./config/pwa-precache.cjs');

// 通信できない画面遷移にだけ、事前保存した公開の /offline を返す（SW内に文字列として埋め込まれる）。
// 個人用の画面はどこにも保存しないため、オフライン時に表示できるのはホームとこの画面だけ。
const offlineDocumentFallback = async () => (await caches.match('/offline', {
  cacheName: `workbox-precache-v2-${self.registration.scope}`,
  ignoreSearch: true,
})) || undefined;

const withPWA = require('next-pwa')({
  dest: 'public',
  // next-pwa 5.6 の自動登録は Pages Router の main.js にしか入らず、App Router では動かない。
  // 登録は app/_components/ServiceWorkerRegistration.tsx から本番だけ明示的に行う。
  register: false,
  reloadOnOnline: false,
  skipWaiting: true,
  // next-pwa標準のstart-urlは '/' の応答を状態コードや保存可否に関係なく保存するため使わず、
  // 下の start-url-v2 ルールで公開HTMLだけを保存する。'/' を事前保存（古いHTMLの固定）もしない。
  dynamicStartUrl: false,
  cacheStartUrl: false,
  // SWの起動を待たずに画面のHTML取得を始め、SW導入による表示の遅れを抑える。
  navigationPreload: true,
  // App Router's build manifest is internal and returns 404 on Vercel.
  // Precaching it would abort installation of the entire service worker.
  buildExcludes: [/app-build-manifest\.json$/, excludeUnusedRouteJavaScript],
  // オフライン時の代替画面。静的に生成される公開ページで、ビルドごとに更新する。
  manifestTransforms: [addOfflinePageToPrecache],
  // Social-preview assets remain publicly served; they are not needed offline.
  publicExcludes: ['!noprecache/**/*', '!gatareview_ogp.png', '!ogp.png', '!green-title.svg', '!white-title.svg'],
  disable: process.env.NODE_ENV === 'development',
  // 既に配布済みの古いSWが作成したキャッシュ（api-cache/pages等）を削除する
  importScripts: ['/sw-cache-cleanup.js'],
  runtimeCaching: [
    {
      // URL全体に対する拡張子ルールより先に、クエリ付きAPIも除外する。
      urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
      handler: 'NetworkOnly',
    },
    {
      // アフィリエイト広告(A8.net)はキャッシュしない。
      // 特に1x1の計測ピクセルがキャッシュされると成果計測が壊れるため、画像ルールより先に置く。
      urlPattern: ({ url }) => url.hostname === 'a8.net' || url.hostname.endsWith('.a8.net'),
      handler: 'NetworkOnly',
    },
    {
      // ホーム('/')への画面遷移だけは、前回表示した公開HTMLをオフライン時に再表示する。
      // クエリ付き・リダイレクト・エラー・private/no-store の応答は保存しない。
      urlPattern: ({ url, request }) => request.mode === 'navigate' && url.origin === self.location.origin
        && url.pathname === '/' && url.search === '',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'start-url-v2',
        plugins: [{
          cacheWillUpdate: async ({ response }) => {
            if (!response || response.status !== 200 || response.type !== 'basic' || response.redirected) return null;
            if (!/^text\/html(;|$)/i.test(response.headers.get('Content-Type') || '')) return null;
            if (/private|no-store/i.test(response.headers.get('Cache-Control') || '')) return null;
            return response;
          },
          handlerDidError: offlineDocumentFallback,
        }],
        expiration: {
          maxEntries: 1,
        },
      },
    },
    {
      // その他の画面遷移（授業・マイページ・認証画面など）は保存も再利用もしない。
      // 通信できないときだけ /offline を返す。
      urlPattern: ({ url, request }) => request.mode === 'navigate' && url.origin === self.location.origin,
      handler: 'NetworkOnly',
      options: {
        plugins: [{ handlerDidError: offlineDocumentFallback }],
      },
    },
    {
      urlPattern: ({ url, request }) => url.protocol === 'https:' && url.hostname === 'fonts.googleapis.com' && request.destination === 'style',
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
        },
      },
    },
    {
      urlPattern: ({ url, request }) => url.protocol === 'https:' && url.hostname === 'fonts.gstatic.com' && request.destination === 'font',
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
        },
      },
    },
    {
      // public直下で管理する公開画像だけを保存する。動的ページは拡張子でも除外する。
      // next/image の最適化URLも、元画像が同じ許可リストに完全一致するときだけ保存する
      // （ヘッダーのロゴをオフライン画面でも表示するため）。Googleのアイコン等の外部画像は対象外。
      urlPattern: ({ url, request }) => request.destination === 'image' && url.origin === self.location.origin && [
        '/apple-touch-icon.png', '/gatareview_ogp.png', '/green-footer-title.png', '/green-title.svg',
        '/icon-120x120.png', '/icon-128x128.png', '/icon-144x144.png', '/icon-152x152.png',
        '/icon-16x16.png', '/icon-192x192.png', '/icon-32x32.png', '/icon-384x384.png',
        '/icon-512x512.png', '/icon-72x72.png', '/icon-96x96.png', '/icon.png', '/ogp.png',
        '/white-header-title.png', '/white-title.svg',
      ].includes(url.pathname === '/_next/image' && url.searchParams.getAll('url').length === 1
        ? url.searchParams.get('url')
        : url.pathname),
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-v2',
        plugins: [{
          cacheWillUpdate: async ({ response }) => {
            if (!response || response.status !== 200 || !response.headers.get('Content-Type')?.startsWith('image/')) return null;
            if (/private|no-store/i.test(response.headers.get('Cache-Control') || '')) return null;
            return response;
          },
        }],
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
        },
      },
    },
    {
      urlPattern: ({ url, request }) => url.origin === self.location.origin && url.pathname.startsWith('/_next/static/') && (
        (request.destination === 'script' && url.pathname.endsWith('.js')) ||
        (request.destination === 'style' && url.pathname.endsWith('.css'))
      ),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources-v2',
        plugins: [{
          cacheWillUpdate: async ({ response }) => {
            if (!response || response.status !== 200 || !/^(application\/javascript|text\/javascript|text\/css)(;|$)/i.test(response.headers.get('Content-Type') || '')) return null;
            if (/private|no-store/i.test(response.headers.get('Cache-Control') || '')) return null;
            return response;
          },
        }],
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7日
        },
      },
    },
  ],
});

const nextConfig = {
  // React strictMode
  reactStrictMode: true,

  // OGP生成はNode.js実行環境からロゴを読むため、公開配信とは別に同梱する。
  outputFileTracingIncludes: {
    '/lectures/*/opengraph-image': ['./public/green-footer-title.png'],
  },

  // Webpack設定を最小限に抑制
  webpack: (config, { isServer }) => {
    // Canvas依存関係の問題を解決
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config;
  },

  // PWA関連ヘッダー設定
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{
          key: 'Content-Security-Policy',
          value: createContentSecurityPolicy({
            production: process.env.NODE_ENV === 'production',
            apiBaseUrl: process.env.NEXT_PUBLIC_ENV,
            sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          }),
        }],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 画像最適化設定
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gatareview.com', port: '' },
      { protocol: 'https', hostname: 'www.gatareview.com', port: '' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '' },
      ...(process.env.NODE_ENV !== 'production'
        ? [{ protocol: 'http', hostname: 'localhost' }, { protocol: 'http', hostname: '127.0.0.1' }]
        : []),
    ],
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = require('@sentry/nextjs/config').withSentryConfig(withPWA(nextConfig), {
  silent: true,
  telemetry: false,
  sourcemaps: { disable: true },
});
