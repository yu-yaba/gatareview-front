'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const [totalReviews, setTotalReviews] = useState(null);
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('http://localhost:3000/api/v2/reviews/total')
      .then(response => response.json())
      .then(data => setTotalReviews(data.count))
      .catch(err => console.error('Failed to fetch review count:', err));
  }, []);

  const handleSearch = () => {
    localStorage.setItem('searchWord', searchWord);
    localStorage.setItem('selectedFaculty', selectedFaculty);
    router.push('/lectures');
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <div>
        <h1>ガタレビュ!は新大生のための授業レビュー・過去問共有サイトです。</h1>
        {totalReviews !== null ? (
          <p>現在の総レビュー数  {totalReviews}件</p>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <section className="text-center">
        <div className="flex justify-center">
          <div className="flex justify-center w-full mx-10">
            <label className='border-4 border-green-400 rounded-lg inline-block py-3 hover:bg-green-50 font-bold text-gray-600'>
              キーワード
              <input
                className="ml-2 w-1/2 mr-0 outline-none hover:bg-green-50"
                placeholder="授業・教授・学部"
                type="text"
                onChange={(e) => setSearchWord(e.target.value)}
                onKeyUp={handleKeyUp}
              />
            </label>
            <select id="faculty" name="faculty" onKeyUp={handleKeyUp} onChange={(e) => setSelectedFaculty(e.target.value)} className=" font-bold p-3 px-5 ml-7 w-1/7 border-4 rounded-lg text-gray-600 border-green-400 outline-none hover:bg-green-50">
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
            <button onClick={handleSearch} className="ml-5 bg-green-400 text-white p-3 rounded-lg">
              検索
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
