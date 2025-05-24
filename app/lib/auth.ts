import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // Add any other session-related options if needed, e.g., session strategy
  session: {
    strategy: "jwt", // Example: Using JWT strategy
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
        // session.user.id = token.id; // Example: If you added id to token
      }
      return session;
    },
  },
};
