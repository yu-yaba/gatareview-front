// バックエンド(Rails)の `presence` と `length: { in: 30..1000 }` に合わせたコメント検証。
// Ruby の String#length はコードポイント数なので、UTF-16 の length ではなくコードポイントで数える。
export const REVIEW_CONTENT_MIN_LENGTH = 30;
export const REVIEW_CONTENT_MAX_LENGTH = 1000;

// JS の \s は U+FEFF を含み、Ruby の [[:space:]] は U+0085 を含む。両方を空白として扱う。
const EDGE_SPACES = /^[\s\u0085]+|[\s\u0085]+$/g;

export function countCharacters(value: string): number {
  return Array.from(value).length;
}

export function truncateCharacters(value: string, max: number): string {
  const characters = Array.from(value);
  return characters.length > max ? `${characters.slice(0, max).join('')}...` : value;
}

export function reviewContentError(value: string): string {
  const trimmed = value.replace(EDGE_SPACES, '');
  if (trimmed === '') return 'コメントを入力してください';
  if (countCharacters(trimmed) < REVIEW_CONTENT_MIN_LENGTH) {
    return `コメントは${REVIEW_CONTENT_MIN_LENGTH}文字以上で入力してください`;
  }
  if (countCharacters(value) > REVIEW_CONTENT_MAX_LENGTH) {
    return `コメントは${REVIEW_CONTENT_MAX_LENGTH}文字以内で入力してください`;
  }
  return '';
}
