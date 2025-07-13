'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import './globals.css';
import Link from 'next/link';
import Script from 'next/script';
import { FaSearch, FaUsers, FaStar, FaGraduationCap, FaChartLine, FaBookOpen, FaLightbulb, FaHeart, FaCommentAlt, FaFireAlt, FaRandom, FaBullhorn, FaNewspaper, FaRocket, FaAtom, FaMagic, FaUser, FaUniversity } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { ReviewWithLecture } from './_types/ReviewWithLecture';
import { handleAjaxError } from './_helpers/helpers';

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

interface LectureItem {
  readonly id: number;
  readonly title: string;
  readonly lecturer: string;
  readonly faculty: string;
  readonly avg_rating: number;
  readonly review_count: number;
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

const usePopularLectures = () => {
  const [popularLectures, setPopularLectures] = useState<LectureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularLectures = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/popular`;
        console.log('Fetching popular lectures from:', url);

        const response = await fetch(url);
        console.log('Popular lectures response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Popular lectures error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Popular lectures data:', data);

        if (data.lectures && Array.isArray(data.lectures)) {
          setPopularLectures(data.lectures);
        } else {
          console.warn('Invalid data structure for popular lectures:', data);
          setPopularLectures([]);
        }
      } catch (error) {
        console.error('Failed to fetch popular lectures:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setPopularLectures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularLectures();
  }, []);

  return { popularLectures, loading, error };
};

const useNoReviewsLectures = () => {
  const [noReviewsLectures, setNoReviewsLectures] = useState<LectureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNoReviewsLectures = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/no_reviews`;
        console.log('Fetching no reviews lectures from:', url);

        const response = await fetch(url);
        console.log('No reviews lectures response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('No reviews lectures error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('No reviews lectures data:', data);

        if (data.lectures && Array.isArray(data.lectures)) {
          setNoReviewsLectures(data.lectures);
        } else {
          console.warn('Invalid data structure for no reviews lectures:', data);
          setNoReviewsLectures([]);
        }
      } catch (error) {
        console.error('Failed to fetch lectures with no reviews:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setNoReviewsLectures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNoReviewsLectures();
  }, []);

  return { noReviewsLectures, loading, error };
};

// ========================================
// Latest Reviews Hook
// ========================================
const useLatestReviews = () => {
  const [latestReviews, setLatestReviews] = useState<ReviewWithLecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `${process.env.NEXT_PUBLIC_ENV}/api/v1/reviews/latest`;
        console.log('Fetching latest reviews from:', url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }

        setLatestReviews(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('最新のレビューの取得中にエラーが発生しました:', error);
        setError(errorMessage);
        handleAjaxError("最新のレビューを取得できません。");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestReviews();
  }, []);

  return { latestReviews, loading, error };
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
  <div className="max-w-6xl mx-auto relative">
    <div className="genius-search rounded-3xl p-4 lg:p-6 xl:p-8 2xl:p-10 shadow-2xl border border-green-100 relative overflow-hidden">
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 animate-shimmer rounded-3xl"></div>
      </div>

      <h3 className="text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-4 lg:mb-5 xl:mb-6 2xl:mb-8 flex items-center justify-center genius-title-white">
        <FaSearch className="mr-2 lg:mr-3 2xl:mr-4 text-green-500 animate-pulse" />
        授業を検索する
      </h3>

      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 xl:gap-6 relative z-10">
        <div className="flex-grow">
          <input
            className="w-full px-4 lg:px-5 xl:px-6 2xl:px-8 py-3 lg:py-3.5 xl:py-4 2xl:py-5 text-sm lg:text-base xl:text-lg 2xl:text-xl border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none transition-all duration-500 shadow-inner animate-search-focus backdrop-blur-sm"
            placeholder="授業名、教授名、学部名で検索..."
            type="text"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            onKeyUp={handleKeyUp}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 xl:gap-6 w-full lg:w-auto lg:min-w-max">
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            onKeyUp={handleKeyUp}
            className="w-full sm:w-auto lg:w-48 xl:w-52 2xl:w-56 px-4 lg:px-5 xl:px-6 2xl:px-8 py-3 lg:py-3.5 xl:py-4 2xl:py-5 text-sm lg:text-base xl:text-lg 2xl:text-xl border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none transition-all duration-500 bg-white/90 backdrop-blur-sm animate-search-focus"
          >
            {FACULTY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="w-full sm:w-auto lg:w-32 xl:w-36 2xl:w-40 px-5 lg:px-6 xl:px-8 2xl:px-10 py-3 lg:py-3.5 xl:py-4 2xl:py-5 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl animate-card-hover-lift relative overflow-hidden group text-sm lg:text-base xl:text-lg 2xl:text-xl"
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

interface ReviewCardProps {
  readonly review: ReviewWithLecture;
  readonly index: number;
}

const ReviewCard = memo<ReviewCardProps>(({ review, index }) => (
  <div className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
    <Link
      href={`/lectures/${review.lecture.id}`}
      className="block w-full bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
    >
      <div className="space-y-4 h-full flex flex-col">
        <div className="space-y-2 flex-grow">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors duration-300 leading-tight">
            {review.lecture.title}
          </h3>
          <div className="space-y-1">
            <div className="flex items-center">
              <FaUser className="text-blue-500 mr-2 text-sm" />
              <p className="text-xs text-gray-700 font-medium">
                {review.lecture.lecturer}
              </p>
            </div>
            <div className="flex items-center">
              <FaUniversity className="text-purple-500 mr-2 text-sm" />
              <p className="text-xs font-semibold text-green-600">
                {review.lecture.faculty}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
              <FaStar className="text-yellow-400 text-sm" />
              <span className="text-xs font-bold text-gray-800">
                {review.rating.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
              <FaCommentAlt className="text-green-500 text-sm" />
              <span className="text-xs font-bold text-gray-800">レビュー</span>
            </div>
          </div>

          <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed bg-gray-50 p-3 rounded-lg">
            {review.content && review.content.length > 80
              ? `${review.content.substring(0, 80)}...`
              : review.content || 'コメントなし'}
          </p>
        </div>
      </div>
    </Link>
  </div>
));

ReviewCard.displayName = 'ReviewCard';

interface LectureCardProps {
  readonly lecture: LectureItem;
  readonly showReviewInfo?: boolean;
  readonly isWaitingForReview?: boolean;
}

const LectureCard = memo<LectureCardProps>(({ lecture, showReviewInfo = true, isWaitingForReview = false }) => (
  <Link href={`/lectures/${lecture.id}`} className="block bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group w-full">
    <div className="space-y-4 h-full flex flex-col">
      <div className="space-y-2 flex-grow">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors duration-300 leading-tight">
          {lecture.title}
        </h3>
        <div className="space-y-1">
          <div className="flex items-center">
            <FaUser className="text-blue-500 mr-2 text-sm" />
            <p className="text-xs text-gray-700 font-medium">
              {lecture.lecturer}
            </p>
          </div>
          <div className="flex items-center">
            <FaUniversity className="text-purple-500 mr-2 text-sm" />
            <p className="text-xs font-semibold text-green-600">
              {lecture.faculty}
            </p>
          </div>
        </div>
      </div>
      {showReviewInfo && (
        <div className="flex items-center justify-between">
          {!isWaitingForReview && (
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
              <FaStar className={lecture.avg_rating > 0 ? "text-yellow-400 text-sm" : "text-gray-400 text-sm"} />
              <span className="text-xs font-bold text-gray-800">
                {lecture.avg_rating > 0 ? lecture.avg_rating.toFixed(1) : '未評価'}
              </span>
            </div>
          )}
          <div className={`flex items-center space-x-2 rounded-full px-3 py-1 ${isWaitingForReview
            ? 'bg-yellow-300 ml-auto'
            : 'bg-green-100'
            }`}>
            <FaCommentAlt className={`text-sm ${isWaitingForReview
              ? 'text-white'
              : 'text-green-500'
              }`} />
            <span className="text-xs font-bold text-gray-800">
              {isWaitingForReview ? 'レビュー募集中' : `${lecture.review_count}件`}
            </span>
          </div>
        </div>
      )}
    </div>
  </Link>
));

LectureCard.displayName = 'LectureCard';


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
  const { popularLectures, loading: popularLoading, error: popularError } = usePopularLectures();
  const { noReviewsLectures, loading: noReviewsLoading, error: noReviewsError } = useNoReviewsLectures();
  const { latestReviews, loading: latestReviewsLoading, error: latestReviewsError } = useLatestReviews();

  const stats: readonly StatData[] = useMemo(() => [
    { number: totalReviews || "1000+", label: "累計レビュー数", icon: <FaChartLine /> },
    { number: "5000+", label: "登録授業数", icon: <FaBookOpen /> },
    { number: "9000+", label: "累計アクティブユーザー", icon: <FaUsers /> }
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
    <>
      <div className="min-h-screen">
        {/* Hero Section - White Background */}
        <section className="relative overflow-hidden bg-white min-h-[calc(100vh-64px)] xl:min-h-screen flex flex-col justify-center genius-section">
          <WhiteSectionBg />

          <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 xl:py-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold mb-4 lg:mb-6 xl:mb-8 leading-tight genius-title-white">
                新大生の
                <br className="sm:hidden md:block lg:block" />
                <span className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 bg-clip-text text-transparent animate-gradient-x">
                  授業選びをサポート
                </span>
              </h1>

              <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl mb-6 lg:mb-8 xl:mb-12 max-w-4xl mx-auto leading-relaxed genius-subtitle">
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

        {/* Latest Reviews Section - White Background */}
        <section className="min-h-screen lg:min-h-0 lg:py-20 bg-white flex flex-col justify-center relative overflow-hidden">
          {/* シンプルな背景パターン */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50/20 via-green-100/10 to-green-50/20"></div>
          </div>

          {/* 清潔な浮遊要素 */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-green-100 rounded-full opacity-30 animate-float"></div>
          <div className="absolute top-1/3 right-32 w-12 h-12 bg-green-200 rounded-full opacity-25 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-1/3 w-10 h-10 bg-green-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 relative z-10">
            {/* シンプルなタイトルデザイン */}
            <div className="text-center mb-12 lg:mb-20 animate-fade-in">
              <h2 className="text-3xl lg:text-4xl font-bold text-green-600 mb-6 flex items-center justify-center leading-tight">
                最新のレビュー
              </h2>
              <p className="text-lg lg:text-xl font-semibold text-green-500">みんなの新しいレビューをチェック</p>
            </div>

            {/* シンプルなグリッドレイアウト */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {latestReviewsLoading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="bg-green-50 rounded-xl p-6 animate-pulse">
                    <div className="space-y-4">
                      <div className="h-4 bg-green-200 rounded"></div>
                      <div className="h-3 bg-green-200 rounded"></div>
                      <div className="h-3 bg-green-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : latestReviewsError ? (
                <div className="col-span-full text-center py-12">
                  <div className="bg-red-50 rounded-xl p-8 max-w-md mx-auto">
                    <div className="text-red-500 text-4xl mb-4">🔄</div>
                    <p className="text-gray-700 text-lg font-semibold mb-2">データの取得に失敗しました</p>
                    <p className="text-gray-500 text-sm">{latestReviewsError}</p>
                  </div>
                </div>
              ) : latestReviews.length > 0 ? (
                latestReviews.map((review, index) => (
                  <ReviewCard key={`review-${review.lecture.id}-${review.id}`} review={review} index={index} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="bg-green-50 rounded-xl p-8 max-w-md mx-auto">
                    <div className="text-green-500 text-4xl mb-4">📝</div>
                    <p className="text-gray-700 text-lg font-semibold mb-2">まだレビューがありません</p>
                    <p className="text-gray-500 text-sm">最初のレビューを投稿してみませんか？</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* シンプルなセクション境界 */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#10b981" opacity="0.1" />
            </svg>
          </div>
        </section>

        {/* Popular Lectures Section - Green Background */}
        <section className="min-h-screen lg:min-h-0 lg:py-20 bg-[#1DBE67] flex flex-col justify-center relative overflow-hidden">
          <GreenSectionBg />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 relative z-10">
            <div className="text-center mb-8 lg:mb-16 animate-section-slide-in">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 genius-title-green">人気の授業</h2>
              <p className="text-lg lg:text-xl text-white">レビュー数の多い授業をチェックしよう！</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {popularLoading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="bg-white rounded-3xl p-6 shadow-lg animate-pulse">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : popularError ? (
                <div className="col-span-full text-center py-12">
                  <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md mx-auto">
                    <div className="text-4xl mb-4">🔄</div>
                    <div className="text-lg font-bold text-gray-900 mb-2">エラー</div>
                    <div className="text-gray-600 text-sm">データの取得に失敗しました</div>
                  </div>
                </div>
              ) : popularLectures.length > 0 ? (
                popularLectures.map((lecture, index) => (
                  <div key={lecture.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 z-20 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      <LectureCard lecture={lecture} showReviewInfo={true} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md mx-auto">
                    <div className="text-4xl mb-4">🌱</div>
                    <div className="text-lg font-bold text-gray-900 mb-2">人気の授業がまだありません</div>
                    <div className="text-gray-600 text-sm">レビューを投稿して人気授業を作りましょう！</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* No Reviews Lectures Section - 緑を基調としたシンプルデザイン */}
        <section className="min-h-screen lg:min-h-0 lg:py-20 bg-white flex flex-col justify-center relative overflow-hidden">
          {/* シンプルな背景パターン */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50/20 via-green-100/10 to-green-50/20"></div>
          </div>

          {/* 清潔な浮遊要素 */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-green-100 rounded-full opacity-30 animate-float"></div>
          <div className="absolute top-1/3 right-32 w-12 h-12 bg-green-200 rounded-full opacity-25 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-1/3 w-10 h-10 bg-green-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 relative z-10">
            {/* シンプルなタイトルデザイン */}
            <div className="text-center mb-12 lg:mb-20 animate-fade-in">
              <h2 className="text-3xl lg:text-4xl font-bold text-green-600 mb-6 flex items-center justify-center leading-tight">
                レビューが未投稿の授業
              </h2>
              <p className="text-lg lg:text-xl font-semibold text-green-500">あなたのレビューをお待ちしています</p>
            </div>

            {/* シンプルなグリッドレイアウト */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {noReviewsLoading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="bg-green-50 rounded-xl p-6 animate-pulse">
                    <div className="space-y-4">
                      <div className="h-4 bg-green-200 rounded"></div>
                      <div className="h-3 bg-green-200 rounded"></div>
                      <div className="h-3 bg-green-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : noReviewsError ? (
                <div className="col-span-full text-center py-12">
                  <div className="bg-red-50 rounded-xl p-8 max-w-md mx-auto">
                    <div className="text-red-500 text-4xl mb-4">🔄</div>
                    <p className="text-gray-700 text-lg font-semibold mb-2">データの取得に失敗しました</p>
                    <p className="text-gray-500 text-sm">{noReviewsError}</p>
                  </div>
                </div>
              ) : noReviewsLectures.length > 0 ? (
                noReviewsLectures.map((lecture, index) => (
                  <div key={lecture.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <LectureCard lecture={lecture} showReviewInfo={true} isWaitingForReview={true} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="bg-green-50 rounded-xl p-8 max-w-md mx-auto">
                    <div className="text-green-500 text-4xl mb-4">🎉</div>
                    <p className="text-gray-700 text-lg font-semibold mb-2">すべての授業にレビューが投稿されています！</p>
                    <p className="text-gray-500 text-sm">素晴らしいコミュニティの成果です</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* シンプルなセクション境界 */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#10b981" opacity="0.1" />
            </svg>
          </div>
        </section>

        {/* Advertisement & Social Section - 緑を基調としたデザイン */}
        <section className="min-h-screen lg:min-h-0 lg:py-20 bg-white relative overflow-hidden flex flex-col justify-center">
          {/* シンプルな背景エフェクト */}
          <div className="absolute inset-0">
            <div className="bg-gradient-to-br from-green-50/30 via-transparent to-green-100/30"></div>
          </div>

          {/* 清演な浮遊要素 */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-green-100 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-1/3 right-32 w-24 h-24 bg-green-200 rounded-full opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-green-300 rounded-full opacity-25 animate-float" style={{ animationDelay: '4s' }}></div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 z-10">
            <div className="text-center mb-12 lg:mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                広告掲載のご案内
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                このサイトに広告を載せませんか？
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* 統計情報カード */}
              <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="p-4 bg-green-100 rounded-full inline-block mb-6">
                      <FaBullhorn className="text-4xl text-green-600" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                      <div className="flex items-center justify-center space-x-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">9000+</div>
                          <div className="text-sm text-gray-600 font-medium">累計訪問者</div>
                        </div>
                        <div className="w-px h-12 bg-gray-300"></div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">新大生</div>
                          <div className="text-sm text-gray-600 font-medium">ターゲット層</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed font-bold">
                      累計<span className="text-green-600 font-bold">9000人</span>のユーザーが訪問しています
                    </p>
                  </div>
                </div>
              </div>

              {/* 広告効果カード */}
              <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="p-4 bg-green-100 rounded-full inline-block mb-6">
                      <FaRocket className="text-4xl text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      広告効果
                    </h3>
                    <div className="space-y-4 mb-6">
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-green-800 font-semibold">新大生に特化</p>
                        <p className="text-green-600 text-sm">学生に直接リーチできます</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-green-800 font-semibold">高いエンゲージメント</p>
                        <p className="text-green-600 text-sm">学生が日常的に利用します</p>
                      </div>
                    </div>
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLScencxVkV7P5sXKi9GkqlyIbAnQblG_yGciERVgsomicq_7Hw/viewform"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      お問い合わせ
                    </a>
                  </div>
                </div>
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8 xl:gap-12 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <StatsCard key={`${stat.label}-${index}`} stat={stat} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - 緑を基調としたシンプルデザイン */}
        <section className="min-h-screen lg:min-h-0 lg:py-20 bg-white relative overflow-hidden flex flex-col justify-center">
          {/* シンプルな背景エフェクト */}
          <div className="absolute inset-0">
            <div className="bg-gradient-to-br from-green-50/30 via-transparent to-green-100/30"></div>
          </div>

          {/* 清演な浮遊要素 */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-green-100 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-1/3 right-32 w-24 h-24 bg-green-200 rounded-full opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-green-300 rounded-full opacity-25 animate-float" style={{ animationDelay: '4s' }}></div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 lg:py-0 z-10">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-900 mb-6 lg:mb-8 xl:mb-12">
                今すぐ始めましょう
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 xl:gap-8 justify-center max-w-2xl mx-auto">
                <button
                  onClick={handleNavigateToReviewCreate}
                  className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 lg:py-4 xl:py-5 2xl:py-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl flex items-center justify-center text-sm lg:text-base xl:text-lg 2xl:text-xl"
                >
                  <FaHeart className="mr-2 lg:mr-3" />
                  <span>レビューを投稿する</span>
                </button>

                <button
                  onClick={handleNavigateToLectures}
                  className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 lg:py-4 xl:py-5 2xl:py-6 bg-transparent border-2 border-green-500 text-green-600 font-bold rounded-2xl hover:bg-green-50 transform hover:scale-105 transition-all duration-500 flex items-center justify-center text-sm lg:text-base xl:text-lg 2xl:text-xl"
                >
                  <FaLightbulb className="mr-2 lg:mr-3" />
                  <span>授業を探す</span>
                </button>
              </div>
            </div>
          </div>

        </section>

      </div>
    </>
  );
}

