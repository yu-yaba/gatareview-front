'use client'

import { AD_CONFIG } from '../config/adConfig';
import NinjaAdMax from '../_components/NinjaAdMax';

export default function TestAdsPage() {
  console.log('=== 広告設定テスト ===');
  console.log('Desktop Banner ID:', AD_CONFIG.NINJA_ADMAX.DESKTOP_BANNER);
  console.log('Mobile Banner ID:', AD_CONFIG.NINJA_ADMAX.MOBILE_BANNER);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">忍者AdMax 広告テストページ</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">設定確認</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>デスクトップ用ID:</strong> {AD_CONFIG.NINJA_ADMAX.DESKTOP_BANNER || '未設定'}</p>
            <p><strong>モバイル用ID:</strong> {AD_CONFIG.NINJA_ADMAX.MOBILE_BANNER || '未設定'}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">デスクトップ用バナー (728x90)</h2>
          <div className="border-2 border-dashed border-gray-300 p-4">
            <NinjaAdMax 
              adId={AD_CONFIG.NINJA_ADMAX.DESKTOP_BANNER}
              width={728}
              height={90}
              className="mx-auto"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">モバイル用バナー (320x50)</h2>
          <div className="border-2 border-dashed border-gray-300 p-4">
            <NinjaAdMax 
              adId={AD_CONFIG.NINJA_ADMAX.MOBILE_BANNER}
              width={320}
              height={50}
              className="mx-auto"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">レスポンシブテスト（実際の配置）</h2>
          <div className="flex justify-center mt-12 mb-8 px-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100/50 w-full max-w-4xl">
              {/* デスクトップ用広告 */}
              <div className="hidden md:block">
                <p className="text-sm text-gray-600 mb-2 text-center">デスクトップ表示:</p>
                <NinjaAdMax 
                  adId={AD_CONFIG.NINJA_ADMAX.DESKTOP_BANNER}
                  width={728}
                  height={90}
                  className="mx-auto"
                />
              </div>
              {/* モバイル用広告 */}
              <div className="block md:hidden">
                <p className="text-sm text-gray-600 mb-2 text-center">モバイル表示:</p>
                <NinjaAdMax 
                  adId={AD_CONFIG.NINJA_ADMAX.MOBILE_BANNER}
                  width={320}
                  height={50}
                  className="mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}