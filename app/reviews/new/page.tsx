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
import { FaArrowLeft, FaEdit, FaStar, FaHeart, FaBookOpen, FaUser, FaUniversity } from 'react-icons/fa';

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

  // フィールド設定の型定義
  interface SelectFieldConfig {
    id: string;
    name: keyof ReviewData;
    label: string;
    options: string[];
  }

  // フィールド設定の定義
  const selectFieldConfigs: SelectFieldConfig[] = [
    {
      id: 'period_year',
      name: 'period_year',
      label: '授業を受けた年',
      options: ['2025', '2024', '2023', '2022', '2021', '2020', 'その他・不明']
    },
    {
      id: 'period_term',
      name: 'period_term',
      label: '開講',
      options: ['1ターム', '2ターム', '1, 2ターム', '3ターム', '4ターム', '3, 4ターム', '通年', '集中', 'その他・不明']
    },
    {
      id: 'textbook',
      name: 'textbook',
      label: '教科書',
      options: ['必要', '不要', 'その他・不明']
    },
    {
      id: 'attendance',
      name: 'attendance',
      label: '出席確認',
      options: ['毎回確認', 'たまに確認', 'なし', 'その他・不明']
    },
    {
      id: 'grading_type',
      name: 'grading_type',
      label: '採点方法',
      options: ['テストのみ', 'レポートのみ', 'テスト,レポート', 'その他・不明']
    },
    {
      id: 'content_difficulty',
      name: 'content_difficulty',
      label: '単位取得難易度',
      options: ['とても楽', '楽', '普通', '難', 'とても難しい']
    },
    {
      id: 'content_quality',
      name: 'content_quality',
      label: '内容充実度',
      options: ['とても良い', '良い', '普通', '悪い', 'とても悪い']
    }
  ];

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

  // 個別フィールドのエラー表示用関数
  const renderFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      return (
        <p className="mt-2 text-sm text-red-600 font-medium flex items-center animate-fade-in">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {formErrors[fieldName]}
        </p>
      );
    }
    return null;
  };

  // フィールドのボーダー色を決定する関数
  const getFieldBorderClass = (fieldName: string) => {
    const baseClasses = "block appearance-none w-full bg-gradient-to-br from-white to-green-50/30 backdrop-blur-sm p-4 rounded-xl shadow-lg focus:ring-2 focus:outline-none cursor-pointer text-gray-700 font-medium transition-all duration-300";
    if (formErrors[fieldName]) {
      return `${baseClasses} border-2 border-red-300 focus:border-red-500 focus:ring-red-200 hover:border-red-400`;
    }
    return `${baseClasses} border-2 focus:border-green-400 focus:ring-green-200 hover:border-green-200`;
  };

  // textareaのクラス取得関数
  const getTextareaClass = (fieldName: string) => {
    const baseClasses = "p-4 w-full rounded-xl shadow-lg bg-gradient-to-br from-white to-green-50/30 backdrop-blur-sm focus:ring-2 focus:outline-none text-gray-700 font-medium transition-all duration-300 resize-none";
    if (formErrors[fieldName]) {
      return `${baseClasses} border-2 border-red-300 focus:border-red-500 focus:ring-red-200 hover:border-red-400`;
    }
    return `${baseClasses} border-2 focus:border-green-400 focus:ring-green-200 hover:border-green-200`;
  };

  // ドロップダウンアイコンコンポーネント
  const DropdownIcon = () => (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-green-600">
      <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
      </svg>
    </div>
  );

  // SelectFieldコンポーネント
  const SelectField = ({ id, name, label, options }: SelectFieldConfig) => (
    <div className="mb-6 flex flex-col">
      <label className="block text-bold">
        <p className="font-bold mb-3 text-gray-800">{label}</p>
        <div className="relative">
          <select
            id={id}
            name={name}
            value={(review as any)?.[name] || ''}
            onChange={handleInputChange}
            className={getFieldBorderClass(name)}>
            <option value="">選択してください</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {renderFieldError(name)}
          <DropdownIcon />
        </div>
      </label>
    </div>
  );

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
          <div className="text-center mb-8 flex flex-col animate-fade-in">
            <div className="relative inline-block">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 bg-clip-text text-transparent">
                  <FaEdit className="inline-block mr-3 text-green-500" />
                  レビュー投稿
                </span>
              </h1>
            </div>

            <div className="inline-block p-6 lg:p-8 rounded-3xl shadow-2xl border border-green-100/30 bg-white/95 backdrop-blur-md transform hover:scale-105 transition-all duration-500 relative overflow-hidden group">

              {/* コンテンツ */}
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-3 animate-fade-in-up">
                  <FaBookOpen className="text-green-500 mr-3 text-xl" />
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{selectedLecture.title}</h2>
                </div>

                <div className="flex flex-col items-center justify-center space-y-2 text-gray-600 font-medium animate-fade-in-up delay-150">
                  <div className="flex items-center animate-slide-in-left">
                    <FaUser className="text-blue-500 mr-2" />
                    <span>{selectedLecture.lecturer}</span>
                  </div>
                  <div className="flex items-center animate-slide-in-right">
                    <FaUniversity className="text-yellow-500 mr-2" />
                    <span>{selectedLecture.faculty}</span>
                  </div>
                </div>
              </div>

              {/* ホバーエフェクト */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col w-10/12 md:w-8/12 2xl:w-5/12">
            {/* 評価 */}
            <div className="mb-6 flex flex-col">
              <label htmlFor="rating" className="block text-bold">
                <p className="font-bold mb-3 text-gray-800">評価</p>
                <div className="p-4 w-full border-2 rounded-xl shadow-lg bg-gradient-to-br from-white to-green-50/30 backdrop-blur-sm">
                  <ReactStars onChange={starOnChange} size={25} value={ratingValue} edit={true} />
                </div>
              </label>
            </div>

            {/* 授業を受けた年 */}
            <SelectField id="period_year" name="period_year" label="授業を受けた年" options={selectFieldConfigs[0].options} />

            {/* 開講 */}
            <SelectField id="period_term" name="period_term" label="開講" options={selectFieldConfigs[1].options} />

            {/* 教科書 */}
            <SelectField id="textbook" name="textbook" label="教科書" options={selectFieldConfigs[2].options} />

            {/* 出席確認 */}
            <SelectField id="attendance" name="attendance" label="出席確認" options={selectFieldConfigs[3].options} />

            {/* 採点方法 */}
            <SelectField id="grading_type" name="grading_type" label="採点方法" options={selectFieldConfigs[4].options} />

            {/* 単位取得難易度 */}
            <SelectField id="content_difficulty" name="content_difficulty" label="単位取得難易度" options={selectFieldConfigs[5].options} />

            {/* 内容充実度 */}
            <SelectField id="content_quality" name="content_quality" label="内容充実度" options={selectFieldConfigs[6].options} />

            {/* select要素を動的生成 */}
            {selectFieldConfigs.map((config) => (
              <SelectField
                key={config.id}
                id={config.id}
                name={config.name}
                label={config.label}
                options={config.options}
              />
            ))}

            {/* コメント */}
            <div className="mb-8 flex flex-col">
              <label htmlFor="content" className="block text-bold">
                <p className="font-bold mb-3 text-gray-800">コメント (任意)</p>
                <textarea
                  cols={30}
                  rows={5}
                  id="content"
                  name="content"
                  className={getTextareaClass('content')}
                  onChange={handleInputChange}
                  value={review?.content || ''}
                  placeholder="コメントは150文字以内で入力してください..."
                />
                {renderFieldError('content')}
              </label>
            </div>

            {/* ボタン */}
            <div className="flex flex-col md:flex-row justify-center gap-6 pt-8 animate-fade-in-up">
              <button
                type='button'
                onClick={cancelReview}
                className='px-8 py-4 bg-transparent border-2 border-gray-300 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transform hover:scale-110 transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-lg hover:shadow-xl'
              >
                <FaArrowLeft className="mr-3 transform group-hover:scale-110 group-hover:-translate-x-1 transition-all duration-300" />
                <span className="relative z-10">授業選択に戻る</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>

              <button
                type="submit"
                className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 flex items-center justify-center relative overflow-hidden group"
              >
                <FaHeart className="mr-3 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 animate-heartbeat" />
                <span className="relative z-10">投稿する</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>

                {/* キラキラエフェクト */}
                <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-twinkle opacity-0 group-hover:opacity-100"></div>
                <div className="absolute bottom-3 left-3 w-1 h-1 bg-white rounded-full animate-twinkle opacity-0 group-hover:opacity-100 delay-100"></div>
                <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-white rounded-full animate-twinkle opacity-0 group-hover:opacity-100 delay-200"></div>
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
};

export default NewReviewPage;