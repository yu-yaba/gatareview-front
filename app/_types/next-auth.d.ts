import "next-auth"
import { DefaultSession } from "next-auth"

// カスタムユーザー型の定義
export interface CustomUser {
  id: string
  email: string
  name: string
  avatar_url?: string | null
  reviews_count?: number
  admin?: boolean
}

declare module "next-auth" {
  interface Session {
    backendToken: string | null
    user: CustomUser & DefaultSession["user"]
  }

  interface User extends CustomUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string | null
    user?: CustomUser
    // 「ログイン状態を記憶する」を選んだか
    remember?: boolean
    // サインインした時刻（秒）
    authTime?: number
    // バックエンドAPIトークンの有効期限（秒）
    backendExp?: number
    iat?: number
    exp?: number
  }
}
