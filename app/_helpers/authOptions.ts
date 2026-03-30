import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET環境変数が設定されていません。セキュリティのため必須です。');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const rememberMe = cookies().get('remember_me')?.value === 'true';

        try {
          const backendUrl = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV;
          const response = await fetch(`${backendUrl}/api/v1/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: account.id_token,
              remember: rememberMe,
            }),
          });

          if (response.ok) {
            const data = await response.json();

            if (data.token) {
              token.backendToken = data.token;
              token.user = data.user;
            }
          } else {
            const errorText = await response.text();
            console.error('Backend authentication failed:', response.status, errorText);
          }
        } catch (error) {
          console.error('Network error calling backend:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken || null;
      if (token.user) {
        session.user = {
          ...session.user,
          id: token.user.id,
          email: token.user.email,
          name: token.user.name,
          avatar_url: token.user.avatar_url || null,
          admin: token.user.admin || false,
        };
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
