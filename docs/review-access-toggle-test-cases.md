# レビュー閲覧制限 テストケース

対象: `gatareview-front` / `gatareview-back`  
元仕様: [`review-access-toggle-spec.md`](/Users/kawaiyuya/Desktop/gatareview/gatareview-front/docs/review-access-toggle-spec.md)  
更新日: 2026-03-21

## 1. 目的

レビュー閲覧制限の手動切替仕様について、実装確認に必要なテストケースを整理する。  
対象は以下とする。

- 授業詳細ページのレビュー閲覧制御
- 管理画面 `/admin/review-access`
- 公開側 API
- 管理側 API
- 影響範囲外の画面

## 2. 共通前提

- 制御対象は `/lectures/[id]` の授業詳細ページに表示されるレビュー本文のみ
- 制限 `OFF` のときは、全ユーザーが授業詳細レビュー本文を全文閲覧できる
- 制限 `ON` のときは、`ログイン済み` かつ `reviews_count >= 1` のユーザーのみ全文閲覧できる
- 未ログインユーザー、および `reviews_count = 0` のログインユーザーは制限対象
- 制限対象ユーザーでも、先頭レビューは全文表示し、2件目以降は本文の一部のみ表示する
- レビュー0件の授業ではロックUIを表示しない
- `ありがとう`、`報告`、`ブックマーク`、本人レビュー編集削除のログイン要件は従来どおり維持する

## 3. テストデータ

### 3.1 授業

- `Lecture A`
  - レビュー 0 件
- `Lecture B`
  - レビュー 1 件
- `Lecture C`
  - レビュー 2 件以上
  - 1件目と2件目で本文が明確に判別できること

### 3.2 ユーザー

- `Guest`
  - 未ログイン
- `User Zero`
  - ログイン済み
  - `reviews_count = 0`
- `User One`
  - ログイン済み
  - `reviews_count = 1`
- `Admin User`
  - ログイン済み
  - `admin? = true`
- `General User`
  - ログイン済み
  - `admin? = false`

## 4. 授業詳細ページテストケース

### 4.1 制限 OFF

#### TC-PUB-01

- 観点: 未ログイン時の全文閲覧
- 前提: 制限 `OFF`、`Guest`、`Lecture C`
- 手順:
  1. `/lectures/:id` を開く
- 期待結果:
  - 全レビュー本文が全文表示される
  - ロックUIは表示されない

#### TC-PUB-02

- 観点: `reviews_count = 0` ログインユーザーの全文閲覧
- 前提: 制限 `OFF`、`User Zero`、`Lecture C`
- 手順:
  1. ログイン状態で `/lectures/:id` を開く
- 期待結果:
  - 全レビュー本文が全文表示される
  - `reviews_count = 0` でも制限されない

#### TC-PUB-03

- 観点: `reviews_count >= 1` ログインユーザーの全文閲覧
- 前提: 制限 `OFF`、`User One`、`Lecture C`
- 手順:
  1. ログイン状態で `/lectures/:id` を開く
- 期待結果:
  - 全レビュー本文が全文表示される

### 4.2 制限 ON

#### TC-PUB-04

- 観点: 未ログインユーザーの制限表示
- 前提: 制限 `ON`、`Guest`、`Lecture C`
- 手順:
  1. `/lectures/:id` を開く
- 期待結果:
  - 1件目レビューは全文表示される
  - 2件目以降は本文の一部のみ表示される
  - レビュー投稿導線モーダルを開くボタンが表示される

#### TC-PUB-05

- 観点: `reviews_count = 0` ログインユーザーの制限表示
- 前提: 制限 `ON`、`User Zero`、`Lecture C`
- 手順:
  1. ログイン状態で `/lectures/:id` を開く
- 期待結果:
  - 1件目レビューは全文表示される
  - 2件目以降は本文の一部のみ表示される
  - 「1レビューを投稿して閲覧する」導線が表示される

#### TC-PUB-06

- 観点: `reviews_count >= 1` ログインユーザーの全文閲覧
- 前提: 制限 `ON`、`User One`、`Lecture C`
- 手順:
  1. ログイン状態で `/lectures/:id` を開く
- 期待結果:
  - 全レビュー本文が全文表示される
  - ロックUIは表示されない

### 4.3 レビュー件数別表示

#### TC-PUB-07

- 観点: レビュー 0 件授業の表示
- 前提: 制限 `ON` または `OFF`、任意ユーザー、`Lecture A`
- 手順:
  1. `/lectures/:id` を開く
- 期待結果:
  - レビュー未投稿状態の通常UIが表示される
  - ロックUIは表示されない

#### TC-PUB-08

- 観点: レビュー 1 件授業の表示
- 前提: 制限 `ON`、制限対象ユーザー、`Lecture B`
- 手順:
  1. `/lectures/:id` を開く
- 期待結果:
  - 1件目レビューのみ表示される
  - ぼかし表示は出ない
  - ロックUIが不自然に重ならない

#### TC-PUB-09

- 観点: レビュー 2 件以上授業の表示差分
- 前提: 制限 `ON`、制限対象ユーザー、`Lecture C`
- 手順:
  1. `/lectures/:id` を開く
- 期待結果:
  - 1件目レビューは全文表示される
  - 2件目以降だけが制限表示になる

### 4.4 レビュー削除後の再ロック

#### TC-PUB-10

- 観点: 最後の1件削除後の再ロック
- 前提: 制限 `ON`、`User One`、`Lecture C`
- 手順:
  1. `User One` が全文閲覧できることを確認する
  2. `User One` の唯一のレビューを削除する
  3. 同じ授業詳細を再表示する
- 期待結果:
  - `reviews_count = 0` になる
  - 再表示時は制限対象になる
  - 1件目のみ全文、2件目以降は制限表示になる

#### TC-PUB-11

- 観点: 制限 OFF 中のレビュー削除
- 前提: 制限 `OFF`、`User One`、`Lecture C`
- 手順:
  1. `User One` の唯一のレビューを削除する
  2. 同じ授業詳細を再表示する
- 期待結果:
  - `reviews_count = 0` になっても全文閲覧できる

### 4.5 制限中の各機能表示

#### TC-PUB-12

- 観点: 制限中のアクション表示
- 前提: 制限 `ON`、制限対象ユーザー、`Lecture C`
- 手順:
  1. `/lectures/:id` を開く
- 期待結果:
  - `ありがとう` ボタンが表示される
  - `報告` ボタンが表示される
  - `ブックマーク` ボタンが表示される

#### TC-PUB-13

- 観点: ログイン要件の維持
- 前提: 制限 `ON` または `OFF`
- 手順:
  1. 未ログインで `ありがとう` を押す
  2. 未ログインで `ブックマーク` を押す
  3. ログイン済み本人レビューで編集または削除を確認する
- 期待結果:
  - `ありがとう` はログイン必須のまま
  - `ブックマーク` はログイン必須のまま
  - 本人レビュー編集削除は本人のみ利用できる

### 4.6 エラー表示

#### TC-PUB-14

- 観点: レビュー取得 API 失敗時の画面表示
- 前提: レビュー取得 API を失敗させる
- 手順:
  1. `/lectures/:id` を開く
- 期待結果:
  - レビュー取得エラーメッセージが表示される
  - `reviews_count` などによる代替判定はしない
  - 偽の `0件` / `0.0` 表示にならない

## 5. 管理画面テストケース

### 5.1 アクセス制御

#### TC-ADM-01

- 観点: 未ログインアクセス
- 前提: `Guest`
- 手順:
  1. `/admin/review-access` にアクセスする
- 期待結果:
  - `/auth/signin` へリダイレクトされる

#### TC-ADM-02

- 観点: 非管理者アクセス
- 前提: `General User`
- 手順:
  1. ログイン状態で `/admin/review-access` にアクセスする
- 期待結果:
  - `403 Forbidden` の画面または同等の拒否表示になる

#### TC-ADM-03

- 観点: 管理者アクセス
- 前提: `Admin User`
- 手順:
  1. ログイン状態で `/admin/review-access` にアクセスする
- 期待結果:
  - 管理画面が表示される

### 5.2 表示内容

#### TC-ADM-04

- 観点: 現在状態の表示
- 前提: `Admin User`
- 手順:
  1. `/admin/review-access` を開く
- 期待結果:
  - 現在の ON / OFF 状態が表示される
  - 状態に応じた説明文が表示される

#### TC-ADM-05

- 観点: 更新情報の表示
- 前提: 一度以上設定更新済み
- 手順:
  1. `/admin/review-access` を開く
- 期待結果:
  - 最終更新日時が表示される
  - 最終更新者が表示される

### 5.3 切替動作

#### TC-ADM-06

- 観点: `OFF -> ON` 確認ダイアログ
- 前提: 現在 `OFF`
- 手順:
  1. `制限を ON にする` を押す
- 期待結果:
  - タイトル `レビュー閲覧制限を有効にしますか？` が表示される
  - 本文 `未ログインユーザーとレビュー未投稿ユーザーは、授業詳細ページのレビュー全文を閲覧できなくなります。` が表示される

#### TC-ADM-07

- 観点: `ON -> OFF` 確認ダイアログ
- 前提: 現在 `ON`
- 手順:
  1. `制限を OFF にする` を押す
- 期待結果:
  - タイトル `レビュー閲覧制限を無効にしますか？` が表示される
  - 本文 `すべてのユーザーが、授業詳細ページのレビュー全文を閲覧できるようになります。` が表示される

#### TC-ADM-08

- 観点: 保存成功メッセージ
- 前提: `Admin User`
- 手順:
  1. `OFF -> ON` に更新する
  2. `ON -> OFF` に更新する
- 期待結果:
  - `レビュー閲覧制限を有効にしました` が表示される
  - `レビュー閲覧制限を無効にしました` が表示される

#### TC-ADM-09

- 観点: 保存失敗メッセージ
- 前提: サーバー側更新を失敗させる
- 手順:
  1. 更新操作を行う
- 期待結果:
  - `レビュー閲覧制限の更新に失敗しました` が表示される

#### TC-ADM-10

- 観点: 通信失敗メッセージ
- 前提: 管理 API を通信失敗させる
- 手順:
  1. 更新操作を行う
- 期待結果:
  - `通信エラーが発生しました。時間をおいて再度お試しください` が表示される

## 6. 公開側 API テストケース

#### TC-API-PUB-01

- 観点: レスポンス形式
- 前提: 任意の授業
- 手順:
  1. `GET /api/v1/lectures/:lecture_id/reviews` を実行する
- 期待結果:
  - `{ reviews, access }` 形式で返る

#### TC-API-PUB-02

- 観点: レビュー 0 件時のレスポンス
- 前提: `Lecture A`
- 手順:
  1. `GET /api/v1/lectures/:lecture_id/reviews` を実行する
- 期待結果:
  - `reviews: []` が返る
  - `access` が必ず返る

#### TC-API-PUB-03

- 観点: 制限 OFF 時のアクセス状態
- 前提: 制限 `OFF`
- 手順:
  1. `GET /api/v1/lectures/:lecture_id/reviews` を実行する
- 期待結果:
  - `access.restriction_enabled = false`
  - `access.access_granted = true`

#### TC-API-PUB-04

- 観点: 制限 ON・未ログイン時のアクセス状態
- 前提: 制限 `ON`、未ログイン
- 手順:
  1. `GET /api/v1/lectures/:lecture_id/reviews` を実行する
- 期待結果:
  - `access.restriction_enabled = true`
  - `access.access_granted = false`

#### TC-API-PUB-05

- 観点: 制限 ON・`reviews_count = 0` 時のアクセス状態
- 前提: 制限 `ON`、`User Zero`
- 手順:
  1. 認証付きで `GET /api/v1/lectures/:lecture_id/reviews` を実行する
- 期待結果:
  - `access.access_granted = false`

#### TC-API-PUB-06

- 観点: 制限 ON・`reviews_count >= 1` 時のアクセス状態
- 前提: 制限 `ON`、`User One`
- 手順:
  1. 認証付きで `GET /api/v1/lectures/:lecture_id/reviews` を実行する
- 期待結果:
  - `access.access_granted = true`

#### TC-API-PUB-07

- 観点: 制限対象ユーザーの本文マスク
- 前提: 制限 `ON`、制限対象ユーザー、`Lecture C`
- 手順:
  1. `GET /api/v1/lectures/:lecture_id/reviews` を実行する
- 期待結果:
  - 1件目レビューは全文のまま返る
  - 2件目以降の本文は部分マスクされて返る

## 7. 管理側 API テストケース

#### TC-API-ADM-01

- 観点: 現在値取得
- 前提: `Admin User`
- 手順:
  1. `GET /api/v1/admin/review-access` を実行する
- 期待結果:
  - 現在の `lecture_review_restriction_enabled` が返る
  - `updated_at` が返る
  - `last_updated_by` が返る

#### TC-API-ADM-02

- 観点: 状態更新
- 前提: `Admin User`
- 手順:
  1. `PATCH /api/v1/admin/review-access` で `lecture_review_restriction_enabled` を更新する
- 期待結果:
  - 更新後の値が返る
  - `last_updated_by` が更新される

#### TC-API-ADM-03

- 観点: 未ログインアクセス
- 前提: 未ログイン
- 手順:
  1. `GET /api/v1/admin/review-access` を実行する
- 期待結果:
  - `401 Unauthorized`

#### TC-API-ADM-04

- 観点: 非管理者アクセス
- 前提: `General User`
- 手順:
  1. `GET /api/v1/admin/review-access` を実行する
- 期待結果:
  - `403 Forbidden`

#### TC-API-ADM-05

- 観点: 不正値更新
- 前提: `Admin User`
- 手順:
  1. 不正な値で `PATCH /api/v1/admin/review-access` を実行する
- 期待結果:
  - `422 Unprocessable Entity`

## 8. 影響範囲外テストケース

#### TC-SCOPE-01

- 観点: ルートページ最新レビュー
- 前提: 制限 `ON` と `OFF` を切り替える
- 手順:
  1. `/` を確認する
- 期待結果:
  - 最新レビューの表示仕様は変わらない

#### TC-SCOPE-02

- 観点: 授業一覧・検索結果
- 前提: 制限 `ON` と `OFF` を切り替える
- 手順:
  1. 授業一覧、検索結果を確認する
- 期待結果:
  - 一覧や要約表示の仕様は変わらない

#### TC-SCOPE-03

- 観点: レビュー件数・平均評価
- 前提: 制限 `ON` と `OFF` を切り替える
- 手順:
  1. 授業詳細ヘッダーを確認する
- 期待結果:
  - レビュー件数、平均評価の表示仕様は変わらない

#### TC-SCOPE-04

- 観点: レビュー投稿画面
- 前提: 制限 `ON` と `OFF` を切り替える
- 手順:
  1. レビュー投稿画面を開く
- 期待結果:
  - 投稿導線と投稿動作は変わらない

#### TC-SCOPE-05

- 観点: マイページ集計
- 前提: 制限 `ON` と `OFF` を切り替える
- 手順:
  1. マイページを確認する
- 期待結果:
  - 集計表示の仕様は変わらない

## 9. 最低限の確認セット

リリース前に最低限通すケースは以下とする。

- `TC-PUB-01`
- `TC-PUB-04`
- `TC-PUB-06`
- `TC-PUB-07`
- `TC-PUB-10`
- `TC-ADM-01`
- `TC-ADM-03`
- `TC-ADM-08`
- `TC-API-PUB-01`
- `TC-API-PUB-07`
- `TC-API-ADM-03`
- `TC-API-ADM-04`
