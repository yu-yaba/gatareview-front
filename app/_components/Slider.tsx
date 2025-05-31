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
    0: {
      slidesPerView: 1.2,
      spaceBetween: 110,
    },
    768: {
      slidesPerView: 1.1,
      spaceBetween: 50,
    },
    1024: {
      slidesPerView: 1.5,
      spaceBetween: 210,
    },
    2560: {
      slidesPerView: 2,
      spaceBetween: 860,
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
    <div className="w-full max-w-7xl mx-auto px-4">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        breakpoints={slideSettings}
        slidesPerView={1}
        centeredSlides={true}
        speed={900}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        navigation
        pagination={{
          clickable: true,
        }}
        style={{
          '--swiper-pagination-color': '#1ebe67',
          '--swiper-navigation-color': '#1ebe67',
          '--swiper-navigation-sides-offset': '10px',
          'paddingTop': '30px',
          'paddingBottom': '40px',
          '--swiper-pagination-bullet-size': '13px',
          'minHeight': '250px',
        } as React.CSSProperties}
        className="w-full"
      >
        {latestReviews.map((review, reviewIndex) => (
          <SwiperSlide key={`review-${review.lecture.id}-${reviewIndex}`} className="flex justify-center items-center h-auto">
            <div className="w-full max-w-md flex flex-col justify-center">
              <h5 className="text-center text-xs md:text-base mb-2">新着のレビュー</h5>
              <Link
                href={`/lectures/${review.lecture.id}`}
                className='block w-full mt-2 md:mt-4 p-5 rounded-3xl bg-white border border-1 shadow-md hover:bg-green-100 hover:border-green-400 transform hover:scale-105 transition duration-150'
              >
                <div className="text-center">
                  <h5 className="text-xs">{review.lecture.title}</h5>
                  <p className="text-xs">{review.lecture.lecturer}</p>
                  <div className="flex justify-center">
                    <ReactStars value={review.rating} size={13} edit={false} half={true} />
                  </div>
                  <p className="text-xs break-all line-clamp-3">{review.content}</p>
                </div>
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}