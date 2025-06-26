'use client'
import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!adId || typeof window === 'undefined' || !adRef.current) {
      return;
    }

    // 少し遅延させてDOMが完全に準備されてから実行
    const timer = setTimeout(() => {
      if (!adRef.current) return;

      // 忍者AdMaxスクリプトを直接挿入（提供されたタグと同じ方式）
      const script = document.createElement('script');
      script.src = `https://adm.shinobi.jp/s/${adId}`;
      script.async = true;
      script.onload = () => {
        console.log(`NinjaAdMax script loaded: ${adId}`);
      };
      script.onerror = () => {
        console.warn(`Failed to load NinjaAdMax script: ${adId}`);
      };
      
      adRef.current.appendChild(script);
    }, 100);

    return () => {
      clearTimeout(timer);
      // クリーンアップ
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [adId]);

  if (!adId) {
    return null;
  }

  return (
    <div 
      className={`ninja-admax-wrapper ${className}`}
      style={{
        width: '100%',
        maxWidth: `${width}px`,
        height: `${height}px`,
        margin: '0 auto',
        textAlign: 'center'
      }}
      role="banner"
      aria-label={ariaLabel}
    >
      <div ref={adRef} />
    </div>
  );
};

export default NinjaAdMax;