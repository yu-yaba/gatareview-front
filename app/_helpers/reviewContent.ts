// バックエンド(Rails)の `presence` と `length: { in: 30..1000 }` に合わせたコメント検証。
// Ruby の String#length はコードポイント数なので、UTF-16 の length ではなくコードポイントで数える。
export const REVIEW_CONTENT_MIN_LENGTH = 30;
export const REVIEW_CONTENT_MAX_LENGTH = 1000;

// JS の \s(U+FEFF を含む)と Ruby の [[:space:]](U+0085 を含む)に加え、幅ゼロの文字も空白として扱う。
// 前後が空白・幅ゼロの文字だけのコメントを通さないよう、フロントはバックエンドより少し厳しくする。
const BLANK = '[\\s\\u0085\\u200B-\\u200D\\u2060]';
const EDGE_BLANKS = new RegExp(`^${BLANK}+|${BLANK}+$`, 'g');
// 改行以外の空白（行の中身が空かどうかの判定に使う）
const INLINE_BLANK = '(?:[^\\S\\n]|[\\u0085\\u200B-\\u200D\\u2060])';
const LEADING_BLANK_LINES = new RegExp(`^(?:${INLINE_BLANK}*\\n)+`);
const TRAILING_BLANKS = new RegExp(`${BLANK}+$`);
const REPEATED_BLANK_LINES = new RegExp(`\\n(?:${INLINE_BLANK}*\\n){2,}`, 'g');

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

// 表示用: 先頭の空行と末尾の空白を除き、3行以上続く空行を1行にまとめる。
// 1行目の全角スペースの字下げは残す（本文は文字として表示し、HTMLにはしない）。
export function formatReviewText(value: string | null | undefined): string {
  return (value || '')
    .replace(/\r\n?/g, '\n')
    .replace(LEADING_BLANK_LINES, '')
    .replace(TRAILING_BLANKS, '')
    .replace(REPEATED_BLANK_LINES, '\n\n');
}

export function reviewContentError(value: string | null | undefined): string {
  const content = value || '';
  const meaningful = countMeaningfulCharacters(content);
  if (meaningful === 0) return 'コメントを入力してください';
  if (meaningful < REVIEW_CONTENT_MIN_LENGTH) {
    return `コメントは前後の空白・改行を除いて${REVIEW_CONTENT_MIN_LENGTH}文字以上で入力してください`;
  }
  if (countCharacters(content) > REVIEW_CONTENT_MAX_LENGTH) {
    return `コメントは${REVIEW_CONTENT_MAX_LENGTH}文字以内で入力してください`;
  }
  return '';
}
