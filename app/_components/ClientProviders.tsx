'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { Fragment, ReactNode, useState } from 'react'

interface ClientProvidersProps {
  children: ReactNode
}

function SessionBoundary({ children }: ClientProvidersProps) {
  const { data: session, status } = useSession()
  const backendToken = session?.backendToken || null
  const [identity, setIdentity] = useState({ backendToken: null as string | null, initialized: false, version: 0 })

  // Reset private client state and pending component updates when accounts or tokens change.
  if (status !== 'loading' && (!identity.initialized || identity.backendToken !== backendToken)) {
    setIdentity({ backendToken, initialized: true, version: identity.version + (identity.initialized ? 1 : 0) })
  }

  return <Fragment key={identity.version}>{children}</Fragment>
}

// 開いたままのタブでも、期限切れで終了したセッションをログイン済みとして表示し続けない。
const SESSION_REFETCH_INTERVAL_SECONDS = 5 * 60

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider refetchInterval={SESSION_REFETCH_INTERVAL_SECONDS}>
      <SessionBoundary>{children}</SessionBoundary>
    </SessionProvider>
  )
}
