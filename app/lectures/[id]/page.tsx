'use client'
import ReactStars from 'react-stars'
import Modal from 'react-modal';
import { pdfjs, Document, Page } from 'react-pdf';
import { handleAjaxError } from '../../_helpers/helpers';
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import type { ReviewSchema } from '@/app/_types/ReviewSchema';
import Link from 'next/link';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import type { ImageData } from '@/app/_types/ImageData';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;


const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    marginTop: '7%',
    transform: 'translate(-50%, -50%)'
  }
};


const LectureDetail = ({ params }: { params: { id: number } }) => {
  const [reviews, setReviews] = useState({ reviews: [], avgRating: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [lecture, setLecture] = useState<LectureSchema | null>(null)


  useEffect(() => {
    const fetchLectureDetail = async () => {
      try {
        // eslint-disable-next-line no-undef
        const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v2/lectures/${params.id}`);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v2/lectures/${params.id}/reviews`);
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

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v2/lectures/${params.id}/images`);
        if (!res.ok) {
          console.error('レスポンスオブジェクト:', res);
          throw new Error('Not Found');
        }
        const data = await res.json();
        // データを使って何かする
      } catch (error) {
        console.error('フェッチに失敗:', error);
      }
    }

    fetchImages();
  }, []);

  const openModal = () => {
    if (imageCount === 0) {
      handleAjaxError("過去問はありません");
      return;
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };




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
      <div className='flex justify-center mt-8'>
        <div className='flex flex-wrap justify-center items-center w-8/12 md:w-7/12 2xl:w-5/12 text-lg text-center font-bold border border-1 py-4 rounded-2xl shadow-inner bg-slate-50 p-6'>
          <button type='button'
            style={{ color: imageCount === 0 ? 'red' : '#1DBE67' }}
            className='border border-2 px-4 py-3 rounded-lg bg-white w-full md:w-5/12 md:mr-4 transform hover:scale-105 transition  duration-150'>
            過去問 ({imageCount})
          </button>
          <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            style={customStyles}
            contentLabel="Example Modal"
          >
            <button type='button' className='closeButton' onClick={closeModal}>×</button>
            <div className='imageContainer'>
              {images.map(image => {
                console.log(image);
                if (image.type && image.type.startsWith('image/')) {
                  return <a key={image.url} href={image.url} target='_blank' rel="noopener noreferrer">
                    <img src={image.url} alt="過去問" />
                  </a>;
                } if (image.type && image.type === 'application/pdf') {
                  return <a key={image.url} href={image.url} target='_blank' rel="noopener noreferrer">
                    <div className="pdfContainer">
                      <Document file={image.url} key={image.url}>
                        <Page pageNumber={1} scale={0.3} renderTextLayer={false} />
                      </Document>
                    </div>
                  </a>
                    ;
                }
                return null;
              })}
            </div>
          </Modal>
          {/* <Link href={`/lectures/${params.id}/upload`} className='md:ml-4 mt-4 md:mt-0 w-full md:w-5/12 border border-2 px-4 py-3 rounded-lg bg-white transform hover:scale-105 transition  duration-150'> */}
          <button type='button' className='md:ml-4 mt-4 md:mt-0 w-full md:w-5/12 border border-2 px-4 py-3 rounded-lg bg-white transform hover:scale-105 transition  duration-150'>過去問を投稿</button>
          {/* </Link> */}
        </div>
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
                    <td className=' pt-4'>{review.content}</td>
                  </tr>
                </tbody>
              </table>
            </li>
          </div>
        ))}
      </div>
      <div className='flex justify-center ...'>
        <Link href={`/lectures/${params.id}/new`}><button type='button' className='bg-green-500 text-white text-lg font-bold py-3 px-6 rounded-lg mt-4 hover:scale-105 transition  duration-150' >レビューする</button></Link>
      </div>
    </div>
  );
};



export default LectureDetail