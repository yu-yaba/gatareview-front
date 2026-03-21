export type ReviewSchema = {
  id: number
  rating: number;
  content: string;
  lecture_id: number;
  textbook: string;
  attendance: string;
  grading_type: string;
  content_difficulty: string;
  content_quality: string;
  period_year: string;
  period_term: string;
  created_at: Date;
  updated_at: Date;
  user_id?: number | null;
  thanks_count?: number;
}

export interface ReviewAccessState {
  restriction_enabled: boolean;
  access_granted: boolean;
}

export interface LectureReviewsResponse {
  reviews: ReviewSchema[];
  access: ReviewAccessState;
}

// APIレスポンス型
export interface CreateReviewResponse {
  success: boolean;
  review?: ReviewSchema;
  errors?: string[];
  message?: string;
}
