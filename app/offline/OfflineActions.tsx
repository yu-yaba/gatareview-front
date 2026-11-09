'use client';

import { useEffect, useState } from 'react';

export default function OfflineActions() {
  // 水和が終わり、再接続の監視を始めたことを示す（ボタンもこの時点から動作する）。
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // アドレスバーには本来開こうとしたURLが残っているため、再接続時はそのまま読み込み直す。
    // 実際に接続が戻ったとき（navigator.onLine が true）だけにし、別の画面への移動中に
    // 届く一時的なonlineイベントで移動を打ち消さないようにする。
    // 利用者がすでに別の画面へ移動し始めている場合は、その移動を優先する。
    let leaving = false;
    const markLeaving = () => {
      leaving = true;
    };
    const reload = () => {
      if (navigator.onLine && !leaving) window.location.reload();
    };
    window.addEventListener('beforeunload', markLeaving);
    window.addEventListener('online', reload);
    setReady(true);
    return () => {
      window.removeEventListener('beforeunload', markLeaving);
      window.removeEventListener('online', reload);
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
