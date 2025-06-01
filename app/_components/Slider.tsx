import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../globals.css";
import Link from "next/link";
import ReactStars from "react-stars";
import { handleAjaxError } from '../_helpers/helpers';
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { ReviewWithLecture } from "../_types/ReviewWithLecture";
import React from "react";

// ========================================
// Type Definitions
// ========================================
interface SwiperBreakpoint {
  readonly slidesPerView: number;
  readonly spaceBetween: number;
}

interface SwiperBreakpoints {
  readonly [key: number]: SwiperBreakpoint;
  readonly [key: string]: SwiperBreakpoint;
}

interface SwiperStyleConfig {
  readonly '--swiper-pagination-color': string;
  readonly '--swiper-navigation-color': string;
  readonly '--swiper-navigation-size': string;
  readonly '--swiper-navigation-sides-offset': string;
  readonly 'paddingTop': string;
  readonly 'paddingBottom': string;
  readonly '--swiper-pagination-bullet-size': string;
  readonly '--swiper-pagination-bullet-inactive-color': string;
  readonly 'overflow': string;
}

// ========================================
// Constants
// ========================================
const SWIPER_CONFIG = {
  AUTOPLAY_DELAY: 3000,
  TRANSITION_SPEED: 800,
  DISABLE_ON_INTERACTION: false
} as const;

const SWIPER_BREAKPOINTS = {
  320: {
    slidesPerView: 1,
    spaceBetween: 16,
  },
  480: {
    slidesPerView: 1,
    spaceBetween: 20,
  },
  768: {
    slidesPerView: 1,
    spaceBetween: 24,
  },
  1024: {
    slidesPerView: 1.2,
    spaceBetween: 32,
  },
  1280: {
    slidesPerView: 1.4,
    spaceBetween: 40,
  }
} as const;

const SWIPER_STYLES: SwiperStyleConfig & React.CSSProperties = {
  '--swiper-pagination-color': '#10b981',
  '--swiper-navigation-color': '#10b981',
  '--swiper-navigation-size': '24px',
  '--swiper-navigation-sides-offset': '8px',
  'paddingTop': '16px',
  'paddingBottom': '48px',
  '--swiper-pagination-bullet-size': '10px',
  '--swiper-pagination-bullet-inactive-color': '#d1d5db',
  'overflow': 'visible',
} as const;

const RATING_CONFIG = {
  SIZE: 14,
  EDIT: false,
  HALF: true,
  INACTIVE_COLOR: '#d1d5db',
  ACTIVE_COLOR: '#fbbf24'
} as const;

// ========================================
// Custom Hooks
// ========================================
const useLatestReviews = () => {
  const [latestReviews, setLatestReviews] = useState<ReviewWithLecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/latest`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }

      setLatestReviews(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('最新のレビューの取得中にエラーが発生しました:', error);
      setError(errorMessage);
      handleAjaxError("最新のレビューを取得できません。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestReviews();
  }, [fetchLatestReviews]);

  return {
    latestReviews,
    loading,
    error,
    refetch: fetchLatestReviews
  };
};

// ========================================
// Component Definitions
// ========================================
interface ReviewSlideProps {
  readonly review: ReviewWithLecture;
  readonly reviewIndex: number;
}

const ReviewSlide = memo<ReviewSlideProps>(({ review, reviewIndex }) => {
  const slideKey = useMemo(() =>
    `review-${review.lecture.id}-${reviewIndex}`,
    [review.lecture.id, reviewIndex]
  );

  return (
    <SwiperSlide key={slideKey} className="!flex !justify-center !items-center">
      <div className="w-full max-w-xs mx-auto mb-9">
        <Link
          href={`/lectures/${review.lecture.id}`}
          className="block w-full bg-white rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl p-5 transition-all duration-300 hover:scale-[1.03] hover:border-green-400 hover:bg-gradient-to-br hover:from-green-50 hover:to-white"
        >
          <div className="text-center space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">
                {review.lecture.title}
              </h3>
              <p className="text-xs text-gray-600">{review.lecture.lecturer}</p>
            </div>

            <div className="flex justify-center">
              <ReactStars
                value={review.rating}
                size={RATING_CONFIG.SIZE}
                edit={RATING_CONFIG.EDIT}
                half={RATING_CONFIG.HALF}
                color1={RATING_CONFIG.INACTIVE_COLOR}
                color2={RATING_CONFIG.ACTIVE_COLOR}
              />
            </div>

            <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
              {review.content}
            </p>
          </div>
        </Link>
      </div>
    </SwiperSlide>
  );
});

ReviewSlide.displayName = 'ReviewSlide';

interface LoadingSlideProps {
  readonly count?: number;
}

const LoadingSlide = memo<LoadingSlideProps>(({ count = 3 }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <SwiperSlide key={`loading-${index}`} className="!flex !justify-center !items-center">
        <div className="w-full max-w-xs mx-auto px-2">
          <div className="text-center mb-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-5">
            <div className="text-center space-y-3">
              <div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
              </div>
              <div className="flex justify-center space-x-1">
                {Array.from({ length: 5 }, (_, starIndex) => (
                  <div key={starIndex} className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-4/6 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </SwiperSlide>
    ))}
  </>
));

LoadingSlide.displayName = 'LoadingSlide';

interface ErrorSlideProps {
  readonly error: string;
  readonly onRetry: () => void;
}

const ErrorSlide = memo<ErrorSlideProps>(({ error, onRetry }) => (
  <SwiperSlide className="!flex !justify-center !items-center">
    <div className="w-full max-w-xs mx-auto px-2">
      <div className="bg-white rounded-3xl border border-red-200 shadow-lg p-5 text-center">
        <div className="text-red-500 mb-3">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          レビューの読み込みに失敗しました
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-green-500 text-white text-sm rounded-xl hover:bg-green-600 transition-colors duration-200"
        >
          再試行
        </button>
      </div>
    </div>
  </SwiperSlide>
));

ErrorSlide.displayName = 'ErrorSlide';

// ========================================
// Main Component
// ========================================
const BasicSlider = memo(() => {
  const { latestReviews, loading, error, refetch } = useLatestReviews();

  const renderSlides = useMemo(() => {
    if (loading) {
      return <LoadingSlide count={3} />;
    }

    if (error || latestReviews.length === 0) {
      return <ErrorSlide error={error || 'No reviews found'} onRetry={refetch} />;
    }

    return latestReviews.map((review, reviewIndex) => (
      <ReviewSlide
        key={`review-${review.lecture.id}-${reviewIndex}`}
        review={review}
        reviewIndex={reviewIndex}
      />
    ));
  }, [latestReviews, loading, error, refetch]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        breakpoints={SWIPER_BREAKPOINTS}
        slidesPerView={1}
        centeredSlides={true}
        speed={SWIPER_CONFIG.TRANSITION_SPEED}
        autoplay={{
          delay: SWIPER_CONFIG.AUTOPLAY_DELAY,
          disableOnInteraction: SWIPER_CONFIG.DISABLE_ON_INTERACTION,
        }}
        navigation={{
          enabled: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        style={SWIPER_STYLES}
        className="w-full !overflow-visible"
      >
        {renderSlides}
      </Swiper>
    </div>
  );
});

BasicSlider.displayName = 'BasicSlider';

export default BasicSlider;