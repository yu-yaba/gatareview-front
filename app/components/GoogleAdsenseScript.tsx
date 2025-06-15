'use client';

import Script from 'next/script';
import { ADSENSE_CONFIG } from '../config/adsense';

export default function GoogleAdsenseScript() {
  return (
    <>
      {/* Google AdSense DNS プリフェッチ */}
      {ADSENSE_CONFIG.PERFORMANCE.DNS_PREFETCH.map((domain) => (
        <link key={domain} rel="dns-prefetch" href={domain} />
      ))}

      {/* Google AdSense スクリプト */}
      <Script
        id="google-adsense"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.CLIENT_ID}`}
        crossOrigin="anonymous"
        strategy={ADSENSE_CONFIG.PERFORMANCE.LOAD_STRATEGY}
        onLoad={() => {
          console.log('Google AdSense script loaded successfully');
        }}
        onError={(e) => {
          console.error('Failed to load Google AdSense script:', e);
        }}
      />
    </>
  );
} 