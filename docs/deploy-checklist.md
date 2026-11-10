# Frontend Deploy Checklist

## 対象

- `gatareview-front` の Vercel デプロイ
- backend API 契約に依存する画面変更
- NextAuth / review access / reCAPTCHA / GA まわりの設定変更

## 事前確認

1. ローカルで `npm run verify` を実行する
2. ルーティング、認証、`layout.tsx`、PWA、metadata を触った場合は `npm run build` も実行する
3. backend API 契約を変えた場合は backend 側の request spec と deploy 手順も確認する
4. マージ直前にPRの最新レビューと未解決スレッドを確認し、各指摘の対応と検証結果を記録する。CI成功だけでレビュー確認済みと扱わない。
5. 投稿する授業の検索、投稿レビュー一覧、ブックマーク一覧の2ページ目から別画面へ進み、戻る・進む・再読込でページと検索条件を確認する。検索消去や画面移動後に遅い応答が届いても上書き・強制移動が起きないことも確認する。認証内の試験は偽アカウント・APIと、本番での認証保護の確認を区別して記録する。
6. 移動先の応答を遅らせた状態でも、待機中の検索がホームや投稿フォームへの移動を妨げないことを確認する。

## Vercel 環境変数

変更がある場合は Vercel に反映し、再デプロイする。

| 変数名 | 必須 | 確認内容 |
| --- | --- | --- |
| `NEXT_PUBLIC_ENV` | Yes | backend の本番 URL を向いている |
| `NEXTAUTH_URL` | Yes | frontend の本番 URL と一致している |
| `NEXTAUTH_SECRET` | Yes | 空ではない |
| `GOOGLE_CLIENT_ID` | Yes | Google Cloud Console の本番値 |
| `GOOGLE_CLIENT_SECRET` | Yes | Google Cloud Console の本番値 |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Optional | reCAPTCHA を使う画面で正しい site key |
| `NEXT_PUBLIC_GA_ID` | Optional | 計測 ID が正しい |
| `CLOUDFLARE_PROXY_SECRET` | Recommended | 32バイト以上のランダム値。CloudflareのTransform Ruleが付ける `X-Gatareview-Proxy-Secret` と完全に同じ値（下記手順）。Productionに設定する。未設定だと、Cloudflare経由の訪問はCloudflareの中継サーバーのIPごとに枠を共有する |
| `RATE_LIMIT_FORWARDING_SECRET` | Recommended | 32バイト以上のランダム値。Herokuの同名の変数と完全に同じ値。Production（Previewもbackendの本番APIを使うならPreview）に設定する。Developmentには設定しない。未設定でも動くが、サーバーからのAPI呼び出しが全員で1つの回数制限の枠を共有する |

## review access 変更時の追加確認

1. backend が先にデプロイ済みであること
2. backend の migration が実行済みであること
3. `/admin/review-access` に管理者で入れること
4. 制限 `OFF`
   - 未ログインで授業詳細レビューが全文表示される
5. 制限 `ON`
   - 未ログインでは 1 件目全文、2 件目以降が制限される
   - `reviews_count >= 1` のユーザーでは全文表示される
6. 影響範囲外
   - `/` の最新レビュー
   - `/lectures`
   - レビュー投稿画面
   - マイページ

## 本番確認 URL

- `/`
- `/lectures`
- `/lectures/:id`
- `/lectures/:id/review`
- `/auth/signin`
- `/mypage`
- `/admin/review-access`

## 事故りやすい点

- `NEXT_PUBLIC_ENV` に `/api/v1` を含めない
- frontend の再デプロイだけでは `site_settings` は作られない
- review access 不具合は frontend ではなく backend の migration / env 不備が原因のことがある

## 2026年10月のセキュリティ更新

- Node.js 24.22.1以降の24系 / Next.js 15.5.28 / sharp 0.35.5を使用する。Vercelのプロジェクト設定もNode.js 24系にそろえる。
- 再ログインと通常のログアウトで、APIの失効を確認してからNextAuthのセッションを終了する。APIが401の場合は終了できる。通信障害や5xxの場合はセッションを保持して再試行する。
- `/api/auth/signout` の標準経路でもCSRF検証後にAPIトークンを失効する。アカウント変更にも同じ失効処理を適用する。

## 2026年11月のセッション寿命の修正

- 「ログイン状態を記憶する」なしのセッションCookieにはExpiresを付けない（ブラウザ終了で消える）。サーバー側でもログインから4時間で終了する。
- 記憶ありでもAPIトークンの期限を超えて延長しない。APIトークンを取得できないログインはセッションを作らない。
- 寿命の情報を持たない旧形式のセッションは無効になるため、デプロイ後は全員が一度ログインし直す。
- デプロイ後の確認: 記憶なしでログイン→ブラウザを完全に終了→再度開いて未ログインであること。別端末でログアウト→元の端末で授業詳細を開くとログイン画面に「有効期限が切れたか…」が表示されること。
- PWA・画像設定を変更した場合は、`npm run build` 後に `npm run e2e:security` を実行する。この検証は生成済みの実Service Workerと偽セッションだけを使い、ログアウト後の機密キャッシュ残存と画像取得の許可範囲を確認する。
- 授業OGPは `public/green-footer-title.png` をサーバー実行環境にも必要とする。ビルド後のファイル一覧への同梱を `e2e:security` で確認し、本番の `/lectures/:id/opengraph-image` が画像を返すことも確認する。
- backendの `token_version` migration と32バイト以上の専用JWT鍵を先に確認する。
- 回帰テストはローカルの専用モックAPI（3101番）を使う。授業のサーバー表示も同じモックを利用するため、テストは順次実行する。
- Dockerイメージには `.playwright-cli`、確認画像を含む `output`、テスト結果、環境変数ファイル、ローカルの秘密鍵を含めない。

## API回数制限の利用者IP転送

- 授業詳細・OGP画像・授業検索・Googleログインなどのサーバーからの呼び出しには、利用者IP（Cloudflare経由では秘密のヘッダーがある時だけ `CF-Connecting-IP`、それ以外はVercelの `x-real-ip`）と `RATE_LIMIT_FORWARDING_SECRET` による署名を付ける。詳しくは [公開授業情報の共通キャッシュ](public-lecture-cache.md#api呼び出しの回数制限と利用者ip) を参照する。
- デプロイ順（鍵は実値をリポジトリ・チャット・ログに残さない。`openssl rand -hex 32` などで作る）:
  1. このfrontendを先にデプロイする（鍵はまだ設定しない）。署名は付かないが、429を404ではなく5xxのエラー画面として扱うようになる。
  2. backendをデプロイする。カウンターが正確になりワーカーごとの上限になるため、旧frontendのままだと429が404画面になる。そのため1の後にする。
  3. 鍵Aを作り、Herokuの `RATE_LIMIT_FORWARDING_SECRET` に設定する。
  4. 鍵Bを作り、Cloudflareのダッシュボード（gatareview.comのゾーン）で「Rules → Transform Rules → Modify Request Header」のルールを作る。対象はホスト名が `www.gatareview.com` と等しい要求だけ（他のサーバーへ鍵Bを送らないため。`gatareview.com` はwwwへのリダイレクトだけなので不要）、操作は「Set static」、ヘッダー名 `X-Gatareview-Proxy-Secret`、値は鍵B。無料プランで使える。CloudflareのPseudo IPv4は「Off」か「Add header」のままにする（「Overwrite headers」は `CF-Connecting-IP` を仮のIPv4に置き換え、IPv6の `/64` 単位の制限が効かなくなる）。
  5. Vercel（Production）に `RATE_LIMIT_FORWARDING_SECRET`（鍵A）と `CLOUDFLARE_PROXY_SECRET`（鍵B）を**両方設定してから**再デプロイする。鍵Aだけで再デプロイすると、CloudflareのIPが署名されて枠を共有する（失敗はしない）。Vercelの環境変数は次のデプロイから効くため、両方そろうまで他のデプロイもしない。
  - CloudflareのDNSを「DNS only」（プロキシなし）にする場合は4は不要（`x-real-ip` が利用者のIPになる）。ただしCloudflareのWeb Analyticsの自動挿入などは使えなくなる。
  - どの順でも要求は失敗しない。backendは署名のない要求を従来どおり扱い、frontendはbackendが署名を無視しても動く。鍵がそろうまで回数制限が共有されるだけ。
- 鍵が設定されているのに32バイト未満の場合や、Cloudflare経由の要求（`CF-Ray` あり）で鍵Bのヘッダーが一致しない・`CLOUDFLARE_PROXY_SECRET` が未設定の場合は、Vercelの実行ログに警告を出す（プロセスごとに10分に1回まで。`CF-Ray` は誰でも偽装できるので、1回きりにすると本当の設定漏れを隠されるため）。IPや鍵の値は出さない。
- 鍵の交換: 鍵Aは、Herokuは設定変更ですぐ、Vercelは再デプロイで切り替わる。鍵Bは、Cloudflareのルールはすぐ、Vercelは再デプロイで切り替わる。その間は署名やヘッダーが一致せず、回数制限が一時的に共有されるだけで要求は失敗しない。両方を続けて更新し、すぐにVercelを再デプロイする。
- 授業IDが1〜10桁の正の整数でないURL（例: `/lectures/0123`、`/lectures/123.json`）は404になる。以前はAPIが数値に変換して授業を表示していた。
- 他人のCloudflare Workerから `www.gatareview.com` を呼ぶ要求は、Cloudflareの仕様で `CF-Connecting-IP` が固定の `2a06:98c0:3600::103` になり、1つの枠を共有する。影響はWorker経由の要求（一部のリンクプレビューやbot）だけで、自分の枠から逃れることはできない。
- 確認: 反映後、Herokuのログに `[rack-attack] throttled ... key_source=router` が授業詳細やログインの時間帯に頻発していないかを見る（署名の鍵の設定漏れ・不一致の目安）。`key_source=signed` が多くの利用者で同時に出る場合は、Cloudflareの鍵Bの設定漏れでCloudflareのIPが署名されている可能性がある。
- Vercelの「System Environment Variablesの公開」を無効にすると `VERCEL` が見えず、署名は付かない。
- 授業ページの取得失敗は、APIの本当の404だけを404にし、429・5xx・タイムアウト（8秒）は5xxのエラー画面にする。

## 授業詳細の先行表示

- [表示速度の方針と測定方法](page-speed.md)に従い、レビューを待つ間に公開の授業情報が表示されることを確認する。
- 本番ビルド後は `test:public-cache`、`test:lecture-streaming`、`e2e:security` を実行する。
- 実行地域はAPIに近い単一の `iad1`。本番のデプロイ情報と照合し、主要画面、セッションAPI、表示速度を確認する。

## CSPの確認

- [CSPの許可範囲と制約](content-security-policy.md)を確認する。
- 本番では外部の不許可スクリプト・接続先・HTMLイベント属性・evalを拒否する。
- Googleログイン、reCAPTCHA、計測、PWA、主要画面の操作時にCSP違反がないことを確認する。
- インラインscriptを全面禁止する方式ではない。既存の静的描画・公開情報キャッシュ・先行表示を維持する。

## 一覧・検索とPWAの通信削減

- 一覧でページ・並び順・詳細条件を変更し、授業詳細を開いてブラウザで戻る。戻ったURL、表示結果、ページ表示、入力条件が一致することを確認する。一覧内だけの戻る・進むとは別の経路として確認する。
- `npm run test:search-cache`で、実際の本番用Next.jsサーバーの共有取得・条件分離・60秒の再検証・失敗からの回復・認証情報の非転送を確認する。
- 初期HTMLに検索結果が含まれ、初期化後に同じ一覧をブラウザから再取得しないことを確認する。
- 並び替え・詳細条件・ページ移動・戻る進む・保存条件の復元・検索の再試行を確認する。
- `npm run e2e:csp`では、SWの有効化に加えて、有効化後に通常表示したホームをブラウザHTTPキャッシュなし・オフラインでも表示できることを確認する。
- 本番では同じ非表示Chrome、1440px/390px、ブラウザキャッシュ無効・SW回避で、各1回の準備と5回の中央値を比較する。PWA登録時の受信量は別に3回の空キャッシュ登録で測定する。
- ブラウザ受信量、サーバーからAPIへのJSON量、DB通信量、月間見積もりは別々に報告する。今回の測定から月額の削減額へ換算しない。
