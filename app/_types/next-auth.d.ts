import "next-auth"
import { DefaultSession } from "next-auth"

// カスタムユーザー型の定義
export interface CustomUser {
  id: string
  email: string
  name: string
  avatar_url?: string | null
  reviews_count?: number
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
    iat?: number
    exp?: number
  }
}