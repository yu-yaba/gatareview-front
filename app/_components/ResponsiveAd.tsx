'use client';

import NinjaAdMax from './NinjaAdMax';
import { AD_CONFIG, AD_SIZES } from '../config/adConfig';

interface ResponsiveAdProps {
  className?: string;
  'aria-label'?: string;
}

const ResponsiveAd: React.FC<ResponsiveAdProps> = ({ 
  className = '',
  'aria-label': ariaLabel = '広告'
}) => {
  return (
    <div className={`flex justify-center mt-12 mb-8 px-4 ${className}`}>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100/50 w-full max-w-4xl">
        {/* デスクトップ用広告 */}
        <div className="hidden md:block">
          <NinjaAdMax 
            adId={AD_CONFIG.NINJA_ADMAX.DESKTOP_BANNER}
            width={AD_SIZES.DESKTOP_BANNER.width}
            height={AD_SIZES.DESKTOP_BANNER.height}
            className="mx-auto"
            aria-label={ariaLabel}
          />
        </div>
        {/* モバイル用広告 */}
        <div className="block md:hidden">
          <NinjaAdMax 
            adId={AD_CONFIG.NINJA_ADMAX.MOBILE_BANNER}
            width={AD_SIZES.MOBILE_BANNER.width}
            height={AD_SIZES.MOBILE_BANNER.height}
            className="mx-auto"
            aria-label={ariaLabel}
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveAd;