'use client'
import ReactStars from 'react-stars'
import { handleAjaxError } from '../../_helpers/helpers';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import type { ReviewSchema } from '@/app/_types/ReviewSchema';
import Link from 'next/link';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import { FaBook, FaUser, FaUniversity, FaStar, FaCalendar, FaGraduationCap, FaClipboardList, FaComments, FaHeart, FaBookOpen, FaChartLine, FaEdit, FaTrash, FaFlag } from 'react-icons/fa';
import BookmarkButton from '../../_components/BookmarkButton';
import ThanksButton from '../../_components/ThanksButton';
import ReviewEditModal from '../../_components/ReviewEditModal';
import ReportButton from '../../_components/ReportButton';
import ReviewAccessBlur, { PartialComment } from '../../_components/ReviewAccessBlur';
import ReviewPromptModal from '../../_components/ReviewPromptModal';
import { useSession } from 'next-auth/react';
import { useAuth } from '../../_hooks/useAuth';
import { canAccessReviews, canAccessReviewsUnified } from '../../_helpers/reviewAccessManager';

const LectureDetail = ({ params }: { params: { id: number } }) => {
  const [reviews, setReviews] = useState<{ reviews: ReviewSchema[], avgRating: string }>({ reviews: [], avgRating: "" });
  const [lecture, setLecture] = useState<LectureSchema | null>(null)
  const [editingReview, setEditingReview] = useState<ReviewSchema | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReviewPromptModalOpen, setIsReviewPromptModalOpen] = useState(false);

  const { data: session, status } = useSession();
  const { user, isAuthenticated } = useAuth();

  // レビュー閲覧権限をチェック（期間ベースAPI優先、フォールバックでセッション認証またはローカルストレージの権限）
  const canViewReviews = canAccessReviewsUnified(reviews.reviews, isAuthenticated, user?.reviews_count);

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
  }, [params.id]);


  useEffect(() => {
    if (status === 'loading') return;
    const fetchReviews = async () => {
      try {
        // 認証ヘッダーを含めてレビューAPIを呼び出し
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // 認証済みユーザーの場合、Authorizationヘッダーを追加
        if (session?.backendToken) {
          headers['Authorization'] = `Bearer ${session.backendToken}`;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${params.id}/reviews`, {
          method: 'GET',
          headers: headers,
        });

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
  }, [params.id, session?.backendToken, status]);


  // レビュー編集機能
  const handleEditReview = (review: ReviewSchema) => {
    setEditingReview(review);
    setIsEditModalOpen(true);
  };

  // 編集後のレビュー更新
  const handleReviewUpdated = (updatedReview: ReviewSchema) => {
    const updatedReviews = reviews.reviews.map((review: ReviewSchema) =>
      review.id === updatedReview.id ? updatedReview : review
    );
    let avgRating = "0.0";
    if (updatedReviews.length > 0) {
      avgRating = (updatedReviews.reduce((total: number, review: ReviewSchema) => total + review.rating, 0) / updatedReviews.length).toFixed(1);
    }
    setReviews({ reviews: updatedReviews, avgRating });
    setIsEditModalOpen(false);
    setEditingReview(null);
  };



  if (!params.id) notFound();

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダーセクション */}
      <div className="relative py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* メイン講義情報カード */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-6xl">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 lg:p-8 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* 講義タイトル */}
                  <div className="flex-1 lg:flex-[2]">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 text-center lg:text-left leading-tight">
                      {lecture?.title}
                    </h1>
                  </div>

                  {/* 講義詳細情報 */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-col gap-4">
                      <div className="flex items-center justify-center sm:justify-start md:justify-center lg:justify-start">
                        <FaUser className="text-blue-500 mr-3 text-lg" />
                        <div className="text-center sm:text-left md:text-center lg:text-left">
                          <span className="text-lg font-semibold text-gray-800">{lecture?.lecturer}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start md:justify-center lg:justify-start">
                        <FaUniversity className="text-purple-500 mr-3 text-lg" />
                        <div className="text-center sm:text-left md:text-center lg:text-left">
                          <span className="text-lg font-semibold text-gray-800">{lecture?.faculty}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 評価セクション */}
                  <div className="flex-1">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3">
                        <h3 className="text-3xl font-bold text-yellow-500">{reviews.avgRating}</h3>
                        <ReactStars
                          value={parseFloat(reviews.avgRating)}
                          edit={false}
                          size={24}
                          className="flex"
                          half={true}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        ({reviews.reviews.length}件のレビュー)
                      </p>

                      {/* ブックマークボタン */}
                      {lecture && (
                        <div className="mt-4 flex justify-end">
                          <BookmarkButton lectureId={lecture.id} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* レビューボタン */}
          <div className="flex justify-center mb-8">
            <Link href={`/lectures/${params.id}/review`}>
              <button
                type="button"
                className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 flex items-center justify-center relative overflow-hidden group"
              >
                <FaHeart className="mr-3 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 animate-heartbeat" />
                <span className="relative z-10">レビューを投稿する</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>

                {/* キラキラエフェクト */}
                <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-twinkle opacity-0 group-hover:opacity-100"></div>
                <div className="absolute bottom-3 left-3 w-1 h-1 bg-white rounded-full animate-twinkle opacity-0 group-hover:opacity-100 delay-100"></div>
                <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-white rounded-full animate-twinkle opacity-0 group-hover:opacity-100 delay-200"></div>
              </button>
            </Link>
          </div>


          {/* レビュー一覧セクション */}
          <div className="max-w-6xl mx-auto relative">
            {/* レビューカード */}
            <div className="space-y-6">
              {reviews.reviews && reviews.reviews.map((review: ReviewSchema, index: number) => (
                <div
                  key={review.id}
                  className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* レビューヘッダー */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <ReactStars
                        value={review.rating}
                        edit={false}
                        size={20}
                        className="flex"
                        half={true}
                      />
                      <span className="text-lg font-bold text-yellow-500">{review.rating}</span>
                    </div>
                    {(review.period_year || review.period_term) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendar className="mr-1" />
                        {review.period_year && `${review.period_year}年`}
                        {review.period_year && review.period_term && ' '}
                        {review.period_term}
                      </div>
                    )}
                  </div>

                  {/* レビュー詳細情報 */}
                  {(review.textbook || review.attendance || review.grading_type || review.content_difficulty || review.content_quality) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-3">
                        {review.textbook && (
                          <div className="flex items-center gap-3">
                            <FaBookOpen className="text-blue-500 flex-shrink-0" />
                            <div>
                              <span className="text-sm text-gray-500 block">教科書</span>
                              <span className="font-medium text-gray-800">{review.textbook}</span>
                            </div>
                          </div>
                        )}
                        {review.attendance && (
                          <div className="flex items-center gap-3">
                            <FaClipboardList className="text-green-500 flex-shrink-0" />
                            <div>
                              <span className="text-sm text-gray-500 block">出席確認</span>
                              <span className="font-medium text-gray-800">{review.attendance}</span>
                            </div>
                          </div>
                        )}
                        {review.grading_type && (
                          <div className="flex items-center gap-3">
                            <FaGraduationCap className="text-purple-500 flex-shrink-0" />
                            <div>
                              <span className="text-sm text-gray-500 block">採点方法</span>
                              <span className="font-medium text-gray-800">{review.grading_type}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {review.content_difficulty && (
                          <div className="flex items-center gap-3">
                            <FaChartLine className="text-red-500 flex-shrink-0" />
                            <div>
                              <span className="text-sm text-gray-500 block">難易度</span>
                              <span className="font-medium text-gray-800">{review.content_difficulty}</span>
                            </div>
                          </div>
                        )}
                        {review.content_quality && (
                          <div className="flex items-center gap-3">
                            <FaStar className="text-yellow-500 flex-shrink-0" />
                            <div>
                              <span className="text-sm text-gray-500 block">内容の質</span>
                              <span className="font-medium text-gray-800">{review.content_quality}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* コメントセクション */}
                  {review.content && (
                    <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 relative">
                      <div className="flex items-start gap-3">
                        <FaComments className="text-green-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-gray-500 block mb-2">コメント</span>
                          {canViewReviews ? (
                            <p className="text-gray-800 leading-relaxed break-words">{review.content}</p>
                          ) : (
                            <div className="relative">
                              <PartialComment content={review.content} />
                              {/* コメント内オーバーレイボタン */}
                              <div className="absolute inset-0 flex items-end justify-center pb-4 bg-gradient-to-r from-transparent via-transparent to-white/90 rounded-2xl">
                                <button
                                  onClick={() => setIsReviewPromptModalOpen(true)}
                                  className="px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/25 flex items-center gap-1 md:gap-2 text-xs md:text-sm group"
                                >
                                  <FaHeart className="group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                                  <span className="truncate">
                                    {!isAuthenticated ? (
                                      <>
                                        <span className="">ログイン&1レビューして閲覧する</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="">1レビューを投稿して閲覧する</span>
                                      </>
                                    )}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      {/* ありがとうボタン */}
                      <ThanksButton reviewId={review.id} initialThanksCount={review.thanks_count} />

                      {/* 報告ボタン（全ユーザーに表示） */}
                      <ReportButton reviewId={review.id} />
                    </div>

                    {/* 編集ボタン（自分のレビューの場合のみ） */}
                    {session && user && review.user_id && Number(review.user_id) === Number(user.id) && (
                      <button
                        onClick={() => handleEditReview(review)}
                        className="group relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-sm border backdrop-blur-sm overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/50 hover:from-blue-100 hover:to-indigo-100 hover:shadow-blue-200/25 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                        <FaEdit className="w-3.5 h-3.5 transform group-hover:scale-110 transition-transform duration-200 relative" />
                        <span className="text-sm relative">編集</span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* レビューがない場合の表示 */}
            {reviews.reviews.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4">
                  <FaComments className="mx-auto text-5xl text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-500 mb-2">まだレビューがありません</h3>
                <p className="text-gray-400 mb-6">この授業の最初のレビューを投稿してみませんか？</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* レビュー編集モーダル */}
      {isEditModalOpen && editingReview && (
        <ReviewEditModal
          review={editingReview}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingReview(null);
          }}
          onSave={handleReviewUpdated}
        />
      )}

      {/* レビュー促進モーダル */}
      <ReviewPromptModal
        isOpen={isReviewPromptModalOpen}
        onClose={() => setIsReviewPromptModalOpen(false)}
        lectureId={params.id}
      />
    </div>
  );
};

export default LectureDetail