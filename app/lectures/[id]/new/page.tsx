'use client'
import { useState } from 'react';
import ReactStars from 'react-stars'
import { isEmptyObject, validateReview } from '../../../helpers/helpers';
import Link from 'next/link';
import { success } from '@/app/helpers/notifications';
import { handleAjaxError } from '../../../helpers/helpers';
import { ReviewData } from '@/app/types/ReviewData';
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
  const router = useRouter()

  const updateReview = (name: string, value: string) => {
    setReview((prevReview) => ({ ...prevReview, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { target } = e;
    const { name } = target;
    const { value } = target;

    updateReview(name, value);
  };

  const [formErrors, setFormErrors] = useState({});

  const renderErrors = () => {
    if (isEmptyObject(formErrors)) {
      return null;
    }

    return (
      <div className="flex justify-center">
        <div className=" text-red-500 ">
          <h3>空欄があります</h3>
          <ul className=" list-disc">
            {((Object.values(formErrors) as unknown) as string[]).map((formError, index) => (
              <li key={index}>{formError}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  const addReview = async (newReview: ReviewData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v2/lectures/${params.id}/reviews`, {
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
            <select className='w-full border rounded-md shadow p-3'
              id="period_year" name="period_year" onChange={handleInputChange} value={review.period_year}>
              <option>選択してください</option>
              <option>2023</option>
              <option>2022</option>
              <option>2021</option>
              <option>2020</option>
              <option>その他・不明</option>
            </select>
            <p className="font-bold mb-2 mt-8">ターム</p>
            <select className='w-full border rounded-md shadow p-3'
              id="period_term" name="period_term" onChange={handleInputChange} value={review.period_term}>
              <option>選択してください</option>
              <option>1ターム</option>
              <option>2ターム</option>
              <option>1, 2ターム</option>
              <option>3ターム</option>
              <option>4ターム</option>
              <option>3, 4ターム</option>
              <option>その他・不明</option>
            </select>      </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">教科書</p>
            <select className='w-full border rounded-md shadow p-3'
              id="textbook" name="textbook" onChange={handleInputChange} value={review.textbook}>
              <option>選択してください</option>
              <option>必要</option>
              <option>不要</option>
              <option>その他・不明</option>
            </select>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">出席確認</p>
            <select className='w-full border rounded-md shadow p-3'
              id="attendance" name="attendance" onChange={handleInputChange} value={review.attendance}>
              <option>選択してください</option>
              <option>毎回確認</option>
              <option>たまに確認</option>
              <option>なし</option>
              <option>その他・不明</option>
            </select>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">採点方法</p>
            <select className='w-full border rounded-md shadow p-3'
              id="grading_type" name="grading_type" onChange={handleInputChange} value={review.grading_type}>
              <option>選択してください</option>
              <option>テストのみ</option>
              <option>レポートのみ</option>
              <option>テスト,レポート</option>
              <option>その他・不明</option>
            </select>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">単位取得難易度</p>
            <select className='w-full border rounded-md shadow p-3'
              id='content_difficulty' name='content_difficulty' onChange={handleInputChange} value={review.content_difficulty}>
              <option>選択してください</option>
              <option>とても楽</option>
              <option>楽</option>
              <option>普通</option>
              <option>難</option>
              <option>とても難しい</option>
            </select>
          </label>
        </div>
        <div className="mb-8 flex flex-col">
          <label className="block text-bold">
            <p className="font-bold mb-2">内容充実度</p>
            <select className='w-full border rounded-md shadow p-3'
              id='content_quality' name='content_quality' onChange={handleInputChange} value={review.content_quality}>
              <option>選択してください</option>
              <option>とても良い</option>
              <option>良い</option>
              <option>普通</option>
              <option>悪い</option>
              <option>とても悪い</option>
            </select>
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
            className="p-2 rounded-lg font-bold text-white w-3/12 mr-8 bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50">
            投稿
          </button>
          <Link href={cancelURL}>
            <button type='button' className='p-2 rounded-lg shadow border-2 bg-white text-green-500'>
              キャンセル
            </button>
          </Link>
        </div>
      </form>
    </section>
  );
};

export default ReviewForm;

