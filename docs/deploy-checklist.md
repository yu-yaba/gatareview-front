# Frontend Deploy Checklist

## 対象

- `gatareview-front` の Vercel デプロイ
- backend API 契約に依存する画面変更
- NextAuth / review access / reCAPTCHA / GA まわりの設定変更

## 事前確認

1. ローカルで `npm run verify` を実行する
2. ルーティング、認証、`layout.tsx`、PWA、metadata を触った場合は `npm run build` も実行する
3. backend API 契約を変えた場合は backend 側の request spec と deploy 手順も確認する

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
