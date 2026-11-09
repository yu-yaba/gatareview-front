import type { Metadata } from 'next';
import Image from 'next/image';
import OfflineActions from './OfflineActions';

// Service Worker が事前保存し、通信できない画面遷移の代わりに表示する公開ページ。
// 個人用の情報を含めないよう、静的に生成される内容だけで構成する。
export const metadata: Metadata = {
  title: 'オフラインです | ガタレビュ！',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* 最適化URLはオフラインで取得できないため、事前保存済みの元画像を直接使う。 */}
          <Image
            src="/icon-192x192.png"
            alt="ガタレビュ"
            width={128}
            height={128}
            className="rounded-2xl shadow-lg"
            priority
            unoptimized
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          オフラインです
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          インターネットに接続できないため、このページを表示できません。<br />
          接続が戻ると自動で読み込み直します。
        </p>

        <OfflineActions />

        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
          <h2 className="font-semibold text-blue-900 mb-2">
            オフラインで表示できるもの
          </h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• トップページ（この端末で以前に開いたときの内容です。最新とは限りません）</li>
          </ul>
          <p className="text-sm text-blue-700 mt-3 leading-relaxed">
            授業ページ・レビュー・マイページは、最新の内容とログイン状態に応じた閲覧範囲を正しく表示するため、端末に保存していません。接続が戻ってから開いてください。
          </p>
        </div>
      </div>
    </div>
  );
}
