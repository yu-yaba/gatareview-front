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
    // APIレスポンスが拡張子付きクエリで混入し得た旧キャッシュ。
    // 新しいSWは別名のv2キャッシュを使用するため、新規データは削除しない。
    'images',
    'static-resources',
    // 状態コードや保存可否を確認せずに '/' を保存していた next-pwa 標準のホーム用キャッシュ。
    // 公開HTMLだけを保存する start-url-v2 に置き換えた。
    'start-url',
    // 新しいSW（＝新しいビルド）の有効化ごとに空にする。前のビルドのホームHTMLが参照する
    // JS・CSSは事前保存から外れるため、残すとオフライン時に崩れたエラー画面になる。
    // 次にオンラインでホームを開いたときに、新しいビルドのHTMLを保存し直す。
    'start-url-v2',
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
