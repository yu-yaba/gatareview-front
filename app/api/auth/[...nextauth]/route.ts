import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Google認証成功時
      if (account && user) {
        try {
          // バックエンドのGoogle認証APIを呼び出し
          const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: account.id_token,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            // バックエンドからのJWTトークンとユーザー情報を保存
            token.backendToken = data.token
            token.user = data.user
          } else {
            console.error('Backend authentication failed')
          }
        } catch (error) {
          console.error('Error authenticating with backend:', error)
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
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }