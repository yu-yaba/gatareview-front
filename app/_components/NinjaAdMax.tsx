'use client'
import { useEffect, useRef, useCallback } from 'react';

export interface NinjaAdMaxProps {
  adId: string;
  width?: number;
  height?: number;
  className?: string;
  'aria-label'?: string;
}

const NinjaAdMax: React.FC<NinjaAdMaxProps> = ({ 
  adId, 
  width = 728, 
  height = 90, 
  className = '',
  'aria-label': ariaLabel = '広告'
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  const loadAdScript = useCallback(() => {
    if (!adRef.current || !adId) return;

    // 既存のスクリプトをクリア
    adRef.current.innerHTML = '';

    // 忍者AdMaxの広告コードを動的に挿入
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://adm.shinobi.jp/s/${encodeURIComponent(adId)}`;
    script.onerror = () => {
      console.warn('Failed to load NinjaAdMax script');
    };
    
    adRef.current.appendChild(script);
  }, [adId]);

  useEffect(() => {
    // 広告IDが空の場合は何もしない
    if (!adId || typeof window === 'undefined') {
      return;
    }

    loadAdScript();
    
    return () => {
      // クリーンアップ
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [adId, loadAdScript]);

  // 広告IDが空の場合は何も表示しない
  if (!adId) {
    return null;
  }

  const minWidth = Math.min(width, 320);

  return (
    <div 
      className={`ninja-admax-wrapper ${className}`}
      style={{
        width: '100%',
        maxWidth: `${width}px`,
        minWidth: `${minWidth}px`,
        height: `${height}px`,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: 0.8
      }}
      role="banner"
      aria-label={ariaLabel}
    >
      <div 
        ref={adRef}
        className="w-full h-full"
        style={{
          minHeight: `${height}px`
        }}
      />
    </div>
  );
};

export default NinjaAdMax;