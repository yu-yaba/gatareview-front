'use client';

import Image from 'next/image';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <Image
            src="/icon-192x192.png"
            alt="ガタレビュ"
            width={128}
            height={128}
            className="rounded-2xl shadow-lg"
            priority
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          オフラインです
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          インターネット接続を確認してください。<br />
          キャッシュされたページは引き続きご利用いただけます。
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            再読み込み
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            前のページに戻る
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 オフラインでも使える機能
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 閲覧済みの授業レビュー</li>
            <li>• キャッシュされたページ</li>
            <li>• 基本的なナビゲーション</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 