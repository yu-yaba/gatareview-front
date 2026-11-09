// 開いたままのタブでも、セッションの終了時刻を過ぎたらログイン済みの表示をやめるため、
// 終了時刻の少し後にだけセッションを再取得する（定期的な再取得は各画面の再読み込みを招く）。
const AFTER_EXPIRY_SECONDS = 5
// setIntervalの上限（約24.8日）を超えないよう、長いセッションは1日ごとに確認する。
const MAX_INTERVAL_SECONDS = 24 * 60 * 60

// SessionProviderのrefetchInterval（秒）。0は再取得しない。
export function sessionRefetchInterval(expires: string | null | undefined, now = Date.now()): number {
  if (!expires) return 0
  const end = Date.parse(expires)
  if (!Number.isFinite(end)) return 0
  const seconds = Math.ceil((end - now) / 1000) + AFTER_EXPIRY_SECONDS
  return Math.min(Math.max(seconds, AFTER_EXPIRY_SECONDS), MAX_INTERVAL_SECONDS)
}
