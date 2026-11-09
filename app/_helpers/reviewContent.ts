// バックエンド(Rails)の `presence` と `length: { in: 30..1000 }` に合わせたコメント検証。
// Ruby の String#length はコードポイント数なので、UTF-16 の length ではなくコードポイントで数える。
export const REVIEW_CONTENT_MIN_LENGTH = 30;
export const REVIEW_CONTENT_MAX_LENGTH = 1000;

// JS の \s(U+FEFF を含む)と Ruby の [[:space:]](U+0085 を含む)に加え、幅ゼロの文字も空白として扱う。
// 見た目が空のコメントを投稿できないよう、フロントはバックエンドより少し厳しくする。
const BLANK = '[\\s\\u0085\\u200B-\\u200D\\u2060]';
const EDGE_BLANKS = new RegExp(`^${BLANK}+|${BLANK}+$`, 'g');

export function countCharacters(value: string | null | undefined): number {
  return value ? Array.from(value).length : 0;
}

// 前後の空白・改行を除いた文字数（最低文字数の判定と表示に使う）
export function countMeaningfulCharacters(value: string | null | undefined): number {
  return countCharacters((value || '').replace(EDGE_BLANKS, ''));
}

const graphemes = (value: string): string[] => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), part => part.segment);
  }
  return Array.from(value);
};

// 絵文字(サロゲートペアや ZWJ でつながった絵文字)を途中で切らずに省略する
export function truncateCharacters(value: string, max: number): string {
  const characters = graphemes(value);
  return characters.length > max ? `${characters.slice(0, max).join('')}...` : value;
}

// 表示用: 前後の空白と、3行以上続く空行をまとめる（本文は文字として表示し、HTMLにはしない）
export function formatReviewText(value: string | null | undefined): string {
  return (value || '')
    .replace(/\r\n?/g, '\n')
    .replace(EDGE_BLANKS, '')
    .replace(/\n(?:[^\S\n]*\n){2,}/g, '\n\n');
}

export function reviewContentError(value: string | null | undefined): string {
  const content = value || '';
  const meaningful = countMeaningfulCharacters(content);
  if (meaningful === 0) return 'コメントを入力してください';
  if (meaningful < REVIEW_CONTENT_MIN_LENGTH) {
    return `コメントは空白・改行を除いて${REVIEW_CONTENT_MIN_LENGTH}文字以上で入力してください`;
  }
  if (countCharacters(content) > REVIEW_CONTENT_MAX_LENGTH) {
    return `コメントは${REVIEW_CONTENT_MAX_LENGTH}文字以内で入力してください`;
  }
  return '';
}
