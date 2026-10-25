import { Suspense } from 'react';
import LectureSearchClient from './LectureSearchClient';
import LectureSearchLoading from './LectureSearchLoading';
import { getPublicLectureList } from '../_helpers/serverLectureSearch';
import type { LectureSearchResponse } from '../_helpers/lectureSearch';

async function InitialResults({ query }: { query: string }) {
  let initialData: LectureSearchResponse | null = null;
  try { initialData = await getPublicLectureList(new URLSearchParams(query)); } catch { /* Client retry remains available. */ }
  return <LectureSearchClient key={query} initialQuery={query} initialData={initialData} generatedAt={Date.now()} />;
}

export default async function LecturesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (value !== undefined) params.set(key, Array.isArray(value) ? value[0] : value);
  }
  return <Suspense fallback={<LectureSearchLoading />}><InitialResults query={params.toString()} /></Suspense>;
}
