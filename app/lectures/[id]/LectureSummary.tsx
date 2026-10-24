import Link from 'next/link';
import { FaUser, FaUniversity, FaHeart } from 'react-icons/fa';
import StarRating from '@/app/_components/StarRating';
import BookmarkButton from '@/app/_components/BookmarkButton';
import type { LectureSchema } from '@/app/_types/LectureSchema';

type Props = {
  lecture: LectureSchema;
  lectureId: number;
  avgRating: string;
  reviewCount: number;
  reviewsError: string | null;
  loading?: boolean;
};

// This summary contains public lecture information only. It can be rendered
// while viewer-specific reviews are still being fetched on the server.
export default function LectureSummary({ lecture, lectureId, avgRating, reviewCount, reviewsError, loading = false }: Props) {
  return (
    <>
      {/* メイン講義情報カード */}
      <div className="flex justify-center mb-8">
        <div className="w-full max-w-6xl">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 lg:p-8 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* 講義タイトル */}
              <div className="flex-1 lg:flex-[2]">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 text-center lg:text-left leading-tight">
                  {lecture.title}
                </h1>
              </div>

              {/* 講義詳細情報 */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-col gap-4">
                  <div className="flex items-center justify-center sm:justify-start md:justify-center lg:justify-start">
                    <FaUser className="text-blue-500 mr-3 text-lg" />
                    <div className="text-center sm:text-left md:text-center lg:text-left">
                      <span className="text-lg font-semibold text-gray-800">{lecture.lecturer}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start md:justify-center lg:justify-start">
                    <FaUniversity className="text-purple-500 mr-3 text-lg" />
                    <div className="text-center sm:text-left md:text-center lg:text-left">
                      <span className="text-lg font-semibold text-gray-800">{lecture.faculty}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 評価セクション */}
              <div className="flex-1">
                <div className="text-center">
                  {reviewsError ? (
                    <>
                      <h3 className="text-3xl font-bold text-red-500">--</h3>
                      <p className="text-sm text-red-500 mt-1">レビュー取得エラー</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-3">
                        <h3 className="text-3xl font-bold text-yellow-500">{avgRating}</h3>
                        <StarRating
                          value={parseFloat(avgRating)}
                          edit={false}
                          size={24}
                          className="flex"
                          half={true}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        ({reviewCount}件のレビュー)
                      </p>
                    </>
                  )}

                  {/* ブックマークボタン */}
                  {lecture && (
                    <div className="mt-4 flex justify-end">
                      {loading ? (
                        <button disabled className="px-4 py-3 rounded-2xl bg-gray-50 text-sm text-gray-500">ブックマーク</button>
                      ) : <BookmarkButton lectureId={lecture.id} />}
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
        <Link href={`/lectures/${lectureId}/review`}>
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


    </>
  );
}
