'use client'
import Head from 'next/head'
import { useEffect, useRef, useState } from 'react';
import { LectureData } from '../types/LectureData';
import ReactStarsRating from 'react-awesome-stars-rating';
import { LectureSchema } from '../types/LectureSchema';
import Pagination from '../components/Pagination';
import Link from "next/link";
import { handleAjaxError } from '../helpers/helpers';


const LectureList = ({ lectures }: { lectures: Array<LectureSchema> }) => {
  const [searchWord, setSearchWord] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);


  // 1ページあたりのレクチャー数
  const lecturesPerPage = 10;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/v2/lectures`);
        if (!response.ok) throw Error(response.statusText);
        const data = await response.json();
        setFetchedLectures(data);
      } catch (error) {
        handleAjaxError("データが取得できませんでした");
      }
    };
    fetchData();
  }, []);

  const updateSearchWord = () => {
    // useRef.currentで参照した値に更新
    setSearchWord(searchInput.current?.value || '');
  };

  const matchSearchWord = (obj: LectureSchema) => {
    // eslint-disable-next-line camelcase
    const { id, created_at, updated_at, ...rest } = obj;
    return Object.values(rest).some((value) =>
      value
        .toString()
        .toLowerCase()
        .indexOf(searchWord.toLowerCase()) > -1
    );
  };

  const renderLectures = () => {
    const filteredLectures = fetchedLectures.filter((el) => matchSearchWord(el));



    return filteredLectures
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .map((lecture) => (

        <Link href={`/lectures/${lecture.id}`} key={lecture.id} className='m-5 p-4 rounded-full bg-opacity-100 bg-white shadow-lg inline-block w-8/12 hover:bg-green-100 hover:text-black transform hover:scale-105 transition ease-in-out duration-150'>
          <li key={lecture.id}>
            <h2 className="inline-block mx-2 my-1 text-center">{lecture.title}</h2>
            <div className="flex flex-row justify-center">
              <p className="mx-2 my-3">{lecture.lecturer}</p>
              <p className="mx-2 my-3">{lecture.faculty}</p>
            </div>
            <ReactStarsRating value={lecture.avg_rating} isEdit={false} isHalf className=" flex justify-center" />
          </li>
        </Link>
      ));
  };


  return (
    <section className="text-center">
      <div className="flex justify-center">
        <div className="flex justify-center w-full mx-10">
          <input
            className="p-2 border border-opacity-10 rounded focus:outline-green-600 focus:ring focus:ring-green-200 mx-5 w-1/3 shadow-lg"
            placeholder="授業・教授・学部"
            type="text"
            ref={searchInput}
            onKeyUp={updateSearchWord}
          />
        </div>
      </div>
      <div>
        <ul className="list-none mt-10 p-0">
          {renderLectures()}
        </ul>
      </div>
    </section>
  );
};


export default LectureList