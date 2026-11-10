import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import * as Sentry from '@sentry/nextjs'
import { getSession } from 'next-auth/react'
import { CreateReviewResponse } from '../_types/ReviewSchema'

// API ベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_ENV ? `${process.env.NEXT_PUBLIC_ENV}/api/v1` : 'http://localhost:3001/api/v1'

const LOGOUT_PATH = '/auth/logout'

// Axios インスタンスを作成
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface SessionBoundRequestConfig extends AxiosRequestConfig {
  expectedBackendToken: string | null
}

export class SessionChangedError extends Error {
  constructor() {
    super('アカウントが変更されました。内容を確認して再度お試しください。')
    this.name = 'SessionChangedError'
  }
}

const normalizeToken = (token: unknown): string | null =>
  typeof token === 'string' && token.trim() !== '' ? token.trim() : null

// getSessionは通信失敗もnullにするため、更新時は正常な匿名応答と区別する。
async function mutationSessionToken(signal?: AbortSignal): Promise<string | null> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  const timeout = setTimeout(cancel, 10000)
  signal?.addEventListener('abort', cancel, { once: true })
  if (signal?.aborted) cancel()
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('セッションの確認に失敗しました。')
    const session = await response.json()
    if (session !== null && (typeof session !== 'object' || Array.isArray(session) ||
        (session.backendToken != null && typeof session.backendToken !== 'string'))) {
      throw new Error('セッションの確認に失敗しました。')
    }
    return normalizeToken(session?.backendToken)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', cancel)
  }
}

apiClient.interceptors.request.use(async config => {
  const bound = config as typeof config & Partial<SessionBoundRequestConfig>
  const isBound = Object.prototype.hasOwnProperty.call(bound, 'expectedBackendToken')
  const token = isBound
    ? await mutationSessionToken(config.signal as AbortSignal | undefined)
    : normalizeToken((await getSession())?.backendToken)
  if (isBound && token !== normalizeToken(bound.expectedBackendToken)) throw new SessionChangedError()

  // Cookie切替の通知がまだ届いていなくても、開始時と異なる権限では更新しない。
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  else config.headers.delete('Authorization')
  return config
})

// レスポンスインターセプター: エラーハンドリング
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401: 送ったAPIトークンが期限切れ・別端末でのログアウト等で無効になった。
    // ログイン済みに見えるまま全操作が失敗しないよう、セッションを終えてログイン画面へ案内する。
    // ログアウトAPI自体の401は signOutWithRevocation が成功として扱うため対象外。
    if (error.response?.status === 401 && originalRequest?.url !== LOGOUT_PATH) {
      const authorization = originalRequest?.headers?.get?.('Authorization') ?? originalRequest?.headers?.Authorization
      if (authorization) {
        void import('./sessionExpiry')
          .then(({ bearerToken, handleBackendUnauthorized }) => handleBackendUnauthorized(bearerToken(authorization)))
          .catch(() => {})
      }
    }

    // 403エラー（認可エラー）の場合
    if (error.response?.status === 403) {
      console.error('Access denied. Insufficient permissions.')
    }

    // 500エラー（サーバーエラー）の場合
    if (error.response?.status >= 500) {
      Sentry.captureException(error, { tags: { operation: 'api.request' } })
      console.error('Server error occurred. Please try again later.')
    }

    return Promise.reject(error)
  }
)

// API 関数のタイプ定義
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
}

export interface AdminReviewAccessState {
  lecture_review_restriction_enabled: boolean
  updated_at: string | null
  last_updated_by: {
    id: number
    name: string
    email: string
  } | null
}

// 汎用API呼び出し関数
export const apiRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig | SessionBoundRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig | SessionBoundRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig | SessionBoundRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig | SessionBoundRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig | SessionBoundRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete(url, config),
}

// 認証関連のAPI関数
export const authApi = {
  // 現在のユーザー情報を取得
  getCurrentUser: () => apiRequest.get('/auth/me'),

  // ログアウト
  logout: () => apiRequest.post(LOGOUT_PATH),
}

// レビュー関連のAPI関数
export const reviewApi = {
  // レビューを作成（匿名投稿可能、ログイン時は自動的にユーザーに紐付け）
  createReview: (lectureId: string, reviewData: any, config: SessionBoundRequestConfig) =>
    apiRequest.post<CreateReviewResponse>(`/lectures/${lectureId}/reviews`, reviewData, config),

  // ユーザーのレビュー一覧を取得（認証必須）
  getUserReviews: () => apiRequest.get('/users/reviews'),
}

export const reviewAccessAdminApi = {
  getReviewAccess: () => apiRequest.get<AdminReviewAccessState>('/admin/review-access'),

  updateReviewAccess: (enabled: boolean, config: SessionBoundRequestConfig) =>
    apiRequest.patch<AdminReviewAccessState>('/admin/review-access', {
      review_access: {
        lecture_review_restriction_enabled: enabled,
      },
    }, config),
}

// マイページ関連のAPI関数
export const mypageApi = {
  // マイページデータを取得（認証必須）
  getMypage: () => apiRequest.get('/mypage'),
  
  // ユーザーのレビュー一覧を取得（認証必須、ページネーション付き）
  getReviews: (page = 1, perPage = 10, config?: AxiosRequestConfig) =>
    apiRequest.get(`/mypage/reviews?page=${page}&per_page=${perPage}`, config),
    
  // ユーザーのブックマーク一覧を取得（認証必須、ページネーション付き）
  getBookmarks: (page = 1, perPage = 10, config?: AxiosRequestConfig) =>
    apiRequest.get(`/mypage/bookmarks?page=${page}&per_page=${perPage}`, config),
}

export default apiClient
