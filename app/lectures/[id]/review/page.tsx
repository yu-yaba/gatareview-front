'use client';

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { isEmptyObject, validateReview, handleAjaxError } from '../../../_helpers/helpers';
import { getReviewYearOptions } from '../../../_helpers/reviewYears';
import { success } from '@/app/_helpers/notifications';
import type { ReviewData } from '@/app/_types/ReviewData';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import { useParams, useRouter } from 'next/navigation';
import { reviewApi, SessionChangedError } from '../../../_helpers/api';
import { useMutationRequest, type MutationRequest } from '../../../_hooks/useMutationRequest';
import { useCancelOnNavigation } from '../../../_hooks/useCancelOnNavigation';
import Loading from '../../../_components/Loading';
import ReviewSelectField from '../../../_components/ReviewSelectField';
import { countCharacters, REVIEW_CONTENT_MAX_LENGTH } from '../../../_helpers/reviewContent';
import { FaArrowLeft, FaHeart, FaBookOpen, FaUser, FaUniversity, FaStar } from 'react-icons/fa';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const ReviewPage = () => {
  const params = useParams<{ id: string }>();
  const [lecture, setLecture] = useState<LectureSchema | null>(null);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLecture, setIsLoadingLecture] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [ratingValue, setRatingValue] = useState(3);
  const router = useRouter();
  const lectureRequest = useRef<AbortController | null>(null);
  const cancelLecture = useCallback(() => lectureRequest.current?.abort(), []);
  useCancelOnNavigation(cancelLecture);
  const { beginMutation, cancelMutations, isSessionLoading } = useMutationRequest();

  // フィールド設定の型定義
  interface SelectFieldConfig {
    id: string;
    name: keyof ReviewData;
    label: string;
    options: string[];
  }

  // フィールド設定の定義（メモ化）
  const reviewYearOptions = useMemo(() => getReviewYearOptions(), []);
  const selectFieldConfigs: SelectFieldConfig[] = useMemo(() => [
    {
      id: 'period_year',
      name: 'period_year',
      label: '授業を受けた年',
      options: [...reviewYearOptions, 'その他・不明']
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
      options: ['必要', '不要', 'どちらでも', 'その他・不明']
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
  ], [reviewYearOptions]);

  // 講義詳細取得
  useEffect(() => {
    const controller = new AbortController();
    lectureRequest.current = controller;
    const fetchLecture = async () => {
      try {
        setIsLoadingLecture(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${params.id}`, { signal: controller.signal });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        if (controller.signal.aborted) return;
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
        if (controller.signal.aborted) return;
        handleAjaxError("授業の取得に失敗しました");
        router.push('/reviews/new');
      } finally {
        if (!controller.signal.aborted) setIsLoadingLecture(false);
      }
    };

    fetchLecture();
    return () => controller.abort();
  }, [params.id, router]);

  // レビューフォームのロジック（最適化）
  const updateReview = useCallback((name: string, value: string | number) => {
    if (!review) return;
    setReview((prevReview) => ({ ...prevReview!, [name]: value }));
  }, [review]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateReview(name, value);
    // 直し始めたら古いエラー（表示・aria-invalid・読み上げ）を消す
    setFormErrors(current => {
      if (!current[name]) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }, [updateReview]);

  // カスタムドロップダウン用のstate管理（同時に開くのは1つだけ）
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownOpenChange = useCallback((fieldName: string, open: boolean) => {
    setOpenDropdown(current => (open ? fieldName : current === fieldName ? null : current));
  }, []);

  // ドロップダウン外クリックで閉じる
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (openDropdown) {
      const target = e.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    }
  }, [openDropdown]);

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const starOnChange = useCallback((newValue: number) => {
    setRatingValue(newValue);
    updateReview('rating', newValue);
  }, [updateReview]);

  // 個別フィールドのエラー表示用関数（メモ化）
  const renderFieldError = useCallback((fieldName: string) => {
    if (formErrors[fieldName]) {
      return (
        <p id={`${fieldName}-error`} className="mt-2 text-sm text-red-600 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {formErrors[fieldName]}
        </p>
      );
    }
    return null;
  }, [formErrors]);

  // textareaのクラス取得関数（メモ化）
  const getTextareaClass = useCallback((fieldName: string) => {
    const baseClasses = "p-4 w-full rounded-2xl shadow-lg bg-white/95 backdrop-blur-md border border-green-100/50 focus:ring-2 text-gray-800 font-medium transition-all duration-300 resize-none hover:shadow-xl";
    if (formErrors[fieldName]) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200 hover:border-red-400`;
    }
    return `${baseClasses} focus:border-green-500 focus:ring-green-200 hover:border-green-300`;
  }, [formErrors]);

  const addReview = useCallback(async (newReview: ReviewData, token: string, request: MutationRequest) => {
    if (!lecture || request.signal.aborted) return;
    try {
      const res = await reviewApi.createReview(lecture.id.toString(), {
        review: newReview,
        token,
      }, request);
      if (request.signal.aborted) return;

      if (res.data.success) {
        success('レビューを登録しました');
        router.push(`/lectures/${lecture.id}`);
      } else {
        handleAjaxError(res.data.message || res.data.errors?.[0] || "レビューの登録に失敗しました");
      }
    } catch (error: any) {
      if (request.signal.aborted) return;
      if (error instanceof SessionChangedError) {
        handleAjaxError(error.message);
        return;
      }
      // セキュリティ: AxiosError の全体出力はAuthorizationヘッダー等が含まれ得るため避ける
      console.error('Review creation error:', error?.response?.status, error?.message);

      const status = error.response?.status;
      const errorData = error.response?.data;

      if (status === 422) {
        handleAjaxError(errorData?.message || errorData?.errors?.[0] || "レビューの登録に失敗しました");
      } else if (status === 401) {
        handleAjaxError("ログインが必要です");
      } else if (status === 403) {
        handleAjaxError("権限がありません");
      } else {
        handleAjaxError("レビューの登録に失敗しました");
      }
    }
  }, [lecture, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!review) return;

    const errors = validateReview(review);
    if (!isEmptyObject(errors)) {
      setFormErrors(errors);
    } else {
      setFormErrors({});
      if (!window.grecaptcha) {
        setFormErrors({ recaptcha: 'reCAPTCHAが読み込まれていません。ページをリロードしてください。' });
        return;
      }
      const request = beginMutation();
      if (!request) return;
      setIsLoading(true);
      try {
        const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
        const token = await window.grecaptcha.execute(SITE_KEY, { action: 'submit' });
        if (request.signal.aborted) return;
        await addReview(review, token, request);
      } catch (error) {
        if (request.signal.aborted) return;
        handleAjaxError("reCAPTCHAの取得に失敗しました");
        setFormErrors({ recaptcha: 'reCAPTCHAの検証に失敗しました。' });
      } finally {
        request.finish();
        if (!request.signal.aborted) setIsLoading(false);
      }
    }
  }, [review, addReview, beginMutation]);

  const handleBack = useCallback(() => {
    cancelLecture();
    cancelMutations();
    router.push(`/lectures/${params.id}`);
  }, [params.id, router, cancelLecture, cancelMutations]);

  const contentLength = countCharacters(review?.content || '');

  if (isLoadingLecture || !lecture) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading type={"bubbles"} width={200} height={200} color={"#1DBE67"} />
          <p className="text-gray-600 mt-4">授業を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ページタイトルとヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-2">レビュー投稿</h1>
          <p className="text-gray-600">授業の評価とコメントを投稿してください</p>
        </div>

        {/* 授業情報カード */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300 mb-8">
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
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 評価セクション */}
            <div>
              <label className="block">
                <p className="font-bold mb-4 text-gray-800 text-lg">
                  総合評価
                  <span className="ml-3 text-sm font-normal text-red-500 bg-red-100 px-3 py-1 rounded-full">
                    必須
                  </span>
                </p>
                <div className="flex flex-col items-center justify-center p-8 rounded-3xl shadow-lg border border-yellow-200/50 backdrop-blur-xs">
                  <div className="flex items-center space-x-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => starOnChange(star)}
                        className={`p-2 transition-all duration-300 transform hover:scale-125 focus:outline-hidden focus:scale-125 ${star <= ratingValue ? 'text-yellow-300' : 'text-gray-300'
                          }`}
                        aria-label={`${star}つ星を選択`}
                      >
                        <FaStar className="w-8 h-8 drop-shadow-xs" />
                      </button>
                    ))}
                  </div>
                  <div className="text-center ">
                    <span className="text-2xl font-bold text-yellow-400">{ratingValue}</span>
                    <span className="text-lg text-gray-600 ml-1">/ 5</span>
                  </div>
                </div>
              </label>
            </div>

            {/* select要素を動的生成 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectFieldConfigs.map((config) => (
                <ReviewSelectField
                  key={config.id}
                  id={config.id}
                  label={config.label}
                  options={config.options}
                  value={String(review?.[config.name] ?? '')}
                  isOpen={openDropdown === config.name}
                  error={formErrors[config.name]}
                  onOpenChange={(open) => handleDropdownOpenChange(config.name, open)}
                  onSelect={(value) => updateReview(config.name, value)}
                />
              ))}
            </div>

            {/* コメントセクション */}
            <div>
              <label className="block">
                <p className="font-bold mb-4 text-gray-800 text-lg">
                  コメント
                  <span className="ml-3 text-sm font-normal text-red-500 bg-red-100 px-3 py-1 rounded-full">
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
                  placeholder="授業の感想やアドバイスなどを30文字以上1000文字以内で入力してください..."
                  aria-describedby={formErrors.content ? 'content-count content-error' : 'content-count'}
                  aria-invalid={formErrors.content ? true : undefined}
                />
              </label>
              {/* 文字数とエラーは label の外に置き、入力欄の読み上げ名に混ぜない */}
              <p
                id="content-count"
                className={`mt-2 text-right text-sm ${contentLength > REVIEW_CONTENT_MAX_LENGTH ? 'text-red-600 font-medium' : 'text-gray-500'}`}
              >
                {contentLength} / {REVIEW_CONTENT_MAX_LENGTH}文字
              </p>
              {renderFieldError('content')}
            </div>

            {/* ボタンセクション */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
              <button
                type='button'
                onClick={handleBack}
                className='flex-1 px-8 py-4 bg-white/95 backdrop-blur-md border border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center relative overflow-hidden group'
              >
                <div className="absolute inset-0 bg-linear-to-r from-gray-50 to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FaArrowLeft className="mr-2 relative z-10" />
                <span className="relative z-10">授業詳細に戻る</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || isSessionLoading}
                className="flex-1 px-8 py-4 bg-linear-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 flex items-center justify-center relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:scale-100"
              >
                <div className="absolute inset-0 bg-linear-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>

                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 relative z-10"></div>
                    <span className="relative z-10">投稿中...</span>
                  </>
                ) : (
                  <>
                    <FaHeart className="mr-2 relative z-10 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                    <span className="relative z-10">レビューを投稿</span>
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
