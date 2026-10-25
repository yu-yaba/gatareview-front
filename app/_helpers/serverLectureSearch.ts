import 'server-only';
import { unstable_cache } from 'next/cache';
import { LECTURE_LIST_CACHE_SECONDS, publicLectureQuery, type LectureSearchResponse } from './lectureSearch';

async function fetchPublicList(query: string, base: string): Promise<LectureSearchResponse> {
  // Never read or forward cookies, Authorization, or viewer-specific API data.
  const response = await fetch(`${base}/api/v1/lectures?${query}`, {
    cache: 'no-store', headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Lecture search unavailable');
  const body = await response.json();
  if (!Array.isArray(body?.lectures) || body.lectures.length > 20 ||
      !body.lectures.every((lecture: Record<string, unknown>) =>
        lecture && typeof lecture.id === 'number' && typeof lecture.title === 'string' &&
        typeof lecture.lecturer === 'string' && typeof lecture.faculty === 'string' &&
        typeof lecture.avg_rating === 'number' && Number.isFinite(lecture.avg_rating) &&
        Number.isInteger(lecture.review_count) && Number(lecture.review_count) >= 0) ||
      !body.pagination || !['current_page', 'total_pages', 'total_count', 'per_page'].every(key =>
        Number.isInteger(body.pagination[key]) && body.pagination[key] >= 0)) {
    throw new Error('Invalid lecture search response');
  }
  return {
    lectures: body.lectures.map((lecture: LectureSearchResponse['lectures'][number]) => ({
      id: lecture.id, title: lecture.title, lecturer: lecture.lecturer, faculty: lecture.faculty,
      avg_rating: lecture.avg_rating, review_count: lecture.review_count,
    })),
    pagination: {
      current_page: body.pagination.current_page, total_pages: body.pagination.total_pages,
      total_count: body.pagination.total_count, per_page: body.pagination.per_page,
    },
  };
}

// Only successful, validated public data is cached; failures are thrown, not saved.
const cachedPublicList = unstable_cache(fetchPublicList, ['public-lecture-search-v1'], {
  revalidate: LECTURE_LIST_CACHE_SECONDS,
});

export function getPublicLectureList(input: URLSearchParams): Promise<LectureSearchResponse> {
  const query = publicLectureQuery(input);
  // Include the backend in the cache arguments so environments cannot share fixtures/data.
  const base = (process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV || 'http://localhost:3001').replace(/\/$/, '');
  // Development should show edits/fixtures immediately; production tests exercise the real cache.
  return process.env.NODE_ENV === 'development' ? fetchPublicList(query, base) : cachedPublicList(query, base);
}
