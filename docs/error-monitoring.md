# エラー監視

Sentryの無料枠で、ブラウザ・Next.jsサーバーの予期しない例外、APIの500番台、バックエンド認証の障害を収集する。通常の認証拒否・入力エラーは通知しない。

## 設定

- VercelのProductionだけに`NEXT_PUBLIC_SENTRY_DSN`を設定して再デプロイする。DSNは公開の送信先で、管理用トークンではない。
- Preview・Developmentには本番DSNを設定しない。SDKもproduction環境以外は無効。
- CSPはDSNのSentry ingestホストだけを`connect-src`へ追加する。ワイルドカードや独自の転送APIは追加しない。
- 通知は新規・再発・重要度上昇をメールで受け取る。Sentryの有料機能、追加従量課金、Seerは有効にしない。

## 送信する情報

エラーの種類、コードのファイル名・関数名・行番号、環境・リリース、固定の操作名に限定する。元のエラーメッセージにも入力値が含まれる場合があるため、固定文へ置き換える。

投稿本文、ユーザー情報、Cookie、Authorization、リクエスト・レスポンス本文、URLクエリ、追加データ、操作履歴、ソースコード、ローカル変数は送らない。画面録画・性能計測・ログ全量収集・メトリクスの送信は行わない。Sentry側でもIP保存とソースコードの外部取得を無効にする。

初期設定ではソースマップを公開・アップロードしない。ブラウザの発生箇所はビルド後のファイルで確認するため、詳細調査には同じリリースのコードも使用する。

## 無料枠と停止監視

Sentry Developerは1ユーザー、月5,000エラー。枠は同じ組織の全プロジェクトで共有する。上限を超えると収集が止まるため、通知メールと使用量を確認する。カード未登録のBusiness無料体験は、アップグレードしなければ終了後にDeveloper無料プランへ移る。

UptimeRobot Freeでトップページと、DBを読み取る公開APIを5分間隔で監視する。異常・復旧は既存アカウントのメールへ通知し、繰り返し通知は設定しない。SSL期限通知など有料項目は使わない。

## 検証・停止

`npm run verify`、`npm run build`、`npm run e2e:security`を実行する。`test:monitoring`は実際のSDKの送信処理にテスト値を渡し、機密情報が残らないことを検証する。反映後はテスト用ブラウザ内だけでエラーを発生させ、Sentryの受信とメール通知を確認する。

停止する場合はProductionの`NEXT_PUBLIC_SENTRY_DSN`を外して再デプロイする。UptimeRobotは対象の2監視をpauseする。

公式資料: [Next.js導入](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)、[Sentry料金](https://sentry.io/pricing/)、[UptimeRobot無料枠](https://help.uptimerobot.com/en/articles/11604710-who-should-use-uptimerobot-s-free-plan)
