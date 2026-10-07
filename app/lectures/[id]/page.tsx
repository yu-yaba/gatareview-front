import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

import LectureDetailClient from './LectureDetailClient';
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
  const lecture = await getLectureForPage(id);

  if (!lecture) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const reviewViewerKey = await getReviewViewerKey(session?.backendToken);
  const reviewsResponse = await getLectureReviewsForPage(id, session?.backendToken);
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
