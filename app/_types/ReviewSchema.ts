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
  user_id?: number;
}