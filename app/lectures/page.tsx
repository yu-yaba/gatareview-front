'use client'
import { useEffect, useRef, useState } from 'react';
import ReactStars from 'react-stars'
import type { LectureSchema } from '../_types/LectureSchema';
import Link from "next/link";
import { handleAjaxError } from '../_helpers/helpers';
import Loading from 'react-loading';
import { FaSearch, FaBook, FaUser, FaUniversity, FaStar, FaFilter, FaGraduationCap, FaBookOpen, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

interface LecturesResponse {
  lectures: LectureSchema[];
  pagination: PaginationInfo;
}

const LectureList = () => {
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [sortType, setSortType] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailedSearch, setShowDetailedSearch] = useState(false);

  // 詳細検索の状態
  const [periodYear, setPeriodYear] = useState('');
  const [periodTerm, setPeriodTerm] = useState('');
  const [textbook, setTextbook] = useState('');
  const [attendance, setAttendance] = useState('');
  const [gradingType, setGradingType] = useState('');
  const [contentDifficulty, setContentDifficulty] = useState('');
  const [contentQuality, setContentQuality] = useState('');

  const searchInput = useRef<HTMLInputElement>(null);
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 0,
    total_count: 0,
    per_page: 20
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLectures = async (page = 1) => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      params.append('page', page.toString());

      if (searchWord) params.append('search', searchWord);
      if (selectedFaculty) params.append('faculty', selectedFaculty);
      if (sortType) params.append('sort', sortType);

      // 詳細検索パラメータ
      if (periodYear) params.append('period_year', periodYear);
      if (periodTerm) params.append('period_term', periodTerm);
      if (textbook) params.append('textbook', textbook);
      if (attendance) params.append('attendance', attendance);
      if (gradingType) params.append('grading_type', gradingType);
      if (contentDifficulty) params.append('content_difficulty', contentDifficulty);
      if (contentQuality) params.append('content_quality', contentQuality);

      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures?${params.toString()}`, {
        next: { revalidate: 60 }
      });

      if (!response.ok) throw new Error(response.statusText);
      const data: LecturesResponse = await response.json();

      setFetchedLectures(data.lectures);
      setPaginationInfo(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      handleAjaxError("授業の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialSearchWord = sessionStorage.getItem('searchWord') || '';
    const initialSelectedFaculty = sessionStorage.getItem('selectedFaculty') || '';
    const initialSortType = sessionStorage.getItem('sortType') || 'newest';

    setSearchWord(initialSearchWord);
    setSelectedFaculty(initialSelectedFaculty);
    setSortType(initialSortType);

    fetchLectures(1);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('searchWord', searchWord);
    sessionStorage.setItem('selectedFaculty', selectedFaculty);
    sessionStorage.setItem('sortType', sortType);
  }, [searchWord, selectedFaculty, sortType]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLectures(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= paginationInfo.total_pages) {
      fetchLectures(page);
    }
  };

  const handleSelectChange = (setStateFunc: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStateFunc(e.target.value);
    };

  const clearDetailedSearch = () => {
    setPeriodYear('');
    setPeriodTerm('');
    setTextbook('');
    setAttendance('');
    setGradingType('');
    setContentDifficulty('');
    setContentQuality('');
  };

  const renderPagination = () => {
    if (paginationInfo.total_pages <= 1) return null;

    const pages = [];
    const current = paginationInfo.current_page;
    const total = paginationInfo.total_pages;

    // 前のページ
    if (current > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(current - 1)}
          className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          前へ
        </button>
      );
    }

    // ページ番号
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, current + 2);

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2 py-2 text-gray-500">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 mx-1 text-sm font-medium rounded-md ${i === current
            ? 'text-white bg-green-600 border border-green-600'
            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < total) {
      if (endPage < total - 1) {
        pages.push(<span key="ellipsis2" className="px-2 py-2 text-gray-500">...</span>);
      }
      pages.push(
        <button
          key={total}
          onClick={() => handlePageChange(total)}
          className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {total}
        </button>
      );
    }

    // 次のページ
    if (current < total) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(current + 1)}
          className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          次へ
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-8 mb-6">
        <div className="flex items-center">
          {pages}
        </div>
      </div>
    );
  };

  const renderLectures = () => {
    return fetchedLectures.map((lecture) => (
      <Link href={`/lectures/${lecture.id}`} key={lecture.id} className="block w-full">
        <div className="mx-auto mb-4 p-4 md:p-5 lg:p-6 rounded-2xl md:rounded-3xl bg-white border border-1 shadow-md w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl hover:bg-green-100 hover:border-1 hover:border-green-400 transform hover:scale-105 transition duration-150">
          {/* メインコンテンツ */}
          <div className="flex flex-col md:flex-row md:items-center">
            {/* タイトルセクション */}
            <div className="w-full md:w-5/12 lg:w-5/12 mb-4 md:mb-0 md:pr-4">
              <h1 className="font-extrabold text-xl sm:text-xl lg:text-2xl text-center md:text-left text-gray-800 leading-tight">
                {lecture.title}
              </h1>
            </div>

            {/* 詳細情報セクション */}
            <div className="w-full md:w-7/12 lg:w-7/12">
              <div className="flex flex-col sm:flex-row sm:items-center">
                {/* 教員・学部情報 */}
                <div className="w-full sm:w-7/12 lg:w-7/12 mb-3 sm:mb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center justify-center sm:justify-start">
                      <FaUser className="text-blue-500 mr-2 text-sm" />
                      <span className="text-gray-700 font-medium text-sm lg:text-base">{lecture.lecturer}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start">
                      <FaUniversity className="text-purple-500 mr-2 text-sm" />
                      <span className="text-gray-600 text-sm lg:text-base">{lecture.faculty}</span>
                    </div>
                  </div>
                </div>

                {/* 評価セクション */}
                <div className="w-full sm:w-5/12 lg:w-5/12 flex flex-col items-center sm:items-end">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl text-yellow-500 font-bold">
                      {lecture.avg_rating}
                    </h2>
                    <ReactStars
                      value={lecture.avg_rating}
                      size={16}
                      edit={false}
                      half={true}
                      className="flex"
                    />
                    <span className="text-sm text-gray-500 font-medium">
                      ({lecture.reviews?.length || 0}件)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative z-10 text-center py-8 px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-screen">
            <div className="text-center">
              <Loading type={"bubbles"} width={200} height={200} color={"#1DBE67"} />
            </div>
          </div>
        ) : (
          <>
            {/* 検索・フィルターセクション */}
            <div className="flex justify-center mb-4 md:mb-8">
              <div className="w-full max-w-6xl">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 lg:p-8 shadow-xl border border-green-100/50">
                  <div className="relative z-10">
                    <div className="flex flex-wrap justify-center items-end gap-4 lg:gap-6 mb-6">
                      {/* 検索ボックス */}
                      <div className="w-full md:w-8/12 lg:w-4/12">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap w-24">
                            <FaSearch className="mr-1 text-green-500" />
                            キーワード
                          </span>
                          <div className="relative flex-1">
                            <input
                              className="w-full px-4 py-3 text-sm lg:text-base border-4 border-green-400 rounded-xl text-gray-800 font-semibold focus:border-green-500 focus:outline-none transition-all duration-300 shadow-inner bg-white/90 backdrop-blur-sm hover:bg-white"
                              placeholder="授業・教授"
                              type="text"
                              ref={searchInput}
                              value={searchWord}
                              onChange={(e) => setSearchWord(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 学部フィルター */}
                      <div className="w-full md:w-5/12 lg:w-3/12">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap w-24">
                            <FaUniversity className="mr-1 text-purple-500" />
                            学部
                          </span>
                          <div className="relative flex-1">
                            <select
                              value={selectedFaculty}
                              onChange={handleSelectChange(setSelectedFaculty)}
                              className="block appearance-none w-full px-4 py-3 text-sm lg:text-base text-gray-500 font-semibold border-4 border-green-400 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white cursor-pointer"
                            >
                              <option value="">全学部</option>
                              <option value="G:教養科目">G:教養科目</option>
                              <option value="H:人文学部">H:人文学部</option>
                              <option value="K:教育学部">K:教育学部</option>
                              <option value="L:法学部">L:法学部</option>
                              <option value="E:経済科学部">E:経済科学部</option>
                              <option value="S:理学部">S:理学部</option>
                              <option value="M:医学部">M:医学部</option>
                              <option value="D:歯学部">D:歯学部</option>
                              <option value="T:工学部">T:工学部</option>
                              <option value="A:農学部">A:農学部</option>
                              <option value="X:創生学部">X:創生学部</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ソート */}
                      <div className="w-full md:w-5/12 lg:w-3/12">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap w-24">
                            <FaStar className="mr-1 text-yellow-500" />
                            並び順
                          </span>
                          <div className="relative flex-1">
                            <select
                              onChange={handleSelectChange(setSortType)}
                              value={sortType}
                              className="block appearance-none w-full px-4 py-3 text-sm lg:text-base text-gray-500 font-semibold border-4 border-green-400 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white cursor-pointer"
                            >
                              <option value="newest">新しい順</option>
                              <option value="highestRating">評価が高い順</option>
                              <option value="mostReviewed">レビュー件数順</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 詳細検索ボタン */}
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={() => setShowDetailedSearch(!showDetailedSearch)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <FaFilter className="mr-2" />
                        詳細検索
                        {showDetailedSearch ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
                      </button>
                    </div>

                    {/* 詳細検索セクション */}
                    {showDetailedSearch && (
                      <div className="border-t border-gray-200 pt-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* 授業を受けた年 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">授業を受けた年</label>
                            <select
                              value={periodYear}
                              onChange={(e) => setPeriodYear(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">選択してください</option>
                              <option value="2025">2025</option>
                              <option value="2024">2024</option>
                              <option value="2023">2023</option>
                              <option value="2022">2022</option>
                              <option value="2021">2021</option>
                              <option value="2020">2020</option>
                              <option value="その他・不明">その他・不明</option>
                            </select>
                          </div>

                          {/* 開講期間 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">開講期間</label>
                            <select
                              value={periodTerm}
                              onChange={(e) => setPeriodTerm(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">選択してください</option>
                              <option value="1ターム">1ターム</option>
                              <option value="2ターム">2ターム</option>
                              <option value="1, 2ターム">1, 2ターム</option>
                              <option value="3ターム">3ターム</option>
                              <option value="4ターム">4ターム</option>
                              <option value="3, 4ターム">3, 4ターム</option>
                              <option value="通年">通年</option>
                              <option value="集中">集中</option>
                              <option value="その他・不明">その他・不明</option>
                            </select>
                          </div>

                          {/* 教科書 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">教科書</label>
                            <select
                              value={textbook}
                              onChange={(e) => setTextbook(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">選択してください</option>
                              <option value="必要">必要</option>
                              <option value="不要">不要</option>
                              <option value="その他・不明">その他・不明</option>
                            </select>
                          </div>

                          {/* 出席確認 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">出席確認</label>
                            <select
                              value={attendance}
                              onChange={(e) => setAttendance(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">選択してください</option>
                              <option value="毎回確認">毎回確認</option>
                              <option value="たまに確認">たまに確認</option>
                              <option value="なし">なし</option>
                              <option value="その他・不明">その他・不明</option>
                            </select>
                          </div>

                          {/* 採点方法 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">採点方法</label>
                            <select
                              value={gradingType}
                              onChange={(e) => setGradingType(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">選択してください</option>
                              <option value="テストのみ">テストのみ</option>
                              <option value="レポートのみ">レポートのみ</option>
                              <option value="テスト,レポート">テスト,レポート</option>
                              <option value="その他・不明">その他・不明</option>
                            </select>
                          </div>

                          {/* 単位取得難易度 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">単位取得難易度</label>
                            <select
                              value={contentDifficulty}
                              onChange={(e) => setContentDifficulty(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">選択してください</option>
                              <option value="とても楽">とても楽</option>
                              <option value="楽">楽</option>
                              <option value="普通">普通</option>
                              <option value="難">難</option>
                              <option value="とても難しい">とても難しい</option>
                            </select>
                          </div>

                          {/* 内容充実度 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">内容充実度</label>
                            <select
                              value={contentQuality}
                              onChange={(e) => setContentQuality(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">選択してください</option>
                              <option value="とても良い">とても良い</option>
                              <option value="良い">良い</option>
                              <option value="普通">普通</option>
                              <option value="悪い">悪い</option>
                              <option value="とても悪い">とても悪い</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-center mt-4 space-x-4">
                          <button
                            onClick={clearDetailedSearch}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            クリア
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 検索ボタン */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleSearch}
                        className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        <FaSearch className="inline-block mr-2" />
                        検索
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 結果表示 */}
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-green-100/50">
                  <p className="text-sm lg:text-base font-medium text-gray-700">
                    <span className="font-bold text-green-600 text-lg">{paginationInfo.total_count}</span>
                    <span className="ml-1">件の授業が見つかりました</span>
                    {paginationInfo.total_pages > 1 && (
                      <span className="ml-2 text-gray-500">
                        （{paginationInfo.current_page} / {paginationInfo.total_pages} ページ）
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 講義リスト */}
            <div className="w-full px-4 sm:px-6 lg:px-8">
              {fetchedLectures.length > 0 ? (
                <>
                  <div className="space-y-0">
                    {renderLectures()}
                  </div>

                  {/* ページネーション */}
                  {renderPagination()}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="mb-4">
                    <FaSearch className="mx-auto text-5xl text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-500 mb-2">該当する授業が見つかりません</h3>
                  <p className="text-gray-400">検索条件を変更してもう一度お試しください</p>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default LectureList