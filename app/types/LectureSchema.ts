import { ReviewSchema } from "./ReviewSchema";

export type LectureSchema = {
  avg_rating: number;
  id: number;
  title: string;
  lecturer: string;
  faculty: string;
  created_at: Date;
  updated_at: Date;
  reviews: ReviewSchema[];
}