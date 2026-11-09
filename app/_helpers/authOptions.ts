import type { NextAuthOptions } from 'next-auth';
import * as Sentry from '@sentry/nextjs';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import { clientIpSigner } from './backendRequest';
import {
  REMEMBERED_SESSION_MAX_AGE,
  SESSION_ENDED_ERROR_NAME,
  SessionEndedError,
  backendTokenExpiry,
  isSessionActive,
  nowInSeconds,
  sessionExpiresAt,
} from './sessionLifetime';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET環境変数が設定されていません。セキュリティのため必須です。');
}

// NextAuthはサインイン時のjwtコールバックの例外を `?error=Callback` としてサインイン画面へ戻す。
class BackendAuthenticationError extends Error {
  constructor() {
    super('Backend authentication failed');
    this.name = 'BackendAuthenticationError';
  }
}

// NextAuthはエラー本体か { error } を渡す。名前とメッセージだけを取り出す。
const describeError = (metadata: unknown) => {
  const candidate = metadata instanceof Error ? metadata : (metadata as { error?: unknown } | null)?.error ?? metadata;
  const { name, message } = (candidate ?? {}) as { name?: unknown; message?: unknown };
  return {
    name: typeof name === 'string' ? name : '',
    message: typeof message === 'string' ? message : '',
  };
};

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
            const backendExp = backendTokenExpiry(data?.token);
            const authTime = nowInSeconds();

            if (typeof data?.token === 'string' && data.user && backendExp !== null && backendExp > authTime) {
              token.backendToken = data.token;
              token.user = data.user;
              token.remember = rememberMe;
              token.authTime = authTime;
              token.backendExp = backendExp;
              return token;
            }
            console.error('Backend authentication returned no usable token');
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

        // APIトークンなしのセッションを作らない（ログイン済みに見えて全操作が失敗するため）。
        throw new BackendAuthenticationError();
      }

      // 期限切れ・寿命の情報がない旧形式のセッションは終了し、Cookieを削除させる。
      if (!isSessionActive(token)) throw new SessionEndedError();
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken || null;
      const expiresAt = sessionExpiresAt(token);
      if (expiresAt !== null) {
        session.expires = new Date(expiresAt * 1000).toISOString();
        // ブラウザの時計がずれていても終了時刻に再確認できるよう、サーバー基準の残り秒数も返す。
        session.expiresIn = Math.max(0, expiresAt - nowInSeconds());
      }
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
  logger: {
    // 寿命による通常の終了はエラーとして記録しない。その他も詳細（トークンを含み得る）は出さない。
    error(code, metadata) {
      const { name, message } = describeError(metadata);
      if (code === 'JWT_SESSION_ERROR' && name === SESSION_ENDED_ERROR_NAME) return;
      console.error(`[next-auth][error][${code}]`, name, message);
    },
  },
  pages: {
    signIn: '/auth/signin',
    // NextAuthの全エラー（Googleでのキャンセル等）をサインイン画面でメッセージ表示する。
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    // Cookieの実際の期限は route.ts で記憶設定とAPIトークンの期限に合わせて上書きする。
    maxAge: REMEMBERED_SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: REMEMBERED_SESSION_MAX_AGE,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
