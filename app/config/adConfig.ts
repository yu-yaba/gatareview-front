export const AD_CONFIG = {
  // 忍者AdMaxの広告ID設定
  NINJA_ADMAX: {
    // デスクトップ用バナー広告 (728x90)
    DESKTOP_BANNER: process.env.NEXT_PUBLIC_NINJA_ADMAX_DESKTOP_BANNER || '',
    
    // モバイル用バナー広告 (320x50)
    MOBILE_BANNER: process.env.NEXT_PUBLIC_NINJA_ADMAX_MOBILE_BANNER || ''
  }
};

// 使用例:
// import { AD_CONFIG } from '@/app/config/adConfig';
// <NinjaAdMax adId={AD_CONFIG.NINJA_ADMAX.DESKTOP_BANNER} />