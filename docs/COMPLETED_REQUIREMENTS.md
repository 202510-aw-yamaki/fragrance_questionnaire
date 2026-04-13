# COMPLETED_REQUIREMENTS

本書は、再編元 Markdown の要件のうち、2026-04-14 時点の現行リポジトリで実装確認できた項目だけを整理したものです。

## 本書の扱い

- 本書は「今このリポジトリで実装済みのもの」を正とする
- 仕様書や研究メモに書かれていても、現行コードで確認できないものは本書へ入れない
- 実装状況の判断に迷った場合は、本書を `UNMET_REQUIREMENTS.md` より優先する

## 公開導線

- `index.html`、`questionnaire.html`、`questionnaire_step2.html`、`fragrance-graph.html`、`reservation.html`、`reservation-complete.html` が存在する
- `questionnaire.html` に `MASTER_SCORING_CONFIG` があり、STEP1 の 5 軸計算と `sessionStorage` 保存が入っている
- `questionnaire_step2.html` で STEP2 / Q8 / finish blend / nearest profile 計算が実装されている
- `fragrance-graph.html` で最終軸の初期表示、preset 適用、調整後軸の保存が入っている
- `reservation.html` で nearest profile による summary 表示、予約枠取得、予約登録が入っている
- `reservation-complete.html` で `reservationCode` を用いた予約復元が入っている

## 配点ロジック

- 5 軸固定、初期値 `50`、`0` から `100` clamp の前提が実装されている
- STEP1 は `weight = 1`、STEP2 は `weight = 2`、Q8 は `weight = 3` の構成になっている
- STEP1 後の weighted Manhattan distance による branch 判定が入っている
- Q8 後に `finishTemplates` を `0.25` ブレンドする構成が入っている
- `summaryProfiles` を使った nearest profile 判定が `questionnaire.html`、`questionnaire_step2.html`、`fragrance-graph.html`、`reservation.html` に入っている

## sessionStorage

- `fragranceScoringConfig`
- `fragranceScoreState`
- `fragranceStep1Answers`
- `fragranceReservationDraft`
- `fragranceReservationConfirmation`

上記キーを使う前提の導線が実装されている。

## Supabase 連携

- `js/supabase-config.js`、`js/supabase-client.js`、`js/public-data.js` が存在する
- `js/public-data.js` に `scoring_configs`、`questionnaire_results`、`reservation_slots`、`reservations` の入出力処理が入っている
- `supabase/schema.sql` に `questionnaire_results`、`reservation_slots`、`reservations`、`scoring_configs`、`material_points`、`admin_settings` が定義されている
- `schema.sql` で RLS 有効化と公開 / 管理向け policy が定義されている

## 管理画面

- `admin-login.html`、`admin-dashboard.html`、`admin-reservations.html`、`admin-slots.html`、`admin-scoring.html`、`admin-materials.html`、`admin-settings.html` が存在する
- `js/admin-auth.js` にログイン / ログアウト処理が入っている
- `js/admin-data.js` に管理画面用 CRUD の共通処理が入っている
- `admin-dashboard.html` で KPI 表示と各管理画面への導線がある
- `admin-reservations.html` で予約一覧表示と status 更新が入っている
- `admin-slots.html` で予約枠 CRUD が入っている
- `admin-scoring.html` で active scoring config の編集 / 反映が入っている
- `admin-materials.html` で `material_points` の CRUD が入っている
- `admin-settings.html` で `admin_settings` の CRUD が入っている

## 原料ポイント管理

- `material_points` テーブルがある
- `admin-materials.html` で 5 軸の `point_axes` を個別入力して保存できる
- `admin-dashboard.html` で `material_points` 件数の参照が入っている
