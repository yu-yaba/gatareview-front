# Frontend Agent Guide

## 概要

このリポジトリはガタレビュの Next.js 13 フロントエンドです。  
主に UI、ルーティング、NextAuth 認証、SEO、PWA、Rails API との連携を担当します。

## 主要ディレクトリ

- `app/`
  App Router の画面、レイアウト、API Route
- `app/_components/`
  再利用コンポーネント
- `app/_helpers/`
  API 呼び出し、バリデーション、通知、レビュー閲覧制御補助
- `app/_hooks/`
  認証やデータ取得のカスタムフック
- `app/_types/`
  型定義
- `public/`
  画像、PWA 用アセット、マニフェスト
- `docs/`
  実装ベースの仕様書

## よく使うコマンド

このリポジトリ直下で実行:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run verify
npm run build
```

統合 workspace から実行する場合:

```bash
docker-compose run --rm gatareview-front npm run lint
docker-compose run --rm gatareview-front npm run verify
docker-compose run --rm gatareview-front npm run build
```

## 実装上の重要ポイント

- 文言は基本的に日本語です。変更時は既存のトーンに合わせてください。
- ルーティングは App Router 前提です。`pages/` ベースの実装は混ぜないでください。
- API のベース URL は環境変数 `NEXT_PUBLIC_ENV` を使います。URL の直書きは避けてください。
- 認証変更はフロント単体で閉じません。少なくとも以下をまとめて確認してください。
  - `app/api/auth/[...nextauth]/route.ts`
  - `app/_hooks/useAuth.ts`
  - バックエンドの `/api/v1/auth/*`
- レビュー閲覧制御を変更する場合は、以下を必ずまとめて確認してください。
  - `app/lectures/[id]/page.tsx`
  - `app/_components/ReviewAccessBlur.tsx`
  - `app/admin/review-access/page.tsx`
  - `app/_helpers/api.ts`
  - `docs/review-access-toggle-spec.md`
  - `docs/site-spec.md`
- 授業詳細の最終閲覧判定は `access.access_granted` を唯一のソースにします。`reviews_count` はバックエンド判定用の材料で、フロントの最終判定に直接使いません。
- Playwright smoke は API モック前提です。外部サービスの実疎通を前提にしないでください。
- レビュー投稿フォームの前提:
  - 総合評価とコメントは必須
  - コメントは 30 文字以上 1000 文字以内
  - reCAPTCHA を通して投稿する
- UI 変更時はモバイル表示を崩さないことを優先してください。

## 変更時の検証

- 変更後は最低限 `npm run verify` を実行してください。
- 以下を触った場合は `npm run build` も実行してください。
  - ルーティング
  - 認証
  - `layout.tsx`
  - `next.config.js`
  - PWA / metadata / sitemap
- デプロイ前は `docs/deploy-checklist.md` を使って Vercel env と backend 依存を確認してください。
- 手動確認の優先フロー:
  - ホーム -> 授業一覧 -> 授業詳細
  - 授業検索 -> レビュー投稿
  - ログイン -> マイページ -> 投稿レビュー/ブックマーク
  - レビュー閲覧制限の表示

## セキュリティ

- `.env.local` や実運用の OAuth / GA / reCAPTCHA 値はコミットしないでください。
- `session` 全体や `backendToken` をそのままログ出力しないでください。
- ドキュメントやサンプルには実値ではなくプレースホルダを使ってください。

## 仕様ドキュメント

- `docs/site-spec.md`
- `docs/review-access-toggle-spec.md`
- `docs/deploy-checklist.md`

実装変更が仕様に影響する場合は、必要に応じてこの 2 つも更新してください。
