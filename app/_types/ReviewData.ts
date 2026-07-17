export type ReviewData = {
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
  academic_year?: number | null;
  term_code?: string | null;
  lecture_offering_id?: number | null;
}
