# フロントエンド設計書: アーキテクチャ

## 目的
GataReview のフロントエンドは、講義検索、講義詳細閲覧、レビュー投稿、マイページ、管理者向けレビュー閲覧制限設定を提供する Next.js アプリケーションである。バックエンド Rails API と連携し、Google OAuth によるログイン状態を NextAuth で管理する。

## 技術スタック
- Framework: Next.js 13 App Router
- Language: TypeScript
- UI: React 18, Tailwind CSS
- Auth: NextAuth Google Provider
- HTTP client: `axios`, `fetch`
- PWA: `next-pwa`
- E2E: Playwright

## ディレクトリ構成
- `app/`: App Router のルート、レイアウト、ページ、グローバル CSS
- `app/_components/`: 複数画面で使う UI コンポーネント
- `app/_helpers/`: API クライアント、NextAuth 設定、通知、表示補助
- `app/_hooks/`: API データ取得用の React hooks
- `app/_types/`: API レスポンスやフォーム入力の共有型
- `app/lectures/`: 講義一覧、講義詳細、講義詳細用 OGP
- `app/reviews/`: レビュー投稿画面
- `app/mypage/`: ユーザーの投稿レビュー、ブックマーク、統計
- `app/admin/`: 管理者向け設定画面
- `tests/e2e/`: Playwright によるブラウザテスト

## App Router の基本方針
- ページ単位の entrypoint は `page.tsx` に置く。
- 画面内で状態管理やイベント処理が必要な場合は、Client Component を分離する。
- 講義詳細のようにメタデータや OGP が必要な画面は、ルート配下に `layout.tsx` や `opengraph-image.tsx` を置く。
- `not-found.tsx`、`error.tsx`、`offline/page.tsx` によって例外・未検出・オフライン時の表示を分離する。

## Provider と共通 UI
- `app/layout.tsx` が全体レイアウトの起点で、ヘッダー、フッター、グローバルスタイルを読み込む。
- `ClientProviders.tsx` はクライアント側で必要な Provider を集約する。
- `AuthButton.tsx` はログイン状態に応じた認証導線を担当する。
- `LoginPromptModal.tsx`、`ReviewPromptModal.tsx`、`ReviewAccessBlur.tsx` は、レビュー閲覧・投稿導線の状態表示を担当する。

## 認証設計
- NextAuth の設定は `app/_helpers/authOptions.ts` に集約する。
- Google Provider から取得した `id_token` をバックエンドの `POST /api/v1/auth/google` に渡し、バックエンド JWT を取得する。
- 取得したバックエンド JWT は NextAuth の JWT callback で `token.backendToken` に保存し、session callback で `session.backendToken` として公開する。
- API クライアントは `getSession()` から `backendToken` を取り出し、存在する場合のみ `Authorization: Bearer <token>` を付与する。
- 未ログインでも閲覧できる API は認証ヘッダーなしで呼び出す。レビュー投稿は匿名投稿も許容されるが、reCAPTCHA token が必要になる。

## バックエンド接続
- ブラウザ・クライアント API の基本 URL は `NEXT_PUBLIC_ENV` を使う。
- `app/_helpers/api.ts` の `API_BASE_URL` は `NEXT_PUBLIC_ENV` があれば `${NEXT_PUBLIC_ENV}/api/v1`、なければ `http://localhost:3001/api/v1` になる。
- NextAuth callback からバックエンドへ接続する場合は、サーバーサイド実行になるため `DOCKER_BACKEND_URL` を優先し、なければ `NEXT_PUBLIC_ENV` を使う。
- Docker Compose ではフロントはホスト `8080`、バックエンドはホスト `3001` に公開される。

## PWA
- `next-pwa` を利用し、オフライン時のページとして `app/offline/page.tsx` を持つ。
- PWA インストール導線は `PWAInstall.tsx` が担当する。
- PWA の挙動確認では、通常の画面表示だけでなく Service Worker、キャッシュ、オフライン遷移も見る。

## 環境変数
- `NEXT_PUBLIC_ENV`: ブラウザから参照するバックエンド origin。例: `http://localhost:3001`
- `DOCKER_BACKEND_URL`: Docker 内の NextAuth callback から参照するバックエンド origin。
- `NEXTAUTH_SECRET`: NextAuth の署名 secret。未設定時は起動時にエラーにする。
- `GOOGLE_CLIENT_ID`: Google OAuth client ID。NextAuth とバックエンドの token 検証で一致が必要。
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret。

## 設計上の注意
- API 呼び出しは `app/_helpers/api.ts` の `apiRequest` と用途別 API wrapper を優先する。
- 既存の `app/_hooks/api.ts` はホーム画面向けの軽量 fetch hook として使われており、レスポンス構造に応じて配列を取り出す。
- 認証必須 API を追加する場合は、バックエンド JWT が session に入る前提で `apiRequest` を使う。
- 画面用型は `app/_types/` に寄せ、バックエンド JSON の変更時は型と画面の両方を更新する。
