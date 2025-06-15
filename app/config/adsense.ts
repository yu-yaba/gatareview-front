// Google AdSense設定
export const ADSENSE_CONFIG = {
  // 広告クライアントID
  CLIENT_ID: 'ca-pub-2103632661362848',

  // 広告スロットID（実際の値に置き換えてください）
  AD_SLOTS: {
    FOOTER: 'YOUR-FOOTER-AD-SLOT-ID', // フッター広告用 - Google AdSenseで作成した広告ユニットのスロットIDに置き換えてください
    SIDEBAR: 'YOUR-SIDEBAR-AD-SLOT-ID', // サイドバー広告用（将来的に使用）
    HEADER: 'YOUR-HEADER-AD-SLOT-ID', // ヘッダー広告用（将来的に使用）
    ARTICLE: 'YOUR-ARTICLE-AD-SLOT-ID', // 記事内広告用（将来的に使用）
  },

  // 広告の表示設定
  DISPLAY_SETTINGS: {
    // 広告エリアを常に表示（開発環境ではプレースホルダー、本番環境では実際の広告）
    ENABLED: true,

    // 広告の遅延読み込み時間（ミリ秒）
    LAZY_LOAD_DELAY: 1000,

    // 広告読み込みのタイムアウト時間（ミリ秒）
    LOAD_TIMEOUT: 10000,

    // レスポンシブ広告を有効にする
    RESPONSIVE: true,
  },

  // パフォーマンス設定
  PERFORMANCE: {
    // 広告スクリプトの読み込み戦略
    LOAD_STRATEGY: 'afterInteractive' as const,

    // プリロード設定
    PRELOAD: true,

    // DNS プリフェッチ
    DNS_PREFETCH: [
      '//pagead2.googlesyndication.com',
      '//www.googletagservices.com',
      '//securepubads.g.doubleclick.net',
    ],
  },
} as const;

// 広告スロットIDの型定義
export type AdSlotType = keyof typeof ADSENSE_CONFIG.AD_SLOTS;

// 環境別設定
export const getAdsenseConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    ...ADSENSE_CONFIG,
    DISPLAY_SETTINGS: {
      ...ADSENSE_CONFIG.DISPLAY_SETTINGS,
      // 広告エリアは常に表示（開発環境ではプレースホルダー）
      ENABLED: true,
    },
  };
}; 