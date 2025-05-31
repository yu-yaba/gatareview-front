import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../globals.css"
import Link from "next/link";
import ReactStars from "react-stars";
import { handleAjaxError } from '../_helpers/helpers';
import { useEffect, useState } from "react";
import { ReviewWithLecture } from "../_types/ReviewWithLecture";
import React from "react";


export default function BasicSlider() {
  const slideSettings = {
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
  };

  const [latestReviews, setLatestReviews] = useState<ReviewWithLecture[]>([]);

  useEffect(() => {
    const fetchLatestReviews = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/latest`);
        if (!response.ok) throw new Error('レスポンスエラー');
        const data = await response.json();

        setLatestReviews(data);
      } catch (error) {
        console.error('最新のレビューの取得中にエラーが発生しました:', error);
        handleAjaxError("最新のレビューを取得できません。");
      }
    };

    fetchLatestReviews();
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        breakpoints={slideSettings}
        slidesPerView={1}
        centeredSlides={true}
        speed={800}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        navigation={{
          enabled: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        style={{
          '--swiper-pagination-color': '#10b981',
          '--swiper-navigation-color': '#10b981',
          '--swiper-navigation-size': '24px',
          '--swiper-navigation-sides-offset': '8px',
          'paddingTop': '16px',
          'paddingBottom': '48px',
          '--swiper-pagination-bullet-size': '10px',
          '--swiper-pagination-bullet-inactive-color': '#d1d5db',
          'overflow': 'visible',
        } as React.CSSProperties}
        className="w-full !overflow-visible"
      >
        {latestReviews.map((review, reviewIndex) => (
          <SwiperSlide key={`review-${review.lecture.id}-${reviewIndex}`} className="!flex !justify-center !items-center">
            <div className="w-full max-w-xs mx-auto px-2">
              <div className="text-center mb-3">
                <span className="text-sm text-gray-500 font-medium">新着のレビュー</span>
              </div>
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
                      size={14}
                      edit={false}
                      half={true}
                      color1="#d1d5db"
                      color2="#fbbf24"
                    />
                  </div>

                  <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
                    {review.content}
                  </p>
                </div>
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}