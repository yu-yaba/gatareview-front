import type { ReviewWithLecture } from './ReviewWithLecture';

export interface HomeLectureItem {
  id: number;
  title: string;
  lecturer: string;
  faculty: string;
  avg_rating: number;
  review_count: number;
}

export interface HomePageData {
  totalReviews: number | null;
  popularLectures: HomeLectureItem[];
  popularError: string | null;
  noReviewsLectures: HomeLectureItem[];
  noReviewsError: string | null;
  latestReviews: ReviewWithLecture[];
  latestReviewsError: string | null;
}
