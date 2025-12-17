/* eslint-disable no-restricted-globals */

// 既に配布済みの古い Service Worker が作成した runtime cache を削除する。
// 新しい SW が有効化されるタイミングで一度だけ実行される想定。
self.addEventListener('activate', (event) => {
  const cachesToDelete = [
    // 旧設定で /api と全ページをキャッシュしていたキャッシュ名
    'api-cache',
    'pages',

    // next-pwa のデフォルト設定で作られ得るキャッシュ名（念のため）
    'apis',
    'others',
  ]

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((cacheName) => cachesToDelete.includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      )
    })()
  )
})

