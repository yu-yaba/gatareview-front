import { Suspense } from 'react';
import LectureSearchClient from './LectureSearchClient';
import LectureSearchLoading from './LectureSearchLoading';
import { getPublicLectureList } from '../_helpers/serverLectureSearch';
import type { LectureSearchResponse } from '../_helpers/lectureSearch';
import type { Metadata } from 'next';
import JsonLd from '../_components/JsonLd';
import { HOME_BREADCRUMB, breadcrumbJsonLd, indexablePageMetadata, lectureListCanonicalPath } from '../_helpers/seo';

type LecturesSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function toURLSearchParams(searchParams: LecturesSearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (value !== undefined) params.set(key, Array.isArray(value) ? value[0] : value);
  }
  return params;
}

const LECTURE_LIST_TITLE = '授業一覧・検索 - ガタレビュ！新潟大学の授業レビュー';
const LECTURE_LIST_DESCRIPTION = '新潟大学の授業を授業名・教員名・学部で検索できます。評価やレビュー数で並び替え、テストの有無や出席確認などのレビュー内容でも絞り込めます。';
const lectureListBreadcrumb = breadcrumbJsonLd([HOME_BREADCRUMB, { name: '授業一覧', path: '/lectures' }]);

export async function generateMetadata({ searchParams }: { searchParams: LecturesSearchParams }): Promise<Metadata> {
  const path = lectureListCanonicalPath(await toURLSearchParams(searchParams));
  const page = new URLSearchParams(path.split('?')[1] || '').get('page');
  return indexablePageMetadata({
    title: page ? `授業一覧（${page}ページ目） - ガタレビュ！新潟大学の授業レビュー` : LECTURE_LIST_TITLE,
    description: LECTURE_LIST_DESCRIPTION,
    path,
  });
}

async function InitialResults({ query }: { query: string }) {
  let initialData: LectureSearchResponse | null = null;
  try { initialData = await getPublicLectureList(new URLSearchParams(query)); } catch { /* Client retry remains available. */ }
  return <LectureSearchClient key={query} initialQuery={query} initialData={initialData} generatedAt={Date.now()} />;
}

export default async function LecturesPage({ searchParams }: { searchParams: LecturesSearchParams }) {
  const params = await toURLSearchParams(searchParams);
  return (
    <>
      <JsonLd data={lectureListBreadcrumb} />
      <Suspense fallback={<LectureSearchLoading />}><InitialResults query={params.toString()} /></Suspense>
    </>
  );
}
