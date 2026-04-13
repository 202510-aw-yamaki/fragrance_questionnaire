# SPEC

本書は `deep-research-report.md`、`ロジック実装.md`、`Supabase 前提の静的HTMLアプリへ移行.md` を、現行実装の構成に合わせて再編した仕様固定書です。

## 仕様の優先順位

迷った場合は、以下の順で正とする。

1. 現在のリポジトリ内の実装と `supabase/schema.sql`
2. 実行時に参照される active `scoring_configs`
3. `questionnaire.html` の `MASTER_SCORING_CONFIG`
4. 研究メモ由来の案や将来構想

補足:

- 本書は「現行仕様」を固定する文書であり、研究メモや構想メモより優先する
- `material_points` は現行公開導線の挙動を決める主データではない

## プロジェクト概要

- 本アプリは、静的 HTML + CSS + JavaScript を前提にした香りアンケート / 香りグラフ / 予約導線 / 管理画面の構成を持つ
- 公開導線の保存先と取得先は Supabase を前提とする
- README は案内用途として現状維持し、本書群で仕様を固定する

## 画面構成

### 公開導線

1. `index.html`
2. `questionnaire.html`
3. `questionnaire_step2.html`
4. `fragrance-graph.html`
5. `reservation.html`
6. `reservation-complete.html`

### 管理画面

1. `admin-login.html`
2. `admin-dashboard.html`
3. `admin-reservations.html`
4. `admin-slots.html`
5. `admin-scoring.html`
6. `admin-materials.html`
7. `admin-settings.html`

## 固定ドメイン

- 香り評価軸は `floral` / `fresh` / `woody` / `spicy` / `sweet` の 5 軸固定
- 軸スコアは `0` から `100` の範囲で扱い、初期値は `50`
- アンケートの回答キーは `A` / `B` / `C` / `ALL` / `NONE` を固定で使う
- 公開ページで使う配点ロジックは、通常時は Supabase の `scoring_configs` の active レコードを優先し、取得できない場合は `questionnaire.html` の `MASTER_SCORING_CONFIG` を fallback とする
- `material_points` は将来の提案ロジック拡張用のデータ置き場であり、現段階では管理用 CRUD が主用途

## データ保存

### sessionStorage

- `fragranceScoringConfig`
- `fragranceScoreState`
- `fragranceStep1Answers`
- `fragranceReservationDraft`
- `fragranceReservationConfirmation`

### Supabase テーブル

- `questionnaire_results`
- `reservation_slots`
- `reservations`
- `scoring_configs`
- `material_points`
- `admin_settings`

## ページごとの責務

- `questionnaire.html`
  STEP1 の回答収集、配点設定の確定、STEP1 結果保存
- `questionnaire_step2.html`
  STEP2 / Q8 の実行、最終 5 軸計算、要約プロフィール確定、`questionnaire_results` 保存
- `fragrance-graph.html`
  最終軸の可視化と手動調整、`adjusted_axes` 更新
- `reservation.html`
  予約枠取得、要約表示、予約確定、`reservations` 保存
- `reservation-complete.html`
  予約コードによる復元表示
- 管理画面群
  予約、予約枠、配点設定、原料ポイント、設定値の管理

## データ連携の基本順序

- 公開ページは `Supabase -> sessionStorage -> ローカル fallback / demo data` の優先順で扱う
- 管理画面は Supabase 前提で動作し、未設定時は明示メッセージを出す

## 現段階の範囲外

- `material_points` を使った原料提案ロジック
- 16 原料プロファイルからの自動ブレンド探索
- ワークショップ後の 5 軸評価を使った校正フロー
