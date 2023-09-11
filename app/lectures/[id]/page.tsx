'use client'
import PropTypes from 'prop-types';
import ReactStars from 'react-stars'
import Modal from 'react-modal';
import { pdfjs, Document, Page } from 'react-pdf';
import { handleAjaxError } from '../../helpers/helpers';
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { Suspense, useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { ReviewData } from '@/app/types/ReviewData';
import { ReviewSchema } from '@/app/types/ReviewSchema';
import Link from 'next/link';
import { LectureData } from '@/app/types/LectureData';
import { LectureSchema } from '@/app/types/LectureSchema';
import { ImageData } from '@/app/types/ImageData';

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
        const res = await fetch(`http://localhost:3000/api/v2/lectures/${params.id}`);
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
        const res = await fetch(`http://localhost:3000/api/v2/lectures/${params.id}/reviews`);
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
        const res = await fetch(`http://localhost:3000/api/v2/lectures/${params.id}/images`);
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
    <Suspense fallback='loading'>
      <div className='lectureContainer'>
        <div className='lectureHeader flex flex-wrap ...'>
          <h2 className='lectureTitle text-4xl ...'>
            {lecture?.title}
          </h2>
          <div className='rating'>
            <h2 className='lectureAvg'>{reviews.avgRating}</h2>
            <div className='titleStar'>
              <ReactStars value={reviews.avgRating} edit={false} size={30} className="star" />
            </div>
          </div>
          <ul className='lectureInfo flex flex-col ...'>
            <li>
              <strong>教員:</strong> {lecture?.lecturer}
            </li>
            <li>
              <strong>学部:</strong> {lecture?.faculty}
            </li>
          </ul>
        </div>
        <div className='modalCon'>
          <button type='button' onClick={openModal} style={{ color: imageCount === 0 ? 'red' : '#1DBE67' }}>過去問 ({imageCount})</button>
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
          <Link href={`/lectures/${params.id}/upload`} className='addReview'><button type='button'>過去問を投稿</button></Link>
        </div>

        <div className='lectureReview flex flex-wrap ...'>
          {reviews.reviews && reviews.reviews.map((review: ReviewSchema) => (
            <div key={review.id} className='reviewContainer flex flex-col ...'>
              <li className='eachReview'>
                <ReactStars
                  value={(review.rating)}
                  edit={false}
                />
                <p><strong>受講時期</strong> {review.period_year}, {review.period_term} </p>
                <p><strong>教科書</strong> {review.textbook}</p>
                <p><strong>出席確認</strong> {review.attendance}</p>
                <p><strong>採点方法</strong> {review.grading_type}</p>
                <p><strong>難易度</strong> {review.content_difficulty}</p>
                <p><strong>内容</strong> {review.content_quality}</p>
                <p><strong>コメント</strong> {review.content}</p>
              </li>
            </div>
          ))}
        </div>
        <div className='addButtonCon flex justify-center ...'>
          <Link href={`/lectures/${params.id}/new`} className='addReview'><button type='button' className='bg-green-500 text-white text-lg font-bold' >レビューする</button></Link>
        </div>
      </div>
    </Suspense>
  );
};



export default LectureDetail