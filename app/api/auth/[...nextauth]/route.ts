import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"
import { cookies } from 'next/headers'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      console.log('🚀 JWT CALLBACK EXECUTED!')
      console.log('Account exists:', !!account)
      console.log('User exists:', !!user)
      
      // Google認証成功時
      if (account && user) {
        const rememberMe = cookies().get('remember_me')?.value === 'true'
        console.log('=== NextAuth JWT Callback START ===')
        console.log('Account provider:', account.provider)
        console.log('Account type:', account.type)
        console.log('ID Token present:', !!account.id_token)
        console.log('ID Token length:', account.id_token?.length || 0)
        console.log('User info:', { name: user.name, email: user.email })
        console.log('Environment:', process.env.NEXT_PUBLIC_ENV)
        console.log('Backend API URL:', `${process.env.NEXT_PUBLIC_ENV}/api/v1/auth/google`)
        
        try {
          console.log('🔄 Calling backend API...')
          
          // Docker環境では内部通信URLを使用、外部からはNEXT_PUBLIC_ENVを使用
          const backendUrl = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV
          console.log('Using backend URL:', backendUrl)
          console.log('DOCKER_BACKEND_URL:', process.env.DOCKER_BACKEND_URL)
          console.log('NEXT_PUBLIC_ENV:', process.env.NEXT_PUBLIC_ENV)
          
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
          
          console.log('Request options:', {
            method: fetchOptions.method,
            headers: fetchOptions.headers,
            bodyTokenLength: account.id_token?.length || 0
          })
          
          const response = await fetch(`${backendUrl}/api/v1/auth/google`, fetchOptions)

          console.log('✅ Backend response received')
          console.log('Response status:', response.status)
          console.log('Response ok:', response.ok)
          console.log('Response headers:', Object.fromEntries(response.headers.entries()))
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ Backend response data:', data)
            
            if (data.token) {
              // バックエンドからのJWTトークンとユーザー情報を保存
              token.backendToken = data.token
              token.user = data.user
              console.log('✅ JWT token saved successfully:', data.token.substring(0, 20) + '...')
            } else {
              console.error('❌ No token in backend response')
            }
          } else {
            const errorText = await response.text()
            console.error('❌ Backend authentication failed')
            console.error('Status:', response.status)
            console.error('Error text:', errorText)
            console.error('Full response:', response)
          }
        } catch (error) {
          console.error('❌ Network error calling backend:', error)
          if (error instanceof Error) {
            console.error('Error name:', error.name)
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
          } else {
            console.error('Unknown error type:', typeof error)
          }
        }
        
        console.log('=== NextAuth JWT Callback END ===')
        console.log('Final token backendToken:', !!token.backendToken)
      } else {
        console.log('NextAuth JWT Callback: No new account/user data')
      }

      return token
    },
    async session({ session, token }) {
      console.log('🎯 SESSION CALLBACK EXECUTED!')
      console.log('Token backendToken:', token.backendToken)
      
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