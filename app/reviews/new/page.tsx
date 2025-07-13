'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { handleAjaxError } from '../../_helpers/helpers';
import Link from 'next/link';
import type { LectureSchema } from '@/app/_types/LectureSchema';
import { useRouter, useSearchParams } from 'next/navigation';
import Loading from 'react-loading';
import { debounce } from 'lodash';
import { useAuth } from '../../_hooks/useAuth';
import { signIn } from 'next-auth/react';

const NewReviewPage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [searchWord, setSearchWord] = useState('');
  const [fetchedLectures, setFetchedLectures] = useState<Array<LectureSchema>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 検索結果キャッシュ
  const searchCache = useRef<Map<string, { lectures: LectureSchema[], pagination: any, timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // キャッシュ有効期限（5分）
  const CACHE_DURATION = 5 * 60 * 1000;

  // Intersection Observer for lazy loading optimization
  const observerTarget = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  // URLパラメータから特定の授業を取得する関数
  const fetchSpecificLecture = async (lectureId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/${lectureId}`);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      // 直接レビューページに遷移
      router.push(`/lectures/${lectureId}/review`);
      return data;
    } catch (error) {
      handleAjaxError("指定された授業の取得に失敗しました");
      return null;
    }
  };

  useEffect(() => {
    const lectureId = searchParams.get('lectureId');

    if (lectureId) {
      // URLパラメータで授業IDが指定されている場合、その授業のレビューページに遷移
      fetchSpecificLecture(lectureId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  // 最適化された授業検索関数
  const fetchLectures = useCallback(async (search: string, page: number = 1, fromPageChange: boolean = false) => {
    // 空文字の場合のみ何もしない
    if (!search.trim()) {
      if (!fromPageChange) {
        setFetchedLectures([]);
        setTotalPages(0);
        setTotalCount(0);
        setHasSearched(false);
      }
      return;
    }

    const cacheKey = `${search.trim()}_${page}`;
    const now = Date.now();

    // キャッシュチェック
    if (searchCache.current.has(cacheKey)) {
      const cached = searchCache.current.get(cacheKey)!;
      if (now - cached.timestamp < CACHE_DURATION) {
        setFetchedLectures(cached.lectures);
        setTotalPages(cached.pagination.total_pages);
        setTotalCount(cached.pagination.total_count);
        setCurrentPage(page);
        setHasSearched(true);
        setLastSearchTerm(search.trim());
        return;
      } else {
        // 期限切れキャッシュを削除
        searchCache.current.delete(cacheKey);
      }
    }

    // 進行中のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures?search=${encodeURIComponent(search.trim())}&page=${page}`,
        { 
          signal: abortControllerRef.current.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // キャッシュに保存
      searchCache.current.set(cacheKey, {
        lectures: data.lectures || [],
        pagination: data.pagination,
        timestamp: now
      });

      // キャッシュサイズ制限（最大50エントリ）
      if (searchCache.current.size > 50) {
        const firstKey = searchCache.current.keys().next().value;
        if (firstKey) {
          searchCache.current.delete(firstKey);
        }
      }

      setFetchedLectures(data.lectures || []);
      setTotalPages(data.pagination?.total_pages || 0);
      setTotalCount(data.pagination?.total_count || 0);
      setCurrentPage(page);
      setHasSearched(true);
      setLastSearchTerm(search.trim());
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // リクエストがキャンセルされた場合は何もしない
      }

      console.error('Search error:', error);
      
      // より詳細なエラーハンドリング
      if (error.message?.includes('500')) {
        handleAjaxError("サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。");
      } else if (error.message?.includes('404')) {
        handleAjaxError("APIエンドポイントが見つかりません。");
      } else if (error.message?.includes('Network') || error.name === 'TypeError') {
        handleAjaxError("ネットワーク接続を確認してください。");
      } else if (error.message?.includes('timeout')) {
        handleAjaxError("リクエストがタイムアウトしました。再度お試しください。");
      } else {
        handleAjaxError("授業の検索に失敗しました。しばらく時間をおいてから再度お試しください。");
      }
      
      setFetchedLectures([]);
      setTotalPages(0);
      setTotalCount(0);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 最適化されたdebounce（1つのみ）
  const debouncedFetchLectures = useCallback(
    (search: string) => {
      const debouncedFunction = debounce(() => {
        fetchLectures(search, 1);
      }, 300);
      debouncedFunction();
    },
    [fetchLectures]
  );

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchWord(value);

    if (value.length >= 1) {
      debouncedFetchLectures(value);
    } else if (value.length === 0) {
      setFetchedLectures([]);
      setTotalPages(0);
      setTotalCount(0);
      setHasSearched(false);
      debouncedFetchLectures.cancel(); // debounceをキャンセル
    }
  }, [debouncedFetchLectures]);

  const handlePageChange = useCallback((page: number) => {
    if (lastSearchTerm.length >= 1) {
      fetchLectures(lastSearchTerm, page, true);
    }
  }, [lastSearchTerm, fetchLectures]);

  // 講義選択ハンドラー
  const handleLectureSelect = useCallback((lecture: LectureSchema) => {
    router.push(`/lectures/${lecture.id}/review`);
  }, [router]);

  // 講義カードコンポーネント（メモ化）
  const LectureCard = memo<{ lecture: LectureSchema }>(({ lecture }) => (
    <button
      onClick={() => handleLectureSelect(lecture)}
      className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-green-100/50 hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group"
    >
      {/* ホバーエフェクト */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

      <div className="relative z-10 text-left">
        {/* 講義タイトル */}
        <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-tight group-hover:text-green-600 transition-colors duration-300 mb-2">
          {lecture.title}
        </h2>
        {/* 講師名 */}
        <p className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
          {lecture.lecturer}
        </p>
      </div>
    </button>
  ));
  LectureCard.displayName = 'LectureCard';

  // Intersection Observer for lazy loading optimization
  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && fetchedLectures.length > visibleRange.end) {
            setVisibleRange(prev => ({ ...prev, end: Math.min(prev.end + 10, fetchedLectures.length) }));
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [fetchedLectures.length, visibleRange.end]);

  // Reset visible range when search changes
  useEffect(() => {
    setVisibleRange({ start: 0, end: Math.min(10, fetchedLectures.length) });
  }, [fetchedLectures.length]);

  // 講義リストコンポーネント（メモ化 + Virtual scrolling風の最適化）
  const LectureList = memo(() => {
    const visibleLectures = useMemo(
      () => fetchedLectures.slice(visibleRange.start, visibleRange.end),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fetchedLectures, visibleRange.start, visibleRange.end]
    );

    return (
      <div className="w-full max-w-6xl space-y-4">
        {visibleLectures.map((lecture) => (
          <LectureCard key={lecture.id} lecture={lecture} />
        ))}
        {visibleRange.end < fetchedLectures.length && (
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            <div className="text-gray-400 text-sm">読み込み中...</div>
          </div>
        )}
      </div>
    );
  });
  LectureList.displayName = 'LectureList';

  // ページネーションコンポーネント（メモ化）
  const PaginationControls = memo(() => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center mt-8 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          前へ
        </button>

        <span className="px-4 py-2 text-gray-700 font-medium">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          次へ
        </button>
      </div>
    );
  });
  PaginationControls.displayName = 'PaginationControls';

  // ローディングコンポーネント（メモ化）
  const LoadingSpinner = memo(() => (
    <div className="flex justify-center items-center h-64">
      <Loading type={"bubbles"} width={100} height={100} color={"#1DBE67"} />
    </div>
  ));
  LoadingSpinner.displayName = 'LoadingSpinner';

  // 検索ガイダンスコンポーネント（メモ化）
  const SearchGuidance = memo(() => (
    <div className="text-center mt-8">
      <p className="text-gray-500 mb-2">
        授業名または講師名を入力して検索してください
      </p>
    </div>
  ));
  SearchGuidance.displayName = 'SearchGuidance';

  // 検索結果ヘッダーコンポーネント（メモ化）
  const SearchResultHeader = memo(() => (
    <div className="mb-4 text-center">
      <p className="text-sm text-gray-600">
        「{lastSearchTerm}」の検索結果: {totalCount}件
      </p>
    </div>
  ));
  SearchResultHeader.displayName = 'SearchResultHeader';

  // 検索結果なしコンポーネント（メモ化）
  const NoSearchResults = memo(() => (
    <div className="text-center mt-8">
      <p className="text-gray-500 mb-2">
        「{lastSearchTerm}」に該当する授業が見つかりません
      </p>
      <p className="text-sm text-gray-400">
        別のキーワードで検索してみてください
      </p>
    </div>
  ));
  NoSearchResults.displayName = 'NoSearchResults';

  // 認証プロンプトコンポーネント（メモ化）
  const AuthPrompt = memo(() => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-green-100/50 max-w-md text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-800 mb-2">ログインが必要です</h3>
          <p className="text-gray-600 mb-6">
            レビューを投稿するには、Googleアカウントでログインしてください。
          </p>
        </div>
        
        <button
          onClick={() => signIn('google', { callbackUrl: '/reviews/new' })}
          className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Googleでログイン</span>
        </button>
        
        <p className="text-sm text-gray-500 mt-4">
          ログイン後、こちらのページに戻って授業を検索できます。
        </p>
      </div>
    </div>
  ));
  AuthPrompt.displayName = 'AuthPrompt';

  // 認証中の場合はローディングを表示
  if (authLoading) {
    return (
      <section className="flex flex-col items-center p-4 md:p-8">
        <LoadingSpinner />
      </section>
    );
  }

  // 認証制限を削除: 全ユーザーがレビュー投稿可能

  return (
    <section className="flex flex-col items-center p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-4 2xl:text-4xl">レビューする授業を選択</h2>
      

      <div className="w-10/12 md:w-8/12 2xl:w-6/12 mb-6">
        <input
          type="text"
          ref={searchInput}
          defaultValue={searchWord}
          onChange={handleSearchInputChange}
          placeholder="授業名、講師名で検索..."
          className="w-full p-3 border rounded-md shadow focus:border-green-500 outline-none"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full flex flex-col items-center">
          {!hasSearched ? (
            <SearchGuidance />
          ) : fetchedLectures.length > 0 ? (
            <>
              <SearchResultHeader />
              <LectureList />
              <PaginationControls />
            </>
          ) : (
            <NoSearchResults />
          )}
        </div>
      )}
    </section>
  );
};

export default memo(NewReviewPage);