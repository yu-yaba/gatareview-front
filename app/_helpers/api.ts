import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { getSession } from 'next-auth/react'
import { CreateReviewResponse } from '../_types/ReviewSchema'

// API ベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_ENV ? `${process.env.NEXT_PUBLIC_ENV}/api/v1` : 'http://localhost:3001/api/v1'

// Axios インスタンスを作成
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// リクエストインターセプター: 認証トークンを自動付与
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      // NextAuthセッションから認証トークンを取得
      const session = await getSession()
      
      if (session?.backendToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${session.backendToken}`,
        }
      }
    } catch (error) {
      console.error('Failed to get session:', error)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// レスポンスインターセプター: エラーハンドリング
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401エラー（認証エラー）の場合
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // ここでログアウト処理やトークンリフレッシュを行うことができる
      console.error('Authentication failed. Please log in again.')
      
      // 必要に応じてログアウト処理を実行
      // signOut({ callbackUrl: '/login' })
    }

    // 403エラー（認可エラー）の場合
    if (error.response?.status === 403) {
      console.error('Access denied. Insufficient permissions.')
    }

    // 500エラー（サーバーエラー）の場合
    if (error.response?.status >= 500) {
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

// 汎用API呼び出し関数
export const apiRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete(url, config),
}

// 認証関連のAPI関数
export const authApi = {
  // 現在のユーザー情報を取得
  getCurrentUser: () => apiRequest.get('/auth/me'),

  // ログアウト
  logout: () => apiRequest.post('/auth/logout'),
}

// レビュー関連のAPI関数（認証が必要な場合）
export const reviewApi = {
  // レビューを作成（認証必須）
  createReview: (lectureId: string, reviewData: any) =>
    apiRequest.post<CreateReviewResponse>(`/lectures/${lectureId}/reviews`, reviewData),

  // ユーザーのレビュー一覧を取得（認証必須）
  getUserReviews: () => apiRequest.get('/users/reviews'),
}

// マイページ関連のAPI関数
export const mypageApi = {
  // マイページデータを取得（認証必須）
  getMypage: () => apiRequest.get('/mypage'),
  
  // ユーザーのレビュー一覧を取得（認証必須、ページネーション付き）
  getReviews: (page = 1, perPage = 10) => 
    apiRequest.get(`/mypage/reviews?page=${page}&per_page=${perPage}`),
    
  // ユーザーのブックマーク一覧を取得（認証必須、ページネーション付き）
  getBookmarks: (page = 1, perPage = 10) => 
    apiRequest.get(`/mypage/bookmarks?page=${page}&per_page=${perPage}`),
}

// 講義関連のAPI関数 (主にサーバーサイドでのデータ取得)
export const lectureApi = {
  getLecture: async (id: string) => {
    try {
      // Docker環境ではコンテナ間通信を使用
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://gatareview.com' 
        : 'http://gatareview-back:3000';
      
      const response = await fetch(`${apiUrl}/api/v1/lectures/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        // ISR的なキャッシュ設定
        cache: 'no-store', // キャッシュを一時的に無効化
      });
  
      if (!response.ok) {
        return null;
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching lecture data:', error);
      return null;
    }
  }
};

export default apiClient