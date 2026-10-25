# Content Security Policy

すべての応答にCSPを付け、外部スクリプト、ブラウザからの接続、画像、フォント、iframeの読み込み元を制限する。設定は `config/content-security-policy.cjs` にまとめ、`next.config.js` のヘッダーから適用する。

## 許可する動作

- 同一サイトのNext.js、API、画像、PWA。
- `NEXT_PUBLIC_ENV` で指定したAPIのオリジン。サーバー専用の `DOCKER_BACKEND_URL` は公開しない。
- GoogleのreCAPTCHA、計測、アバター、フォントとGoogleログインへのフォーム送信。
- Next.jsの初期化とストリーミングに必要なインラインscript、および既存のインラインstyle。

その他の外部スクリプト・接続先、HTMLイベント属性、eval、objectの埋め込み、他サイトからのフレーム表示は拒否する。本番でunsafe-evalは許可せず、開発時のHMRだけに許可する。

## 制約と性能

Next.js 15のストリーミングは動的なインラインscriptを使う。既存の静的描画・公開情報キャッシュを維持するため、この構成ではscript-srcのunsafe-inlineを許可している。任意のインラインscriptを全面的に防ぐ厳格なnonce方式ではなく、これだけでXSSを防ぎ切れるとは判断しない。入力のエスケープ、認可、秘密情報を画面へ出さない実装を引き続き維持する。

nonce生成用のMiddlewareは追加しない。公開情報の300秒キャッシュと、レビューを待たずに授業概要を表示する処理を維持する。外部の有料CSP収集サービスは使わない。許可先を追加するときは用途と配信元を確認し、広いhttps:や*を追加しない。

## 検証

`npm run verify` と `npm run e2e` の後、本番ビルドで `npm run test:public-cache`、`npm run test:lecture-streaming`、`npm run e2e:security` を実行する。ビルド時と同じ公開API設定のモックを起動したまま `npm run e2e:csp` を実行し、実際の本番用Next.jsサーバーで操作・CSPヘッダー・SW登録も確認する。通常のE2Eは開発用のモック変更を即座に表示する前提なので、300秒キャッシュが有効な本番モードの検証とは分ける。

CSPのブラウザ試験ではダミー環境を使い、不許可のスクリプト・接続・イベント属性・evalを拒否し、必要な初期化と通信を維持することを確認する。本番反映後は主要画面、Googleログイン画面、reCAPTCHA読み込み、計測、SWの登録、CSP違反を確認する。

仕様: [Next.js 15のCSP](https://nextjs.org/docs/15/app/guides/content-security-policy)、[Google reCAPTCHAのCSP](https://developers.google.com/recaptcha/docs/faq#im_using_content-security-policy_csp_on_my_website_how_can_i_configure_it_to_work_with_recaptcha)。
