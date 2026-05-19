# フロントエンド設計書: 画面とフロー

## 主要画面

### ホーム
- Entry: `app/page.tsx`
- Client UI: `HomePageClient.tsx`
- 役割:
  - 人気講義、レビューなし講義、最新レビュー、総レビュー数を表示する。
  - 講義一覧やレビュー投稿への導線を提供する。
- 主な API:
  - `GET /api/v1/lectures/popular`
  - `GET /api/v1/lectures/no_reviews`
  - `GET /api/v1/reviews/latest`
  - `GET /api/v1/reviews/total`

### 講義一覧
- Entry: `app/lectures/page.tsx`
- 役割:
  - 講義を検索、絞り込み、並び替え、ページング表示する。
  - 講義詳細へ遷移する。
- 主な検索条件:
  - `search`: 講義名または教員名
  - `faculty`: 学部
  - `sort`: `newest`, `highestRating`, `mostReviewed`
  - レビュー詳細条件: 年度、学期、教科書、出席、評価方法、難易度、質
- 主な API:
  - `GET /api/v1/lectures`

### 講義詳細
- Entry: `app/lectures/[id]/page.tsx`
- Client UI: `LectureDetailClient.tsx`
- 役割:
  - 講義基本情報、平均評価、レビュー数、レビュー一覧を表示する。
  - ブックマーク、ありがとう、レビュー編集・削除、レビュー投稿導線を提供する。
  - レビュー閲覧制限が有効な場合、閲覧権限がないユーザーには一部レビューをぼかし表示する。
- 主な API:
  - `GET /api/v1/lectures/:id`
  - `GET /api/v1/lectures/:lecture_id/reviews`
  - `POST /api/v1/lectures/:lecture_id/bookmarks`
  - `GET /api/v1/lectures/:lecture_id/bookmarks`
  - `DELETE /api/v1/lectures/:lecture_id/bookmarks`
  - `POST /api/v1/reviews/:review_id/thanks`
  - `GET /api/v1/reviews/:review_id/thanks`
  - `DELETE /api/v1/reviews/:review_id/thanks`

### レビュー投稿
- Entry: `app/reviews/new/page.tsx`
- 役割:
  - 対象講義にレビューを投稿する。
  - ログイン済みユーザーの場合はバックエンド側でユーザーに紐付ける。
  - 未ログインでも匿名レビュー投稿は可能。
- 主な API:
  - `POST /api/v1/lectures/:lecture_id/reviews`
- 注意:
  - バックエンドは reCAPTCHA 検証を行う。
  - 投稿本文は必須で最大 1000 文字。
  - ログインユーザーは同一講義に複数レビューを投稿できない。

### マイページ
- Entry:
  - `app/mypage/page.tsx`
  - `app/mypage/reviews/page.tsx`
  - `app/mypage/bookmarks/page.tsx`
- 役割:
  - ユーザー情報、投稿数、受け取ったありがとう数、最新レビュー、ランキングを表示する。
  - 投稿レビュー一覧とブックマーク一覧をページング表示する。
- 主な API:
  - `GET /api/v1/mypage`
  - `GET /api/v1/mypage/reviews`
  - `GET /api/v1/mypage/bookmarks`
- 認証:
  - 全てログイン必須。

### 管理画面
- Entry: `app/admin/review-access/page.tsx`
- 役割:
  - レビュー閲覧制限を確認・更新する。
  - 制限が有効な場合、レビュー投稿済みユーザーだけが講義詳細のレビュー全文を閲覧できる。
- 主な API:
  - `GET /api/v1/admin/review-access`
  - `PATCH /api/v1/admin/review-access`
- 認証:
  - ログイン必須。
  - バックエンドで `ADMIN_EMAILS` または `ADMIN_EMAIL` に含まれるメールアドレスのみ許可する。

### 認証画面
- Entry:
  - `app/auth/signin/page.tsx`
  - `app/auth/signout/page.tsx`
  - `app/api/auth/[...nextauth]/route.ts`
- 役割:
  - Google OAuth ログイン、ログアウト、NextAuth callback を扱う。
  - ログイン成功時にバックエンド JWT を session に入れる。

## 主要フロー

### ログイン
1. ユーザーがサインイン画面から Google ログインを開始する。
2. NextAuth が Google Provider の認可フローを完了する。
3. NextAuth JWT callback が Google `id_token` を `POST /api/v1/auth/google` に送る。
4. バックエンドが Google token を検証し、ユーザーを作成または更新する。
5. バックエンド JWT とユーザー情報を NextAuth session に保存する。

### 講義検索からレビュー閲覧
1. 講義一覧で検索条件を指定する。
2. フロントは `GET /api/v1/lectures` に query parameter を付けて呼び出す。
3. 検索結果から講義詳細へ遷移する。
4. 講義詳細で講義情報とレビュー一覧を取得する。
5. レビュー閲覧制限が返された場合は、アクセス状態に応じて本文表示を切り替える。

### レビュー投稿
1. ユーザーが対象講義と評価項目を入力する。
2. reCAPTCHA token とレビュー payload を送信する。
3. バックエンドが token と入力値を検証してレビューを保存する。
4. レビュー保存後、詳細画面や投稿完了 UI へ反映する。

### ブックマーク
1. 講義詳細でログイン状態を確認する。
2. 未ログインの場合はログイン誘導を出す。
3. ログイン済みの場合は作成、取得、削除 API で状態を同期する。
4. マイページのブックマーク一覧で確認できる。

### ありがとう
1. 講義詳細のレビュー単位でありがとう状態を取得する。
2. ログイン済みユーザーがありがとうを作成または削除する。
3. API レスポンスの `thanks_count` を表示へ反映する。

## エラー表示方針
- 404 の講義は `lectures/not-found.tsx` または Next.js の not found 表示へ誘導する。
- API 認証エラーはログイン誘導または権限不足表示に寄せる。
- 投稿や更新の validation error はフォーム近傍に表示する。
- 予期しないエラーは `error.tsx` と toast/通知でユーザーに戻り先を示す。
