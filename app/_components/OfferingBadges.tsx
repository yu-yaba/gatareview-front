import type { OfferingData } from '@/app/_types/LectureSchema';
import { DAY_LABELS, offeringTermLabel } from '@/app/_helpers/offering';

type OfferingBadgesProps = {
  offering: OfferingData | null | undefined;
  showYear?: boolean;
  className?: string;
};

export default function OfferingBadges({ offering, showYear = false, className = '' }: OfferingBadgesProps) {
  if (!offering) return null;

  const termLabel = offeringTermLabel(offering.term_label, offering.term_numbers);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {showYear && <span className="text-xs text-gray-500">{offering.year}年度</span>}
      {termLabel && (
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
          {termLabel}
        </span>
      )}
      {offering.slots.map((slot) => (
        <span key={`${slot.day}-${slot.period}`} className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
          {DAY_LABELS[slot.day]}{slot.period}
        </span>
      ))}
    </div>
  );
}
