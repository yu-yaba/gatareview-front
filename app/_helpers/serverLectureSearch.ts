import 'server-only';
import { unstable_cache } from 'next/cache';
import { BACKEND_TIMEOUT_MS, clientIpSigner, type ClientIpSigner } from './backendRequest';
import { LECTURE_LIST_CACHE_SECONDS, publicLectureQuery, type LectureSearchResponse } from './lectureSearch';

async function fetchPublicList(query: string, base: string, signClientIp: ClientIpSigner): Promise<LectureSearchResponse> {
  // Never read or forward cookies, Authorization, or viewer-specific API data.
  // The signed visitor IP only lets the API count this request against the visitor.
  const url = `${base}/api/v1/lectures?${query}`;
  const response = await fetch(url, {
    cache: 'no-store', headers: { Accept: 'application/json', ...signClientIp(url) },
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
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

export async function getPublicLectureList(input: URLSearchParams): Promise<LectureSearchResponse> {
  const query = publicLectureQuery(input);
  // Include the backend in the cache arguments so environments cannot share fixtures/data.
  const base = (process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV || 'http://localhost:3001').replace(/\/$/, '');
  const signClientIp = await clientIpSigner();
  // Development should show edits/fixtures immediately; production tests exercise the real cache.
  if (process.env.NODE_ENV === 'development') return fetchPublicList(query, base, signClientIp);
  // Only successful, validated public data is cached; failures are thrown, not saved.
  // The signer is captured by the closure, not the cache key (query and base).
  return unstable_cache(
    (cachedQuery: string, cachedBase: string) => fetchPublicList(cachedQuery, cachedBase, signClientIp),
    ['public-lecture-search-v1'],
    { revalidate: LECTURE_LIST_CACHE_SECONDS },
  )(query, base);
}
