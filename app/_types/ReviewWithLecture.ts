export type ReviewWithLecture = {
  id: number;
  content: string;
  rating: number;
  lecture: {
    id: number;
    title: string;
    lecturer: string;
    faculty: string;
    avg_rating?: number;
  };
}