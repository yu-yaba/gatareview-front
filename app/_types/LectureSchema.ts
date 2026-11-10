import { ReviewSchema } from "./ReviewSchema";

export type LectureSchema = {
  avg_rating: number;
  id: number;
  title: string;
  lecturer: string;
  faculty: string;
  reviews?: ReviewSchema[];
  review_count: number;
}