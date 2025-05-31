'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BasicSlider from './_components/Slider';
import './globals.css';
import { FaSearch, FaUsers, FaStar, FaGraduationCap, FaChartLine, FaBookOpen, FaLightbulb, FaHeart, FaCommentAlt } from 'react-icons/fa';

export default function Page() {
  const [totalReviews, setTotalReviews] = useState(null);
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [countingComplete, setCountingComplete] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
    fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/total`)
      .then(response => response.json())
      .then(data => {
        setTotalReviews(data.count);
        // Start the counter animation after 1 second
        setTimeout(() => {
          animateCounter(data.count);
        }, 1000);
      })
      .catch(err => {
        console.error('Failed to fetch review count:', err);
      });
  }, []);

  const animateCounter = (targetCount: number) => {
    const duration = 2000; // 2 seconds for the animation
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const counterIncrement = targetCount / totalFrames;

    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentCount = Math.ceil(progress * targetCount);

      setDisplayedCount(currentCount);

      if (frame === totalFrames) {
        clearInterval(counter);
        setCountingComplete(true);
      }
    }, frameDuration);
  };

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

  const features = [
    {
      icon: <FaBookOpen className="text-4xl text-white" />,
      title: "リアルな授業情報",
      description: "シラバスではわからない授業の実態を学生の生の声で知ることができます"
    },
    {
      icon: <FaStar className="text-4xl text-white" />,
      title: "信頼できる評価",
      description: "実際に授業を受けた学生による詳細で公正な評価とレビュー"
    },
    {
      icon: <FaUsers className="text-4xl text-white" />,
      title: "コミュニティ",
      description: "新潟大学生同士で情報を共有し、より良い学習環境を作りましょう"
    }
  ];

  const stats = [
    { number: totalReviews || "1000+", label: "累計レビュー数", icon: <FaChartLine /> },
    { number: "7000+", label: "登録授業数", icon: <FaBookOpen /> },
    { number: "5000+", label: "累計アクティブユーザー", icon: <FaUsers /> }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - White Background */}
      <section className="relative overflow-hidden bg-white py-16">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-green-100 opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-100 opacity-10 rounded-full blur-3xl"></div>
        </div>

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 leading-tight">
              新大生の
              <br />
              <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                授業選びをサポート
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              シラバスではわからない
              <br /><span className="font-semibold text-green-600">リアルな授業情報</span>を共有しよう
            </p>

            {/* Review Counter */}
            <div className="mb-16 flex justify-center">
              <div className="relative p-8 bg-gradient-to-r from-green-50 to-white rounded-2xl shadow-xl border border-green-100 transform hover:scale-105 transition-all duration-300 group overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-100 opacity-30 rounded-full"></div>
                <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-green-100 opacity-30 rounded-full"></div>

                <div className="relative z-10 flex items-center">
                  <div className="mr-6 bg-green-500 rounded-full p-4 text-white text-2xl">
                    <FaCommentAlt />
                  </div>
                  <div className="text-left">
                    <p className="text-green-600 font-medium mb-1">現在の総レビュー数</p>
                    <div className="flex items-baseline">
                      <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                        {displayedCount}
                      </span>
                      <span className="ml-2 text-xl text-gray-600 font-medium">件</span>
                    </div>
                    <div className={`h-1 bg-green-500 mt-1 transition-all duration-1000 ${countingComplete ? 'w-full' : 'w-0'}`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl p-8 shadow-2xl border border-green-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center">
                  <FaSearch className="mr-3 text-green-500" />
                  授業を検索する
                </h3>

                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-grow">
                    <input
                      className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none transition-all duration-300 shadow-inner"
                      placeholder="授業名、教授名、学部名で検索..."
                      type="text"
                      value={searchWord}
                      onChange={(e) => setSearchWord(e.target.value)}
                      onKeyUp={handleKeyUp}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <select
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      onKeyUp={handleKeyUp}
                      className="w-full sm:w-auto px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none transition-all duration-300 bg-white"
                    >
                      <option value="">学部を選択</option>
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

                    <button
                      onClick={handleSearch}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      検索
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Green Background */}
      <section className="py-20 bg-gradient-to-br from-green-500 via-green-600 to-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">数字で見るガタレビュ！</h2>
            <p className="text-xl text-green-100">新大生の皆さんが閲覧しています。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white border-opacity-20">
                <div className="text-4xl text-white mb-4 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-green-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reviews Slider - White Background */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">最新のレビュー</h2>
          </div>

          <BasicSlider />
        </div>
      </section>

      {/* Features Section - Green Background */}
      <section className="py-20 bg-gradient-to-br from-green-500 via-green-600 to-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">ガタレビュ！の特徴</h2>
            <p className="text-xl text-green-100">新大生のための、新大生による授業レビューサイト</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white border-opacity-20">
                <div className="mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-green-100 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - White Background */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-green-100 opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-green-100 opacity-10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            今すぐ始めましょう
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => router.push('/reviews/new')}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <FaHeart className="mr-2" />
              レビューを投稿する
            </button>
            <button
              onClick={() => router.push('/lectures')}
              className="px-8 py-4 bg-transparent border-2 border-green-500 text-green-600 font-bold rounded-2xl hover:bg-green-50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <FaLightbulb className="mr-2" />
              授業を探す
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
