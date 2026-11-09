'use client';

import { useEffect } from 'react';

export default function OfflineActions() {
  useEffect(() => {
    // アドレスバーには本来開こうとしたURLが残っているため、再接続時はそのまま読み込み直す。
    const reload = () => window.location.reload();
    window.addEventListener('online', reload);
    return () => window.removeEventListener('online', reload);
  }, []);

  return (
    <div className="space-y-4">
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
