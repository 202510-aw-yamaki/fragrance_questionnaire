# COMPLETED_REQUIREMENTS

本書は、現時点で本リポジトリ上に実装済みである要件だけを記載する文書です。  
未達項目は `UNMET_REQUIREMENTS.md` で管理します。

## 顧客側フロー

- `index.html` から `customer/questionnaire.html`、`customer/questionnaire_step2.html`、`customer/fragrance-graph.html`、`customer/reservation.html`、`customer/reservation-complete.html` までの基本導線がある
- 顧客向け画面は `customer/` 配下に整理され、`customer/product-reservation.html` も同系統ページとして配置している
- アンケート回答から五軸グラフ、予約、予約完了までの保存導線がある
- `customer/questionnaire.html` と `customer/questionnaire_step2.html` は `deep-research-report.md` 基準の配点ロジックへ揃えてある
- `customer/fragrance-graph.html` と `customer/reservation.html` は `deep-research-report.md` 基準の五軸を前提に引き継ぐ
- `customer/reservation.html` は Supabase 経由の予約枠取得 / 予約保存を優先し、失敗時は demo slots や `sessionStorage` で継続できる
- `customer/reservation-complete.html` は `sessionStorage` を優先し、欠損時は Supabase の `reservations` から `reservationCode` で復元できる

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
- `staff/staff-dashboard.html`
- `staff/staff-customer-detail.html`
- `staff/staff-slots.html`
- `staff/staff-reservations.html`
- `admin/admin-dashboard.html`
- `admin/admin-scoring.html`
- `admin/admin-materials.html`
- `admin/admin-settings.html`

上記のスタッフ / 管理者導線がある。

- `js/admin-auth.js` でログイン確認と共通ヘッダー表示を行う
- `js/admin-data.js` で管理系 CRUD の共通呼び出しを行う

## 配点ロジック管理

- `admin/admin-scoring.html` は JSON 直編集前提ではなく、フォーム中心で配点調整できる
- `deep-research-report.md` 基準の初期テンプレートを管理画面から読み込める
- `scoring_configs` に新 version として保存できる
- 公開側は active `scoring_configs` を読んで配点へ接続できる

## 原料ポイント管理

- `admin/admin-materials.html` は一覧カードと数値入力で管理できる
- `deep-research-report.md` 基準の 16 原料テンプレートを一括反映できる
- 2026-04-25 追記: `admin/admin-materials.html` は上部 / 下部の DB 保存ボタンから、現在表示中の原料一覧を `material_points` に保存できる
- 2026-04-25 追記: `Json メモ` は JSON 本文ではなく保存データの補足メモとして扱い、`admin_settings` に保存できる
- `material_points` を公開側が読める
- `customer/fragrance-graph.html` は `material_points` を参照し、五軸に近い候補素材を予約 draft に保持できる

## スタッフ機能

- スタッフ向けログイン後画面として `staff/staff-dashboard.html` を配置した
- `staff/staff-reservations.html` で予約一覧を日付、ステータス、キーワードで絞り込みできる
- `staff/staff-customer-detail.html` で予約ごとに事前アンケートの要約と回答内容を確認できる
- `staff/staff-customer-detail.html` で予約時五軸、アンケート後五軸、調整候補五軸を比較表示できる
- `staff/staff-customer-detail.html` で店頭で決まった最終五軸を入力して保存できる
- `staff/staff-customer-detail.html` で基剤 / 原料、量、ロット、備考をレシピとして保存できる
- `workshop_sessions` に接客前メモ、接客後サマリー、五軸、レシピを保存できる
- `reservations` 側の `staff_memo` と `status` を接客記録保存に合わせて更新できる
- `staff/staff-slots.html` にシフトベースの予約枠一括作成 UI を追加した
- 出勤時間帯、曜日、時間間隔から `reservation_slots` をまとめて作成 / 更新できる

## 既存ドキュメント運用

- 配点仕様は `SURVEY_SCORING_LOGIC.md` を正本として整理してある
- 原料テンプレートは `MATERIAL_POINTS.md` を正本として整理してある
- 達成済みと未達を `COMPLETED_REQUIREMENTS.md` / `UNMET_REQUIREMENTS.md` に分けて管理する運用にしてある

## 追記: 2026-04-20 スタッフ / 管理ページ初期実装

この追記は、現段階で実装可能なスタッフ側 / 管理者側ページの着手分を、既存記述を残したまま補足するために追加する。

- `admin-login.html` に `staff` / `manager` のログイン種別切替 UI を追加し、ログイン後の遷移先を画面種別ごとに切り替えられるようにした
- `js/admin-auth.js` に staff / manager 両系統の共通ヘッダー切替、ロール別ホーム遷移、ロール保持を追加した
- `staff/staff-dashboard.html` を追加し、スタッフ確認ページとして「本日の予定確認」「向こう一週間の予約件数」「向こう二週間の予約枠状況」「予約枠作成ページ / 予約情報一覧ページへの導線」を実装した
- スタッフ確認ページの日表示カレンダー UI として、前日 / 翌日ナビゲーション、09:00-18:00 のタイムライン、昼休憩帯表示、イベントカード表示を追加した
- `admin/admin-dashboard.html` に、本日の出勤状況、向こう二週間の予約枠 OK / NG 表示、配点ロジック要約、原料クイックリンクを追加した
- `admin/admin-materials.html` / `js/admin-materials-page.js` に、`focus` クエリで対象原料へ自動スクロールする導線を追加した
- `staff/staff-slots.html` に、単件予約枠の入力中プレビューと、一括作成時の件数 / 日付範囲プレビューを追加した
- `js/admin-slots-bulk-page.js` に、既登録日が含まれる場合の「mm/dd は登録が既にしてあります」ポップアップ確認を追加した
- `staff/staff-reservations.html` / `js/admin-reservations-page.js` を、予約情報一覧ページとして来店日時ベースの一覧表示と、予約顧客情報詳細ページへの導線付き表示へ更新した
- `staff/staff-customer-detail.html` / `js/admin-workspace-page.js` に、予約顧客情報詳細ページ導線での直開き対応、5軸比較の表示順修正、最終5軸の合計100補正 UI を追加した
