import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import LectureSearchClient from './LectureSearchClient';
import LectureSearchLoading from './LectureSearchLoading';
import { getPublicLectureList } from '../_helpers/serverLectureSearch';
import type { LectureSearchResponse } from '../_helpers/lectureSearch';
import { isValidPageNumber } from '../_helpers/pagination';

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
  // `?page=abc` や `?page=0` はエラーにせず1ページ目として開き直す。
  if (params.has('page') && !isValidPageNumber(params.get('page'))) {
    params.delete('page');
    const query = params.toString();
    redirect(query ? `/lectures?${query}` : '/lectures');
  }
  return <Suspense fallback={<LectureSearchLoading />}><InitialResults query={params.toString()} /></Suspense>;
}
