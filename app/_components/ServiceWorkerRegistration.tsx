'use client';

import { useEffect } from 'react';

// next-pwa 5.6 の自動登録は Pages Router 用の main.js にしか入らず、App Router の画面では実行されない。
// 本番ビルドでだけ、読み込み完了後に生成済みの /sw.js を登録する（開発時は layout.tsx が解除する）。
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    const register = () => {
      // CDNが sw.js 等にブラウザキャッシュを付けても、更新確認では常に最新を取得する。
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {
          // プライベートブラウズ等で登録できない場合も、通常の閲覧は続けられる。
        });
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
