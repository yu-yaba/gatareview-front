'use client'
import { useEffect, useRef, useState } from 'react';
import ReactStars from 'react-stars'
import type { LectureSchema } from '../_types/LectureSchema';
import Link from "next/link";
import { handleAjaxError } from '../_helpers/helpers';
import Loading from 'react-loading';
import type { QueryParameters } from '../_types/QueryParameters';

const LectureList = () => {
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [sortType, setSortType] = useState('')
  const searchInput = useRef<HTMLInputElement>(null);
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);
  const [searchButtonClicked, setSearchButtonClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const fetchLectures = async (queryParameters: QueryParameters) => {
    try {
      setIsLoading(true);
      const searchParams = new URLSearchParams();

      Object.keys(queryParameters).forEach((key) => {
        const value = queryParameters[key];
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
      const queryString = searchParams.toString();

      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures?${queryString}`);
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
    if (searchButtonClicked || selectedFaculty) {
      const queryParameters = { searchWord: searchWord, faculty: selectedFaculty, sortType: sortType };
      fetchLectures(queryParameters);
    }
  }, [searchButtonClicked]);

  useEffect(() => {
    const initialSearchWord = localStorage.getItem('searchWord') || '';
    const initialSelectedFaculty = localStorage.getItem('selectedFaculty') || '';
    const initialSortType = localStorage.getItem('sortType') || '';

    setSearchWord(initialSearchWord);
    setSelectedFaculty(initialSelectedFaculty);
    setSortType(initialSortType);

    const queryParameters = { searchWord: initialSearchWord, faculty: initialSelectedFaculty, sortType: initialSortType };
    fetchLectures(queryParameters);
  }, []);

  useEffect(() => {
    localStorage.setItem('searchWord', searchWord);
    localStorage.setItem('selectedFaculty', selectedFaculty);
    localStorage.setItem('sortType', sortType);
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
    // 最新のレビューの日付を含む授業オブジェクトを作成
    const lecturesWithLatestReviewDate = lectures.map(lecture => {
      const latestReviewDate = lecture.reviews.reduce((latest, review) => {
        const reviewUpdatedAt = new Date(review.updated_at);
        return reviewUpdatedAt > latest ? reviewUpdatedAt : latest;
      }, new Date(0)); // 初期値は1970-01-01

      return { ...lecture, latestReviewDate };
    });

    if (sortType === 'newest') {
      return lecturesWithLatestReviewDate.sort((a, b) => b.latestReviewDate.getTime() - a.latestReviewDate.getTime());
    }
    if (sortType === 'highestRating') {
      return lecturesWithLatestReviewDate.sort((a, b) => b.avg_rating - a.avg_rating);
    }
    if (sortType === 'mostReviewed') {
      return lecturesWithLatestReviewDate.sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0));
    }

    return lecturesWithLatestReviewDate;
  };


  const renderLectures = () => {
    const filteredLectures = fetchedLectures.filter((el) => matchSearchWord(el));
    const sortedLectures = sortLectures(filteredLectures);

    return sortedLectures.map((lecture) => (
      <Link href={`/lectures/${lecture.id}`} key={lecture.id} className='m-3 p-5 rounded-3xl bg-white border border-1 shadow-md inline-block w-10/12 md:w-8/12 2xl:w-7/12 hover:bg-green-100 hover:border-1 hover:border-green-400 transform hover:scale-105 transition  duration-150'>
        <li key={lecture.id}>
          <div className=' flex items-center flex-wrap'>
            <h2 className="inline-block w-full md:w-4/12 font-bold text-2xl my-1 text-center ">{lecture.title}</h2>
            <div className='flex flex-wrap w-full md:w-8/12'>
              <div className="flex flex-row w-full md:w-7/12  justify-center">
                <p className="mx-2 my-3">{lecture.lecturer}</p>
                <p className="mx-2 my-3">{lecture.faculty}</p>
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
              <div className='flex justify-center w-full md:w-7/12 items-center mb-4 md:mb-0'>
                <label className='border-4 w-9/12 text-start pl-4 border-green-400 rounded-lg inline-block py-3 bg-white hover:bg-green-50 text-gray-600 '>
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
                <button
                  onClick={() => {
                    setSearchButtonClicked(!searchButtonClicked);
                  }}
                  className=' bg-green-500 text-white w-2/12 md:w-2/12 text-sm md:text-lg rounded-md py-3 border-2 ml-4 border-green-500'
                >
                  検索
                </button>
              </div>
              <div className='flex flex-wrap justify-around w-full md:w-5/12'>
                <div className="flex justify-center md:ml-4 mr-2 relative w-6/12 md:w-5/12 md:mr-0 text-gray-600">
                  <select
                    id="faculty"
                    name="faculty"
                    value={selectedFaculty}
                    onChange={handleSelectChange(setSelectedFaculty)}
                    className="block appearance-none w-full p-3 px-2 border-4 rounded-lg text-gray-600 border-green-400 outline-none bg-white hover:bg-green-50  cursor-pointer">
                    <option value="">学部で検索</option>
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