'use client';

import { getActiveProgram } from '@/app/_helpers/affiliates';
import type { AffiliatePlacement } from '@/app/_types/AffiliateProgram';

type AffiliateSlotProps = {
  placement: AffiliatePlacement;
  className?: string;
};

/**
 * A8.netの広告枠。
 *
 * 掲載する案件は _helpers/affiliates.ts で管理しており、該当する案件がない期間は
 * 何も描画しない（レイアウトに影響しない）。
 *
 * A8のタグは <a> と <img> だけで完結するため、外部JSは読み込まない。
 * 表示速度の劣化は検索流入の減少に直結するため、この方針は維持すること。
 */
export default function AffiliateSlot({ placement, className = '' }: AffiliateSlotProps) {
  const program = getActiveProgram(placement);

  if (!program) return null;

  const handleClick = () => {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.('event', 'affiliate_click', {
      program_id: program.id,
      placement,
    });
  };

  return (
    <div className={`my-6 flex flex-col items-center ${className}`}>
      <span className="mb-1 text-xs font-bold tracking-wide text-gray-400">PR</span>
      <a
        href={program.linkUrl}
        target="_blank"
        rel="sponsored nofollow noopener"
        onClick={handleClick}
        className="inline-block max-w-full transition-opacity duration-200 hover:opacity-80"
      >
        {/* next/imageは使わない: 外部ドメインの広告配信URLであり、最適化・プロキシは計測を壊す */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={program.bannerUrl}
          alt={program.alt}
          width={program.width}
          height={program.height}
          loading="lazy"
          className="h-auto max-w-full border-0"
        />
      </a>
      {/* A8.netの表示回数計測用ピクセル */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={program.impressionPixelUrl} alt="" width={1} height={1} className="border-0" />
    </div>
  );
}
