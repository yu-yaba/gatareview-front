import type { LectureReviewsResponse, ReviewAccessState, ReviewSchema } from '@/app/_types/ReviewSchema';
import type { ReviewWithLecture } from '@/app/_types/ReviewWithLecture';

// 画面に投稿者を表示しておらず、利用者は匿名で投稿している前提のため、投稿者を特定・名寄せできる値
// （user, user_id, Google の表示名・プロフィール画像 URL）はクライアントコンポーネントへ渡さない。
// クライアントコンポーネントの props は HTML / RSC payload にそのまま埋め込まれるので、
// バックエンドが余分な項目を返しても漏れないよう、渡す項目を許可リストで固定する。
// created_at / updated_at も渡さない（匿名レビューは編集できないため、編集時刻から
// ログイン投稿かどうかや同じ人の投稿が推測できる。画面でも使っていない）。
const PUBLIC_REVIEW_FIELDS = [
  'id',
  'rating',
  'content',
  'lecture_id',
  'textbook',
  'attendance',
  'grading_type',
  'content_difficulty',
  'content_quality',
  'period_year',
  'period_term',
  'thanks_count',
] as const;

export const DEFAULT_REVIEW_ACCESS: ReviewAccessState = {
  restriction_enabled: false,
  access_granted: true,
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function toPublicReview(raw: unknown, isOwn: boolean): ReviewSchema {
  const source = isRecord(raw) ? raw : {};
  const review: UnknownRecord = {};
  for (const field of PUBLIC_REVIEW_FIELDS) {
    if (field in source) review[field] = source[field];
  }
  review.is_own = isOwn;
  return review as ReviewSchema;
}

// is_own を返すバックエンドではその値だけを使う。
// is_own を返さない旧バックエンド（user_id を返す）へのデプロイ移行期間だけ、サーバー側で
// ログイン中ユーザーの ID と比べて判定する。user_id 自体はクライアントへ渡さない。
export function resolveIsOwn(raw: unknown, viewerUserId?: string | number | null): boolean {
  if (!isRecord(raw)) return false;
  if (typeof raw.is_own === 'boolean') return raw.is_own;
  if (viewerUserId === null || viewerUserId === undefined || viewerUserId === '') return false;
  if (raw.user_id === null || raw.user_id === undefined) return false;
  return String(raw.user_id) === String(viewerUserId);
}

export function toPublicLectureReviews(
  body: unknown,
  viewerUserId?: string | number | null,
): LectureReviewsResponse | null {
  if (!isRecord(body) || !Array.isArray(body.reviews)) return null;

  const access = isRecord(body.access)
    ? {
        restriction_enabled: body.access.restriction_enabled === true,
        access_granted: body.access.access_granted === true,
      }
    : DEFAULT_REVIEW_ACCESS;

  return {
    reviews: body.reviews
      .filter(isRecord)
      .map((review) => toPublicReview(review, resolveIsOwn(review, viewerUserId))),
    access,
  };
}

export function toPublicLatestReviews(body: unknown): ReviewWithLecture[] | null {
  if (!Array.isArray(body)) return null;

  return body
    .filter((review): review is UnknownRecord & { lecture: UnknownRecord } =>
      isRecord(review) && isRecord(review.lecture))
    .map((review) => ({
      id: review.id as number,
      rating: review.rating as number,
      content: review.content as string,
      lecture: {
        id: review.lecture.id as number,
        title: review.lecture.title as string,
        lecturer: review.lecture.lecturer as string,
        faculty: review.lecture.faculty as string,
      },
    }));
}
