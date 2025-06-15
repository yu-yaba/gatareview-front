'use client';

import { useEffect, useState } from 'react';

interface UseGoogleAdsenseOptions {
  adClient: string;
  enabled?: boolean;
}

interface UseGoogleAdsenseReturn {
  isLoaded: boolean;
  isError: boolean;
  error: Error | null;
}

export const useGoogleAdsense = ({
  adClient,
  enabled = true,
}: UseGoogleAdsenseOptions): UseGoogleAdsenseReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    // 既にスクリプトが読み込まれている場合
    if (window.adsbygoogle) {
      setIsLoaded(true);
      return;
    }

    // 既にスクリプトタグが存在する場合
    const existingScript = document.querySelector(
      `script[src*="adsbygoogle.js"][src*="${adClient}"]`
    );

    if (existingScript) {
      // スクリプトの読み込み完了を待つ
      const checkLoaded = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(checkLoaded);
          setIsLoaded(true);
        }
      }, 100);

      // タイムアウト処理
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.adsbygoogle) {
          const timeoutError = new Error('AdSense script load timeout');
          setError(timeoutError);
          setIsError(true);
        }
      }, 10000);

      return;
    }

    // 新しいスクリプトタグを作成
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      const loadError = new Error('Failed to load AdSense script');
      setError(loadError);
      setIsError(true);
    };

    document.head.appendChild(script);

    // クリーンアップ
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [adClient, enabled]);

  return { isLoaded, isError, error };
}; 