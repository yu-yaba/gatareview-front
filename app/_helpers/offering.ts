export const DAY_LABELS: Record<number, string> = {
  1: '月',
  2: '火',
  3: '水',
  4: '木',
  5: '金',
  6: '土',
  7: '日',
};

export const OFFERING_TERM_CODES = [
  '1', '2', '3', '4', '5', '9',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
] as const;

export type OfferingTermCode = typeof OFFERING_TERM_CODES[number];

const REVIEW_TERM_LABELS: Record<OfferingTermCode, string> = {
  '1': '第1学期',
  '2': '第2学期',
  '3': '通年',
  '4': '集中',
  '5': '年度跨り',
  '9': '時間外',
  A: '1ターム',
  B: '2ターム',
  C: '3ターム',
  D: '4ターム',
  E: '1, 2ターム',
  F: '3, 4ターム',
  G: '2, 3ターム',
  H: '1～3ターム',
  I: '2～4ターム',
};

const NORMALIZED_TERM_LABEL_TO_CODE: Record<string, OfferingTermCode> = {
  '第1学期': '1',
  '第2学期': '2',
  '通年': '3',
  '集中': '4',
  '年度跨り': '5',
  '時間外': '9',
  '第1ターム': 'A',
  '1ターム': 'A',
  '第2ターム': 'B',
  '2ターム': 'B',
  '第3ターム': 'C',
  '3ターム': 'C',
  '第4ターム': 'D',
  '4ターム': 'D',
  '第1,2ターム': 'E',
  '1,2ターム': 'E',
  '第3,4ターム': 'F',
  '3,4ターム': 'F',
  '第2,3ターム': 'G',
  '2,3ターム': 'G',
  '第1～3ターム': 'H',
  '1～3ターム': 'H',
  '第2～4ターム': 'I',
  '2～4ターム': 'I',
};

function normalizeTermLabel(label: string): string {
  return label.replace(/\s/g, '').replace(/[，、]/g, ',').replace(/[〜~]/g, '～');
}

const REVIEW_TERM_OPTION_CODES: OfferingTermCode[] = [
  'A', 'B', 'E', 'C', 'D', 'F', 'G', 'H', 'I',
  '1', '2', '3', '4', '5', '9',
];

export const REVIEW_TERM_OPTIONS = REVIEW_TERM_OPTION_CODES.map((code) => REVIEW_TERM_LABELS[code]);

export function offeringTermLabel(termLabel: string | null, termNumbers: number[]): string | null {
  if (termLabel) return termLabel;
  if (termNumbers.length === 0) return null;

  return termNumbers.map((term) => `第${term}ターム`).join('・');
}

export function isOfferingTermCode(value: string | null | undefined): value is OfferingTermCode {
  return OFFERING_TERM_CODES.some((code) => code === value);
}

export function offeringTermCode(
  termCode: string | null | undefined,
  termLabel: string | null | undefined,
): OfferingTermCode | null {
  if (isOfferingTermCode(termCode)) return termCode;
  if (!termLabel) return null;
  return NORMALIZED_TERM_LABEL_TO_CODE[normalizeTermLabel(termLabel)] ?? null;
}

export function reviewTermForOffering(
  termCode: string | null | undefined,
  termLabel?: string | null,
): string {
  const code = offeringTermCode(termCode, termLabel);
  return code ? REVIEW_TERM_LABELS[code] : (termLabel ?? '');
}

export function reviewTermCode(termLabel: string): OfferingTermCode | null {
  if (!termLabel || termLabel === 'その他・不明') return null;
  return NORMALIZED_TERM_LABEL_TO_CODE[normalizeTermLabel(termLabel)] ?? null;
}
