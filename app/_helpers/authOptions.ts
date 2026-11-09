import type { NextAuthOptions } from 'next-auth';
import * as Sentry from '@sentry/nextjs';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import { clientIpSigner } from './backendRequest';

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
        const cookieStore = await cookies();
        const rememberMe = cookieStore.get('remember_me')?.value === 'true';

        try {
          const backendUrl = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV;
          const authUrl = `${backendUrl}/api/v1/auth/google`;
          // Count sign-ins per visitor, not per Vercel egress address.
          const signClientIp = await clientIpSigner();
          const response = await fetch(authUrl, {
            method: 'POST',
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(10000),
            headers: {
              'Content-Type': 'application/json',
              ...signClientIp(authUrl, 'POST'),
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
            if (response.status >= 500) {
              Sentry.captureException(new Error('Backend authentication unavailable'), { tags: { operation: 'auth.backend' } });
            }
            console.error('Backend authentication failed:', response.status);
          }
        } catch (error) {
          Sentry.captureException(error, { tags: { operation: 'auth.backend' } });
          console.error('Network error calling backend authentication');
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
