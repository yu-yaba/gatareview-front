export type TimetableLecture = {
  id: number;
  title: string;
  lecturer: string;
  avg_rating: number;
  review_count: number;
  reviewed_by_me: boolean;
};

export type TimetableEntry = {
  id: number;
  year: number;
  term: number;
  day: number | null;
  period: number | null;
  lecture_offering_id: number | null;
  lecture_offering_status: 'active' | 'missing' | null;
  lecture: TimetableLecture;
};

export type TimetableData = {
  year: number;
  term: number;
  entries: TimetableEntry[];
  intensive_entries: TimetableEntry[];
  available_terms: number[];
  available_years: number[];
};

export type TimetablePlacement = {
  term: number;
  day?: number;
  period?: number;
};
