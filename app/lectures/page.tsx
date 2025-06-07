'use client'
import { useEffect, useRef, useState } from 'react';
import ReactStars from 'react-stars'
import type { LectureSchema } from '../_types/LectureSchema';
import Link from "next/link";
import { handleAjaxError } from '../_helpers/helpers';
import Loading from 'react-loading';
import { FaSearch, FaBook, FaUser, FaUniversity, FaStar, FaFilter, FaGraduationCap, FaBookOpen } from 'react-icons/fa';

const LectureList = () => {
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [sortType, setSortType] = useState('')
  const searchInput = useRef<HTMLInputElement>(null);
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLectures = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures`, { next: { revalidate: 60 } });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();

      setFetchedLectures(data);
    } catch (error) {
      handleAjaxError("検索条件を入力してください");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialSearchWord = sessionStorage.getItem('searchWord') || '';
    const initialSelectedFaculty = sessionStorage.getItem('selectedFaculty') || 'G:教養科目';
    const initialSortType = sessionStorage.getItem('sortType') || 'newest';

    setSearchWord(initialSearchWord);
    setSelectedFaculty(initialSelectedFaculty);
    setSortType(initialSortType);

    fetchLectures();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('searchWord', searchWord);
    sessionStorage.setItem('selectedFaculty', selectedFaculty);
    sessionStorage.setItem('sortType', sortType);
  }, [searchWord, selectedFaculty, sortType]);

  const updateSearchWord = () => {
    setSearchWord(searchInput.current?.value || '');
  };

  const handleSelectChange = (setStateFunc: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStateFunc(e.target.value);
    };

  const matchSearchWord = (obj: LectureSchema) => {
    const isFacultyMatch = selectedFaculty ? obj.faculty === selectedFaculty : true;
    const { id, created_at, updated_at, ...rest } = obj;
    return isFacultyMatch && Object.values(rest).some((value) =>
      value.toString().toLowerCase().includes(searchWord.toLowerCase())
    );
  };

  const sortLectures = (lectures: Array<LectureSchema>) => {
    if (sortType === 'newest') {
      return lectures.sort((a, b) => {
        const aLatestReviewDate = a.reviews.reduce((latest, review) => new Date(review.created_at) > latest ? new Date(review.created_at) : latest, new Date(0));
        const bLatestReviewDate = b.reviews.reduce((latest, review) => new Date(review.created_at) > latest ? new Date(review.created_at) : latest, new Date(0));
        return bLatestReviewDate.getTime() - aLatestReviewDate.getTime();
      });
    }
    if (sortType === 'highestRating') {
      return lectures.sort((a, b) => b.avg_rating - a.avg_rating);
    }
    if (sortType === 'mostReviewed') {
      return lectures.sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0));
    }
    return lectures;
  };

  const renderLectures = () => {
    const filteredLectures = fetchedLectures.filter((el) => matchSearchWord(el));
    const sortedLectures = sortLectures(filteredLectures);

    return sortedLectures.map((lecture) => (
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
            {/* ヘッダーセクション */}
            <div className="mb-4 md:mb-8">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 leading-tight">
                <span className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 bg-clip-text text-transparent">
                  <FaBook className="inline-block mr-2 md:mr-3 text-green-500 text-xl md:text-3xl lg:text-4xl" />
                  授業一覧
                </span>
              </h1>
            </div>

            {/* 検索・フィルターセクション */}
            <div className="flex justify-center mb-4 md:mb-8">
              <div className="w-full max-w-6xl">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 lg:p-8 shadow-xl border border-green-100/50">
                  <div className="relative z-10">

                    <div className="flex flex-wrap justify-center items-end gap-4 lg:gap-6">
                      {/* 検索ボックス */}
                      <div className="w-full md:w-10/12 lg:w-4/12">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-800 flex items-center whitespace-nowrap w-24">
                            <FaSearch className="mr-1 text-green-500" />
                            キーワード
                          </span>
                          <div className="relative flex-1">
                            <input
                              className="w-full px-4 py-3 text-sm lg:text-base border-4 border-green-400 rounded-xl text-gray-800 font-semibold focus:border-green-500 focus:outline-none transition-all duration-300 shadow-inner bg-white/90 backdrop-blur-sm hover:bg-white"
                              placeholder="授業・教授・学部"
                              type="text"
                              ref={searchInput}
                              value={searchWord}
                              onChange={updateSearchWord}
                            />
                            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 border-green-400" />
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
                              <option disabled value="">学部で検索</option>
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
                  </div>
                </div>
              </div>
            </div>

            {/* 結果表示 */}
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-green-100/50">
                  <p className="text-sm lg:text-base font-medium text-gray-700">
                    <span className="font-bold text-green-600 text-lg">{renderLectures().length}</span>
                    <span className="ml-1">件の授業が見つかりました</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 講義リスト */}
            <div className="w-full px-4 sm:px-6 lg:px-8">
              {renderLectures().length > 0 ? (
                <div className="space-y-0">
                  {renderLectures()}
                </div>
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