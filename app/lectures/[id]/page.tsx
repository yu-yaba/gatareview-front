'use client'
import ReactStars from 'react-stars'
import { handleAjaxError } from '../../_helpers/helpers';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import type { ReviewSchema } from '@/app/_types/ReviewSchema';
import Link from 'next/link';
import type { LectureSchema } from '@/app/_types/LectureSchema';


const LectureDetail = ({ params }: { params: { id: number } }) => {
  const [reviews, setReviews] = useState({ reviews: [], avgRating: "" });
  const [lecture, setLecture] = useState<LectureSchema | null>(null)


  useEffect(() => {
    const fetchLectureDetail = async () => {
      try {
        // eslint-disable-next-line no-undef
        const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${params.id}`);
        if (!res.ok) throw Error(res.statusText);
        const data = await res.json();
        console.log(data)
        setLecture(data)
      } catch (error) {
        handleAjaxError("授業の取得に失敗しました");
      }
    };
    fetchLectureDetail()
  }, []);


  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // eslint-disable-next-line no-undef
        const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${params.id}/reviews`);
        if (!res.ok) throw Error(res.statusText);
        const data = await res.json();
        let avgRating = "0.0";
        if (data.length > 0) {
          avgRating = (data.reduce((total: number, review: ReviewSchema) => total + review.rating, 0) / data.length).toFixed(1);
        }
        setReviews({ reviews: data, avgRating });
      } catch (error) {
        handleAjaxError("レビューの取得に失敗しました");
      }
    };
    fetchReviews();
  }, []);



  if (!params.id) notFound();

  return (
    <div className=''>
      <div className='flex justify-center'>
        <div className='flex flex-wrap items-center rounded-3xl border border-1 shadow-md w-10/12 2xl:w-8/12 py-6 px-4'>
          <h2 className='inline-block w-full md:w-5/12  font-bold  text-3xl my-1 text-center'>
            {lecture?.title}
          </h2>
          <ul className='w-full mt-4 md:mt-0 md:w-3/12 flex flex-col text-center'>
            <li>
              <strong>教員:</strong> {lecture?.lecturer}
            </li>
            <li>
              <strong>学部:</strong> {lecture?.faculty}
            </li>
          </ul>
          <div className='flex flex-row justify-center w-full md:w-4/12 items-center mt-4 md:mt-0'>
            <h2 className='mr-2 font-bold text-2xl text-yellow-400'>{reviews.avgRating}</h2>
            <div className='titleStar'>
              <ReactStars value={parseFloat(reviews.avgRating)} edit={false} size={30} className="star" />
            </div>
          </div>
        </div>
      </div>
      <div className='flex mt-4 justify-center'>
        <Link href={`/lectures/${params.id}/new`}><button type='button' className='bg-green-500 text-white text-lg font-bold py-3 px-6 rounded-lg mt-4 hover:scale-105 transition  duration-150' >レビューする</button></Link>
      </div>
      <div className=' flex justify-center items-center flex-col mt-6'>
        {reviews.reviews && reviews.reviews.map((review: ReviewSchema) => (
          <div key={review.id} className='m-3 p-6 rounded-3xl bg-white border border-1 shadow-md inline-block w-11/12 2xl:w-6/12'>
            <li className=' list-none'>
              <ReactStars
                value={(review.rating)}
                edit={false}
                size={20}
                className=' mb-2'
              />
              <table className="table-fixed text-left border-collapse">
                <tbody>
                  <tr>
                    <td className='w-24 pb-2'><strong>受講時期</strong></td>
                    <td className=' pb-2'>{review.period_year}, {review.period_term}</td>
                  </tr>
                  <tr>
                    <td className='w-24 pb-2'><strong>教科書</strong></td>
                    <td className=' pb-2'>{review.textbook}</td>
                  </tr>
                  <tr>
                    <td className='w-24 pb-2'><strong>出席確認</strong></td>
                    <td className=' pb-2'>{review.attendance}</td>
                  </tr>
                  <tr>
                    <td className='w-24 pb-2'><strong>採点方法</strong></td>
                    <td className=' pb-2'>{review.grading_type}</td>
                  </tr>
                  <tr>
                    <td className='w-24 pb-2'><strong>難易度</strong></td>
                    <td className=' pb-2'>{review.content_difficulty}</td>
                  </tr>
                  <tr>
                    <td className='w-24 pb-2'><strong>内容</strong></td>
                    <td className=' pb-2'>{review.content_quality}</td>
                  </tr>
                  <tr>
                    <td className='w-24 pt-4'><strong>コメント</strong></td>
                    <td className=' pt-4 break-all'>{review.content}</td>
                  </tr>
                </tbody>
              </table>
            </li>
          </div>
        ))}
      </div>
    </div>
  );
};



export default LectureDetail