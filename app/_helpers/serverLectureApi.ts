import 'server-only';
import { unstable_cache } from 'next/cache';
import { headers } from 'next/headers';
import { cache } from 'react';

import { BACKEND_TIMEOUT_MS, clientIpSigner, UNSIGNED, type ClientIpSigner } from './backendRequest';
import { BACKEND_RATE_LIMITED_DIGEST } from './monitoring';

import type { HomeLectureItem, HomePageData } from '@/app/_types/HomePageData';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import type { LectureReviewsResponse } from '@/app/_types/ReviewSchema';
import type { ReviewWithLecture } from '@/app/_types/ReviewWithLecture';
import { toPublicLatestReviews, toPublicLectureReviews } from './publicReview';

const DEFAULT_LOCAL_BACKEND_URL = 'http://localhost:3001';
export const PUBLIC_REVALIDATE_SECONDS = 300;
export const METADATA_REVALIDATE_SECONDS = PUBLIC_REVALIDATE_SECONDS;

type ServerFetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

function getBackendBaseUrls() {
  const candidates = [
    process.env.DOCKER_BACKEND_URL,
    process.env.NEXT_PUBLIC_ENV,
    DEFAULT_LOCAL_BACKEND_URL,
  ].filter(Boolean) as string[];

  return Array.from(new Set(candidates.map((candidate) => candidate.replace(/\/$/, ''))));
}

export class BackendResponseError extends Error {
  readonly status: number;
  readonly digest?: string;

  constructor(status: number) {
    super(`Backend responded with HTTP ${status}`);
    this.name = 'BackendResponseError';
    this.status = status;
    // Lets monitoring drop every report of a rate-limited page (see monitoring.ts).
    if (status === 429) this.digest = BACKEND_RATE_LIMITED_DIGEST;
  }
}

// Replaces the fetch's TimeoutError (a DOMException without the path) so logs
// and Sentry say which backend call stalled.
export class BackendTimeoutError extends Error {
  constructor(path: string) {
    super(`Backend did not respond within ${BACKEND_TIMEOUT_MS} ms for ${path}`);
    this.name = 'BackendTimeoutError';
  }
}

const isTimeout = (error: unknown) => error instanceof Error && error.name === 'TimeoutError';

const isBackendNotFound = (error: unknown) =>
  error instanceof BackendResponseError && error.status === 404;

// Any HTTP answer is final: a non-2xx status (429, 5xx, 404) or malformed JSON
// throws, so callers decide what a real 404 means and never turn a transient
// failure into "not found". Only an unreachable backend falls through to the
// next configured base URL.
async function fetchJson<T>(
  path: string,
  init: ServerFetchOptions = {},
  signClientIp: ClientIpSigner = UNSIGNED,
): Promise<T> {
  let lastError: unknown = null;

  for (const backendBaseUrl of getBackendBaseUrls()) {
    const url = `${backendBaseUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(init.headers || {}),
          ...signClientIp(url, init.method),
        },
      });
    } catch (error) {
      // A timeout means the backend is reachable but stalled: fail now instead
      // of spending another full timeout on the next base URL.
      if (isTimeout(error)) throw new BackendTimeoutError(path);
      lastError = error;
      continue;
    }

    if (!response.ok) {
      throw new BackendResponseError(response.status);
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      if (isTimeout(error)) throw new BackendTimeoutError(path);
      throw error;
    }
  }

  console.error(`Error fetching ${path}:`, lastError);
  throw lastError instanceof Error ? lastError : new Error(`Backend unavailable for ${path}`);
}

// Only a well-formed lecture may enter the shared cache; anything else throws
// and is retried on the next request. The text columns allow NULL in the
// database, so null is accepted there.
function assertLecture(body: unknown): LectureSchema {
  const lecture = body as Record<string, unknown> | null;
  const text = (value: unknown) => typeof value === 'string' || value === null || value === undefined;
  if (!lecture || typeof lecture !== 'object' || Array.isArray(lecture) || !Number.isInteger(lecture.id) ||
      !text(lecture.title) || !text(lecture.lecturer) || !text(lecture.faculty)) {
    throw new Error('Invalid lecture response');
  }
  return lecture as unknown as LectureSchema;
}

// Lecture IDs are positive integers. Anything else is not found without asking
// the API, so junk URLs cost no API calls and cannot provoke errors such as the
// 400 Puma returns for over-long request lines.
const LECTURE_ID = /^[1-9]\d{0,9}$/;

// Metadata, the page, and the OGP route share one public cache entry per
// lecture; React also shares the parsed result within a server render. Never
// add a session token here: viewer-specific reviews must keep using no-store
// below. Only successful, well-formed responses are cached. The signer is
// captured by the closure, not the cache key, so a cache miss is counted
// against the visitor who caused it while everyone shares the cached result.
async function fetchPublicLecture(id: string, signClientIp: ClientIpSigner): Promise<LectureSchema | null> {
  if (!LECTURE_ID.test(id)) return null;
  const path = `/api/v1/lectures/${id}`;
  try {
    return await unstable_cache(
      async () => assertLecture(await fetchJson<unknown>(path, {
        cache: 'no-store',
        headers: { 'User-Agent': 'GataReview-NextJS-Metadata/1.0' },
      }, signClientIp)),
      ['public-lecture-v2', ...getBackendBaseUrls(), path],
      { revalidate: PUBLIC_REVALIDATE_SECONDS },
    )();
  } catch (error) {
    if (isBackendNotFound(error)) return null;
    throw error;
  }
}

// After a failed or not-found lookup Next.js renders the error page a second
// time, calling generateMetadata again, and React's cache() does not span the
// two renders. Keep each lookup for the rest of the request (keyed by the
// request's headers object) so one page view calls the API once, and a timeout
// is waited for once, even when the lookup fails.
const lookupsByRequest = new WeakMap<object, Map<string, Promise<LectureSchema | null>>>();

// The OGP image route renders on every request too (only the CDN caches the
// image), so it can read the visitor's headers and sign like the page does.
const getPublicLecture = cache(async (id: string): Promise<LectureSchema | null> => {
  if (!LECTURE_ID.test(id)) return null;
  const requestHeaders = await headers();
  let lookups = lookupsByRequest.get(requestHeaders);
  if (!lookups) {
    lookups = new Map();
    lookupsByRequest.set(requestHeaders, lookups);
  }
  let lookup = lookups.get(id);
  if (!lookup) {
    lookup = clientIpSigner().then((signClientIp) => fetchPublicLecture(id, signClientIp));
    lookups.set(id, lookup);
  }
  return lookup;
});
export { getPublicLecture as getLectureForMetadata, getPublicLecture as getLectureForPage };

// The result is passed to a client component, so it is serialized into the HTML
// and RSC payload. Only whitelisted review fields leave the server.
export async function getLectureReviewsForPage(
  id: string,
  backendToken?: string | null,
  viewerUserId?: string | number | null,
): Promise<LectureReviewsResponse | null> {
  const headers = backendToken
    ? { Authorization: `Bearer ${backendToken}` }
    : undefined;

  let body: unknown;
  try {
    body = await fetchJson<unknown>(`/api/v1/lectures/${id}/reviews`, {
      cache: 'no-store',
      headers,
    }, await clientIpSigner());
  } catch (error) {
    // The lecture is already on screen; show the inline retry message instead.
    console.error(`Error fetching reviews for lecture ${id}:`, error);
    return null;
  }

  // The viewer ID is only a fallback for backends that do not send is_own yet,
  // and only counts when the request was made with that viewer's token.
  return toPublicLectureReviews(body, backendToken ? viewerUserId : null);
}

// The home page shows a message per section instead of failing as a whole.
const orNull = <T,>(request: Promise<T>) => request.catch(() => null);

async function getTotalReviews() {
  const response = await orNull(fetchJson<{ count: number }>('/api/v1/reviews/total', {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  }));

  return response?.count ?? null;
}

async function getPopularLectures() {
  const response = await orNull(fetchJson<{ lectures: HomeLectureItem[] }>('/api/v1/lectures/popular', {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  }));

  return response?.lectures ?? null;
}

async function getNoReviewsLectures() {
  const response = await orNull(fetchJson<{ lectures: HomeLectureItem[] }>('/api/v1/lectures/no_reviews', {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  }));

  return response?.lectures ?? null;
}

async function getLatestReviews(): Promise<ReviewWithLecture[] | null> {
  const body = await orNull(fetchJson<unknown>('/api/v1/reviews/latest', {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  }));

  return body === null ? null : toPublicLatestReviews(body);
}

export async function getHomePageData(): Promise<HomePageData> {
  const [totalReviews, popularLectures, noReviewsLectures, latestReviews] =
    await Promise.all([
      getTotalReviews(),
      getPopularLectures(),
      getNoReviewsLectures(),
      getLatestReviews(),
    ]);

  return {
    totalReviews,
    popularLectures: popularLectures ?? [],
    popularError: popularLectures ? null : '人気の授業を取得できませんでした。',
    noReviewsLectures: noReviewsLectures ?? [],
    noReviewsError: noReviewsLectures ? null : 'レビュー未投稿の授業を取得できませんでした。',
    latestReviews: latestReviews ?? [],
    latestReviewsError: latestReviews ? null : '最新のレビューを取得できませんでした。',
  };
}
