'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import { sessionRefetchInterval } from '../_helpers/sessionRefetch'

interface ClientProvidersProps {
  children: ReactNode
}

function SessionBoundary({ children, onExpiresInChange }: ClientProvidersProps & { onExpiresInChange: (expiresIn: number | null) => void }) {
  const { data: session, status } = useSession()
  const backendToken = session?.backendToken || null
  const expiresIn = session?.expiresIn ?? null
  const [identity, setIdentity] = useState({ backendToken: null as string | null, initialized: false, version: 0 })

  // Reset private client state and pending component updates when accounts or tokens change.
  if (status !== 'loading' && (!identity.initialized || identity.backendToken !== backendToken)) {
    setIdentity({ backendToken, initialized: true, version: identity.version + (identity.initialized ? 1 : 0) })
  }

  useEffect(() => { onExpiresInChange(expiresIn) }, [expiresIn, onExpiresInChange])

  return <Fragment key={identity.version}>{children}</Fragment>
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  // 取得時点でのセッション終了までの秒数（サーバー基準）。終了直後に再取得してログアウト表示にする。
  // 再取得のたびに残り秒数が変わり、タイマーはその時点から数え直す。
  const [expiresIn, setExpiresIn] = useState<number | null>(null)
  const refetchInterval = useMemo(() => sessionRefetchInterval(expiresIn), [expiresIn])

  return (
    <SessionProvider refetchInterval={refetchInterval}>
      <SessionBoundary onExpiresInChange={setExpiresIn}>{children}</SessionBoundary>
    </SessionProvider>
  )
}
