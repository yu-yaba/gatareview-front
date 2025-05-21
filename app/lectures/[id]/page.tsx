'use client'
import ReactStars from 'react-stars'
import { handleAjaxError } from '../../_helpers/helpers';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import type { ReviewSchema } from '@/app/_types/ReviewSchema';
import Link from 'next/link';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import Loading from 'react-loading';


const LectureDetail = ({ params }: { params: { id: number } }) => {
  const [reviews, setReviews] = useState({ reviews: [], avgRating: "" });
  const [lecture, setLecture] = useState<LectureSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchLectureData = async () => {
      setIsLoading(true); // Set loading true at the beginning of fetch
      try {
        // eslint-disable-next-line no-undef
        // Note: Caching is set to 60 seconds. A newly submitted review might not be visible immediately on this page due to this policy.
        const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${params.id}`, { next: { revalidate: 60 } });
        if (!res.ok) throw Error(res.statusText);
        const data = await res.json(); // Assuming data is { ...lectureData, reviews: [...reviewDataArray], avg_rating: 4.5 }
        
        // Separate lecture data from reviews and avg_rating
        const { reviews: fetchedReviews, avg_rating: fetchedAvgRating, ...lectureData } = data;
        
        setLecture(lectureData);
        setReviews({ 
          reviews: fetchedReviews || [], // Ensure reviews is an array
          avgRating: fetchedAvgRating ? fetchedAvgRating.toString() : "0.0" // Ensure avgRating is a string
        });

      } catch (error) {
        handleAjaxError("授業詳細とレビューの取得に失敗しました");
        // Optionally, redirect to notFound or show a more specific error message
      } finally {
        setIsLoading(false); // Set loading false after fetch attempt (success or fail)
      }
    };
    fetchLectureData();
  }, [params.id]);

  if (!params.id) notFound();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading type={"bubbles"} width={200} height={500} color={"#1DBE67"} />
      </div>
    );
  }
  
  // Early return if lecture data is still null after loading is complete (e.g. fetch error)
  if (!lecture) {
    // This can happen if fetchLectureData fails and sets isLoading to false
    // but lecture remains null.
    // You might want to show an error message or redirect.
    // For now, returning null or a simple message.
    return <div className="text-center mt-10">授業データの読み込みに失敗しました。</div>;
  }

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