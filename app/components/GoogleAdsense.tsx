'use client';

import { useEffect, useRef, useState } from 'react';
import { ADSENSE_CONFIG } from '../config/adsense';

// グローバル型定義
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface GoogleAdsenseProps {
  adSlot: string;
  adClient?: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adLayout?: string;
  adLayoutKey?: string;
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// 開発環境用プレースホルダーコンポーネント
const AdPlaceholder: React.FC<{ adSlot: string; style?: React.CSSProperties; className?: string }> = ({
  adSlot,
  style,
  className
}) => {
  return (
    <div
      className={`ad-placeholder ${className}`}
      style={{
        ...style,
        minHeight: '250px',
        backgroundColor: '#f8f9fa',
        border: '2px dashed #dee2e6',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#6c757d',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景パターン */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(45deg, transparent 40%, rgba(0,0,0,0.02) 50%, transparent 60%),
            linear-gradient(-45deg, transparent 40%, rgba(0,0,0,0.02) 50%, transparent 60%)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.5,
        }}
      />

      {/* コンテンツ */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#28a745',
          }}
        >
          📢
        </div>
        <div
          style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: '#495057',
          }}
        >
          Google広告表示エリア
        </div>
        <div
          style={{
            fontSize: '0.9rem',
            marginBottom: '1rem',
            color: '#6c757d',
          }}
        >
          開発環境のため、プレースホルダーを表示中
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            backgroundColor: '#e9ecef',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontFamily: 'monospace',
            color: '#495057',
          }}
        >
          スロットID: {adSlot}
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            marginTop: '1rem',
            color: '#adb5bd',
          }}
        >
          本番環境では実際の広告が表示されます
        </div>
      </div>
    </div>
  );
};

const GoogleAdsense: React.FC<GoogleAdsenseProps> = ({
  adSlot,
  adClient = ADSENSE_CONFIG.CLIENT_ID,
  adFormat = 'auto',
  adLayout,
  adLayoutKey,
  style,
  className = '',
  responsive = true,
  onLoad,
  onError,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // 開発環境では何もしない
    if (isDevelopment) {
      return;
    }

    const loadAd = () => {
      try {
        // AdSenseスクリプトが読み込まれているかチェック
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          // 既に初期化済みの広告をスキップ
          if (adRef.current?.getAttribute('data-adsbygoogle-status')) {
            return;
          }

          // 広告を初期化
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsLoaded(true);
          onLoad?.();
        } else {
          // AdSenseスクリプトの読み込みを待つ
          const checkAdSense = setInterval(() => {
            if (window.adsbygoogle) {
              clearInterval(checkAdSense);
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              setIsLoaded(true);
              onLoad?.();
            }
          }, 100);

          // 10秒後にタイムアウト
          setTimeout(() => {
            clearInterval(checkAdSense);
            if (!isLoaded) {
              const error = new Error('AdSense script failed to load');
              setHasError(true);
              onError?.(error);
            }
          }, 10000);
        }
      } catch (error) {
        console.error('AdSense error:', error);
        setHasError(true);
        onError?.(error as Error);
      }
    };

    // コンポーネントマウント後に広告を読み込み
    const timer = setTimeout(loadAd, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [adSlot, isLoaded, onLoad, onError, isDevelopment]);

  // 開発環境ではプレースホルダーを表示
  if (isDevelopment) {
    return <AdPlaceholder adSlot={adSlot} style={style} className={className} />;
  }

  // エラー時の表示
  if (hasError) {
    return (
      <div
        className={`ad-error ${className}`}
        style={{
          ...style,
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#666',
          fontSize: '14px'
        }}
      >
        広告の読み込みに失敗しました
      </div>
    );
  }

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: isLoaded ? 'auto' : '100px',
          backgroundColor: isLoaded ? 'transparent' : '#f9f9f9',
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
        data-ad-layout-key={adLayoutKey}
        data-full-width-responsive={responsive.toString()}
      />
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#999',
            fontSize: '12px'
          }}
        >
          広告を読み込み中...
        </div>
      )}
    </div>
  );
};

export default GoogleAdsense; 