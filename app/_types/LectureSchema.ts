import { ReviewSchema } from "./ReviewSchema";

export type OfferingSlot = {
  day: number;
  period: number;
};

export type OfferingData = {
  year: number;
  term_label: string | null;
  term_numbers: number[];
  slots: OfferingSlot[];
  syllabus_url: string;
};

export type LectureSchema = {
  avg_rating: number;
  id: number;
  title: string;
  lecturer: string;
  faculty: string;
  created_at: Date;
  updated_at: Date;
  reviews?: ReviewSchema[];
  review_count: number;
  offering: OfferingData | null;
}
