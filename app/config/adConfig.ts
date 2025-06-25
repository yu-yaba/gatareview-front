interface AdConfig {
  NINJA_ADMAX: {
    DESKTOP_BANNER: string;
    MOBILE_BANNER: string;
  };
}

export const AD_CONFIG: AdConfig = {
  // 忍者AdMaxの広告ID設定
  NINJA_ADMAX: {
    // デスクトップ用バナー広告 (728x90)
    DESKTOP_BANNER: process.env.NEXT_PUBLIC_NINJA_ADMAX_DESKTOP_BANNER || '',
    
    // モバイル用バナー広告 (320x50)
    MOBILE_BANNER: process.env.NEXT_PUBLIC_NINJA_ADMAX_MOBILE_BANNER || ''
  }
} as const;

// 広告サイズの定数
export const AD_SIZES = {
  DESKTOP_BANNER: { width: 728, height: 90 },
  MOBILE_BANNER: { width: 320, height: 50 }
} as const;

// 使用例:
// import { AD_CONFIG } from '@/app/config/adConfig';
// <NinjaAdMax adId={AD_CONFIG.NINJA_ADMAX.DESKTOP_BANNER} />