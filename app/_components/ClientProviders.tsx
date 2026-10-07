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

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <SessionBoundary>{children}</SessionBoundary>
    </SessionProvider>
  )
}
