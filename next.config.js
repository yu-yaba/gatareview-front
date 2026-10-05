/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
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
      urlPattern: ({ url }) => url.hostname.endsWith('a8.net'),
      handler: 'NetworkOnly',
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
      urlPattern: ({ url, request }) => request.destination === 'image' && url.origin === self.location.origin && [
        '/apple-touch-icon.png', '/gatareview_ogp.png', '/green-footer-title.png', '/green-title.svg',
        '/icon-120x120.png', '/icon-128x128.png', '/icon-144x144.png', '/icon-152x152.png',
        '/icon-16x16.png', '/icon-192x192.png', '/icon-32x32.png', '/icon-384x384.png',
        '/icon-512x512.png', '/icon-72x72.png', '/icon-96x96.png', '/icon.png', '/ogp.png',
        '/white-header-title.png', '/white-title.svg',
      ].includes(url.pathname),
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

module.exports = withPWA(nextConfig);
