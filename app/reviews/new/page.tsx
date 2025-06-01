'use client';

import { useState, useEffect, useRef, useCallback } from 'react'; // useCallback をインポート
import ReactStars from 'react-stars';
import { isEmptyObject, validateReview, handleAjaxError } from '../../_helpers/helpers';
import Link from 'next/link';
import { success } from '@/app/_helpers/notifications';
import type { ReviewData } from '@/app/_types/ReviewData';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Loading from 'react-loading';
import { debounce } from 'lodash'; // debounce をインポート

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const NewReviewPage = () => {
  const [selectedLecture, setSelectedLecture] = useState<LectureSchema | null>(null);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [searchWord, setSearchWord] = useState('');
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [ratingValue, setRatingValue] = useState(3);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures`);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        setFetchedLectures(data);
      } catch (error) {
        handleAjaxError("授業リストの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLectures();
  }, []);

  const debouncedUpdateSearchWord = useCallback(
    debounce((value: string) => {
      setSearchWord(value);
    }, 300), // 300msの遅延
    []
  );

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedUpdateSearchWord(e.target.value);
  };

  const matchSearchWord = (lecture: LectureSchema) => {
    if (!searchWord) return true; // 検索語がない場合はすべて表示
    const { id, created_at, updated_at, avg_rating, reviews, ...rest } = lecture; // 検索対象外のフィールドを除外
    return Object.values(rest).some((value) => {
      // value が null または undefined の場合は空文字列として扱い、それ以外の場合は toString() を呼び出す
      let stringValue = '';
      if (value !== null && typeof value !== 'undefined') {
        stringValue = value.toString();
      }
      return stringValue.toLowerCase().includes(searchWord.toLowerCase());
    });
  };

  const handleLectureSelect = (lecture: LectureSchema) => {
    setSelectedLecture(lecture);
    setReview({
      lecture_id: lecture.id,
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
    setRatingValue(3);
    setFormErrors({}); // 以前のエラーをクリア
  };

  // レビューフォームのロジック (lectures/[id]/new/page.tsx から流用)
  const updateReview = (name: string, value: string | number) => {
    if (!review) return;
    setReview((prevReview) => ({ ...prevReview!, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateReview(name, value);
  };

  const starOnChange = (newValue: number) => {
    setRatingValue(newValue);
    updateReview('rating', newValue);
  };

  const renderErrors = () => {
    if (isEmptyObject(formErrors)) {
      return null;
    }
    return (
      <div className="flex justify-center my-4">
        <div className="text-red-500">
          <h3 className='font-bold text-lg'>※入力内容に誤りがあります</h3>
          <ul className="list-none ml-4">
            {Object.values(formErrors).map((formError, index) => (
              <li key={index}>{formError}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const addReview = async (newReview: ReviewData, token: string) => {
    if (!selectedLecture) return;
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${selectedLecture.id}/reviews`, {
        review: newReview,
        token,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.data.success) {
        success('レビューを登録しました');
        router.push(`/lectures/${selectedLecture.id}`);
      } else {
        handleAjaxError(res.data.message || "reCAPTCHA認証に失敗しました");
      }
    } catch (error) {
      handleAjaxError("レビューの登録に失敗しました");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!review) return;

    const errors = validateReview(review);
    if (!isEmptyObject(errors)) {
      setFormErrors(errors);
    } else {
      if (!window.grecaptcha) {
        setFormErrors({ recaptcha: 'reCAPTCHAが読み込まれていません。ページをリロードしてください。' });
        return;
      }
      try {
        const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
        const token = await window.grecaptcha.execute(SITE_KEY, { action: 'submit' });
        addReview(review, token);
      } catch (error) {
        handleAjaxError("reCAPTCHAの取得に失敗しました");
        setFormErrors({ recaptcha: 'reCAPTCHAの検証に失敗しました。' });
      }
    }
  };

  const cancelReview = () => {
    setSelectedLecture(null);
    setReview(null);
    setFormErrors({});
  };

  const filteredLectures = fetchedLectures.filter(matchSearchWord);

  return (
    <section className="flex flex-col items-center p-4 md:p-8">
      {!selectedLecture ? (
        <>
          <h2 className="text-2xl font-bold mb-4 2xl:text-4xl">レビューする授業を選択</h2>
          <div className="w-10/12 md:w-8/12 2xl:w-6/12 mb-6">
            <input
              type="text"
              ref={searchInput}
              defaultValue={searchWord} // 初期値はdefaultValueで設定
              onChange={handleSearchInputChange} // debounceされた関数を呼び出す
              placeholder="授業名、教員名などで検索..."
              className="w-full p-3 border rounded-md shadow focus:border-green-500 outline-none"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loading type={"bubbles"} width={100} height={100} color={"#1DBE67"} />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {filteredLectures.length > 0 ? (
                filteredLectures.map((lecture) => (
                  <button
                    key={lecture.id}
                    onClick={() => handleLectureSelect(lecture)}
                    className='m-1 p-2 rounded-xl bg-white border border-1 shadow-md inline-block w-10/12 md:w-8/12 2xl:w-7/12 hover:bg-green-100 hover:border-1 hover:border-green-400 transform hover:scale-105 transition duration-150'
                  >
                    <div className=' flex items-center flex-wrap'>
                      <h2 className="inline-block w-full md:w-5/12 font-bold text-2xl my-1 text-center">{lecture.title}</h2>
                      <div className='flex flex-wrap w-full md:w-7/12'>
                        <div className="flex flex-row w-full justify-center">
                          <p className="mx-2 my-3">{lecture.lecturer}</p>
                          <p className="mx-2 my-3">{lecture.faculty}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-gray-500 mt-4">該当する授業が見つかりません。</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-1 2xl:text-4xl">レビュー投稿: {selectedLecture.title}</h2>
          <p className="text-gray-600 mb-4">({selectedLecture.lecturer} / {selectedLecture.faculty})</p>
          {renderErrors()}
          <form onSubmit={handleSubmit} className="flex flex-col w-10/12 md:w-8/12 2xl:w-5/12">
            {/* 評価 */}
            <div className="mb-6 flex flex-col">
              <label htmlFor="rating" className="block text-bold">
                <p className="font-bold mb-2">評価</p>
                <div className="p-2 pl-5 w-full border rounded-md shadow bg-white">
                  <ReactStars onChange={starOnChange} size={25} value={ratingValue} edit={true} />
                </div>
              </label>
            </div>

            {/* 授業を受けた年 */}
            <div className="mb-6 flex flex-col">
              <label className="block text-bold">
                <p className="font-bold mb-2">授業を受けた年</p>
                <div className="flex relative w-full text-gray-600">
                  <select
                    id="period_year"
                    name="period_year"
                    value={review?.period_year || ''}
                    onChange={handleInputChange}
                    required
                    className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 outline-none cursor-pointer">
                    <option value="">選択してください</option>
                    <option>2024</option>
                    <option>2023</option>
                    <option>2022</option>
                    <option>2021</option>
                    <option>2020</option>
                    <option>その他・不明</option>
                  </select>
                  {/* 下矢印アイコン */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path></svg>
                  </div>
                </div>
              </label>
            </div>

            {/* ターム */}
            <div className="mb-6 flex flex-col">
              <label className="block text-bold">
                <p className="font-bold mb-2">ターム</p>
                <div className="flex relative w-full text-gray-600">
                  <select
                    id="period_term"
                    name="period_term"
                    onChange={handleInputChange}
                    value={review?.period_term || ''}
                    required
                    className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 outline-none cursor-pointer">
                    <option value="">選択してください</option>
                    <option>1ターム</option>
                    <option>2ターム</option>
                    <option>1, 2ターム</option>
                    <option>3ターム</option>
                    <option>4ターム</option>
                    <option>3, 4ターム</option>
                    <option>その他・不明</option>
                  </select>
                  {/* 下矢印アイコン */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path></svg>
                  </div>
                </div>
              </label>
            </div>

            {/* 教科書 */}
            <div className="mb-6 flex flex-col">
              <label className="block text-bold">
                <p className="font-bold mb-2">教科書</p>
                <div className="flex relative w-full text-gray-600">
                  <select
                    id="textbook"
                    name="textbook"
                    value={review?.textbook || ''}
                    onChange={handleInputChange}
                    required
                    className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 outline-none cursor-pointer">
                    <option value="">選択してください</option>
                    <option>必要</option>
                    <option>不要</option>
                    <option>その他・不明</option>
                  </select>
                  {/* 下矢印アイコン */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path></svg>
                  </div>
                </div>
              </label>
            </div>

            {/* 出席確認 */}
            <div className="mb-6 flex flex-col">
              <label className="block text-bold">
                <p className="font-bold mb-2">出席確認</p>
                <div className="flex relative w-full text-gray-600">
                  <select
                    id="attendance"
                    name="attendance"
                    value={review?.attendance || ''}
                    onChange={handleInputChange}
                    required
                    className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 outline-none cursor-pointer">
                    <option value="">選択してください</option>
                    <option>毎回確認</option>
                    <option>たまに確認</option>
                    <option>なし</option>
                    <option>その他・不明</option>
                  </select>
                  {/* 下矢印アイコン */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path></svg>
                  </div>
                </div>
              </label>
            </div>

            {/* 採点方法 */}
            <div className="mb-6 flex flex-col">
              <label className="block text-bold">
                <p className="font-bold mb-2">採点方法</p>
                <div className="flex relative w-full text-gray-600">
                  <select
                    id="grading_type"
                    name="grading_type"
                    onChange={handleInputChange}
                    value={review?.grading_type || ''}
                    required
                    className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 outline-none cursor-pointer">
                    <option value="">選択してください</option>
                    <option>テストのみ</option>
                    <option>レポートのみ</option>
                    <option>テスト,レポート</option>
                    <option>その他・不明</option>
                  </select>
                  {/* 下矢印アイコン */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path></svg>
                  </div>
                </div>
              </label>
            </div>

            {/* 単位取得難易度 */}
            <div className="mb-6 flex flex-col">
              <label className="block text-bold">
                <p className="font-bold mb-2">単位取得難易度</p>
                <div className="flex relative w-full text-gray-600">
                  <select
                    id="content_difficulty"
                    name="content_difficulty"
                    onChange={handleInputChange}
                    value={review?.content_difficulty || ''}
                    required
                    className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 outline-none cursor-pointer">
                    <option value="">選択してください</option>
                    <option>とても楽</option>
                    <option>楽</option>
                    <option>普通</option>
                    <option>難</option>
                    <option>とても難しい</option>
                  </select>
                  {/* 下矢印アイコン */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path></svg>
                  </div>
                </div>
              </label>
            </div>

            {/* 内容充実度 */}
            <div className="mb-6 flex flex-col">
              <label className="block text-bold">
                <p className="font-bold mb-2">内容充実度</p>
                <div className="flex relative w-full text-gray-600">
                  <select
                    id="content_quality"
                    name="content_quality"
                    onChange={handleInputChange}
                    value={review?.content_quality || ''}
                    required
                    className="block appearance-none w-full bg-white p-3 border rounded-md shadow focus:border-green-500 outline-none cursor-pointer">
                    <option value="">選択してください</option>
                    <option>とても良い</option>
                    <option>良い</option>
                    <option>普通</option>
                    <option>悪い</option>
                    <option>とても悪い</option>
                  </select>
                  {/* 下矢印アイコン */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path></svg>
                  </div>
                </div>
              </label>
            </div>

            {/* コメント */}
            <div className="mb-8 flex flex-col">
              <label htmlFor="content" className="block text-bold">
                <p className="font-bold mb-2">コメント (任意)</p>
                <textarea
                  cols={30}
                  rows={5}
                  id="content"
                  name="content"
                  className="mt-1 p-2 w-full border rounded-md shadow focus:border-green-500 outline-none"
                  onChange={handleInputChange}
                  value={review?.content || ''}
                />
              </label>
            </div>

            {/* ボタン */}
            <div className="flex justify-center mt-6">
              <button
                type='button'
                onClick={cancelReview}
                className='p-2 px-4 rounded-lg shadow border-2 bg-white text-gray-600 hover:bg-gray-100 transition duration-150 mr-4'
              >
                授業選択に戻る
              </button>
              <button
                type="submit"
                className="p-2 px-6 rounded-lg font-bold text-white  bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-600 focus:ring-opacity-50 transition duration-150"
              >
                投稿する
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
};

export default NewReviewPage;