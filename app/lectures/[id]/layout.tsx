import type { Metadata } from 'next';
import { getLectureForMetadata } from '@/app/_helpers/serverLectureApi';
import { INDEXABLE_ROBOTS, absoluteUrl } from '@/app/_helpers/seo';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lecture = await getLectureForMetadata(id);

  if (!lecture) {
    return {
      title: 'ページが見つかりません - ガタレビュ！',
      description: 'お探しの授業ページは見つかりませんでした。',
    };
  }

  const title = `${lecture.title} - ${lecture.lecturer} | ガタレビュ！`;
  const description = `${lecture.faculty}の「${lecture.title}」(${lecture.lecturer} 先生)の授業レビュー。平均評価${lecture.avg_rating?.toFixed(1) || '0.0'}点、${lecture.review_count || 0}件のレビューを確認できます。`;

  // canonical・og:url は環境によらず本番ドメインにする（_helpers/seo.ts と同じ）。
  const baseUrl = absoluteUrl('');

  return {
    title,
    description,
    robots: INDEXABLE_ROBOTS,
    keywords: [
      lecture.title,
      lecture.lecturer,
      lecture.faculty,
      '新潟大学',
      '授業レビュー',
      '履修',
      'シラバス',
      '授業評価',
    ],
    openGraph: {
      title,
      description,
      url: `${baseUrl}/lectures/${id}`,
      siteName: 'ガタレビュ！',
      locale: 'ja_JP',
      type: 'article',
      images: [
        {
          url: `${baseUrl}/lectures/${id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: {
        url: `${baseUrl}/lectures/${id}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: title,
      },
      creator: '@gatareview',
      site: '@gatareview',
    },
    alternates: {
      canonical: `${baseUrl}/lectures/${id}`,
    },
  };
}

export default function LectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
