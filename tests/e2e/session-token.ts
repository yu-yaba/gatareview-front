// jwtコールバックが有効なセッションとして扱うための寿命情報（app/_helpers/sessionLifetime.ts）。
export function activeSessionFields({ remember = true, ageSeconds = 0, ttlSeconds = 60 * 60 } = {}) {
  const now = Math.floor(Date.now() / 1000)
  return { remember, authTime: now - ageSeconds, backendExp: now + ttlSeconds }
}
