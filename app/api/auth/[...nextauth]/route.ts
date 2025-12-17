import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"
import { cookies } from 'next/headers'

// セキュリティ: NEXTAUTH_SECRET の必須化チェック
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET環境変数が設定されていません。セキュリティのため必須です。')
}

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",  // 常にアカウント選択画面を表示
          access_type: "offline",    // リフレッシュトークン取得
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Google認証成功時
      if (account && user) {
        const rememberMe = cookies().get('remember_me')?.value === 'true'
        
        try {
          // Docker環境では内部通信URLを使用、外部からはNEXT_PUBLIC_ENVを使用
          const backendUrl = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV
          
          // バックエンドのGoogle認証APIを呼び出し
          const fetchOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: account.id_token,
              remember: rememberMe, // rememberMeフラグを送信
            }),
          }

          const response = await fetch(`${backendUrl}/api/v1/auth/google`, fetchOptions)

          if (response.ok) {
            const data = await response.json()
            
            if (data.token) {
              // バックエンドからのJWTトークンとユーザー情報を保存
              token.backendToken = data.token
              token.user = data.user
            }
          } else {
            const errorText = await response.text()
            console.error('Backend authentication failed:', response.status, errorText)
          }
        } catch (error) {
          console.error('Network error calling backend:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      // セッションにバックエンドのトークンとユーザー情報を含める
      session.backendToken = token.backendToken || null
      if (token.user) {
        session.user = {
          ...session.user,
          id: token.user.id,
          email: token.user.email,
          name: token.user.name,
          avatar_url: token.user.avatar_url || null
        }
      }

      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
