'use client'
import { useEffect, useRef, useState } from 'react';
import ReactStars from 'react-stars'
import type { LectureSchema } from '../_types/LectureSchema';
import Link from "next/link";
import { handleAjaxError } from '../_helpers/helpers';
import Loading from 'react-loading';

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
      <Link href={`/lectures/${lecture.id}`} key={lecture.id} className="block">
        <div className="m-3 p-5 rounded-3xl bg-white border border-1 shadow-md inline-block w-10/12 md:w-8/12 2xl:w-7/12 hover:bg-green-100 hover:border-1 hover:border-green-400 transform hover:scale-105 transition duration-150">
          {/* メインコンテンツ */}
          <div className="flex items-center flex-wrap">
            {/* タイトルセクション */}
            <div className="w-full md:w-4/12 mb-4 md:mb-0">
              <h2 className="font-bold text-xl lg:text-2xl text-center md:text-left text-gray-800 leading-tight">
                {lecture.title}
              </h2>
            </div>

            {/* 詳細情報セクション */}
            <div className="w-full md:w-8/12">
              <div className="flex flex-wrap">
                {/* 教員・学部情報 */}
                <div className="w-full lg:w-7/12 flex flex-col space-y-3 mb-4 lg:mb-0">
                  <div className="flex items-center justify-center lg:justify-start">
                    <FaUser className="text-blue-500 mr-2 text-sm" />
                    <span className="text-gray-700 font-medium text-sm lg:text-base">{lecture.lecturer}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start">
                    <FaUniversity className="text-purple-500 mr-2 text-sm" />
                    <span className="text-gray-600 text-sm lg:text-base">{lecture.faculty}</span>
                  </div>
                </div>

                {/* 評価セクション */}
                <div className="w-full lg:w-5/12 flex flex-col items-center lg:items-end">
                  <div className="flex items-center space-x-2 mb-2">
                    <ReactStars
                      value={lecture.avg_rating}
                      size={18}
                      edit={false}
                      half={true}
                      className="flex"
                    />
                    <span className="text-sm text-gray-500 font-medium">
                      ({lecture.reviews?.length || 0}件)
                    </span>
                  </div>
              </div>
              <div className='flex justify-center items-center w-full md:w-5/12'>
                <p className=' mr-2 font-bold text-2xl text-yellow-400'>{lecture.avg_rating}</p>
                <ReactStars value={lecture.avg_rating} size={20} edit={false} half={true} className="flex justify-center" />
                <p className="ml-1 my-3 text-sm">({lecture.reviews?.length || 0})</p>
              </div>
            </div>
          </div>
        </li>
      </Link>
    ));
  };


  return (
    <section className="text-center">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <Loading type={"bubbles"} width={200} height={500} color={"#1DBE67"} />
        </div>
      ) : (
        <>
          <div className="flex justify-center ">
            <div className="flex flex-wrap justify-center items-center w-10/12 2xl:w-7/12 border border-1 py-6 px-3 rounded-2xl shadow-inner bg-slate-50 text-sm md:text-lg font-bold">
              <div className='flex justify-center w-full md:w-6/12 items-center mb-4 md:mb-0 px-2 md:px-4'>
                <label className='border-4 w-full text-start pl-4 border-green-400 rounded-lg inline-block py-3 bg-white hover:bg-green-50 text-gray-600 '>
                  キーワード
                  <input
                    className="ml-2 w-1/2 mr-0 outline-none text-xs md:text-lg  hover:bg-green-50"
                    placeholder="授業・教授・学部"
                    type="text"
                    ref={searchInput}
                    value={searchWord}
                    onChange={updateSearchWord}
                  />
                </label>
              </div>
              <div className='flex flex-wrap justify-around w-full md:w-6/12'>
                <div className="flex justify-center md:ml-4 mr-2 relative w-6/12 md:w-5/12 md:mr-0 text-gray-600">
                  <select
                    id="faculty"
                    name="faculty"
                    value={selectedFaculty}
                    onChange={handleSelectChange(setSelectedFaculty)}
                    className="block appearance-none w-full p-3 px-2 border-4 rounded-lg text-gray-600 border-green-400 outline-none bg-white hover:bg-green-50  cursor-pointer">
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                    </svg>
                  </div>
                </div>
                <div className="flex justify-center md:ml-4 relative w-5/12 md:w-5/12 text-gray-600">
                  <select
                    id="sortType"
                    name="sortType"
                    onChange={handleSelectChange(setSortType)}
                    value={sortType}
                    className="block appearance-none w-full p-3 px-2 border-4 rounded-lg  text-gray-600 border-green-400 outline-none bg-white hover:bg-green-50 cursor-pointer">
                    <option value="newest">新しい順</option>
                    <option value="highestRating">評価が高い順</option>
                    <option value="mostReviewed">レビュー件数順</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className=' flex justify-center mt-6'>
              <div className='flex justify-end w-8/12 text-sm md:text-base 2xl:w-7/12'>
                <p><span className=' font-bold text-green-600'>{renderLectures().length}</span> 件を表示中</p>
              </div>
            </div>
            <ul className="list-none mt-4 p-0">
              {renderLectures()}
            </ul>
          </div>
        </>
      )}
    </section>
  );
};


export default LectureList