# フロントエンド設計書: テスト

## npm scripts
`package.json` には以下の検証コマンドがある。

```bash
npm run lint
npm run typecheck
npm run build
npm run e2e
npm run e2e:smoke
npm run verify
```

- `lint`: Next.js ESLint を実行する。
- `typecheck`: TypeScript を `tsc --noEmit` で検証する。
- `build`: Next.js production build を実行する。
- `e2e`: Playwright テストを実行する。
- `e2e:smoke`: `tests/e2e/review-access.smoke.spec.ts` を Chromium で実行する。
- `verify`: lint、typecheck、review access smoke を連続実行する。

## Playwright
E2E は `tests/e2e/` に置く。

- `review-access.spec.ts`: レビュー閲覧制限まわりの詳細シナリオ。
- `review-access.smoke.spec.ts`: 短時間で確認する smoke シナリオ。
- `review-access.helpers.ts`: テスト補助。

ブラウザ未インストール環境では以下を実行する。

```bash
npm run e2e:install
```

## Docker 環境での確認
初回は依存をインストールする。

```bash
docker-compose run --rm gatareview-front npm install
```

開発環境を起動する。

```bash
docker-compose up --build
```

ホストからはフロントエンドを `http://localhost:8080`、バックエンドを `http://localhost:3001` で確認する。

## 手動 QA 観点
- ホーム:
  - 人気講義、レビューなし講義、最新レビュー、総レビュー数が表示される。
  - API が空配列を返す場合も画面が壊れない。
- 講義一覧:
  - キーワード検索、学部絞り込み、並び替え、ページングが動作する。
  - 詳細検索条件を複数指定しても結果とページングが破綻しない。
- 講義詳細:
  - 講義情報、平均評価、レビュー数、レビュー一覧が表示される。
  - レビュー閲覧制限が有効な場合、権限なしユーザーには制限表示が出る。
  - ブックマークとありがとうの作成・取消が表示に反映される。
- レビュー投稿:
  - 必須項目不足、本文 1000 文字超過、reCAPTCHA 失敗を表示できる。
  - ログイン済みユーザーの投稿がマイページに反映される。
  - 匿名投稿が可能な状態で投稿できる。
- マイページ:
  - 未ログイン時は認証導線になる。
  - レビュー一覧、ブックマーク一覧、統計が表示される。
  - ページングが動作する。
- 管理画面:
  - 管理者だけがレビュー閲覧制限を取得・更新できる。
  - 非管理者は権限不足表示になる。
- 認証:
  - Google ログイン後、ユーザー名、アバター、管理者フラグが session に反映される。
  - ログアウト後、認証必須操作ができない。

## テスト追加方針
- 画面の主要分岐が増える場合は Playwright に smoke を追加する。
- API レスポンス型が変わる場合は `typecheck` で検出できるように型を更新する。
- 認証・管理者権限・レビュー閲覧制限の変更は E2E の対象にする。
