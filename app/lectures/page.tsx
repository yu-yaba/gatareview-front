'use client'
import { useEffect, useRef, useState } from 'react';
import ReactStars from 'react-stars'
import { LectureSchema } from '../types/LectureSchema';
import Link from "next/link";
import { handleAjaxError } from '../helpers/helpers';
import { useRouter } from 'next/navigation';
import Loading from 'react-loading';

const LectureList = () => {
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [sortType, setSortType] = useState('')
  const searchInput = useRef<HTMLInputElement>(null);
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);
  const [searchButtonClicked, setSearchButtonClicked] = useState(false);
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchWord || selectedFaculty) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          const query = [
            searchWord && `searchWord=${searchWord}`,
            selectedFaculty && `faculty=${selectedFaculty}`,
            sortType && `sortType=${sortType}`,
          ].filter(Boolean).join('&');
          const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v2/lectures?${query}`);
          if (!response.ok) throw Error(response.statusText);
          const data = await response.json();

          setFetchedLectures(data);
        } catch (error) {
          handleAjaxError("検索条件を入力してください");
        }
        setIsLoading(false);
      };

      fetchData();
      console.log(fetchedLectures)
    }
  }, [searchButtonClicked, selectedFaculty]);


  useEffect(() => {
    const initialSearchWord = localStorage.getItem('searchWord');
    const initialSelectedFaculty = localStorage.getItem('selectedFaculty');
    const initialSortType = localStorage.getItem('sortType');

    if (initialSearchWord || initialSelectedFaculty || initialSortType) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          const query = [
            initialSearchWord && `searchWord=${initialSearchWord}`,
            initialSelectedFaculty && `faculty=${initialSelectedFaculty}`,
            initialSortType && `sortType=${initialSortType}`
          ].filter(Boolean).join('&');
          const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v2/lectures?${query}`);
          if (!response.ok) throw Error(response.statusText);
          const data = await response.json();
          setFetchedLectures(data);
        } catch (error) {
          handleAjaxError("検索条件を入力してください");
        }
        setIsLoading(false);
      };

      fetchData();
    }

    if (initialSearchWord) setSearchWord(initialSearchWord);
    if (initialSelectedFaculty) setSelectedFaculty(initialSelectedFaculty);
    if (initialSortType) setSortType(initialSortType);

  }, []);

  useEffect(() => {
    const savedSearchWord = localStorage.getItem('searchWord');
    const savedSelectedFaculty = localStorage.getItem('selectedFaculty');
    const savedSortType = localStorage.getItem('sortType');

    if (savedSearchWord) setSearchWord(savedSearchWord);
    if (savedSelectedFaculty) setSelectedFaculty(savedSelectedFaculty);
    if (savedSortType) setSortType(savedSortType);
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
    const isFacultyMatch = selectedFaculty ? obj.faculty === selectedFaculty : true; // 追加
    const { id, created_at, updated_at, ...rest } = obj;
    return isFacultyMatch && Object.values(rest).some((value) => // 編集
      value.toString().toLowerCase().indexOf(searchWord.toLowerCase()) > -1
    );
  };
  const sortLectures = (lectures: Array<LectureSchema>) => {
    if (sortType === 'newest') {
      return lectures.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
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
    const limitedLectures = sortedLectures.slice(0, 100);

    return limitedLectures.map((lecture) => (
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
          <Loading type={"bubbles"} color={"#1DBE67"} />
        </div>
      ) : (
        <>
          <div className="flex justify-center ">
            <div className="flex flex-wrap justify-center items-center w-10/12 2xl:w-7/12 border border-1 py-6 px-3 rounded-2xl shadow-inner bg-slate-50 text-sm md:text-lg font-bold">
              <div className='flex justify-center w-full md:w-7/12 items-center mb-4 md:mb-0'>
                <label className='border-4 w-9/12 text-start pl-4 border-green-400 rounded-lg inline-block py-3 bg-white hover:bg-green-50 text-gray-600 '>
                  キーワード
                  <input
                    className="ml-2 w-1/2 mr-0 outline-none  hover:bg-green-50"
                    placeholder="授業・教授・学部"
                    type="text"
                    ref={searchInput}
                    value={searchWord}
                    onChange={updateSearchWord}
                  />
                </label>
                <button
                  onClick={() => {
                    const query = [
                      searchWord && `searchWord=${searchWord}`,
                      selectedFaculty && `faculty=${selectedFaculty}`,
                      sortType && `sortType=${sortType}`
                    ].filter(Boolean).join('&');
                    router.push(`/lectures?${query}`);
                    setSearchButtonClicked(true);
                  }}
                  className=' bg-green-500 text-white w-2/12 md:w-2/12 text-sm md:text-lg rounded-md py-3 border border-2 ml-2 border-green-500'
                >
                  検索
                </button>
              </div>
              <div className='flex flex-wrap justify-center w-full md:w-5/12'>
                <div className="flex justify-center md:ml-4 relative w-5/12 md:w-5/12 text-gray-600">
                  <select
                    id="faculty"
                    name="faculty"
                    value={selectedFaculty}
                    onChange={handleSelectChange(setSelectedFaculty)}
                    className="block appearance-none w-full p-3 px-2 border-4 rounded-lg text-gray-600 border-green-400 outline-none hover:bg-green-50  cursor-pointer">
                    <option value="">学部で検索</option>
                    <option value="G: 教養科目">G: 教養科目</option>
                    <option value="H: 人文学部">H: 人文学部</option>
                    <option value="K: 教育学部">K: 教育学部</option>
                    <option value="L: 法学部">L: 法学部</option>
                    <option value="E: 経済科学部">E: 経済科学部</option>
                    <option value="S: 理学部">S: 理学部</option>
                    <option value="M: 医学部">M: 医学部</option>
                    <option value="D: 歯学部">D: 歯学部</option>
                    <option value="T: 工学部">T: 工学部</option>
                    <option value="A: 農学部">A: 農学部</option>
                    <option value="X: 創生学部">X: 創生学部</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                    </svg>
                  </div>
                </div>
                <div className="flex justify-center ml-2 md:ml-4 relative w-5/12 md:w-5/12 text-gray-600">
                  <select
                    id="sortType"
                    name="sortType"
                    onChange={handleSelectChange(setSortType)}
                    value={sortType}
                    className="block appearance-none w-full p-3 px-2 border-4 rounded-lg text-gray-600 border-green-400 outline-none hover:bg-green-50 cursor-pointer">
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