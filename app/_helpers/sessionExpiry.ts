import { signOut } from 'next-auth/react'
import { error as notifyError } from './notifications'

// バックエンドがAPIトークンを拒否（401）したときに、ログイン済みに見える状態を終わらせる。
export const SESSION_EXPIRED_SIGNIN_URL = '/auth/signin?error=SessionExpired'

let pending: Promise<void> | null = null

const normalizeToken = (token: unknown): string | null =>
  typeof token === 'string' && token.trim() !== '' ? token.trim() : null

export function bearerToken(authorization: unknown): string | null {
  if (typeof authorization !== 'string') return null
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
  return match ? normalizeToken(match[1]) : null
}

// undefined は「確認できなかった」を表す（通信失敗時に誤ってログアウトさせない）。
async function currentBackendToken(): Promise<string | null | undefined> {
  try {
    const response = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' })
    if (!response.ok) return undefined
    const session = await response.json()
    return normalizeToken(session?.backendToken)
  } catch {
    return undefined
  }
}

async function endRejectedSession(rejectedToken: string) {
  const current = await currentBackendToken()
  if (current === undefined) throw new Error('session check failed')
  // 別アカウントへ切り替わった後に届いた旧トークンの401では、新しいセッションを終わらせない。
  if (current !== null && current !== rejectedToken) return false

  if (current === rejectedToken) {
    // サインアウトAPIはサーバー側でもバックエンドの失効（401は成功扱い）を行ってからCookieを消す。
    const result = await signOut({ redirect: false, callbackUrl: SESSION_EXPIRED_SIGNIN_URL })
    if (!result?.url) throw new Error('sign-out failed')
  }
  window.location.assign(SESSION_EXPIRED_SIGNIN_URL)
  return true
}

// Authorizationを付けたリクエストが401になったときに呼ぶ。トークンなしの401（未ログイン）は対象外。
export function handleBackendUnauthorized(rejectedToken: unknown): Promise<void> {
  const token = normalizeToken(rejectedToken)
  if (!token || typeof window === 'undefined') return Promise.resolve()
  // 同時に複数の401が届いても、サインアウトと遷移は一度だけ行う。
  if (pending) return pending

  pending = endRejectedSession(token).then(
    navigating => { if (!navigating) pending = null },
    () => {
      pending = null
      notifyError('ログイン状態を確認できませんでした。ページを再読み込みして、もう一度ログインしてください。')
    },
  )
  return pending
}
