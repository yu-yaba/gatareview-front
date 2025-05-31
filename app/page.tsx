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
      <section className="relative overflow-hidden bg-white min-h-[calc(100vh-64px)] xl:min-h-screen flex flex-col justify-center genius-section">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 animate-liquid-background opacity-20"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 animate-liquid-background opacity-15" style={{ animationDelay: '4s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="w-full h-full bg-gradient-to-br from-green-50/20 via-transparent to-green-100/20 animate-background-flow"></div>
          </div>

          {/* Floating Neural Network Particles */}
          <div className="absolute top-10 left-10 w-3 h-3 bg-green-300 rounded-full animate-neural-pulse opacity-40"></div>
          <div className="absolute top-32 right-20 w-2 h-2 bg-green-400 rounded-full animate-neural-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-32 w-4 h-4 bg-green-500 rounded-full animate-neural-pulse opacity-30" style={{ animationDelay: '6s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-green-200 rounded-full animate-neural-pulse opacity-60" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 xl:py-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center">
            {/* Enhanced Hero Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 lg:mb-6 xl:mb-8 leading-tight genius-title-white">
              新大生の
              <br />
              <span className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 bg-clip-text text-transparent animate-gradient-x">
                授業選びをサポート
              </span>
            </h1>

            {/* Enhanced Subtitle */}
            <p className="text-lg md:text-xl lg:text-2xl mb-6 lg:mb-8 xl:mb-12 max-w-3xl mx-auto leading-relaxed genius-subtitle">
              <span className="font-semibold text-green-600">リアルな授業情報</span>を共有しよう
            </p>

            {/* Review Counter */}
            <div className="mb-6 lg:mb-12 xl:mb-16 flex justify-center relative">
              <div className="relative genius-card p-6 lg:p-10 xl:p-12 rounded-3xl shadow-2xl border border-green-100/30 overflow-hidden group">
                {/* Holographic Background Layer */}
                <div className="absolute inset-0 animate-holographic opacity-30 rounded-3xl"></div>

                {/* Shimmer Effect Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 animate-shimmer rounded-3xl"></div>
                </div>

                {/* Advanced Decorative Elements */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-green-100 via-green-200 to-green-50 opacity-20 rounded-full blur-xl animate-pulse-3d"></div>
                <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-gradient-to-tr from-green-50 via-green-100 to-green-200 opacity-30 rounded-full blur-lg animate-pulse-3d" style={{ animationDelay: '1.5s' }}></div>

                {/* Floating Geometric Elements */}
                <div className="absolute top-4 right-4 w-3 h-3 border border-green-300 rotate-45 animate-float opacity-40"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-green-400 rounded-full animate-float opacity-50" style={{ animationDelay: '1s' }}></div>

                {/* Inner Glow Ring */}
                <div className="absolute inset-4 border border-green-200/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/10 via-transparent to-green-100/10 rounded-3xl"></div>

                <div className="relative z-20 flex items-center">
                  <div className="mr-4 lg:mr-6 xl:mr-8 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-3xl p-3 lg:p-5 xl:p-6 text-white text-xl lg:text-2xl xl:text-3xl shadow-2xl group-hover:shadow-green-500/25 transition-all duration-700 genius-icon">
                    <FaCommentAlt className="transform group-hover:scale-110 transition-transform duration-700" />

                    {/* Icon Background Effects */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 animate-pulse"></div>
                  </div>

                  <div className="text-left">
                    <p className="text-green-700 font-semibold mb-2 lg:mb-3 text-sm lg:text-base xl:text-lg tracking-wide transform group-hover:translate-x-2 transition-transform duration-700">
                      現在の総レビュー数
                    </p>
                    <div className="flex items-baseline">
                      <span className="genius-number text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-br from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent">
                        {displayedCount}
                      </span>
                      <span className="ml-2 lg:ml-3 text-lg lg:text-xl xl:text-2xl text-gray-700 font-medium transform group-hover:translate-y-1 transition-transform duration-700">件</span>
                    </div>

                    {/* Progress Bar with Advanced Effects */}
                    <div className="relative mt-3 lg:mt-4 h-2 lg:h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 transition-all duration-1000 rounded-full shadow-lg relative ${countingComplete ? 'w-full' : 'w-0'}`}>
                        {/* Progress bar shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        {/* Progress bar glow */}
                        <div className="absolute inset-0 bg-green-400 opacity-50 blur-sm rounded-full"></div>
                      </div>

                      {/* Progress bar particles */}
                      {countingComplete && (
                        <>
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-green-300 rounded-full animate-sparkle"></div>
                          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 w-0.5 h-0.5 bg-green-400 rounded-full animate-sparkle" style={{ animationDelay: '0.5s' }}></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Advanced Accent Elements */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-green-300 to-transparent rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>

                {/* Corner Highlights */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-green-300/40 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-green-300/40 rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                {/* Pulsing Dot Indicators */}
                <div className="absolute top-6 left-6 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-60 animate-pulse transition-opacity duration-700"></div>
                <div className="absolute bottom-6 right-6 w-1.5 h-1.5 bg-green-500 rounded-full opacity-0 group-hover:opacity-50 animate-pulse transition-opacity duration-700" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>

            {/* Enhanced Search Section */}
            <div className="max-w-4xl mx-auto relative">
              <div className="genius-search rounded-3xl p-4 lg:p-6 xl:p-8 shadow-2xl border border-green-100 relative overflow-hidden">
                {/* Search shimmer overlay */}
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute inset-0 animate-shimmer rounded-3xl"></div>
                </div>

                <h3 className="text-lg lg:text-xl xl:text-2xl font-bold mb-4 lg:mb-5 xl:mb-6 flex items-center justify-center genius-title-white">
                  <FaSearch className="mr-2 lg:mr-3 text-green-500 animate-pulse" />
                  授業を検索する
                </h3>

                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 relative z-10">
                  <div className="flex-grow">
                    <input
                      className="w-full px-4 lg:px-5 xl:px-6 py-3 lg:py-3.5 xl:py-4 text-sm lg:text-base xl:text-lg border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none transition-all duration-500 shadow-inner animate-search-focus backdrop-blur-sm"
                      placeholder="授業名、教授名、学部名で検索..."
                      type="text"
                      value={searchWord}
                      onChange={(e) => setSearchWord(e.target.value)}
                      onKeyUp={handleKeyUp}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 w-full lg:w-auto">
                    <select
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      onKeyUp={handleKeyUp}
                      className="w-full sm:w-auto px-4 lg:px-5 xl:px-6 py-3 lg:py-3.5 xl:py-4 text-sm lg:text-base xl:text-lg border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none transition-all duration-500 bg-white/90 backdrop-blur-sm animate-search-focus"
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
                      className="w-full sm:w-auto px-5 lg:px-6 xl:px-8 py-3 lg:py-3.5 xl:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl animate-card-hover-lift relative overflow-hidden group"
                    >
                      <span className="relative z-10">検索</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Green Background */}
      <section className="min-h-screen lg:min-h-0 lg:py-20 bg-[#1DBE67] flex flex-col justify-center relative overflow-hidden">
        {/* Advanced Background Layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full animate-liquid-background opacity-30"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-white/5 rounded-full animate-liquid-background opacity-40" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/15 rounded-full animate-neural-pulse opacity-20"></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/8 rounded-full animate-neural-pulse opacity-25" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 relative z-10">
          <div className="text-center mb-8 lg:mb-16 animate-section-slide-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 genius-title-green">数字で見るガタレビュ！</h2>
            <p className="text-lg lg:text-xl text-white">新大生の皆さんが閲覧しています。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 lg:p-8 genius-card-green rounded-3xl shadow-2xl hover:shadow-green-400/20 transition-all duration-700 hover:scale-105 animate-card-hover-lift group relative overflow-hidden">
                {/* Card Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 animate-shimmer rounded-3xl"></div>
                </div>

                {/* Floating elements */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full animate-float opacity-50"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/40 rounded-full animate-float opacity-60" style={{ animationDelay: '1s' }}></div>

                <div className="relative z-10">
                  <div className="text-3xl lg:text-4xl text-white mb-4 flex justify-center transform group-hover:scale-110 transition-transform duration-700 genius-icon">
                    {stat.icon}
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-2 genius-number">{stat.number}</div>
                  <div className="text-green-100 font-medium text-sm lg:text-base transform group-hover:translate-y-1 transition-transform duration-700">{stat.label}</div>
                </div>

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-white/30 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-white/30 rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reviews Slider - White Background */}
      <section className="min-h-screen lg:min-h-0 lg:py-20 bg-white flex flex-col justify-center genius-section">
        {/* Section Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 animate-liquid-background opacity-10"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 animate-liquid-background opacity-8" style={{ animationDelay: '4s' }}></div>
          <div className="absolute top-1/3 left-1/2 w-40 h-40 bg-green-50 rounded-full animate-neural-pulse opacity-30"></div>
        </div>

        <div className="w-full mx-auto py-8 lg:py-0 relative z-10">
          <div className="text-center mb-8 lg:mb-12 px-4 animate-section-slide-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 genius-title-white">最新のレビュー</h2>
          </div>

          <div className="w-full overflow-hidden relative">
            {/* Slider Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-24 h-24 bg-green-100 rounded-full opacity-20 animate-float"></div>
              <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-green-50 rounded-full opacity-25 animate-float" style={{ animationDelay: '2s' }}></div>
            </div>
            <BasicSlider />
          </div>
        </div>
      </section>

      {/* Features Section - Green Background */}
      <section className="min-h-screen lg:min-h-0 lg:py-20 bg-[#1DBE67] flex flex-col justify-center relative overflow-hidden">
        {/* Advanced Background Layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full animate-liquid-background opacity-30"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/8 rounded-full animate-liquid-background opacity-25" style={{ animationDelay: '5s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="w-full h-full bg-gradient-to-r from-white/5 via-transparent to-white/5 animate-background-flow"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 relative z-10">
          <div className="text-center mb-8 lg:mb-16 animate-section-slide-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 genius-title-green">ガタレビュ！の特徴</h2>
            <p className="text-lg lg:text-xl text-white">新大生のための、新大生による授業レビューサイト</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 lg:p-8 genius-card-green rounded-3xl shadow-2xl hover:shadow-green-400/20 transition-all duration-700 hover:scale-105 animate-card-hover-lift group relative overflow-hidden">
                {/* Card Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 animate-shimmer rounded-3xl"></div>
                </div>

                {/* Orbiting particles around icon */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-1 bg-white/40 rounded-full animate-orbit opacity-60" style={{ animationDelay: `${index}s` }}></div>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="mb-4 lg:mb-6 flex justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 genius-icon">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-4 transform group-hover:translate-y-1 transition-transform duration-700">{feature.title}</h3>
                  <p className="text-green-100 leading-relaxed text-sm lg:text-base transform group-hover:translate-y-2 transition-transform duration-700">{feature.description}</p>
                </div>

                {/* Feature accent line */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - White Background */}
      <section className="min-h-screen lg:min-h-0 lg:py-20 bg-white relative overflow-hidden flex flex-col justify-center genius-section">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 animate-liquid-background opacity-15"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 animate-liquid-background opacity-12" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="w-full h-full bg-gradient-to-br from-green-50/30 via-transparent to-green-100/30 animate-background-flow"></div>
          </div>

          {/* Floating elements */}
          <div className="absolute top-20 left-1/3 w-4 h-4 bg-green-200 rounded-full animate-neural-pulse opacity-40"></div>
          <div className="absolute bottom-32 right-1/3 w-3 h-3 bg-green-300 rounded-full animate-neural-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 right-20 w-2 h-2 bg-green-400 rounded-full animate-neural-pulse opacity-30" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 lg:py-0 z-10">
          <div className="animate-section-slide-in">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 genius-title-white">
              今すぐ始めましょう
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
              <button
                onClick={() => router.push('/reviews/new')}
                className="px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl flex items-center justify-center animate-card-hover-lift relative overflow-hidden group"
              >
                <FaHeart className="mr-2 transform group-hover:scale-110 transition-transform duration-500" />
                <span className="relative z-10">レビューを投稿する</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              </button>

              <button
                onClick={() => router.push('/lectures')}
                className="px-6 lg:px-8 py-3 lg:py-4 bg-transparent border-2 border-green-500 text-green-600 font-bold rounded-2xl hover:bg-green-50 transform hover:scale-105 transition-all duration-500 flex items-center justify-center animate-card-hover-lift relative overflow-hidden group"
              >
                <FaLightbulb className="mr-2 transform group-hover:scale-110 transition-transform duration-500" />
                <span className="relative z-10">授業を探す</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

