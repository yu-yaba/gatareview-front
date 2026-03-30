import 'server-only';

import type { HomeLectureItem, HomePageData } from '@/app/_types/HomePageData';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import type { LectureReviewsResponse } from '@/app/_types/ReviewSchema';
import type { ReviewWithLecture } from '@/app/_types/ReviewWithLecture';

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

async function fetchJson<T>(
  path: string,
  init: ServerFetchOptions = {},
): Promise<T | null> {
  const backendBaseUrls = getBackendBaseUrls();
  let lastError: unknown = null;

  for (const backendBaseUrl of backendBaseUrls) {
    try {
      const response = await fetch(`${backendBaseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(init.headers || {}),
        },
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }

  console.error(`Error fetching ${path}:`, lastError);
  return null;
}

export async function getLectureForMetadata(id: string): Promise<LectureSchema | null> {
  return fetchJson<LectureSchema>(`/api/v1/lectures/${id}`, {
    headers: {
      'User-Agent': 'GataReview-NextJS-Metadata/1.0',
    },
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });
}

export async function getLectureForPage(id: string): Promise<LectureSchema | null> {
  return fetchJson<LectureSchema>(`/api/v1/lectures/${id}`, {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });
}

export async function getLectureReviewsForPage(
  id: string,
  backendToken?: string | null,
): Promise<LectureReviewsResponse | null> {
  const headers = backendToken
    ? { Authorization: `Bearer ${backendToken}` }
    : undefined;

  return fetchJson<LectureReviewsResponse>(`/api/v1/lectures/${id}/reviews`, {
    cache: 'no-store',
    headers,
  });
}

async function getTotalReviews() {
  const response = await fetchJson<{ count: number }>('/api/v1/reviews/total', {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });

  return response?.count ?? null;
}

async function getPopularLectures() {
  const response = await fetchJson<{ lectures: HomeLectureItem[] }>('/api/v1/lectures/popular', {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });

  return response?.lectures ?? null;
}

async function getNoReviewsLectures() {
  const response = await fetchJson<{ lectures: HomeLectureItem[] }>('/api/v1/lectures/no_reviews', {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });

  return response?.lectures ?? null;
}

async function getLatestReviews() {
  return fetchJson<ReviewWithLecture[]>('/api/v1/reviews/latest', {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });
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
