// 開いたままのタブでも、セッションの終了時刻を過ぎたらログイン済みの表示をやめるため、
// 終了時刻の少し後にだけセッションを再取得する（定期的な再取得は各画面の再読み込みを招く）。
// ブラウザの時計はずれていることがあるため、サーバーが返す残り秒数（expiresIn）を使う。
const AFTER_EXPIRY_SECONDS = 5
// setIntervalの上限（約24.8日）を超えないよう、長いセッションは1日ごとに確認する。
// 確認のたびに残り秒数が更新されるので、最後は終了時刻の直後に確認される。
const MAX_INTERVAL_SECONDS = 24 * 60 * 60

// SessionProviderのrefetchInterval（秒）。0は再取得しない。
export function sessionRefetchInterval(expiresIn: number | null | undefined): number {
  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn < 0) return 0
  return Math.min(Math.ceil(expiresIn) + AFTER_EXPIRY_SECONDS, MAX_INTERVAL_SECONDS)
}
