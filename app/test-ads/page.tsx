'use client'

import { AD_CONFIG, AD_SIZES } from '../config/adConfig';
import NinjaAdMax from '../_components/NinjaAdMax';
import ResponsiveAd from '../_components/ResponsiveAd';

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
              width={AD_SIZES.DESKTOP_BANNER.width}
              height={AD_SIZES.DESKTOP_BANNER.height}
              className="mx-auto"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">モバイル用バナー (320x50)</h2>
          <div className="border-2 border-dashed border-gray-300 p-4">
            <NinjaAdMax 
              adId={AD_CONFIG.NINJA_ADMAX.MOBILE_BANNER}
              width={AD_SIZES.MOBILE_BANNER.width}
              height={AD_SIZES.MOBILE_BANNER.height}
              className="mx-auto"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">レスポンシブテスト（実際の配置）</h2>
          <ResponsiveAd aria-label="テストページ用レスポンシブ広告" />
        </div>
      </div>
    </div>
  );
}