# フロントエンド設計書: API 連携

## API クライアント
`app/_helpers/api.ts` は axios ベースの共通 API クライアントを提供する。

- base URL:
  - `NEXT_PUBLIC_ENV` がある場合: `${NEXT_PUBLIC_ENV}/api/v1`
  - ない場合: `http://localhost:3001/api/v1`
- timeout: 10 秒
- default header: `Content-Type: application/json`
- request interceptor:
  - `getSession()` で NextAuth session を取得する。
  - `session.backendToken` が空でない場合のみ `Authorization: Bearer <token>` を付与する。
- response interceptor:
  - `401`: 認証失敗としてログ出力する。
  - `403`: 権限不足としてログ出力する。
  - `5xx`: サーバーエラーとしてログ出力する。

## 用途別 API wrapper

### 認証
- `authApi.getCurrentUser()`: `GET /auth/me`
- `authApi.logout()`: `POST /auth/logout`

### レビュー
- `reviewApi.createReview(lectureId, reviewData)`: `POST /lectures/:lectureId/reviews`
- `reviewApi.getUserReviews()`: 現状は `/users/reviews` を参照しているが、バックエンドの現行 routes には存在しない。ユーザー自身のレビュー一覧は `mypageApi.getReviews()` を使う。

### 管理設定
- `reviewAccessAdminApi.getReviewAccess()`: `GET /admin/review-access`
- `reviewAccessAdminApi.updateReviewAccess(enabled)`: `PATCH /admin/review-access`

### マイページ
- `mypageApi.getMypage()`: `GET /mypage`
- `mypageApi.getReviews(page, perPage)`: `GET /mypage/reviews?page=...&per_page=...`
- `mypageApi.getBookmarks(page, perPage)`: `GET /mypage/bookmarks?page=...&per_page=...`

## fetch hooks
`app/_hooks/api.ts` はホーム画面向けの軽量 hooks を提供する。

- `usePopularLectures()`: `/api/v1/lectures/popular`
- `useNoReviewsLectures()`: `/api/v1/lectures/no_reviews`
- `useLatestReviews()`: `/api/v1/reviews/latest`
- `useTotalReviews()`: `/api/v1/reviews/total`

この hook は `NEXT_PUBLIC_ENV` と URL を連結して `fetch` する。レスポンスが `{ lectures: [...] }` または `{ reviews: [...] }` の場合は配列だけを state に格納し、配列レスポンスの場合もそのまま扱う。

## NextAuth とバックエンド JWT
`app/_helpers/authOptions.ts` が Google OAuth とバックエンド認証の接続点である。

1. Google Provider でログインする。
2. JWT callback で `account.id_token` をバックエンドへ送る。
3. バックエンドの `POST /api/v1/auth/google` が Google token を検証する。
4. バックエンドが発行した JWT を `token.backendToken` に保存する。
5. session callback で `session.backendToken` と `session.user` を返す。
6. axios interceptor が `session.backendToken` を API 呼び出しに付与する。

## 主要レスポンス前提

### 講義一覧
`GET /api/v1/lectures` は以下の形を返す。

```json
{
  "lectures": [],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 0,
    "per_page": 20
  }
}
```

講義要素は `id`, `title`, `lecturer`, `faculty`, `avg_rating`, `review_count` を含む。

### 講義詳細
`GET /api/v1/lectures/:id` は講義の基本項目に `avg_rating` と `review_count` を加えて返す。

### レビュー一覧
`GET /api/v1/lectures/:lecture_id/reviews` は以下を返す。

```json
{
  "reviews": [],
  "access": {
    "restriction_enabled": false,
    "access_granted": true
  }
}
```

`restriction_enabled` が true かつ `access_granted` が false の場合、バックエンドは先頭レビュー以外の `content` を先頭 30 文字に短縮して返す。

### マイページ
`GET /api/v1/mypage` は `user`, `statistics`, `bookmarked_lectures`, `user_reviews`, `ranking_position` を返す。レビュー一覧とブックマーク一覧の詳細ページングはそれぞれ専用 API を使う。

## エラーハンドリング
- `401 Unauthorized`: 未ログインまたは JWT 不正。ログイン導線へ誘導する。
- `403 Forbidden`: 管理者権限不足、または他ユーザーのレビュー編集・削除。
- `404 Not Found`: 講義、レビュー、ブックマーク、ありがとうが存在しない。
- `422 Unprocessable Entity`: validation error、reCAPTCHA 失敗、不正な管理設定値。
- `500 Internal Server Error`: バックエンドの予期しない障害。

## 実装時の注意
- 認証が不要な API でも `apiRequest` を使える。session がない場合は `Authorization` を付けない。
- サーバーコンポーネントからバックエンド API を呼ぶ場合は、ブラウザ用 origin と Docker 内 origin の違いに注意する。
- バックエンド API を追加・変更した場合は、`app/_types/` の型、API wrapper、該当画面、バックエンド docs を同時に更新する。
