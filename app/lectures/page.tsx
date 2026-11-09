import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import LectureSearchClient from './LectureSearchClient';
import LectureSearchLoading from './LectureSearchLoading';
import { getPublicLectureList } from '../_helpers/serverLectureSearch';
import type { LectureSearchResponse } from '../_helpers/lectureSearch';
import { isValidPageNumber } from '../_helpers/pagination';

const MAX_SEARCH_LENGTH = 255;

// 検索APIは UTF-16 の長さで255までを受け付ける。サロゲートペアの途中では切らない。
function truncateUtf16(value: string, max: number): string {
  const cut = value.slice(0, max);
  const last = cut.charCodeAt(cut.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
}

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
  // 長すぎるキーワード（URL直打ち）も、入力欄と同じ255文字までに縮めて開き直す。
  const search = params.get('search');
  const tooLongSearch = search !== null && search.length > MAX_SEARCH_LENGTH;
  const invalidPage = params.has('page') && !isValidPageNumber(params.get('page'));
  if (tooLongSearch || invalidPage) {
    if (invalidPage) params.delete('page');
    if (tooLongSearch) params.set('search', truncateUtf16(search, MAX_SEARCH_LENGTH));
    const query = params.toString();
    redirect(query ? `/lectures?${query}` : '/lectures');
  }
  return <Suspense fallback={<LectureSearchLoading />}><InitialResults query={params.toString()} /></Suspense>;
}
