'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import BasicSlider from './_components/Slider';
import './globals.css';
import { FaSearch, FaUsers, FaStar, FaGraduationCap, FaChartLine, FaBookOpen, FaLightbulb, FaHeart, FaCommentAlt } from 'react-icons/fa';

// ========================================
// Type Definitions
// ========================================
interface FeatureData {
  readonly icon: React.ReactElement;
  readonly title: string;
  readonly description: string;
}

interface FacultyOption {
  readonly value: string;
  readonly label: string;
}

interface StatData {
  readonly number: string | number;
  readonly label: string;
  readonly icon: React.ReactElement;
}

interface AnimationDelays {
  readonly SMALL: string;
  readonly MEDIUM: string;
  readonly LARGE: string;
  readonly EXTRA_LARGE: string;
  readonly LIQUID_BG: string;
  readonly LIQUID_BG_ALT: string;
  readonly PULSE_BG: string;
}

interface CommonClasses {
  readonly sectionBg: string;
  readonly floatingParticle: string;
  readonly liquidBg: string;
  readonly neuralParticle: string;
  readonly cardDecoration: string;
  readonly cardShimmer: string;
  readonly cornerAccent: string;
}

// ========================================
// Constants
// ========================================
const FEATURES_DATA: readonly FeatureData[] = [
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
] as const;

const FACULTY_OPTIONS: readonly FacultyOption[] = [
  { value: "", label: "学部を選択" },
  { value: "G:教養科目", label: "G:教養科目" },
  { value: "H:人文学部", label: "H:人文学部" },
  { value: "K:教育学部", label: "K:教育学部" },
  { value: "L:法学部", label: "L:法学部" },
  { value: "E:経済科学部", label: "E:経済科学部" },
  { value: "S:理学部", label: "S:理学部" },
  { value: "M:医学部", label: "M:医学部" },
  { value: "D:歯学部", label: "D:歯学部" },
  { value: "T:工学部", label: "T:工学部" },
  { value: "A:農学部", label: "A:農学部" },
  { value: "X:創生学部", label: "X:創生学部" }
] as const;

const ANIMATION_DELAYS: AnimationDelays = {
  SMALL: '1s',
  MEDIUM: '2s',
  LARGE: '3s',
  EXTRA_LARGE: '4s',
  LIQUID_BG: '4s',
  LIQUID_BG_ALT: '3s',
  PULSE_BG: '1.5s'
} as const;

const COMMON_CLASSES: CommonClasses = {
  sectionBg: "absolute inset-0 pointer-events-none",
  floatingParticle: "absolute rounded-full animate-float opacity-50",
  liquidBg: "animate-liquid-background opacity-20",
  neuralParticle: "rounded-full animate-neural-pulse",
  cardDecoration: "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl",
  cardShimmer: "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
  cornerAccent: "absolute w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
} as const;

const COUNTER_CONFIG = {
  DURATION: 2000,
  FRAME_RATE: 60,
  START_DELAY: 1000
} as const;

// ========================================
// Custom Hooks
// ========================================
const useReviewCount = () => {
  const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [countingComplete, setCountingComplete] = useState(false);

  const animateCounter = useCallback((targetCount: number) => {
    const frameDuration = 1000 / COUNTER_CONFIG.FRAME_RATE;
    const totalFrames = Math.round(COUNTER_CONFIG.DURATION / frameDuration);
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
  }, []);

  useEffect(() => {
    const fetchReviewCount = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/total`);
        if (!response.ok) throw new Error('Failed to fetch review count');
        const data = await response.json();

        setTotalReviews(data.count);
        setTimeout(() => {
          animateCounter(data.count);
        }, COUNTER_CONFIG.START_DELAY);
      } catch (error) {
        console.error('Failed to fetch review count:', error);
        // Fallback to a default value
        setTotalReviews(1000);
        setTimeout(() => {
          animateCounter(1000);
        }, COUNTER_CONFIG.START_DELAY);
      }
    };

    fetchReviewCount();
  }, [animateCounter]);

  return { totalReviews, displayedCount, countingComplete };
};

const useSearch = () => {
  const [searchWord, setSearchWord] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const router = useRouter();

  const handleSearch = useCallback(() => {
    sessionStorage.setItem('searchWord', searchWord);
    sessionStorage.setItem('selectedFaculty', selectedFaculty);
    router.push('/lectures');
  }, [searchWord, selectedFaculty, router]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return {
    searchWord,
    setSearchWord,
    selectedFaculty,
    setSelectedFaculty,
    handleSearch,
    handleKeyUp
  };
};

// ========================================
// Component Definitions
// ========================================
interface BackgroundEffectsProps {
  readonly type: 'white' | 'green';
  readonly children: React.ReactNode;
}

const BackgroundEffects = memo<BackgroundEffectsProps>(({ type, children }) => (
  <div className={COMMON_CLASSES.sectionBg}>
    {children}
  </div>
));

BackgroundEffects.displayName = 'BackgroundEffects';

const WhiteSectionBg = memo(() => (
  <BackgroundEffects type="white">
    <div className={`absolute top-20 left-20 w-72 h-72 ${COMMON_CLASSES.liquidBg}`}></div>
    <div className={`absolute bottom-20 right-20 w-96 h-96 ${COMMON_CLASSES.liquidBg} opacity-15`} style={{ animationDelay: ANIMATION_DELAYS.LIQUID_BG }}></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
      <div className="w-full h-full bg-gradient-to-br from-green-50/20 via-transparent to-green-100/20 animate-background-flow"></div>
    </div>
    <div className={`absolute top-10 left-10 w-3 h-3 bg-green-300 ${COMMON_CLASSES.neuralParticle} opacity-40`}></div>
    <div className={`absolute top-32 right-20 w-2 h-2 bg-green-400 ${COMMON_CLASSES.neuralParticle} opacity-50`} style={{ animationDelay: ANIMATION_DELAYS.MEDIUM }}></div>
    <div className={`absolute bottom-32 left-32 w-4 h-4 bg-green-500 ${COMMON_CLASSES.neuralParticle} opacity-30`} style={{ animationDelay: '6s' }}></div>
    <div className={`absolute top-1/3 right-1/3 w-1 h-1 bg-green-200 ${COMMON_CLASSES.neuralParticle} opacity-60`} style={{ animationDelay: ANIMATION_DELAYS.EXTRA_LARGE }}></div>
  </BackgroundEffects>
));

WhiteSectionBg.displayName = 'WhiteSectionBg';

const GreenSectionBg = memo(() => (
  <BackgroundEffects type="green">
    <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full animate-liquid-background opacity-30"></div>
    <div className="absolute bottom-20 right-20 w-60 h-60 bg-white/5 rounded-full animate-liquid-background opacity-40" style={{ animationDelay: ANIMATION_DELAYS.LARGE }}></div>
    <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/15 rounded-full animate-neural-pulse opacity-20"></div>
    <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/8 rounded-full animate-neural-pulse opacity-25" style={{ animationDelay: ANIMATION_DELAYS.MEDIUM }}></div>
  </BackgroundEffects>
));

GreenSectionBg.displayName = 'GreenSectionBg';

interface ProgressBarProps {
  readonly isComplete: boolean;
}

const ProgressBar = memo<ProgressBarProps>(({ isComplete }) => (
  <div className="relative mt-3 lg:mt-4 h-2 lg:h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
    <div className={`h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 transition-all duration-1000 rounded-full shadow-lg relative ${isComplete ? 'w-full' : 'w-0'}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
      <div className="absolute inset-0 bg-green-400 opacity-50 blur-sm rounded-full"></div>
    </div>
    {isComplete && (
      <>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-green-300 rounded-full animate-sparkle"></div>
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 w-0.5 h-0.5 bg-green-400 rounded-full animate-sparkle" style={{ animationDelay: '0.5s' }}></div>
      </>
    )}
  </div>
));

ProgressBar.displayName = 'ProgressBar';

interface ReviewCounterProps {
  readonly displayedCount: number;
  readonly countingComplete: boolean;
}

const ReviewCounter = memo<ReviewCounterProps>(({ displayedCount, countingComplete }) => (
  <div className="mb-6 lg:mb-12 xl:mb-16 flex justify-center relative">
    <div className="relative genius-card p-6 lg:p-10 xl:p-12 rounded-3xl shadow-2xl border border-green-100/30 overflow-hidden group">
      <div className="absolute inset-0 animate-holographic opacity-30 rounded-3xl"></div>

      <div className={COMMON_CLASSES.cardShimmer}>
        <div className="absolute inset-0 animate-shimmer rounded-3xl"></div>
      </div>

      <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-green-100 via-green-200 to-green-50 opacity-20 rounded-full blur-xl animate-pulse-3d"></div>
      <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-gradient-to-tr from-green-50 via-green-100 to-green-200 opacity-30 rounded-full blur-lg animate-pulse-3d" style={{ animationDelay: ANIMATION_DELAYS.PULSE_BG }}></div>

      <div className="absolute top-4 right-4 w-3 h-3 border border-green-300 rotate-45 animate-float opacity-40"></div>
      <div className="absolute bottom-4 left-4 w-2 h-2 bg-green-400 rounded-full animate-float opacity-50" style={{ animationDelay: ANIMATION_DELAYS.SMALL }}></div>

      <div className="absolute inset-4 border border-green-200/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/10 via-transparent to-green-100/10 rounded-3xl"></div>

      <div className="relative z-20 flex items-center">
        <div className="mr-4 lg:mr-6 xl:mr-8 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-3xl p-3 lg:p-5 xl:p-6 text-white text-xl lg:text-2xl xl:text-3xl shadow-2xl group-hover:shadow-green-500/25 transition-all duration-700 genius-icon">
          <FaCommentAlt className="transform group-hover:scale-110 transition-transform duration-700" />
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
          <ProgressBar isComplete={countingComplete} />
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-green-300 to-transparent rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>

      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-green-300/40 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-green-300/40 rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="absolute top-6 left-6 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-60 animate-pulse transition-opacity duration-700"></div>
      <div className="absolute bottom-6 right-6 w-1.5 h-1.5 bg-green-500 rounded-full opacity-0 group-hover:opacity-50 animate-pulse transition-opacity duration-700" style={{ animationDelay: '0.5s' }}></div>
    </div>
  </div>
));

ReviewCounter.displayName = 'ReviewCounter';

interface SearchSectionProps {
  readonly searchWord: string;
  readonly setSearchWord: (value: string) => void;
  readonly selectedFaculty: string;
  readonly setSelectedFaculty: (value: string) => void;
  readonly handleKeyUp: (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => void;
  readonly handleSearch: () => void;
}

const SearchSection = memo<SearchSectionProps>(({
  searchWord,
  setSearchWord,
  selectedFaculty,
  setSelectedFaculty,
  handleKeyUp,
  handleSearch
}) => (
  <div className="max-w-4xl mx-auto relative">
    <div className="genius-search rounded-3xl p-4 lg:p-6 xl:p-8 shadow-2xl border border-green-100 relative overflow-hidden">
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
            {FACULTY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
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
));

SearchSection.displayName = 'SearchSection';

interface StatsCardProps {
  readonly stat: StatData;
  readonly index: number;
}

const StatsCard = memo<StatsCardProps>(({ stat, index }) => (
  <div className="text-center p-6 lg:p-8 genius-card-green rounded-3xl shadow-2xl hover:shadow-green-400/20 transition-all duration-700 hover:scale-105 animate-card-hover-lift group relative overflow-hidden">
    <div className={COMMON_CLASSES.cardDecoration}></div>
    <div className={COMMON_CLASSES.cardShimmer}>
      <div className="absolute inset-0 animate-shimmer rounded-3xl"></div>
    </div>

    <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full animate-float opacity-50"></div>
    <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/40 rounded-full animate-float opacity-60" style={{ animationDelay: ANIMATION_DELAYS.SMALL }}></div>

    <div className="relative z-10">
      <div className="text-3xl lg:text-4xl text-white mb-4 flex justify-center transform group-hover:scale-110 transition-transform duration-700 genius-icon">
        {stat.icon}
      </div>
      <div className="text-3xl lg:text-4xl font-bold text-white mb-2 genius-number">{stat.number}</div>
      <div className="text-green-100 font-medium text-sm lg:text-base transform group-hover:translate-y-1 transition-transform duration-700">{stat.label}</div>
    </div>

    <div className={`${COMMON_CLASSES.cornerAccent} top-0 left-0 border-l-2 border-t-2 border-white/30 rounded-tl-3xl`}></div>
    <div className={`${COMMON_CLASSES.cornerAccent} bottom-0 right-0 border-r-2 border-b-2 border-white/30 rounded-br-3xl`}></div>
  </div>
));

StatsCard.displayName = 'StatsCard';

interface FeatureCardProps {
  readonly feature: FeatureData;
  readonly index: number;
}

const FeatureCard = memo<FeatureCardProps>(({ feature, index }) => (
  <div className="text-center p-6 lg:p-8 genius-card-green rounded-3xl shadow-2xl hover:shadow-green-400/20 transition-all duration-700 hover:scale-105 animate-card-hover-lift group relative overflow-hidden">
    <div className={COMMON_CLASSES.cardDecoration}></div>
    <div className={COMMON_CLASSES.cardShimmer}>
      <div className="absolute inset-0 animate-shimmer rounded-3xl"></div>
    </div>

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

    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

// ========================================
// Main Component
// ========================================
export default function Page() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { totalReviews, displayedCount, countingComplete } = useReviewCount();
  const {
    searchWord,
    setSearchWord,
    selectedFaculty,
    setSelectedFaculty,
    handleSearch,
    handleKeyUp
  } = useSearch();

  const stats: readonly StatData[] = useMemo(() => [
    { number: totalReviews || "1000+", label: "累計レビュー数", icon: <FaChartLine /> },
    { number: "7000+", label: "登録授業数", icon: <FaBookOpen /> },
    { number: "5000+", label: "累計アクティブユーザー", icon: <FaUsers /> }
  ], [totalReviews]);

  const handleNavigateToReviewCreate = useCallback(() => {
    router.push('/reviews/new');
  }, [router]);

  const handleNavigateToLectures = useCallback(() => {
    router.push('/lectures');
  }, [router]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section - White Background */}
      <section className="relative overflow-hidden bg-white min-h-[calc(100vh-64px)] xl:min-h-screen flex flex-col justify-center genius-section">
        <WhiteSectionBg />

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 xl:py-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 lg:mb-6 xl:mb-8 leading-tight genius-title-white">
              新大生の
              <br />
              <span className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 bg-clip-text text-transparent animate-gradient-x">
                授業選びをサポート
              </span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl mb-6 lg:mb-8 xl:mb-12 max-w-3xl mx-auto leading-relaxed genius-subtitle">
              <span className="font-semibold text-green-600">リアルな授業情報</span>を共有しよう
            </p>

            <ReviewCounter displayedCount={displayedCount} countingComplete={countingComplete} />

            <SearchSection
              searchWord={searchWord}
              setSearchWord={setSearchWord}
              selectedFaculty={selectedFaculty}
              setSelectedFaculty={setSelectedFaculty}
              handleKeyUp={handleKeyUp}
              handleSearch={handleSearch}
            />
          </div>
        </div>
      </section>

      {/* Stats Section - Green Background */}
      <section className="min-h-screen lg:min-h-0 lg:py-20 bg-[#1DBE67] flex flex-col justify-center relative overflow-hidden">
        <GreenSectionBg />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 relative z-10">
          <div className="text-center mb-8 lg:mb-16 animate-section-slide-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 genius-title-green">数字で見るガタレビュ！</h2>
            <p className="text-lg lg:text-xl text-white">新大生の皆さんが閲覧しています。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <StatsCard key={`${stat.label}-${index}`} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reviews Slider - White Background */}
      <section className="min-h-screen lg:min-h-0 lg:py-20 bg-white flex flex-col justify-center genius-section">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 animate-liquid-background opacity-10"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 animate-liquid-background opacity-8" style={{ animationDelay: ANIMATION_DELAYS.LIQUID_BG }}></div>
          <div className="absolute top-1/3 left-1/2 w-40 h-40 bg-green-50 rounded-full animate-neural-pulse opacity-30"></div>
        </div>

        <div className="w-full mx-auto py-8 lg:py-0 relative z-10">
          <div className="text-center mb-8 lg:mb-12 px-4 animate-section-slide-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 genius-title-white">最新のレビュー</h2>
          </div>

          <div className="w-full overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-24 h-24 bg-green-100 rounded-full opacity-20 animate-float"></div>
              <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-green-50 rounded-full opacity-25 animate-float" style={{ animationDelay: ANIMATION_DELAYS.MEDIUM }}></div>
            </div>
            <BasicSlider />
          </div>
        </div>
      </section>

      {/* Features Section - Green Background */}
      <section className="min-h-screen lg:min-h-0 lg:py-20 bg-[#1DBE67] flex flex-col justify-center relative overflow-hidden">
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
            {FEATURES_DATA.map((feature, index) => (
              <FeatureCard key={`${feature.title}-${index}`} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - White Background */}
      <section className="min-h-screen lg:min-h-0 lg:py-20 bg-white relative overflow-hidden flex flex-col justify-center genius-section">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 animate-liquid-background opacity-15"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 animate-liquid-background opacity-12" style={{ animationDelay: ANIMATION_DELAYS.LARGE }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="w-full h-full bg-gradient-to-br from-green-50/30 via-transparent to-green-100/30 animate-background-flow"></div>
          </div>

          <div className="absolute top-20 left-1/3 w-4 h-4 bg-green-200 rounded-full animate-neural-pulse opacity-40"></div>
          <div className="absolute bottom-32 right-1/3 w-3 h-3 bg-green-300 rounded-full animate-neural-pulse opacity-50" style={{ animationDelay: ANIMATION_DELAYS.MEDIUM }}></div>
          <div className="absolute top-1/3 right-20 w-2 h-2 bg-green-400 rounded-full animate-neural-pulse opacity-30" style={{ animationDelay: ANIMATION_DELAYS.EXTRA_LARGE }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 lg:py-0 z-10">
          <div className="animate-section-slide-in">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 genius-title-white">
              今すぐ始めましょう
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
              <button
                onClick={handleNavigateToReviewCreate}
                className="px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl flex items-center justify-center animate-card-hover-lift relative overflow-hidden group"
              >
                <FaHeart className="mr-2 transform group-hover:scale-110 transition-transform duration-500" />
                <span className="relative z-10">レビューを投稿する</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              </button>

              <button
                onClick={handleNavigateToLectures}
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

