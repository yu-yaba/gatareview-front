'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// この文書で一度水和したかどうか。Service Worker が代わりに返したこの画面から別の画面へ
// クライアント側で移動し、「戻る」で帰ってきた場合は、Next.js が履歴からこの画面を復元する。
// そのときはオンラインでも本来のページを取得しないため、読み込み直して取得し直す。
let mountedInThisDocument = false;

// 利用者が移動を始めてから、自動の読み込み直しを控える時間。移動が取り消された
// （中止ボタン・応答なし）場合も、この時間が過ぎれば再び自動で読み込み直す。
const NAVIGATION_GRACE_MS = 10_000;

export default function OfflineActions() {
  // 水和が終わり、再接続の監視を始めたことを示す（ボタンもこの時点から動作する）。
  const [ready, setReady] = useState(false);
  // この時刻までは、利用者が始めた移動を優先して自動の読み込み直しをしない。
  const navigatingUntil = useRef(0);
  const markNavigating = useCallback(() => {
    navigatingUntil.current = Date.now() + NAVIGATION_GRACE_MS;
  }, []);

  useEffect(() => {
    // ログイン状態の変化などで再表示されただけで、オフラインのままなら読み込み直さない。
    if (mountedInThisDocument && window.location.pathname !== '/offline' && navigator.onLine) {
      window.location.reload();
      return;
    }
    mountedInThisDocument = true;

    // アドレスバーには本来開こうとしたURLが残っているため、接続が戻ったら読み込み直す。
    // 端末が接続ありと判断しているとき（navigator.onLine が true）だけにし、別の画面への移動中に
    // 届く一時的なonlineイベントで移動を打ち消さないようにする。
    // サーバー障害や公衆Wi-Fiのログイン待ちでは online イベントが来ないため、
    // 画面に戻ってきたとき（他のアプリから戻る、ページキャッシュからの復元）にも試す。
    let reloading = false;
    const reload = () => {
      if (reloading || !navigator.onLine || Date.now() < navigatingUntil.current) return;
      reloading = true;
      window.location.reload();
    };
    // App Router のリンク移動は beforeunload を出さず、iOS Safari は beforeunload 自体を出さない。
    // そのため、同じタブで開くリンクのクリックを移動の開始として扱う。
    const markLinkNavigation = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || link.hasAttribute('download')) return;
      const target = link.getAttribute('target');
      if (target && target !== '_self') return;
      markNavigating();
    };
    const reloadWhenVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    // ページキャッシュに入る間は読み込み直さず、復元されたときに1回だけ読み込み直す。
    const suspendWhileHidden = () => {
      navigatingUntil.current = Number.POSITIVE_INFINITY;
    };
    const reloadWhenRestored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      navigatingUntil.current = 0;
      reloading = false;
      reload();
    };
    document.addEventListener('click', markLinkNavigation, true);
    window.addEventListener('beforeunload', markNavigating);
    window.addEventListener('pagehide', suspendWhileHidden);
    window.addEventListener('pageshow', reloadWhenRestored);
    window.addEventListener('online', reload);
    document.addEventListener('visibilitychange', reloadWhenVisible);
    setReady(true);
    return () => {
      document.removeEventListener('click', markLinkNavigation, true);
      window.removeEventListener('beforeunload', markNavigating);
      window.removeEventListener('pagehide', suspendWhileHidden);
      window.removeEventListener('pageshow', reloadWhenRestored);
      window.removeEventListener('online', reload);
      document.removeEventListener('visibilitychange', reloadWhenVisible);
    };
  }, [markNavigating]);

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
        onClick={() => {
          markNavigating();
          window.location.assign('/');
        }}
        className="w-full bg-white hover:bg-gray-50 text-green-700 border border-green-200 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        トップページへ
      </button>

      <button
        type="button"
        onClick={() => {
          markNavigating();
          window.history.back();
        }}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        前のページに戻る
      </button>
    </div>
  );
}
