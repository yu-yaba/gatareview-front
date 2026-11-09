'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import { sessionRefetchInterval } from '../_helpers/sessionRefetch'

interface ClientProvidersProps {
  children: ReactNode
}

function SessionBoundary({ children, onExpiresChange }: ClientProvidersProps & { onExpiresChange: (expires: string | null) => void }) {
  const { data: session, status } = useSession()
  const backendToken = session?.backendToken || null
  const expires = session?.expires ?? null
  const [identity, setIdentity] = useState({ backendToken: null as string | null, initialized: false, version: 0 })

  // Reset private client state and pending component updates when accounts or tokens change.
  if (status !== 'loading' && (!identity.initialized || identity.backendToken !== backendToken)) {
    setIdentity({ backendToken, initialized: true, version: identity.version + (identity.initialized ? 1 : 0) })
  }

  useEffect(() => { onExpiresChange(expires) }, [expires, onExpiresChange])

  return <Fragment key={identity.version}>{children}</Fragment>
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  // セッションの終了時刻（サーバーが返す固定の時刻）。終了直後に一度だけ再取得してログアウト表示にする。
  const [expires, setExpires] = useState<string | null>(null)
  const refetchInterval = useMemo(() => sessionRefetchInterval(expires), [expires])

  return (
    <SessionProvider refetchInterval={refetchInterval}>
      <SessionBoundary onExpiresChange={setExpires}>{children}</SessionBoundary>
    </SessionProvider>
  )
}
