'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactStars from 'react-stars'
import type { LectureSchema } from '../_types/LectureSchema';
import Link from "next/link";
import { handleAjaxError } from '../_helpers/helpers';
import Loading from 'react-loading';
import { FaSearch, FaBook, FaUser, FaUniversity, FaStar, FaFilter, FaGraduationCap, FaBookOpen, FaChevronDown, FaChevronUp, FaCalendarAlt, FaClock, FaClipboardList, FaChartLine } from 'react-icons/fa';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

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

interface SearchParams {
  search: string;
  faculty: string;
  sort: string;
  page: number;
  period_year: string;
  period_term: string;
  textbook: string;
  attendance: string;
  grading_type: string;
  content_difficulty: string;
  content_quality: string;
  detailed: string;
}

type SearchParamKey = keyof SearchParams;

const DEFAULT_VALUES = {
  search: '',
  faculty: '',
  sort: 'newest',
  page: 1,
  period_year: '',
  period_term: '',
  textbook: '',
  attendance: '',
  grading_type: '',
  content_difficulty: '',
  content_quality: '',
  detailed: 'false'
} as const;

const LectureList = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 一時的な検索条件（UIの状態）
  const [tempSearchWord, setTempSearchWord] = useState('');
  const [tempSelectedFaculty, setTempSelectedFaculty] = useState('');
  const [tempSortType, setTempSortType] = useState('newest');

  // 確定済みの検索条件（API呼び出し用）
  const [confirmedSearchWord, setConfirmedSearchWord] = useState('');
  const [confirmedSelectedFaculty, setConfirmedSelectedFaculty] = useState('');
  const [confirmedSortType, setConfirmedSortType] = useState('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailedSearch, setShowDetailedSearch] = useState(false);

  // 詳細検索の一時的な状態
  const [tempPeriodYear, setTempPeriodYear] = useState('');
  const [tempPeriodTerm, setTempPeriodTerm] = useState('');
  const [tempTextbook, setTempTextbook] = useState('');
  const [tempAttendance, setTempAttendance] = useState('');
  const [tempGradingType, setTempGradingType] = useState('');
  const [tempContentDifficulty, setTempContentDifficulty] = useState('');
  const [tempContentQuality, setTempContentQuality] = useState('');

  // 詳細検索の確定済み状態
  const [confirmedPeriodYear, setConfirmedPeriodYear] = useState('');
  const [confirmedPeriodTerm, setConfirmedPeriodTerm] = useState('');
  const [confirmedTextbook, setConfirmedTextbook] = useState('');
  const [confirmedAttendance, setConfirmedAttendance] = useState('');
  const [confirmedGradingType, setConfirmedGradingType] = useState('');
  const [confirmedContentDifficulty, setConfirmedContentDifficulty] = useState('');
  const [confirmedContentQuality, setConfirmedContentQuality] = useState('');

  const searchInput = useRef<HTMLInputElement>(null);
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 0,
    total_count: 0,
    per_page: 20
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // URLパラメータを更新する関数
  const updateURL = useCallback((params: Partial<SearchParams>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(params).forEach(([key, value]) => {
      const defaultValue = DEFAULT_VALUES[key as SearchParamKey];
      if (value && value !== '' && value !== defaultValue) {
        current.set(key, value.toString());
      } else {
        current.delete(key);
      }
    });

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // URLパラメータから状態を復元する関数
  const initialState = useMemo(() => {
    const getParam = (key: SearchParamKey, defaultValue: string | number = '') => {
      return searchParams.get(key) || defaultValue.toString();
    };

    // sessionStorageから値を取得する関数（クライアントサイドでのみ実行）
    const getSessionStorageValue = (key: string, fallback: string = '') => {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem(key) || fallback;
      }
      return fallback;
    };

    // URLパラメータがない場合はsessionStorageから取得
    const searchWord = getParam('search') || getSessionStorageValue('searchWord');
    const selectedFaculty = getParam('faculty') || getSessionStorageValue('selectedFaculty');

    return {
      searchWord,
      selectedFaculty,
      sortType: getParam('sort', DEFAULT_VALUES.sort),
      currentPage: parseInt(getParam('page', DEFAULT_VALUES.page)),
      periodYear: getParam('period_year'),
      periodTerm: getParam('period_term'),
      textbook: getParam('textbook'),
      attendance: getParam('attendance'),
      gradingType: getParam('grading_type'),
      contentDifficulty: getParam('content_difficulty'),
      contentQuality: getParam('content_quality'),
      showDetailedSearch: getParam('detailed', DEFAULT_VALUES.detailed) === 'true'
    };
  }, [searchParams]);

  // API呼び出し関数（確定済みの状態のみ使用）
  const fetchLectures = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      params.append('page', page.toString());

      if (confirmedSearchWord) params.append('search', confirmedSearchWord);
      if (confirmedSelectedFaculty) params.append('faculty', confirmedSelectedFaculty);
      if (confirmedSortType) params.append('sort', confirmedSortType);

      // 確定済みの詳細検索パラメータ
      if (confirmedPeriodYear) params.append('period_year', confirmedPeriodYear);
      if (confirmedPeriodTerm) params.append('period_term', confirmedPeriodTerm);
      if (confirmedTextbook) params.append('textbook', confirmedTextbook);
      if (confirmedAttendance) params.append('attendance', confirmedAttendance);
      if (confirmedGradingType) params.append('grading_type', confirmedGradingType);
      if (confirmedContentDifficulty) params.append('content_difficulty', confirmedContentDifficulty);
      if (confirmedContentQuality) params.append('content_quality', confirmedContentQuality);

      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures?${params.toString()}`, {
        next: { revalidate: 60 }
      });

      if (!response.ok) throw new Error(response.statusText);
      const data: LecturesResponse = await response.json();

      setFetchedLectures(data.lectures);
      setPaginationInfo(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fetch lectures error:', error);
      handleAjaxError("授業の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [confirmedSearchWord, confirmedSelectedFaculty, confirmedSortType, confirmedPeriodYear, confirmedPeriodTerm, confirmedTextbook, confirmedAttendance, confirmedGradingType, confirmedContentDifficulty, confirmedContentQuality]);

  // 初期化用のuseEffect
  useEffect(() => {
    // URLパラメータから状態を復元
    setTempSearchWord(initialState.searchWord);
    setTempSelectedFaculty(initialState.selectedFaculty);
    setTempSortType(initialState.sortType);
    setCurrentPage(initialState.currentPage);
    setTempPeriodYear(initialState.periodYear);
    setTempPeriodTerm(initialState.periodTerm);
    setTempTextbook(initialState.textbook);
    setTempAttendance(initialState.attendance);
    setTempGradingType(initialState.gradingType);
    setTempContentDifficulty(initialState.contentDifficulty);
    setTempContentQuality(initialState.contentQuality);
    setShowDetailedSearch(initialState.showDetailedSearch);

    // 確定済み状態も同時に設定
    setConfirmedSearchWord(initialState.searchWord);
    setConfirmedSelectedFaculty(initialState.selectedFaculty);
    setConfirmedSortType(initialState.sortType);
    setConfirmedPeriodYear(initialState.periodYear);
    setConfirmedPeriodTerm(initialState.periodTerm);
    setConfirmedTextbook(initialState.textbook);
    setConfirmedAttendance(initialState.attendance);
    setConfirmedGradingType(initialState.gradingType);
    setConfirmedContentDifficulty(initialState.contentDifficulty);
    setConfirmedContentQuality(initialState.contentQuality);

    // sessionStorageから値を取得した場合はURLパラメータも更新
    if (initialState.searchWord || initialState.selectedFaculty) {
      updateURL({
        search: initialState.searchWord,
        faculty: initialState.selectedFaculty,
        sort: initialState.sortType,
        page: initialState.currentPage,
        period_year: initialState.periodYear,
        period_term: initialState.periodTerm,
        textbook: initialState.textbook,
        attendance: initialState.attendance,
        grading_type: initialState.gradingType,
        content_difficulty: initialState.contentDifficulty,
        content_quality: initialState.contentQuality,
        detailed: initialState.showDetailedSearch.toString()
      });
    }

    // 初回のデータ取得
    setTimeout(() => {
      fetchLectures(initialState.currentPage);
      setIsInitialized(true);
    }, 0);

    // sessionStorageをクリア（一度使用したら削除）
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('searchWord');
      sessionStorage.removeItem('selectedFaculty');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 検索ワード変更時のハンドラー（一時的な状態のみ更新）
  const handleSearchWordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTempSearchWord(e.target.value);
  }, []);

  // 詳細検索表示切り替え時のハンドラー
  const handleDetailedSearchToggle = useCallback(() => {
    setShowDetailedSearch(prev => !prev);
  }, []);

  // 検索実行ハンドラー（確定済み状態を更新してAPI呼び出し）
  const handleSearch = useCallback(() => {
    // 一時的な状態を確定済み状態にコピー
    setConfirmedSearchWord(tempSearchWord);
    setConfirmedSelectedFaculty(tempSelectedFaculty);
    setConfirmedSortType(tempSortType);
    setConfirmedPeriodYear(tempPeriodYear);
    setConfirmedPeriodTerm(tempPeriodTerm);
    setConfirmedTextbook(tempTextbook);
    setConfirmedAttendance(tempAttendance);
    setConfirmedGradingType(tempGradingType);
    setConfirmedContentDifficulty(tempContentDifficulty);
    setConfirmedContentQuality(tempContentQuality);

    setCurrentPage(1);
    setShowDetailedSearch(false);

    // URLパラメータを更新
    updateURL({
      search: tempSearchWord,
      faculty: tempSelectedFaculty,
      sort: tempSortType,
      page: 1,
      period_year: tempPeriodYear,
      period_term: tempPeriodTerm,
      textbook: tempTextbook,
      attendance: tempAttendance,
      grading_type: tempGradingType,
      content_difficulty: tempContentDifficulty,
      content_quality: tempContentQuality,
      detailed: 'false'
    });
  }, [tempSearchWord, tempSelectedFaculty, tempSortType, tempPeriodYear, tempPeriodTerm, tempTextbook, tempAttendance, tempGradingType, tempContentDifficulty, tempContentQuality, updateURL]);

  // 検索実行時のAPI呼び出し（初期化完了後のみ）
  useEffect(() => {
    if (isInitialized) {
      fetchLectures(1);
      setCurrentPage(1);
    }
  }, [isInitialized, confirmedSearchWord, confirmedSelectedFaculty, confirmedSortType, confirmedPeriodYear, confirmedPeriodTerm, confirmedTextbook, confirmedAttendance, confirmedGradingType, confirmedContentDifficulty, confirmedContentQuality, fetchLectures]);

  // ページ変更ハンドラー（確定済み状態を使用）
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= paginationInfo.total_pages) {
      setCurrentPage(page);

      updateURL({
        search: confirmedSearchWord,
        faculty: confirmedSelectedFaculty,
        sort: confirmedSortType,
        page: page,
        period_year: confirmedPeriodYear,
        period_term: confirmedPeriodTerm,
        textbook: confirmedTextbook,
        attendance: confirmedAttendance,
        grading_type: confirmedGradingType,
        content_difficulty: confirmedContentDifficulty,
        content_quality: confirmedContentQuality,
        detailed: showDetailedSearch.toString()
      });

      fetchLectures(page);
    }
  }, [paginationInfo.total_pages, confirmedSearchWord, confirmedSelectedFaculty, confirmedSortType, confirmedPeriodYear, confirmedPeriodTerm, confirmedTextbook, confirmedAttendance, confirmedGradingType, confirmedContentDifficulty, confirmedContentQuality, showDetailedSearch, updateURL, fetchLectures]);

  // 選択変更ハンドラー（一時的な状態のみ更新）
  const handleSelectChange = useCallback((setStateFunc: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStateFunc(e.target.value);
    }, []);

  // 詳細検索クリアハンドラー
  const clearDetailedSearch = useCallback(() => {
    setTempPeriodYear('');
    setTempPeriodTerm('');
    setTempTextbook('');
    setTempAttendance('');
    setTempGradingType('');
    setTempContentDifficulty('');
    setTempContentQuality('');
  }, []);

  // ページネーション要素をメモ化
  const paginationElements = useMemo(() => {
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
  }, [paginationInfo.current_page, paginationInfo.total_pages, handlePageChange]);

  // 講義リストをメモ化
  const lectureElements = useMemo(() => {
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
  }, [fetchedLectures]);

  return (
    <div className="min-h-screen bg-white">
      {/* SEO用のメタデータ */}
      <div style={{ display: 'none' }}>
        <h1>授業レビュー検索 - {paginationInfo.total_count}件の授業</h1>
        <p>新潟大学の授業レビューを検索できます。{confirmedSearchWord && `「${confirmedSearchWord}」の検索結果`}</p>
      </div>

      <section className="relative z-10 text-center py-8 px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-screen" role="status" aria-label="読み込み中">
            <div className="text-center">
              <Loading type={"bubbles"} width={200} height={200} color={"#1DBE67"} />
              <p className="sr-only">授業データを読み込んでいます...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 検索・フィルターセクション */}
            <div className="flex justify-center mb-4 md:mb-8">
              <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-5 lg:p-8 shadow-xl border border-green-100/50">
                  <div className="relative z-10">
                    {/* 768px以上では横並び、モバイルでは縦並び */}
                    <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12">
                      {/* 左側：メイン検索フィルター */}
                      <div className="flex-1 mb-6 md:mb-0">
                        <div className="space-y-3 md:space-y-4">
                          {/* 検索ボックス - 768px以上では全幅利用 */}
                          <div className="w-full">
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                              <label htmlFor="search-input" className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap flex-[3] sm:w-24 sm:flex-none md:w-20 lg:w-24">
                                <FaSearch className="mr-1 text-green-500" aria-hidden="true" />
                                <span className="truncate">キーワード</span>
                              </label>
                              <div className="relative flex-[7] sm:flex-1">
                                <input
                                  id="search-input"
                                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm lg:text-base border-4 border-green-400 rounded-xl text-gray-800 font-semibold focus:border-green-500 focus:outline-none transition-all duration-300 shadow-inner bg-white/90 backdrop-blur-sm hover:bg-white"
                                  placeholder="授業・教授"
                                  type="text"
                                  ref={searchInput}
                                  value={tempSearchWord}
                                  onChange={handleSearchWordChange}
                                  aria-describedby="search-help"
                                />
                                <p id="search-help" className="sr-only">授業名または教授名で検索できます</p>
                              </div>
                            </div>
                          </div>

                          {/* 学部フィルターと並び順 - レスポンシブグリッド */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
                            {/* 学部フィルター */}
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                              <label htmlFor="faculty-select" className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap flex-[3] sm:w-16 sm:flex-none md:w-12 lg:w-16">
                                <FaUniversity className="mr-1 text-purple-500" aria-hidden="true" />
                                <span className="truncate">学部</span>
                              </label>
                              <div className="relative flex-[7] sm:flex-1">
                                <select
                                  id="faculty-select"
                                  value={tempSelectedFaculty}
                                  onChange={handleSelectChange(setTempSelectedFaculty)}
                                  className="block appearance-none w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm lg:text-base text-gray-500 font-semibold border-4 border-green-400 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white cursor-pointer"
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
                                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* ソート */}
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                              <label htmlFor="sort-select" className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap flex-[3] sm:w-16 sm:flex-none md:w-14 lg:w-16">
                                <FaStar className="mr-1 text-yellow-500" aria-hidden="true" />
                                <span className="truncate">並び順</span>
                              </label>
                              <div className="relative flex-[7] sm:flex-1">
                                <select
                                  id="sort-select"
                                  onChange={handleSelectChange(setTempSortType)}
                                  value={tempSortType}
                                  className="block appearance-none w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm lg:text-base text-gray-500 font-semibold border-4 border-green-400 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white cursor-pointer"
                                >
                                  <option value="newest">最新レビュー順</option>
                                  <option value="highestRating">評価の高い順</option>
                                  <option value="mostReviewed">レビュー数の多い順</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 右側：ボタンセクション（768px以上で固定幅） */}
                      <div className="flex flex-col items-center justify-center space-y-4 md:w-48 lg:w-52 xl:w-56">
                        {/* 詳細検索ボタン */}
                        <button
                          onClick={handleDetailedSearchToggle}
                          className={`flex items-center px-6 py-3 font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg w-full justify-center ${showDetailedSearch
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25'
                            : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-200'
                            }`}
                          aria-expanded={showDetailedSearch}
                          aria-controls="detailed-search-panel"
                        >
                          <FaFilter className="mr-2 transform transition-transform duration-300" aria-hidden="true" />
                          詳細検索
                          <div className="ml-2 transform transition-transform duration-300">
                            {showDetailedSearch ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                          </div>
                        </button>

                        {/* 検索ボタン */}
                        <button
                          onClick={handleSearch}
                          className="w-full px-12 py-4 bg-gradient-to-r from-[#1DBE67] to-[#15A85A] text-white font-bold rounded-2xl hover:from-[#15A85A] hover:to-[#12A150] transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-[#1DBE67]/25 flex items-center justify-center relative overflow-hidden group"
                          aria-label="現在の検索条件で授業を検索"
                        >
                          <FaSearch className="mr-3 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" aria-hidden="true" />
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

                    {/* 詳細検索セクション */}
                    {showDetailedSearch && (
                      <div id="detailed-search-panel" className="border-t border-gradient-to-r from-transparent via-gray-200 to-transparent pt-6 lg:pt-8 mb-6 lg:mb-8 animate-fadeIn">
                        <div className="bg-gradient-to-br from-white/95 via-white/98 to-emerald-50/30 backdrop-blur-sm rounded-2xl p-4 sm:p-5 lg:p-6 shadow-inner border border-emerald-100/50">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 lg:mb-6 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            🔍 詳細検索オプション
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                            {/* 授業を受けた年 */}
                            <div className="group">
                              <label htmlFor="period-year" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaCalendarAlt className="text-blue-500 mr-2 text-sm" aria-hidden="true" />
                                授業を受けた年
                              </label>
                              <select
                                id="period-year"
                                value={tempPeriodYear}
                                onChange={handleSelectChange(setTempPeriodYear)}
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
                              <label htmlFor="period-term" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaClock className="text-emerald-500 mr-2 text-sm" aria-hidden="true" />
                                開講期間
                              </label>
                              <select
                                id="period-term"
                                value={tempPeriodTerm}
                                onChange={handleSelectChange(setTempPeriodTerm)}
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
                              <label htmlFor="textbook" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaBookOpen className="text-amber-500 mr-2 text-sm" aria-hidden="true" />
                                教科書
                              </label>
                              <select
                                id="textbook"
                                value={tempTextbook}
                                onChange={handleSelectChange(setTempTextbook)}
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
                              <label htmlFor="attendance" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaClipboardList className="text-rose-500 mr-2 text-sm" aria-hidden="true" />
                                出席確認
                              </label>
                              <select
                                id="attendance"
                                value={tempAttendance}
                                onChange={handleSelectChange(setTempAttendance)}
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
                              <label htmlFor="grading-type" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaGraduationCap className="text-violet-500 mr-2 text-sm" aria-hidden="true" />
                                採点方法
                              </label>
                              <select
                                id="grading-type"
                                value={tempGradingType}
                                onChange={handleSelectChange(setTempGradingType)}
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
                              <label htmlFor="content-difficulty" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaChartLine className="text-orange-500 mr-2 text-sm" aria-hidden="true" />
                                単位取得難易度
                              </label>
                              <select
                                id="content-difficulty"
                                value={tempContentDifficulty}
                                onChange={handleSelectChange(setTempContentDifficulty)}
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
                              <label htmlFor="content-quality" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <FaStar className="text-yellow-500 mr-2 text-sm" aria-hidden="true" />
                                内容充実度
                              </label>
                              <select
                                id="content-quality"
                                value={tempContentQuality}
                                onChange={handleSelectChange(setTempContentQuality)}
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
                              aria-label="詳細検索の設定をクリア"
                            >
                              🗑️ クリア
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


            {/* 結果表示 */}
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-green-100/50" role="status" aria-live="polite">
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
                    {lectureElements}
                  </div>

                  {/* ページネーション */}
                  {paginationElements}

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