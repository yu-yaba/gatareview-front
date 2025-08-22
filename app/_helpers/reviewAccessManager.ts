/**
 * レビューアクセス権限の管理を行うヘルパーモジュール
 * セッション状態に依存しない永続的なアクセス制御を提供
 */

const STORAGE_KEY = 'gatareview_access_granted';
const STORAGE_VERSION = '1.0';

interface AccessData {
  version: string;
  granted: boolean;
  timestamp: number;
  reviewCount: number;
}

/**
 * レビュー投稿成功時にアクセス権限を付与
 */
export const grantReviewAccess = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const accessData: AccessData = {
        version: STORAGE_VERSION,
        granted: true,
        timestamp: Date.now(),
        reviewCount: getStoredReviewCount() + 1
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accessData));
    }
  } catch (error) {
    console.error('Failed to grant review access:', error);
  }
};

/**
 * ローカルストレージからアクセス権限をチェック
 */
export const hasLocalReviewAccess = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      
      const accessData: AccessData = JSON.parse(stored);
      
      // バージョンチェック（将来の互換性のため）
      if (accessData.version !== STORAGE_VERSION) {
        // 古いバージョンの場合はクリア
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      
      return accessData.granted === true && accessData.reviewCount > 0;
    }
  } catch (error) {
    console.error('Failed to check local review access:', error);
    // エラー時は安全側に倒してfalseを返す
    return false;
  }
  
  return false;
};

/**
 * 保存されているレビュー数を取得
 */
export const getStoredReviewCount = (): number => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return 0;
      
      const accessData: AccessData = JSON.parse(stored);
      return accessData.reviewCount || 0;
    }
  } catch (error) {
    console.error('Failed to get stored review count:', error);
  }
  
  return 0;
};

/**
 * レビューアクセス権限の総合判定
 * 期間ベースのサーバーサイドアクセスコントロールを優先
 * セッション認証とローカルストレージの両方をチェック
 */
export const canAccessReviews = (isAuthenticated: boolean, userReviewsCount: number | undefined): boolean => {
  // 認証済みかつレビュー投稿済みの場合（reviews_countが確実に取得できた場合のみ）
  // 注意: サーバーサイドの期間ベースチェックを優先するため、ここではフォールバック判定として利用
  const sessionAccess = isAuthenticated && userReviewsCount !== undefined && userReviewsCount >= 1;
  
  // ローカルストレージにアクセス権限がある場合（フォールバック）
  const localAccess = hasLocalReviewAccess();
  
  // どちらかの条件を満たせばアクセス可能
  // userReviewsCountがundefinedの場合（APIエラー等）は、ローカルストレージ判定のみ有効
  return sessionAccess || localAccess;
};

/**
 * APIレスポンスから期間ベースのアクセス権限を判定
 * レビュー一覧APIの `access_granted` フィールドを使用
 */
export const canAccessReviewsFromApi = (reviewsResponse: any[]): boolean => {
  if (!reviewsResponse || reviewsResponse.length === 0) {
    return false;
  }
  
  // 最初のレビューの access_granted フィールドをチェック
  // サーバーサイドで統一的に判定されているため、全レビューで同じ値になる
  return reviewsResponse[0]?.access_granted === true;
};

/**
 * 統一されたアクセス権限判定
 * APIレスポンスを優先し、フォールバックとして従来の判定を使用
 */
export const canAccessReviewsUnified = (
  reviewsResponse: any[] | null,
  isAuthenticated: boolean,
  userReviewsCount: number | undefined
): boolean => {
  // APIレスポンスが利用可能な場合はそれを優先
  if (reviewsResponse && reviewsResponse.length > 0) {
    return canAccessReviewsFromApi(reviewsResponse);
  }
  
  // APIレスポンスが利用できない場合はフォールバック判定
  return canAccessReviews(isAuthenticated, userReviewsCount);
};

/**
 * アクセス権限データをクリア（テスト用・デバッグ用）
 */
export const clearReviewAccess = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to clear review access:', error);
  }
};

/**
 * 現在のアクセス権限状態を取得（デバッグ用）
 */
export const getAccessStatus = (): {
  hasLocalAccess: boolean;
  storedReviewCount: number;
  timestamp: number | null;
} => {
  return {
    hasLocalAccess: hasLocalReviewAccess(),
    storedReviewCount: getStoredReviewCount(),
    timestamp: (() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const accessData: AccessData = JSON.parse(stored);
            return accessData.timestamp;
          }
        }
      } catch (error) {
        console.error('Failed to get access timestamp:', error);
      }
      return null;
    })()
  };
};