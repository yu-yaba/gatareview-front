export type AffiliatePlacement = 'lectures_list' | 'lecture_detail';

export type AffiliateProgram = {
  id: string;
  name: string;
  linkUrl: string;
  bannerUrl: string;
  impressionPixelUrl: string;
  width: number;
  height: number;
  alt: string;
  activeMonths: number[];
  placements: AffiliatePlacement[];
};
