import { signOut } from 'next-auth/react'
import { error as notifyError } from './notifications'

// バックエンドがAPIトークンを拒否（401）したときに、ログイン済みに見える状態を終わらせる。
export const SESSION_EXPIRED_SIGNIN_URL = '/auth/signin?error=SessionExpired'

let pending: Promise<void> | null = null
// サインアウトを試みたトークンには、ページ読み込みごとに1回しか試みない。失敗したときに
// （セッション再取得→各画面の再取得→401→再サインアウト…）と繰り返さないため。
const signOutAttempted = new Set<string>()
let lastFailureNoticeAt = 0
const FAILURE_NOTICE_INTERVAL_MS = 10_000

function notifyFailure() {
  const now = Date.now()
  if (now - lastFailureNoticeAt < FAILURE_NOTICE_INTERVAL_MS) return
  lastFailureNoticeAt = now
  notifyError('ログイン状態を更新できませんでした。通信状態を確認して、ページを再読み込みしてください。')
}

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
    signOutAttempted.add(rejectedToken)
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
  // サインアウトに失敗済み（セッションは保持）なら、再試行せず理由だけ知らせる。
  if (signOutAttempted.has(token)) {
    notifyFailure()
    return Promise.resolve()
  }

  // セッションの確認に失敗しただけなら、次の401で再試行する（状態は変わらないので繰り返しは起きない）。
  pending = endRejectedSession(token).then(
    navigating => { if (!navigating) pending = null },
    () => {
      pending = null
      notifyFailure()
    },
  )
  return pending
}
