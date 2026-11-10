// NextAuthセッションの寿命を決めるサーバー側の純粋関数。
// 「ログイン状態を記憶する」を選ばなかったセッションはブラウザを閉じるまで、かつ
// サインインから数時間までに限る。どちらの場合もバックエンドAPIトークンの期限を超えない。

// 「記憶する」を選んだ場合の上限（バックエンドも30日のトークンを発行する）
export const REMEMBERED_SESSION_MAX_AGE = 30 * 24 * 60 * 60
// 選ばなかった場合の上限。共用PCでブラウザが開いたまま・セッション復元された場合に備える。
export const BROWSER_SESSION_MAX_AGE = 4 * 60 * 60
const CLOCK_SKEW_SECONDS = 60

export interface SessionLifetimeFields {
  backendToken?: unknown
  remember?: unknown
  authTime?: unknown
  backendExp?: unknown
}

// NextAuthはjwtコールバックの例外でセッションCookieを削除する。想定どおりの終了を識別する。
// （本番ビルドでクラス名が短縮されても判定できるよう、名前は文字列で固定する）
export const SESSION_ENDED_ERROR_NAME = 'SessionEndedError'
export class SessionEndedError extends Error {
  constructor() {
    super('Session ended')
    this.name = SESSION_ENDED_ERROR_NAME
  }
}

export const nowInSeconds = () => Math.floor(Date.now() / 1000)

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0

// 署名の検証は各リクエストでバックエンドが行う。ここでは寿命を短くする目的でのみ exp を読む。
export function backendTokenExpiry(backendToken: unknown): number | null {
  if (typeof backendToken !== 'string') return null
  const parts = backendToken.split('.')
  if (parts.length !== 3 || !parts[1]) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return isPositiveInteger(payload?.exp) ? payload.exp : null
  } catch {
    return null
  }
}

// セッションが終わる時刻（秒）。必要な情報が欠けた古い形式のセッションは null（無効）。
export function sessionExpiresAt(token: SessionLifetimeFields | null | undefined): number | null {
  if (!token || typeof token.remember !== 'boolean') return null
  if (!isPositiveInteger(token.authTime) || !isPositiveInteger(token.backendExp)) return null
  const maxAge = token.remember ? REMEMBERED_SESSION_MAX_AGE : BROWSER_SESSION_MAX_AGE
  return Math.min(token.backendExp, token.authTime + maxAge)
}

export function isSessionActive(token: SessionLifetimeFields | null | undefined, now = nowInSeconds()): boolean {
  if (!token || typeof token.backendToken !== 'string' || token.backendToken.trim() === '') return false
  if (!isPositiveInteger(token.authTime) || token.authTime > now + CLOCK_SKEW_SECONDS) return false
  const expiresAt = sessionExpiresAt(token)
  return expiresAt !== null && now < expiresAt
}

const SESSION_COOKIE_PATTERN = /^(?:__Secure-)?next-auth\.session-token(?:\.\d+)?=/

function isLiveSessionCookie(cookie: string): boolean {
  if (!SESSION_COOKIE_PATTERN.test(cookie)) return false
  const [pair, ...attributes] = cookie.split(';')
  if (pair.slice(pair.indexOf('=') + 1).trim() === '') return false
  return !attributes.some(attribute => /^\s*max-age\s*=\s*0\s*$/i.test(attribute))
}

function withExpiry(cookie: string, expiresAt: number | null): string {
  const [pair, ...attributes] = cookie.split(';')
  const kept = attributes.filter(attribute => !/^\s*(?:expires|max-age)\s*=/i.test(attribute))
  if (expiresAt !== null) kept.push(` Expires=${new Date(expiresAt * 1000).toUTCString()}`)
  return [pair, ...kept].join(';')
}

// 発行するセッションCookieの期限をトークンの寿命に合わせる。
// 「記憶する」以外（判定できない場合を含む）はExpires/Max-Ageを外し、ブラウザ終了で消える
// セッションCookieにする。削除用Cookie（空値・Max-Age=0）はそのまま残す。
export function applySessionCookieLifetime(
  response: Response,
  token: SessionLifetimeFields | null | undefined,
): Response {
  const cookies = response.headers.getSetCookie()
  if (!cookies.some(isLiveSessionCookie)) return response

  const expiresAt = token?.remember === true ? sessionExpiresAt(token) : null
  const headers = new Headers(response.headers)
  headers.delete('Set-Cookie')
  for (const cookie of cookies) {
    headers.append('Set-Cookie', isLiveSessionCookie(cookie) ? withExpiry(cookie, expiresAt) : cookie)
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
