export interface BookmarkedLectureData {
  id: number;
  title: string;
  lecturer: string;
  faculty: string;
  bookmarked_at: string;
  review_count: number;
  avg_rating: number;
}

export interface BookmarksApiResponse {
  bookmarks: BookmarkedLectureData[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
  statistics: {
    total_bookmarks: number;
  };
}