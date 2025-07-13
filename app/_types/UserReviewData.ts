import type { ReviewSchema } from './ReviewSchema'

export interface UserReviewData extends ReviewSchema {
  lecture: {
    id: number;
    title: string;
    lecturer: string;
    faculty: string;
  };
  thanks_count: number;
}

export interface ReviewsApiResponse {
  reviews: UserReviewData[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
  statistics: {
    total_reviews: number;
    average_rating: number;
  };
}