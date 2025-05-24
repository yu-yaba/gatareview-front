'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" className="auth-error">
      <p>認証に問題が発生しました:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

type Props = {
  children: React.ReactNode;
};

export default function NextAuthProvider({ children }: Props) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SessionProvider>{children}</SessionProvider>
    </ErrorBoundary>
  );
}
