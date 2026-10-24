import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

import LectureDetailClient from './LectureDetailClient';
import LectureSummary from './LectureSummary';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import { authOptions } from '@/app/_helpers/authOptions';
import { getLectureForPage, getLectureReviewsForPage } from '@/app/_helpers/serverLectureApi';
import type { ReviewSchema } from '@/app/_types/ReviewSchema';
import { getReviewViewerKey } from '@/app/_helpers/reviewViewerKey';

function calculateAverageRating(reviews: ReviewSchema[]) {
  if (reviews.length === 0) {
    return '0.0';
  }

  const averageRating =
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;

  return averageRating.toFixed(1);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The session does not depend on the public lecture fetch.
  const [lecture, session] = await Promise.all([
    getLectureForPage(id),
    getServerSession(authOptions),
  ]);

  if (!lecture) {
    notFound();
  }

  return (
    <Suspense key={id} fallback={
      <div className="min-h-screen bg-white">
        <div className="relative py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <LectureSummary
              lecture={lecture}
              lectureId={lecture.id}
              avgRating={(lecture.avg_rating ?? 0).toFixed(1)}
              reviewCount={lecture.review_count ?? 0}
              reviewsError={null}
              loading
            />
            <div
              role="status"
              className="max-w-6xl mx-auto py-16 text-center text-gray-600"
              style={{ minHeight: Math.max(384, Math.min(lecture.review_count ?? 0, 3) * 420) }}
            >
              レビューを読み込んでいます…
            </div>
          </div>
        </div>
      </div>
    }>
      <LectureWithReviews id={id} lecture={lecture} backendToken={session?.backendToken} />
    </Suspense>
  );
}

async function LectureWithReviews({ id, lecture, backendToken }: {
  id: string;
  lecture: LectureSchema;
  backendToken?: string | null;
}) {
  // Keep private reviews uncached; only this boundary waits for them.
  const [reviewViewerKey, reviewsResponse] = await Promise.all([
    getReviewViewerKey(backendToken),
    getLectureReviewsForPage(id, backendToken),
  ]);
  const reviews = reviewsResponse?.reviews ?? [];
  const access = reviewsResponse?.access ?? {
    restriction_enabled: false,
    access_granted: true,
  };
  const reviewsError = reviewsResponse
    ? null
    : 'レビューの取得に失敗しました。時間をおいて再度お試しください。';

  return (
    <LectureDetailClient
      key={`${lecture.id}:${reviewViewerKey}`}
      initialViewerKey={reviewViewerKey}
      lecture={lecture}
      lectureId={lecture.id}
      initialReviews={reviews}
      initialAccess={access}
      initialAvgRating={calculateAverageRating(reviews)}
      initialReviewsError={reviewsError}
    />
  );
}
