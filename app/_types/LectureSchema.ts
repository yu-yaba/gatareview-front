import { ReviewSchema } from "./ReviewSchema";

export type OfferingSlot = {
  day: number;
  period: number;
};

export type OfferingData = {
  id: number;
  year: number;
  term_label: string | null;
  term_numbers: number[];
  schedule_kind?: 'regular' | 'intensive' | 'other' | 'unknown';
  source_title?: string | null;
  source_lecturer?: string | null;
  slots: OfferingSlot[];
  syllabus_url: string;
  details?: {
    credits?: number | null;
    target_years?: number[] | null;
    campus?: string | null;
    language?: string | null;
    delivery_method?: string | null;
    subject_category?: string | null;
  } | null;
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
