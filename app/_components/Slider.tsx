import Image from "next/image";

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


const images = [
  "/gatareview_ogp.png",
];

export default function BasicSlider() {
  const slideSettings = {
    0: {
      slidesPerView: 1.2,
      spaceBetween: 90,
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
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      breakpoints={slideSettings} // slidesPerViewを指定
      slidesPerView={"auto"} // ハイドレーションエラー対策
      centeredSlides={true} // スライドを中央に配置
      speed={900} // スライドが切り替わる時の速度
      autoplay={{
        delay: 2000,
        disableOnInteraction: false,
      }} // スライド表示時間
      navigation // ナビゲーション（左右の矢印）
      pagination={{
        clickable: true,
      }}
      style={{
        '--swiper-pagination-color': '#1ebe67',
        '--swiper-navigation-color': '#1ebe67',
        '--swiper-navigation-sides-offset': '5px',
        'paddingBottom': '40px',
        'paddingTop': '40px',
        '--swiper-pagination-bullet-size': '13px',
      } as React.CSSProperties}
      className="flex justify-center items-center"
    >
      {images.map((src, index) => (
        <React.Fragment key={`image-${index}`}>
          <SwiperSlide className="flex justify-center items-center">
            <div className="flex justify-center items-center">
              <Image
                src={src}
                width={1920}
                height={1038}
                alt="icon"
                priority
                className="w-11/12 mt-4 h-auto md:w-8/12 md:h-7/12 flex justify-center items-center rounded-xl shadow-md hover:scale-105 transition duration-150"
              />
            </div>
          </SwiperSlide>
        </React.Fragment>
      ))}
      {latestReviews.map((review, reviewIndex) => (
        <SwiperSlide key={`review-${review.lecture.id}-${reviewIndex}`} className="flex justify-center items-center">
          <div className="">
            <h5 className="flex justify-center text-base mt-2">新着のレビュー</h5>
            <Link href={`/lectures/${review.lecture.id}`} className='mt-2 md:mt-6 xl:mt-10 p-5 rounded-3xl bg-white border border-1 shadow-md inline-block w-11/12 md:w-9/12 2xl:w-full hover:bg-green-100 hover:border-1 hover:border-green-400 transform hover:scale-105 transition duration-150'>
              <div className="text-center">
                <h5 className=" text-xs">{review.lecture.title}</h5>
                <p className=" text-xs">{review.lecture.lecturer}</p>
                <ReactStars value={review.rating} size={13} edit={false} half={true} className="flex justify-center" />
                <p className=" text-xs break-all line-clamp-3 md:line-clamp-5">{review.content}</p>
              </div>
            </Link>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>);
}