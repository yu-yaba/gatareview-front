'use client'
import { useEffect, useRef } from 'react';

interface NinjaAdMaxProps {
  adId: string;
  width?: number;
  height?: number;
  className?: string;
}

const NinjaAdMax: React.FC<NinjaAdMaxProps> = ({ 
  adId, 
  width = 728, 
  height = 90, 
  className = '' 
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 広告IDが空の場合は何もしない
    if (!adId || typeof window === 'undefined' || !adRef.current) {
      return;
    }

    // 忍者AdMaxの広告コードを動的に挿入
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://www.ninja.co.jp/admax/js/admax.js?id=${adId}`;
    
    // 広告要素をクリア
    adRef.current.innerHTML = '';
    adRef.current.appendChild(script);
    
    return () => {
      // クリーンアップ
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [adId]);

  // 広告IDが空の場合は何も表示しない
  if (!adId) {
    return null;
  }

  return (
    <div 
      className={`ninja-admax-wrapper ${className}`}
      style={{
        width: '100%',
        maxWidth: `${width}px`,
        minWidth: `${Math.min(width, 320)}px`, // 最小幅を設定
        height: `${height}px`,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: 0.8
      }}
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