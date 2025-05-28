import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions, DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id?: string;
    } & DefaultSession['user']
  }
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing environment variables for Google authentication');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable');
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // Add any other session-related options if needed, e.g., session strategy
  session: {
    strategy: "jwt", // Example: Using JWT strategy
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Add callbacks if you need to customize behavior, e.g., jwt, session
  callbacks: {
    async jwt({ token, user }) {
      // Add user id to token, etc.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom properties to session from token
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',  // カスタムサインインページ（必要な場合）
    error: '/auth/error',    // カスタムエラーページ（必要な場合）
  },
};
