import { useState, useEffect } from 'react';

export interface LectureItem {
  id: number;
  title: string;
  lecturer: string;
  faculty: string;
  reviews_count: number;
  average_rating: number;
}

export interface ReviewItem {
  id: number;
  content: string;
  rating: number;
  created_at: string;
  lecture: {
    id: number;
    title: string;
    lecturer: string;
  };
}

interface ApiResponse<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

// Generic API fetch hook
const useApiData = <T>(url: string, defaultValue: T): ApiResponse<T> => {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fullUrl = `${process.env.NEXT_PUBLIC_ENV}${url}`;
        console.log(`Fetching data from: ${fullUrl}`);

        const response = await fetch(fullUrl);
        console.log(`Response status for ${url}:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response for ${url}:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();
        console.log(`Data for ${url}:`, responseData);

        // Handle different response structures
        if (responseData.lectures && Array.isArray(responseData.lectures)) {
          setData(responseData.lectures as T);
        } else if (responseData.reviews && Array.isArray(responseData.reviews)) {
          setData(responseData.reviews as T);
        } else if (Array.isArray(responseData)) {
          setData(responseData as T);
        } else {
          console.warn(`Invalid data structure for ${url}:`, responseData);
          setData(defaultValue);
        }
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setData(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, defaultValue]);

  return { data, loading, error };
};

// Specific hooks using the generic hook
export const usePopularLectures = () => 
  useApiData<LectureItem[]>('/api/v1/lectures/popular', []);

export const useNoReviewsLectures = () => 
  useApiData<LectureItem[]>('/api/v1/lectures/no_reviews', []);

export const useLatestReviews = () => 
  useApiData<ReviewItem[]>('/api/v1/reviews/latest', []);

export const useTotalReviews = () => {
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/total`;
        console.log('Fetching total reviews from:', url);

        const response = await fetch(url);
        console.log('Total reviews response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Total reviews error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Total reviews data:', data);

        if (typeof data.total === 'number') {
          setTotalReviews(data.total);
        } else {
          console.warn('Invalid total reviews data structure:', data);
          setTotalReviews(0);
        }
      } catch (error) {
        console.error('Failed to fetch total reviews:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setTotalReviews(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalReviews();
  }, []);

  return { totalReviews, loading, error };
};