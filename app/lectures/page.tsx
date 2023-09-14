'use client'
import { useEffect, useRef, useState } from 'react';
import ReactStars from 'react-stars'
import { LectureSchema } from '../types/LectureSchema';
import Link from "next/link";
import { handleAjaxError } from '../helpers/helpers';
import { useRouter } from 'next/navigation';

const LectureList = () => {
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [sortType, setSortType] = useState('')
  const searchInput = useRef<HTMLInputElement>(null);
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);
  const [searchButtonClicked, setSearchButtonClicked] = useState(false);
  const router = useRouter()

  useEffect(() => {
    if (searchWord || selectedFaculty) {
      const fetchData = async () => {
        try {
          const query = [
            searchWord && `searchWord=${searchWord}`,
            selectedFaculty && `faculty=${selectedFaculty}`,
            sortType && `sortType=${sortType}`,
          ].filter(Boolean).join('&');
          const response = await fetch(`http://localhost:3000/api/v2/lectures?${query}`);
          if (!response.ok) throw Error(response.statusText);
          const data = await response.json();

          setFetchedLectures(data);
        } catch (error) {
          handleAjaxError("検索条件を入力してください");
        }
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
          const query = [
            initialSearchWord && `searchWord=${initialSearchWord}`,
            initialSelectedFaculty && `faculty=${initialSelectedFaculty}`,
            initialSortType && `sortType=${initialSortType}`
          ].filter(Boolean).join('&');
          const response = await fetch(`http://localhost:3000/api/v2/lectures?${query}`);
          if (!response.ok) throw Error(response.statusText);
          const data = await response.json();
          setFetchedLectures(data);
        } catch (error) {
          handleAjaxError("検索条件を入力してください");
        }
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
      <Link href={`/lectures/${lecture.id}`} key={lecture.id} className='m-5 p-4 rounded-full bg-opacity-100 bg-white shadow-lg inline-block w-8/12 hover:bg-green-100 hover:text-black transform hover:scale-105 transition ease-in-out duration-150'>
        <li key={lecture.id}>
          <h2 className="inline-block mx-2 my-1 text-center">{lecture.title}</h2>
          <div className="flex flex-row justify-center">
            <p className="mx-2 my-3">{lecture.lecturer}</p>
            <p className="mx-2 my-3">{lecture.faculty}</p>
            <p className="mx-2 my-3">{lecture.reviews?.length || 0} レビュー</p>
          </div>
          <ReactStars value={lecture.avg_rating} size={30} edit={false} half={true} className="flex justify-center" />
          <p>{lecture.avg_rating}</p>
        </li>
      </Link>
    ));
  };


  return (
    <section className="text-center">
      <div className="flex justify-center">
        <div className="flex justify-center w-full mx-10">
          <label className='border-4 border-green-400 rounded-lg inline-block py-3 hover:bg-green-50 font-bold text-gray-600'>
            キーワード
            <input
              className="ml-2 w-1/2 mr-0 outline-none hover:bg-green-50"
              placeholder="授業・教授・学部"
              type="text"
              ref={searchInput}
              value={searchWord}
              onChange={updateSearchWord}
            />
          </label>
          <select id="faculty" name="faculty" onChange={handleSelectChange(setSelectedFaculty)} value={selectedFaculty} className=" font-bold p-3 px-5 ml-7 w-1/7 border-4 rounded-lg text-gray-600 border-green-400 outline-none hover:bg-green-50">
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
          <select
            id="sortType"
            name="sortType"
            onChange={handleSelectChange(setSortType)}
            value={sortType}
            className="font-bold p-3 px-5 ml-7 w-1/7 border-4 rounded-lg text-gray-600 border-green-400 outline-none hover:bg-green-50"
          >
            <option value="newest">新しい順</option>
            <option value="highestRating">評価が高い順</option>
            <option value="mostReviewed">レビュー件数順</option>
          </select>
          <button onClick={() => {
            const query = [
              searchWord && `searchWord=${searchWord}`,
              selectedFaculty && `faculty=${selectedFaculty}`,
              sortType && `sortType=${sortType}`
            ].filter(Boolean).join('&');
            router.push(`/lectures?${query}`);
            setSearchButtonClicked(true);
          }}>
            検索
          </button>
        </div>
      </div>
      <div>
        <p>{renderLectures().length}件を表示中</p>
        <ul className="list-none mt-10 p-0">
          {renderLectures()}
        </ul>
      </div>
    </section>
  );
};


export default LectureList