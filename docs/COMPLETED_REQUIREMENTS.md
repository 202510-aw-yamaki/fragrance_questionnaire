# COMPLETED_REQUIREMENTS

本書は、現時点でこのリポジトリ上に実装確認できている項目だけを記録する文書です。  
目標仕様との比較は `UNMET_REQUIREMENTS.md` で管理します。

## 顧客側導線

- `index.html`、`questionnaire.html`、`questionnaire_step2.html`、`fragrance-graph.html`、`reservation.html`、`reservation-complete.html` が存在する
- アンケートからグラフ、予約、完了画面までの基本導線が存在する
- `questionnaire.html` で回答と配点状態を `sessionStorage` に保持する実装がある
- `questionnaire_step2.html` で STEP2、Q8、五軸計算、要約生成の実装がある
- `fragrance-graph.html` で五軸の可視化と手動調整の実装がある
- `reservation.html` で予約枠取得と予約登録の実装がある
- `reservation-complete.html` で `reservationCode` による予約復元の実装がある

## Supabase 連携

- `js/supabase-config.js`、`js/supabase-client.js`、`js/public-data.js` が存在する
- `public-data.js` に `scoring_configs`、`questionnaire_results`、`reservation_slots`、`reservations` の入出力処理がある
- `supabase/schema.sql` が存在する
- `schema.sql` に次のテーブルがある
  - `questionnaire_results`
  - `reservation_slots`
  - `reservations`
  - `scoring_configs`
  - `material_points`
  - `admin_settings`
- `schema.sql` に RLS と policy の定義がある

## 管理導線

- `admin-login.html` が存在する
- `admin-dashboard.html` が存在する
- `admin-reservations.html` が存在する
- `admin-slots.html` が存在する
- `admin-scoring.html` が存在する
- `admin-materials.html` が存在する
- `admin-settings.html` が存在する
- `js/admin-auth.js` にログイン / ログアウト処理がある
- `js/admin-data.js` に管理系 CRUD の共通処理がある

## 現在の管理機能

- 予約一覧表示と status 更新の実装がある
- 予約枠 CRUD の実装がある
- `scoring_configs` の CRUD に近い管理機能がある
- `material_points` の CRUD に近い管理機能がある
- `admin_settings` の CRUD に近い管理機能がある

## 既存マスタの状況

- `material_points` という汎用材料マスタが存在する
- `admin-materials.html` で五軸値を個別に入力して保存できる
- 現時点では「基剤」と「原料」を分けた UI / 権限設計までは入っていない
