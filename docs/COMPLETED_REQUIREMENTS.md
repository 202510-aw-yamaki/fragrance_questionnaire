# COMPLETED_REQUIREMENTS

本書は、現時点で本リポジトリ上に実装済みである要件だけを記載する文書です。  
未達項目は `UNMET_REQUIREMENTS.md` で管理します。

## 顧客側フロー

- `index.html` から `questionnaire.html`、`questionnaire_step2.html`、`fragrance-graph.html`、`reservation.html`、`reservation-complete.html` までの基本導線がある
- アンケート回答から五軸グラフ、予約、予約完了までの保存導線がある
- `questionnaire.html` と `questionnaire_step2.html` は `deep-research-report.md` 基準の配点ロジックへ揃えてある
- `fragrance-graph.html` と `reservation.html` は `deep-research-report.md` 基準の五軸を前提に引き継ぐ

## Supabase 基盤

- `questionnaire_results`
- `reservation_slots`
- `reservations`
- `scoring_configs`
- `material_points`
- `admin_settings`
- `workshop_sessions`

上記テーブルを `supabase/schema.sql` で管理している。

- `scoring_configs` の active 設定を公開側が参照できる
- `reservation_slots` の公開中枠を公開側が参照できる
- `material_points` の公開中素材を公開側が参照できる
- `workshop_sessions` をスタッフ側記録用テーブルとして追加している

## 管理画面の基盤

- `admin-login.html`
- `admin-dashboard.html`
- `admin-reservations.html`
- `admin-slots.html`
- `admin-scoring.html`
- `admin-materials.html`
- `admin-settings.html`
- `admin-workspace.html`

上記の管理画面導線がある。

- `js/admin-auth.js` でログイン確認と共通ヘッダー表示を行う
- `js/admin-data.js` で管理系 CRUD の共通呼び出しを行う

## 配点ロジック管理

- `admin-scoring.html` は JSON 直編集前提ではなく、フォーム中心で配点調整できる
- `deep-research-report.md` 基準の初期テンプレートを管理画面から読み込める
- `scoring_configs` に新 version として保存できる
- 公開側は active `scoring_configs` を読んで配点へ接続できる

## 原料ポイント管理

- `admin-materials.html` は一覧カードと数値入力で管理できる
- `deep-research-report.md` 基準の 16 原料テンプレートを一括反映できる
- `material_points` を公開側が読める
- `fragrance-graph.html` は `material_points` を参照し、五軸に近い候補素材を予約 draft に保持できる

## スタッフ機能

- スタッフ向けログイン後画面として `admin-workspace.html` を追加した
- 予約一覧を日付、ステータス、キーワードで絞り込みできる
- 予約ごとに事前アンケートの要約と回答内容を確認できる
- 予約時五軸、アンケート後五軸、調整候補五軸を比較表示できる
- 店頭で決まった最終五軸を入力して保存できる
- 基剤 / 原料、量、ロット、備考をレシピとして保存できる
- `workshop_sessions` に接客前メモ、接客後サマリー、五軸、レシピを保存できる
- `reservations` 側の `staff_memo` と `status` を接客記録保存に合わせて更新できる
- `admin-slots.html` にシフトベースの予約枠一括作成 UI を追加した
- 出勤時間帯、曜日、時間間隔から `reservation_slots` をまとめて作成 / 更新できる

## 既存ドキュメント運用

- 配点仕様は `SURVEY_SCORING_LOGIC.md` を正本として整理してある
- 原料テンプレートは `MATERIAL_POINTS.md` を正本として整理してある
- 達成済みと未達を `COMPLETED_REQUIREMENTS.md` / `UNMET_REQUIREMENTS.md` に分けて管理する運用にしてある
