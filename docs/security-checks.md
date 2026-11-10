# 脆弱性の検査と更新

Dependabotは毎週月曜の日本時間9時にnpmとGitHub Actionsの更新を確認します。通常のminor・patch更新とセキュリティ更新は別のPRにまとめます。

PRでは `npm audit` がロックファイルを検査し、high・criticalの指摘で失敗します。medium・lowの指摘もログに表示します。GitHub Actionsには読み取り権限を指定し、チェックアウト後に認証情報を残しません。

サービスワーカーの広告用ルールは `a8.net` と `.a8.net` で終わるサブドメインに適用します。別ドメインの末尾やURLのパス・ユーザー情報に `a8.net` が現れるケースは回帰テストで確認します。

## 間接依存の対応（2026-11-03）

- **glob**（[GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)）。Tailwindが使うSucraseを互換性のある3.35.1に更新しました。この版はファイル探索にtinyglobbyを使用します。当初はSentryのビルドツール11.10.0がglob 13系を指定していたため、その版の依存だけに修正版14.0.3を `overrides` で適用していました。`@sentry/nextjs` 11.11.0のビルドツール（`@sentry/bundler-plugins` 11.11.0）は自らglob `^14.0.3` を指定するため、この指定は何にも一致しなくなり、2026-11-09に削除しました。削除後もロックファイルはSentry経由のglobを14.0.3に解決し、`npm audit` もglobを指摘しないことを確認しています。残るglob 7.1.7（ESLint、next-pwa経由のWorkboxとclean-webpack-plugin）は勧告の対象範囲（9.0.0〜14.0.1）の外です。
- **minimatch**（[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)）。Sentry経由のコピーは修正版11系に更新されます。Workbox・ESLintなどには旧API向けの依存が残り、11系への一括置換は互換性がありません。公開APIからユーザーがファイル探索パターンを指定する経路は確認されていません。依存元の対応を追跡します。
- **deepmerge**（[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)）。Rollupのnode-resolveプラグインがビルド設定の結合に使います。公開APIから渡されたオブジェクトをここで結合する経路は確認されていません。公開済みの修正版がないため、アラートを開いたままにします。
