'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BasicSlider from './_components/Slider';
import './globals.css';
import AuthButtons from './_components/AuthButtons';


export default function Page() {
  const [totalReviews, setTotalReviews] = useState(null);
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/total`)
      .then(response => response.json())
      .then(data => {
        setTotalReviews(data.count);
      })
      .catch(err => {
        console.error('Failed to fetch review count:', err);
      });
  }, []);

  const handleSearch = () => {
    sessionStorage.setItem('searchWord', searchWord);
    sessionStorage.setItem('selectedFaculty', selectedFaculty);
    router.push('/lectures');
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className='flex justify-center'>
      <div className='w-full'>
        {/* Add AuthButtons component here */}
        <div className="my-4 flex justify-center">
          <AuthButtons />
        </div>
        <div className='text-center font-extrabold text-3xl text-slate-700 mt-7 lg:mt-0'>
          <p className='text-sm md:text-2xl md:mt-5'>現在の総レビュー数  <br /><span className='text-4xl md:text-5xl text-green-500'>{totalReviews}</span>件</p>
          <BasicSlider />
        </div>
        <div className=' flex justify-center'>
          <div className="flex flex-wrap justify-center items-center w-11/12 2xl:w-7/12 border border-1 py-6 px-6 rounded-2xl shadow-md bg-green-500 text-sm md:text-lg font-bold mt-0">
            <div className='flex justify-center w-full md:w-7/12 items-center mb-4 md:mb-0'>
              <label className=' w-full text-start pl-4 rounded-lg inline-block py-3 bg-white hover:bg-green-50 text-gray-600 shadow-md'>
                キーワード
                <input
                  className="ml-2 w-1/2 mr-0 outline-none  hover:bg-green-50"
                  placeholder="授業・教授・学部"
                  type="text"
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  onKeyUp={handleKeyUp}
                />
              </label>
            </div>
            <div className='w-full md:w-4/12 flex justify-center'>
              <div className="flex justify-center md:ml-6 relative w-8/12 text-slate-600 cursor-pointer hover:bg-green-100">
                <select
                  id="faculty"
                  name="faculty"
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  onKeyUp={handleKeyUp}
                  className="block appearance-none w-full rounded-lg outline-none bg-white p-6 py-3 pr-8  shadow-md ">
                  <option hidden value="">学部で検索</option>
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
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
              <button onClick={handleSearch}
                className=' text-white w-3/12 md:w-4/12 text-sm md:text-lg rounded-md py-3 ml-6 bg-red-500 shadow-md'
              >検索</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
