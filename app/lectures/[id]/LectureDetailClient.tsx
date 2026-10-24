'use client'
import StarRating from '@/app/_components/StarRating'
import LectureSummary from './LectureSummary';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LectureReviewsResponse, ReviewAccessState, ReviewSchema } from '@/app/_types/ReviewSchema';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import { FaStar, FaCalendar, FaGraduationCap, FaClipboardList, FaComments, FaHeart, FaBookOpen, FaChartLine, FaEdit } from 'react-icons/fa';
import ThanksButton from '../../_components/ThanksButton';
import ReviewEditModal from '../../_components/ReviewEditModal';
import ReportButton from '../../_components/ReportButton';
import { PartialComment } from '../../_components/ReviewAccessBlur';
import ReviewPromptModal from '../../_components/ReviewPromptModal';
import { useSession } from 'next-auth/react';
import { useAuth } from '../../_hooks/useAuth';
import AffiliateSlot from '../../_components/AffiliateSlot';
import { ANONYMOUS_REVIEW_VIEWER, getReviewViewerKey } from '@/app/_helpers/reviewViewerKey';

interface LectureDetailClientProps {
  initialViewerKey: string;
  lecture: LectureSchema;
  lectureId: number;
  initialReviews: ReviewSchema[];
  initialAccess: ReviewAccessState;
  initialAvgRating: string;
  initialReviewsError: string | null;
}

const LectureDetailClient = ({
  initialViewerKey,
  lecture,
  lectureId,
  initialReviews,
  initialAccess,
  initialAvgRating,
  initialReviewsError,
}: LectureDetailClientProps) => {
  const [reviews, setReviews] = useState<LectureReviewsResponse & { avgRating: string }>({
    reviews: initialReviews,
    avgRating: initialAvgRating,
    access: initialAccess,
  });
  const [editingReview, setEditingReview] = useState<ReviewSchema | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReviewPromptModalOpen, setIsReviewPromptModalOpen] = useState(false);
  const [reviewsError] = useState<string | null>(initialReviewsError);

  const { data: session, status } = useSession();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const backendToken = session?.backendToken || null;
  const [verifiedViewer, setVerifiedViewer] = useState<{ backendToken: string | null; key: string } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    let active = true;
    getReviewViewerKey(backendToken).then(key => {
      if (active) setVerifiedViewer({ backendToken, key });
    }).catch(() => {
      // Keep old private data hidden if session verification is unavailable.
      if (active) setVerifiedViewer(null);
    });
    return () => { active = false; };
  }, [backendToken, status]);

  const currentViewerKey = status === 'loading'
    ? null
    : !backendToken
      ? ANONYMOUS_REVIEW_VIEWER
      : verifiedViewer?.backendToken === backendToken ? verifiedViewer.key : null;
  const viewerMatches = currentViewerKey === initialViewerKey || (
    status === 'loading' && initialViewerKey === ANONYMOUS_REVIEW_VIEWER
  );

  useEffect(() => {
    if (currentViewerKey && currentViewerKey !== initialViewerKey) router.refresh();
  }, [currentViewerKey, initialViewerKey, router]);

  const canViewReviews = reviews.access.access_granted;

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
    setReviews((currentReviews) => ({
      ...currentReviews,
      reviews: updatedReviews,
      avgRating,
    }));
    setIsEditModalOpen(false);
    setEditingReview(null);
  };

  if (!viewerMatches) {
    return <div role="status" className="py-16 text-center text-gray-600">閲覧情報を更新しています…</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダーセクション */}
      <div className="relative py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <LectureSummary
            lecture={lecture}
            lectureId={lectureId}
            avgRating={reviews.avgRating}
            reviewCount={reviews.reviews.length}
            reviewsError={reviewsError}
          />

          {/* レビュー一覧セクション */}
          <div className="max-w-6xl mx-auto relative">
            {reviewsError && (
              <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-red-700 shadow-sm">
                {reviewsError}
              </div>
            )}

            {/* レビューカード */}
            {!reviewsError && <div className="space-y-6">
              {reviews.reviews && reviews.reviews.map((review: ReviewSchema, index: number) => (
                <div
                  key={review.id}
                  className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* レビューヘッダー */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <StarRating
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
                          {(canViewReviews || index === 0) ? (
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
            </div>}

            {/* レビューがない場合の表示 */}
            {!reviewsError && reviews.reviews.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4">
                  <FaComments className="mx-auto text-5xl text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-500 mb-2">まだレビューがありません</h3>
                <p className="text-gray-400 mb-6">この授業の最初のレビューを投稿してみませんか？</p>
              </div>
            )}

            <AffiliateSlot placement="lecture_detail" />

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
        lectureId={lectureId}
      />
    </div>
  );
};

export default LectureDetailClient
