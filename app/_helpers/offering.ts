export const DAY_LABELS: Record<number, string> = {
  1: '月',
  2: '火',
  3: '水',
  4: '木',
  5: '金',
  6: '土',
  7: '日',
};

export function offeringTermLabel(termLabel: string | null, termNumbers: number[]): string | null {
  if (termLabel) return termLabel;
  if (termNumbers.length === 0) return null;

  return termNumbers.map((term) => `第${term}ターム`).join('・');
}

export function reviewTermForOffering(termLabel: string | null): string {
  const normalized = termLabel?.replace(/\s/g, '').replace('，', ',') ?? '';
  const termLabels: Record<string, string> = {
    '第1ターム': '1ターム',
    '第2ターム': '2ターム',
    '第1,2ターム': '1, 2ターム',
    '第3ターム': '3ターム',
    '第4ターム': '4ターム',
    '第3,4ターム': '3, 4ターム',
    '通年': '通年',
    '集中': '集中',
  };

  return termLabels[normalized] ?? '';
}
