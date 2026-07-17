import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

import LectureDetailClient from './LectureDetailClient';
import { authOptions } from '@/app/_helpers/authOptions';
import { getLectureForPage, getLectureReviewsForPage } from '@/app/_helpers/serverLectureApi';
import type { ReviewSchema } from '@/app/_types/ReviewSchema';

function calculateAverageRating(reviews: ReviewSchema[]) {
  if (reviews.length === 0) {
    return '0.0';
  }

  const averageRating =
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;

  return averageRating.toFixed(1);
}

type PageProps = {
  params: { id: string };
  searchParams?: { offering_id?: string | string[] };
};

export default async function Page({ params, searchParams }: PageProps) {
  const offeringParam = searchParams?.offering_id;
  let offeringId: number | undefined;
  if (offeringParam !== undefined) {
    const rawOfferingId = Array.isArray(offeringParam) && offeringParam.length === 1
      ? offeringParam[0]
      : Array.isArray(offeringParam)
        ? null
        : offeringParam;
    const parsedOfferingId = rawOfferingId && /^[1-9]\d*$/.test(rawOfferingId)
      ? Number(rawOfferingId)
      : Number.NaN;
    if (!Number.isSafeInteger(parsedOfferingId)) notFound();
    offeringId = parsedOfferingId;
  }
  const lecture = await getLectureForPage(params.id, offeringId);

  if (!lecture) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const reviewsResponse = await getLectureReviewsForPage(params.id, session?.backendToken);
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
      lecture={lecture}
      lectureId={lecture.id}
      initialReviews={reviews}
      initialAccess={access}
      initialAvgRating={calculateAverageRating(reviews)}
      initialReviewsError={reviewsError}
    />
  );
}
