import type { Metadata } from 'next';

async function fetchLectureData(id: string) {
  try {
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://gatareview.com' 
      : process.env.NEXT_PUBLIC_ENV || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/api/v1/lectures/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // ISR的なキャッシュ設定
      next: { revalidate: 3600 }, // 1時間キャッシュ
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching lecture data for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const lecture = await fetchLectureData(params.id);

  if (!lecture) {
    return {
      title: 'ページが見つかりません - ガタレビュ！',
      description: 'お探しの授業ページは見つかりませんでした。',
    };
  }

  const title = `${lecture.title} - ${lecture.lecturer} | ガタレビュ！`;
  const description = `${lecture.faculty}の「${lecture.title}」(${lecture.lecturer} 先生)の授業レビュー。平均評価${lecture.avg_rating?.toFixed(1) || '0.0'}点、${lecture.review_count || 0}件のレビューを確認できます。`;

  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://gatareview.com' : 'http://localhost:3000';

  return {
    title,
    description,
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
      url: `${baseUrl}/lectures/${params.id}`,
      siteName: 'ガタレビュ！',
      images: [
        {
          url: `${baseUrl}/api/og/lectures/${params.id}`,
          width: 1200,
          height: 630,
          alt: `${lecture.title} - ${lecture.lecturer} 先生の授業レビュー`,
          type: 'image/png',
        }
      ],
      locale: 'ja_JP',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: {
        url: `${baseUrl}/api/og/lectures/${params.id}`,
        width: 1200,
        height: 630,
        alt: `${lecture.title} - ${lecture.lecturer} 先生の授業レビュー`,
      },
      creator: '@gatareview',
      site: '@gatareview',
    },
    alternates: {
      canonical: `${baseUrl}/lectures/${params.id}`,
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