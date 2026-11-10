'use client';

import { useEffect, useState } from 'react';

// この文書で一度水和したかどうか。Service Worker が代わりに返したこの画面から別の画面へ
// クライアント側で移動し、「戻る」で帰ってきた場合は、Next.js が履歴からこの画面を復元する。
// そのときはオンラインでも本来のページを取得しないため、読み込み直して取得し直す。
let mountedInThisDocument = false;

export default function OfflineActions() {
  // 水和が終わり、再接続の監視を始めたことを示す（ボタンもこの時点から動作する）。
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mountedInThisDocument && window.location.pathname !== '/offline') {
      window.location.reload();
      return;
    }
    mountedInThisDocument = true;

    // アドレスバーには本来開こうとしたURLが残っているため、再接続時はそのまま読み込み直す。
    // 端末が接続ありと判断しているとき（navigator.onLine が true）だけにし、別の画面への移動中に
    // 届く一時的なonlineイベントで移動を打ち消さないようにする。
    // サーバー障害や公衆Wi-Fiのログイン待ちでは online イベントが来ないため、
    // 画面に戻ってきたとき（他のアプリから戻る、ページキャッシュからの復元）にも試す。
    // 利用者がすでに別の画面へ移動し始めている場合は、その移動を優先する。
    let leaving = false;
    const markLeaving = () => {
      leaving = true;
    };
    const reload = () => {
      if (navigator.onLine && !leaving) window.location.reload();
    };
    const reloadWhenVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    const reloadWhenRestored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        leaving = false;
        reload();
      }
    };
    window.addEventListener('beforeunload', markLeaving);
    window.addEventListener('pagehide', markLeaving);
    window.addEventListener('pageshow', reloadWhenRestored);
    window.addEventListener('online', reload);
    document.addEventListener('visibilitychange', reloadWhenVisible);
    setReady(true);
    return () => {
      window.removeEventListener('beforeunload', markLeaving);
      window.removeEventListener('pagehide', markLeaving);
      window.removeEventListener('pageshow', reloadWhenRestored);
      window.removeEventListener('online', reload);
      document.removeEventListener('visibilitychange', reloadWhenVisible);
    };
  }, []);

  return (
    <div className="space-y-4" data-ready={ready ? 'true' : undefined}>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        再読み込み
      </button>

      <button
        type="button"
        onClick={() => window.location.assign('/')}
        className="w-full bg-white hover:bg-gray-50 text-green-700 border border-green-200 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        トップページへ
      </button>

      <button
        type="button"
        onClick={() => window.history.back()}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        前のページに戻る
      </button>
    </div>
  );
}
