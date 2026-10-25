import type { LectureSchema } from '@/app/_types/LectureSchema';

export interface LecturePagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export interface LectureSearchResponse {
  lectures: Pick<LectureSchema, 'id' | 'title' | 'lecturer' | 'faculty' | 'avg_rating' | 'review_count'>[];
  pagination: LecturePagination;
}

export const LECTURE_LIST_CACHE_SECONDS = 60;
const queryKeys = ['search', 'faculty', 'sort', 'period_year', 'period_term',
  'textbook', 'attendance', 'grading_type', 'content_difficulty', 'content_quality'] as const;

// UI-only flags, unknown keys, and parameter ordering must not multiply cache keys.
export function publicLectureQuery(input: URLSearchParams): string {
  const page = input.get('page') || '1';
  if (!/^\d+$/.test(page) || Number(page) < 1 || Number(page) > 10000) {
    throw new Error('Invalid lecture page');
  }
  const result = new URLSearchParams({ page: String(Number(page)) });
  for (const key of queryKeys) {
    const value = input.get(key);
    if (value && value.length > 255) throw new Error('Invalid lecture search parameter');
    if (value && !(key === 'sort' && value === 'newest')) result.set(key, value);
  }
  return result.toString();
}
