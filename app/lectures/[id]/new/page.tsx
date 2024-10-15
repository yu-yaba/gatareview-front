'use client';

import { useState } from 'react';
import ReactStars from 'react-stars';
import { isEmptyObject, validateReview } from '../../../_helpers/helpers';
import Link from 'next/link';
import { success } from '@/app/_helpers/notifications';
import { handleAjaxError } from '../../../_helpers/helpers';
import type { ReviewData } from '@/app/_types/ReviewData';
import { useRouter } from 'next/navigation';

const ReviewForm = ({ params }: { params: { id: number } }) => {
  const [review, setReview] = useState<ReviewData>({
    lecture_id: params.id,
    rating: 3,
    period_year: '',
    period_term: '',
    textbook: '',
    attendance: '',
    grading_type: '',
    content_difficulty: '',
    content_quality: '',
    content: '',
  });
  const router = useRouter();

  const updateReview = (name: string, value: string) => {
    setReview((prevReview) => ({ ...prevReview, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { target } = e;
    const { name, value } = target;
    updateReview(name, value);
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const renderErrors = () => {
    if (isEmptyObject(formErrors)) {
      return null;
    }

    return (
      <div className="flex justify-center">
        <div className="text-red-500">
          <h3 className='font-bold text-lg'>※</h3>
          <ul className="list-none ml-4">
            {Object.values(formErrors).map((formError, index) => (
              <li key={index}>{formError}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  const addReview = async (newReview: ReviewData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${params.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ review: newReview }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw Error(res.statusText);
      success('レビューを登録しました');
      router.push(`/lectures/${params.id}`);
    } catch (error) {
      handleAjaxError("レビューの登録に失敗しました");
    }
  };


  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateReview(review); // errorsにエラーメッセージを格納

    if (!isEmptyObject(errors)) { // errorsが空でない場合はエラーメッセージを表示
      setFormErrors(errors);
    } else {
      addReview({ ...review, lecture_id: params.id, rating: value } as unknown as ReviewData);
    }
  };

  const cancelURL = `/lectures/${params.id}`;
  const [value, setvalue] = useState(3);

  const starOnChange = (newValue: number) => {
    setvalue(newValue);
    setReview({ ...review, rating: newValue });
  };


  return (
    <section className="flex flex-col items-center p-8">
      <h2 className="text-2xl font-bold mb-4 2xl:text-4xl">授業レビューを投稿する</h2>
      {renderErrors()}
      <form onSubmit={handleSubmit} className="flex flex-col w-10/12  md:w-8/12 2xl:w-5/12">
        <div className="mb-8 flex flex-col">
          <label htmlFor="rating" className="block text-bold">
            <p className="font-bold mb-2">評価</p>
            <div className="p-2 pl-5 w-full border rounded-md shadow">
              <ReactStars onChange={starOnChange} size={25} value={review.rating} edit={true} />
            </div>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">授業を受けた年</p>
            <div className="flex relative w-full text-gray-600">
              <select
                id="period_year"
                name="period_year"
                value={review.period_year}
                onChange={handleInputChange}
                className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500">
                <option>選択してください</option>
                <option>2023</option>
                <option>2022</option>
                <option>2021</option>
                <option>2020</option>
                <option>その他・不明</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                </svg>
              </div>
            </div>
            <p className="font-bold mb-2 mt-8">ターム</p>
            <div className="flex relative w-full text-gray-600">
              <select
                id="period_term"
                name="period_term"
                onChange={handleInputChange}
                value={review.period_term}
                className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 ">
                <option>選択してください</option>
                <option>1ターム</option>
                <option>2ターム</option>
                <option>1, 2ターム</option>
                <option>3ターム</option>
                <option>4ターム</option>
                <option>3, 4ターム</option>
                <option>その他・不明</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                </svg>
              </div>
            </div>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">教科書</p>
            <div className="flex relative w-full text-gray-600">
              <select
                id="textbook"
                name="textbook"
                value={review.textbook}
                onChange={handleInputChange}
                className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 ">
                <option>選択してください</option>
                <option>必要</option>
                <option>不要</option>
                <option>その他・不明</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                </svg>
              </div>
            </div>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">出席確認</p>
            <div className="flex relative w-full text-gray-600">
              <select
                id="attendance"
                name="attendance"
                value={review.attendance}
                onChange={handleInputChange}
                className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 ">
                <option>選択してください</option>
                <option>毎回確認</option>
                <option>たまに確認</option>
                <option>なし</option>
                <option>その他・不明</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                </svg>
              </div>
            </div>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">採点方法</p>
            <div className="flex relative w-full text-gray-600">
              <select
                id="grading_type"
                name="grading_type"
                onChange={handleInputChange}
                value={review.grading_type}
                className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 ">
                <option>選択してください</option>
                <option>テストのみ</option>
                <option>レポートのみ</option>
                <option>テスト,レポート</option>
                <option>その他・不明</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                </svg>
              </div>
            </div>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">単位取得難易度</p>
            <div className="flex relative w-full text-gray-600">
              <select
                id="content_difficulty"
                name="content_difficulty"
                onChange={handleInputChange}
                value={review.content_difficulty}
                className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 ">
                <option>選択してください</option>
                <option>とても楽</option>
                <option>楽</option>
                <option>普通</option>
                <option>難</option>
                <option>とても難しい</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                </svg>
              </div>
            </div>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">内容充実度</p>
            <div className="flex relative w-full text-gray-600">
              <select
                id="content_quality"
                name="content_quality"
                onChange={handleInputChange}
                value={review.content_quality}
                className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 ">
                <option>選択してください</option>
                <option>とても良い</option>
                <option>良い</option>
                <option>普通</option>
                <option>悪い</option>
                <option>とても悪い</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                </svg>
              </div>
            </div>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label htmlFor="content" className="block text-bold">
            <p className="font-bold mb-2">コメント</p>
            <textarea cols={30} rows={5} id="content" name="content" className="mt-2 p-2 w-full border rounded-md shadow focus:border-green-500" onChange={handleInputChange} value={review.content} />
          </label>
        </div>
        <div className="flex justify-center mt-6">
          <button type="submit"
            className="p-2 rounded-lg font-bold text-white w-3/12 mr-8 bg-green-500 hover:bg-green-600  focus:ring-2 focus:ring-green-600 focus:ring-opacity-50">
            投稿
          </button>
          <Link href={cancelURL}>
            <button type='button' className='p-2 px-4 rounded-lg shadow border-2 bg-white text-green-500'>
              キャンセル
            </button>
          </Link>
        </div>
      </form>
    </section >
  );
};

export default ReviewForm;

