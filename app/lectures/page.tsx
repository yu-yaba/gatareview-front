'use client'
import { useEffect, useRef, useState } from 'react';
import ReactStars from 'react-stars'
import type { LectureSchema } from '../_types/LectureSchema';
import Link from "next/link";
import { handleAjaxError } from '../_helpers/helpers';
import Loading from 'react-loading';
import { FaSearch, FaBook, FaUser, FaUniversity, FaStar, FaFilter, FaGraduationCap, FaBookOpen, FaChevronDown, FaChevronUp, FaCalendarAlt, FaClock, FaClipboardList, FaChartLine } from 'react-icons/fa';

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

    // ページ番号（表示範囲を狭く）
    let startPage = Math.max(1, current - 1);
    let endPage = Math.min(total, current + 1);

    // 最初のページが範囲外の場合のみ表示
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="flex items-center justify-center w-16 h-12 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="flex items-center justify-center w-12 h-12 text-gray-400 text-sm">...</span>);
      }
    }

    // メインのページ番号
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`flex items-center justify-center w-16 h-12 text-sm font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${i === current
            ? 'text-white bg-gradient-to-r from-[#1DBE67] to-[#15A85A] border border-[#1DBE67] shadow-[#1DBE67]/20'
            : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
        >
          {i}
        </button>
      );
    }

    // 最後のページが範囲外の場合のみ表示
    if (endPage < total) {
      if (endPage < total - 1) {
        pages.push(<span key="ellipsis2" className="flex items-center justify-center w-12 h-12 text-gray-400 text-sm">...</span>);
      }
      pages.push(
        <button
          key={total}
          onClick={() => handlePageChange(total)}
          className="flex items-center justify-center w-16 h-12 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {total}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-8 mb-6 px-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
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
              <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-5 lg:p-8 shadow-xl border border-green-100/50">
                  <div className="relative z-10">
                    {/* メイン検索フィルター */}
                    <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-4 lg:gap-6 mb-6">
                      {/* 検索ボックス */}
                      <div className="md:col-span-12 lg:col-span-5 xl:col-span-4">
                        <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-3">
                          <label className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap md:w-20 lg:w-24">
                            <FaSearch className="mr-1 text-green-500" />
                            キーワード
                          </label>
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
                      <div className="md:col-span-6 lg:col-span-3 xl:col-span-4">
                        <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-3">
                          <label className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap md:w-12 lg:w-16">
                            <FaUniversity className="mr-1 text-purple-500" />
                            学部
                          </label>
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
                      <div className="md:col-span-6 lg:col-span-4 xl:col-span-4">
                        <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-3">
                          <label className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap md:w-14 lg:w-16">
                            <FaStar className="mr-1 text-yellow-500" />
                            並び順
                          </label>
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
                        className={`flex items-center px-6 py-3 font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${showDetailedSearch
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-200'
                          }`}
                      >
                        <FaFilter className="mr-2 transform transition-transform duration-300" />
                        詳細検索
                        <div className="ml-2 transform transition-transform duration-300">
                          {showDetailedSearch ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                      </button>
                    </div>

                    {/* 詳細検索セクション */}
                    {showDetailedSearch && (
                      <div className="border-t border-gradient-to-r from-transparent via-gray-200 to-transparent pt-6 lg:pt-8 mb-6 lg:mb-8 animate-fadeIn">
                        <div className="bg-gradient-to-br from-white/95 via-white/98 to-emerald-50/30 backdrop-blur-sm rounded-2xl p-4 sm:p-5 lg:p-6 shadow-inner border border-emerald-100/50">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 lg:mb-6 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            🔍 詳細検索オプション
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                            {/* 授業を受けた年 */}
                            <div className="group">
                              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaCalendarAlt className="text-blue-500 mr-2 text-sm" />
                                授業を受けた年
                              </label>
                              <select
                                value={periodYear}
                                onChange={(e) => setPeriodYear(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/90 hover:bg-white hover:border-blue-300 group-hover:shadow-md"
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
                            <div className="group">
                              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaClock className="text-emerald-500 mr-2 text-sm" />
                                開講期間
                              </label>
                              <select
                                value={periodTerm}
                                onChange={(e) => setPeriodTerm(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/90 hover:bg-white hover:border-emerald-300 group-hover:shadow-md"
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
                            <div className="group">
                              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaBookOpen className="text-amber-500 mr-2 text-sm" />
                                教科書
                              </label>
                              <select
                                value={textbook}
                                onChange={(e) => setTextbook(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 bg-white/90 hover:bg-white hover:border-amber-300 group-hover:shadow-md"
                              >
                                <option value="">選択してください</option>
                                <option value="必要">必要</option>
                                <option value="不要">不要</option>
                                <option value="その他・不明">その他・不明</option>
                              </select>
                            </div>

                            {/* 出席確認 */}
                            <div className="group">
                              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaClipboardList className="text-rose-500 mr-2 text-sm" />
                                出席確認
                              </label>
                              <select
                                value={attendance}
                                onChange={(e) => setAttendance(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-300 bg-white/90 hover:bg-white hover:border-rose-300 group-hover:shadow-md"
                              >
                                <option value="">選択してください</option>
                                <option value="毎回確認">毎回確認</option>
                                <option value="たまに確認">たまに確認</option>
                                <option value="なし">なし</option>
                                <option value="その他・不明">その他・不明</option>
                              </select>
                            </div>

                            {/* 採点方法 */}
                            <div className="group">
                              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaGraduationCap className="text-violet-500 mr-2 text-sm" />
                                採点方法
                              </label>
                              <select
                                value={gradingType}
                                onChange={(e) => setGradingType(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-300 bg-white/90 hover:bg-white hover:border-violet-300 group-hover:shadow-md"
                              >
                                <option value="">選択してください</option>
                                <option value="テストのみ">テストのみ</option>
                                <option value="レポートのみ">レポートのみ</option>
                                <option value="テスト,レポート">テスト,レポート</option>
                                <option value="その他・不明">その他・不明</option>
                              </select>
                            </div>

                            {/* 単位取得難易度 */}
                            <div className="group">
                              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaChartLine className="text-orange-500 mr-2 text-sm" />
                                単位取得難易度
                              </label>
                              <select
                                value={contentDifficulty}
                                onChange={(e) => setContentDifficulty(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/90 hover:bg-white hover:border-orange-300 group-hover:shadow-md"
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
                            <div className="group">
                              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaStar className="text-yellow-500 mr-2 text-sm" />
                                内容充実度
                              </label>
                              <select
                                value={contentQuality}
                                onChange={(e) => setContentQuality(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all duration-300 bg-white/90 hover:bg-white hover:border-yellow-300 group-hover:shadow-md"
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

                          <div className="flex justify-center mt-8 space-x-4">
                            <button
                              onClick={clearDetailedSearch}
                              className="px-6 py-2 text-sm font-medium text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-gray-200"
                            >
                              🗑️ クリア
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 検索ボタン */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleSearch}
                        className="px-12 py-4 bg-gradient-to-r from-[#1DBE67] to-[#15A85A] text-white font-bold rounded-2xl hover:from-[#15A85A] hover:to-[#12A150] transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-[#1DBE67]/25 flex items-center justify-center relative overflow-hidden group"
                      >
                        <FaSearch className="mr-3 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                        <span className="relative z-10">検索する</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#22C55E] to-[#1DBE67] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>

                        {/* キラキラエフェクト */}
                        <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-pulse opacity-0 group-hover:opacity-100"></div>
                        <div className="absolute bottom-3 left-3 w-1 h-1 bg-white rounded-full animate-pulse opacity-0 group-hover:opacity-100 delay-100"></div>
                        <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-white rounded-full animate-pulse opacity-0 group-hover:opacity-100 delay-200"></div>
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