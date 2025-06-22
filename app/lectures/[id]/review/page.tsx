'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import ReactStars from 'react-stars';
import { isEmptyObject, validateReview, handleAjaxError } from '../../../_helpers/helpers';
import { success } from '@/app/_helpers/notifications';
import type { ReviewData } from '@/app/_types/ReviewData';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaArrowLeft, FaHeart, FaBookOpen, FaUser, FaUniversity } from 'react-icons/fa';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const ReviewPage = ({ params }: { params: { id: string } }) => {
  const [lecture, setLecture] = useState<LectureSchema | null>(null);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLecture, setIsLoadingLecture] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [ratingValue, setRatingValue] = useState(3);
  const router = useRouter();

  // フィールド設定の型定義
  interface SelectFieldConfig {
    id: string;
    name: keyof ReviewData;
    label: string;
    options: string[];
  }

  // フィールド設定の定義（メモ化）
  const selectFieldConfigs: SelectFieldConfig[] = useMemo(() => [
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
  ], []);

  // 講義詳細取得
  useEffect(() => {
    const fetchLecture = async () => {
      try {
        setIsLoadingLecture(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${params.id}`);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        setLecture(data);

        // レビューデータの初期化
        setReview({
          lecture_id: data.id,
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
      } catch (error) {
        handleAjaxError("授業の取得に失敗しました");
        router.push('/reviews/new');
      } finally {
        setIsLoadingLecture(false);
      }
    };

    fetchLecture();
  }, [params.id, router]);

  // レビューフォームのロジック（最適化）
  const updateReview = useCallback((name: string, value: string | number) => {
    if (!review) return;
    setReview((prevReview) => ({ ...prevReview!, [name]: value }));
  }, [review]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateReview(name, value);
  }, [updateReview]);

  const starOnChange = useCallback((newValue: number) => {
    setRatingValue(newValue);
    updateReview('rating', newValue);
  }, [updateReview]);

  // 個別フィールドのエラー表示用関数（メモ化）
  const renderFieldError = useCallback((fieldName: string) => {
    if (formErrors[fieldName]) {
      return (
        <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {formErrors[fieldName]}
        </p>
      );
    }
    return null;
  }, [formErrors]);

  // フィールドのボーダー色を決定する関数（メモ化）
  const getFieldBorderClass = useCallback((fieldName: string) => {
    const baseClasses = "block appearance-none w-full bg-white border p-3 rounded-lg focus:ring-2 focus:outline-none cursor-pointer text-gray-900 transition-all duration-200";
    if (formErrors[fieldName]) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200`;
    }
    return `${baseClasses} border-gray-300 focus:border-green-500 focus:ring-green-200`;
  }, [formErrors]);

  // textareaのクラス取得関数（メモ化）
  const getTextareaClass = useCallback((fieldName: string) => {
    const baseClasses = "p-3 w-full rounded-lg bg-white border focus:ring-2 focus:outline-none text-gray-900 transition-all duration-200 resize-none";
    if (formErrors[fieldName]) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200`;
    }
    return `${baseClasses} border-gray-300 focus:border-green-500 focus:ring-green-200`;
  }, [formErrors]);

  // ドロップダウンアイコンコンポーネント（メモ化）
  const DropdownIcon = memo(() => (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
      </svg>
    </div>
  ));
  DropdownIcon.displayName = 'DropdownIcon';

  // SelectFieldコンポーネント（メモ化）
  const SelectField = memo<SelectFieldConfig>(({ id, name, label, options }) => (
    <div className="mb-6">
      <label className="block">
        <p className="font-semibold mb-3 text-gray-800">
          {label}
          <span className="ml-2 text-sm font-normal text-gray-500">
            任意
          </span>
        </p>
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
          <DropdownIcon />
        </div>
        {renderFieldError(name)}
      </label>
    </div>
  ));
  SelectField.displayName = 'SelectField';

  const addReview = useCallback(async (newReview: ReviewData, token: string) => {
    if (!lecture) return;
    try {
      setIsLoading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${lecture.id}/reviews`, {
        review: newReview,
        token,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.data.success) {
        success('レビューを登録しました');
        router.push(`/lectures/${lecture.id}`);
      } else {
        handleAjaxError(res.data.message || "reCAPTCHA認証に失敗しました");
      }
    } catch (error) {
      handleAjaxError("レビューの登録に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [lecture, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!review || isLoading) return;

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
  }, [review, addReview, isLoading]);

  const handleBack = useCallback(() => {
    router.push(`/lectures/${params.id}`);
  }, [params.id, router]);

  if (isLoadingLecture || !lecture) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          </div>
          <p className="text-gray-600">授業を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ページタイトルとヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">レビュー投稿</h1>
          <p className="text-gray-600">授業の評価とコメントを投稿してください</p>
        </div>

        {/* 授業情報カード */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <FaBookOpen className="text-green-600 mr-3 text-xl" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">{lecture.title}</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-600">
              <div className="flex items-center">
                <FaUser className="text-blue-500 mr-2" />
                <span className="font-medium">{lecture.lecturer}</span>
              </div>
              <div className="flex items-center">
                <FaUniversity className="text-purple-500 mr-2" />
                <span className="font-medium">{lecture.faculty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* レビューフォームカード */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 評価セクション */}
            <div>
              <label className="block">
                <p className="font-semibold mb-3 text-gray-800 text-lg">
                  総合評価
                  <span className="ml-2 text-sm font-normal text-red-500">
                    必須
                  </span>
                </p>
                <div className="flex justify-center p-6 bg-gray-50 rounded-xl">
                  <ReactStars
                    onChange={starOnChange}
                    size={32}
                    value={ratingValue}
                    edit={true}
                    color2="#EAB308"
                  />
                </div>
              </label>
            </div>

            {/* select要素を動的生成 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectFieldConfigs.map((config) => (
                <SelectField
                  key={config.id}
                  id={config.id}
                  name={config.name}
                  label={config.label}
                  options={config.options}
                />
              ))}
            </div>

            {/* コメントセクション */}
            <div>
              <label className="block">
                <p className="font-semibold mb-3 text-gray-800 text-lg">
                  コメント
                  <span className="ml-2 text-sm font-normal text-red-500">
                    必須
                  </span>
                </p>
                <textarea
                  cols={30}
                  rows={6}
                  id="content"
                  name="content"
                  className={getTextareaClass('content')}
                  onChange={handleInputChange}
                  value={review?.content || ''}
                  placeholder="授業の感想やアドバイスなどを150文字以内で入力してください..."
                />
                {renderFieldError('content')}
              </label>
            </div>

            {/* ボタンセクション */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type='button'
                onClick={handleBack}
                className='flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center'
              >
                <FaArrowLeft className="mr-2" />
                授業詳細に戻る
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    投稿中...
                  </>
                ) : (
                  <>
                    <FaHeart className="mr-2" />
                    レビューを投稿
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default memo(ReviewPage); 