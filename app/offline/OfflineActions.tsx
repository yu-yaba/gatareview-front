'use client';

import { useEffect, useState } from 'react';

// 利用者が移動を始めてから、また自動の読み込み直しを始めてから、次の自動の読み込み直しを
// 控える時間。サーバー側のAPIは8秒で打ち切るため、通常の画面はこの時間内に応答する。
// 移動や読み込み直しが取り消された（中止ボタン・応答なし）場合も、この時間が過ぎれば
// 再び自動で読み込み直す。
const NAVIGATION_GRACE_MS = 30_000;

// 以下はこの文書（Service Worker が返した代替表示）全体で共有する。ログイン状態の変化などで
// コンポーネントが作り直されても、利用者が始めた移動や進行中の読み込み直しを打ち消さない。
let mountedInThisDocument = false;
let navigatingUntil = 0;
let reloadingUntil = 0;

const markNavigating = () => {
  navigatingUntil = Date.now() + NAVIGATION_GRACE_MS;
};

// アドレスバーには本来開こうとしたURLが残っているため、読み込み直せば本来の画面を取得できる。
// 端末が接続ありと判断しているとき（navigator.onLine が true）だけにし、別の画面への移動中に
// 届く一時的なonlineイベントや、利用者が始めた移動を打ち消さないようにする。
const reloadIfIdle = () => {
  const now = Date.now();
  if (!navigator.onLine || now < navigatingUntil || now < reloadingUntil) return;
  reloadingUntil = now + NAVIGATION_GRACE_MS;
  window.location.reload();
};

export default function OfflineActions() {
  // 水和が終わり、再接続の監視を始めたことを示す（ボタンもこの時点から動作する）。
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // この画面から別の画面へクライアント側で移動し、「戻る」で帰ってきた場合は、Next.js が
    // 履歴からこの画面を復元するだけで本来の画面を取得しない。そのときは読み込み直す。
    // ログイン状態の変化などで作り直されただけで、オフラインや移動中なら何もしない。
    if (mountedInThisDocument && window.location.pathname !== '/offline') reloadIfIdle();
    mountedInThisDocument = true;
    const shownAt = window.location.pathname + window.location.search;

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
    // サーバー障害や公衆Wi-Fiのログイン待ちでは online イベントが来ないため、
    // 画面に戻ってきたとき（他のアプリから戻る、ページキャッシュからの復元）にも試す。
    const reloadWhenVisible = () => {
      if (document.visibilityState === 'visible') reloadIfIdle();
    };
    // ページキャッシュに入る間は読み込み直さず、復元されたときに1回だけ読み込み直す。
    const suspendWhileHidden = () => {
      navigatingUntil = Number.POSITIVE_INFINITY;
    };
    const reloadWhenRestored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      navigatingUntil = 0;
      reloadingUntil = 0;
      reloadIfIdle();
    };
    document.addEventListener('click', markLinkNavigation, true);
    window.addEventListener('beforeunload', markNavigating);
    window.addEventListener('pagehide', suspendWhileHidden);
    window.addEventListener('pageshow', reloadWhenRestored);
    window.addEventListener('online', reloadIfIdle);
    document.addEventListener('visibilitychange', reloadWhenVisible);
    setReady(true);
    return () => {
      // 別の画面への移動が完了して外れた場合は、待ち時間を解除する（「戻る」で帰ったときに読み込み直す）。
      if (window.location.pathname + window.location.search !== shownAt) navigatingUntil = 0;
      document.removeEventListener('click', markLinkNavigation, true);
      window.removeEventListener('beforeunload', markNavigating);
      window.removeEventListener('pagehide', suspendWhileHidden);
      window.removeEventListener('pageshow', reloadWhenRestored);
      window.removeEventListener('online', reloadIfIdle);
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
