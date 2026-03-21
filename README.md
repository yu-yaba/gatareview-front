# ガタレビュ Frontend

新潟大学向け授業レビューサービス「ガタレビュ」の Next.js フロントエンドです。  
UI、検索、レビュー投稿導線、Google ログイン、PWA、SEO を担当します。

- Production: `https://www.gatareview.com`
- Backend repo: `https://github.com/yu-yaba/gatareview-back`
- Agent guide: [`AGENTS.md`](./AGENTS.md)
- 仕様メモ: [`docs/site-spec.md`](./docs/site-spec.md), [`docs/review-access-toggle-spec.md`](./docs/review-access-toggle-spec.md)

## 主な機能

- 授業検索
  - キーワード検索
  - 学部絞り込み
  - 新着順 / レビュー件数順 / 評価順
  - レビュー詳細条件による絞り込み
- 授業詳細 / レビュー閲覧
- レビュー投稿
- Google ログイン
- マイページ
  - 投稿レビュー一覧
  - ブックマーク一覧
- PWA 対応
- OGP / sitemap / structured data 対応

## 技術スタック

| 領域 | 技術 |
| --- | --- |
| Framework | Next.js 13.4.19 |
| UI | React 18, Tailwind CSS |
| Language | TypeScript |
| Auth | NextAuth |
| Data Fetching | `fetch`, `axios` |
| PWA | `next-pwa` |
| Tooling | ESLint |

## ディレクトリ構成

```text
app/
  _components/   再利用コンポーネント
  _helpers/      API 呼び出し、バリデーション、通知、閲覧制御補助
  _hooks/        認証やデータ取得のフック
  _types/        型定義
  lectures/      授業一覧・授業詳細・レビュー投稿
  mypage/        マイページ
  auth/          サインイン / サインアウト画面
  api/auth/      NextAuth route
public/          画像、manifest、PWA アセット
docs/            実装ベースの仕様書
```

## 前提

- Node.js 18 以上を推奨
- npm
- 別途、Rails API が起動していること

## セットアップ

1. 依存関係をインストール

```bash
npm install
```

2. `.env.local` を作成

```env
NEXT_PUBLIC_ENV=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
NEXT_PUBLIC_GA_ID=

# Docker などで Next.js サーバーから backend コンテナへ直接疎通させる場合に使用
# DOCKER_BACKEND_URL=http://gatareview-back:3000
```

3. 開発サーバーを起動

```bash
npm run dev
```

4. ブラウザで開く

```text
http://localhost:3000
```

## 環境変数

`NEXT_PUBLIC_ENV` は `http://localhost:3001` のような backend のベース URL を指定します。  
`/api/v1` はコード側で付与している箇所が多いため、通常は含めません。

| 変数名 | 必須 | 用途 | 本番例 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_ENV` | Yes | Rails API のベース URL | `https://gatareview-back-b726b6ea4bcf.herokuapp.com` |
| `NEXTAUTH_URL` | Yes | NextAuth が使う自身の URL | `https://www.gatareview.com` |
| `NEXTAUTH_SECRET` | Yes | NextAuth セッション署名 | ランダムな長い文字列 |
| `GOOGLE_CLIENT_ID` | Yes | Google ログイン | Google Cloud Console の値 |
| `GOOGLE_CLIENT_SECRET` | Yes | Google ログイン | Google Cloud Console の値 |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Optional | レビュー投稿時の reCAPTCHA | reCAPTCHA site key |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics | `G-XXXXXXXXXX` |
| `DOCKER_BACKEND_URL` | Optional | Docker / サーバーサイド実行時の backend 内部 URL | 通常は未設定 |

本番デプロイ先が Vercel の場合、環境変数の追加・変更後は再デプロイが必要です。

## 開発コマンド

```bash
npm run dev
npm run lint
npm run typecheck
npm run verify
npm run build
npm run start
npm run e2e:install
npm run e2e:smoke
npm run e2e
```

## Playwright E2E

Playwright は `@playwright/test` で導入済みです。設定ファイルは [playwright.config.ts](/Users/kawaiyuya/Desktop/gatareview/gatareview-front/playwright.config.ts)、スモークテストは [tests/e2e/review-access.smoke.spec.ts](/Users/kawaiyuya/Desktop/gatareview/gatareview-front/tests/e2e/review-access.smoke.spec.ts) にあります。

基本手順:

```bash
npm run e2e:install
npm run e2e:smoke
```

Playwright は `playwright.config.ts` から `Next.js` 開発サーバーを自動起動します。  
デフォルトでは `http://localhost:8080` を見に行きます。対象授業を変えたいときは以下を指定します。

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
PLAYWRIGHT_LECTURE_ID=3886 \
PLAYWRIGHT_LECTURE_TITLE=実働確認用授業 \
PLAYWRIGHT_LECTURER=実働確認教員 \
npm run e2e:smoke
```

現在のスモークテストが確認する内容:

- 授業詳細ページで backend の授業情報とレビューが表示されること
- `/admin/review-access` に未ログインでアクセスしたとき `/auth/signin` へ遷移すること

## 実装上の注意

- 認証は NextAuth と backend JWT を組み合わせています。
- レビュー閲覧制御はフロント単体で完結しません。変更する場合は backend 側の判定も合わせて確認してください。
- `NEXT_PUBLIC_ENV` を変更した場合は、クライアント側 fetch と `app/api/auth/[...nextauth]/route.ts` の server-side fetch の両方に影響します。
- Google ログインや reCAPTCHA を使わない場合でも、該当機能の動作確認なしで本番反映しないでください。

## 検証

最低限、変更後は以下を実行してください。

```bash
npm run verify
npm run build
```

手動確認の優先フロー:

- ホーム
- 授業一覧
- 授業詳細
- レビュー投稿
- ログイン
- マイページ

## デプロイ前確認

本番反映前の確認手順は [`docs/deploy-checklist.md`](./docs/deploy-checklist.md) にまとめています。  
review access まわりの変更は backend の migration / env 追加が必要になることがあるため、frontend だけで完了と判断しないでください。

## 関連リポジトリ

- Frontend: `https://github.com/yu-yaba/gatareview-front`
- Backend: `https://github.com/yu-yaba/gatareview-back`
