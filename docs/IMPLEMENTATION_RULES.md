# IMPLEMENTATION_RULES

本書は `ロジック実装.md` と `Supabase 前提の静的HTMLアプリへ移行.md` を、実装時の共通ルールとして再編したものです。

## 判断優先順位

仕様や文言に差分が見えた場合は、以下の順で判断する。

1. 現在の実装コード
2. `supabase/schema.sql`
3. active `scoring_configs`
4. `questionnaire.html` の `MASTER_SCORING_CONFIG`
5. `deep-research-report.md` 由来の研究値や将来案

研究メモは根拠資料として扱うが、現行挙動の正解データとしては扱わない。

## 共通方針

- 既存の UI、レイアウト、DOM 構造、class 名、CTA 導線、モバイル表示を大きく崩さない
- 実装基盤は静的 HTML + CSS + JavaScript とし、フレームワーク前提にしない
- 公開ページのロジックは、既存方針どおり各 HTML 内の script を基本とする
- 複数ページで共通化価値がある処理のみ `js/` 配下へ切り出す

## 配点設定の扱い

- 配点ロジックの fallback 主編集箇所は `questionnaire.html` の `MASTER_SCORING_CONFIG`
- 本番運用での主編集経路は `admin-scoring.html` と `scoring_configs`
- `questionnaire_step2.html`、`fragrance-graph.html`、`reservation.html` には、主編集箇所が `questionnaire.html` 側にあることを分かるコメントを残す
- 文書更新時は、現行挙動を先に合わせ、その後に fallback 値と説明文を追随させる

## 固定ルール

- 軸順は `floral -> fresh -> woody -> spicy -> sweet`
- 全軸の演算結果は常に `0` から `100` に clamp する
- 回答キーは表示文言ではなく `A` / `B` / `C` / `ALL` / `NONE` で保持する
- `全部好き` は `ALL`、`この中にはない` は `NONE` として扱う
- STEP2 の分岐 tie-break は `floral -> fresh -> woody`

## sessionStorage ルール

### `fragranceScoringConfig`

- active scoring config を保存する
- public ページ間で同じ配点設定を参照する

### `fragranceScoreState`

- STEP1 回答
- STEP1 / STEP2 / Q8 の回答キー
- `branchKey`
- `axesAfterStep1`
- `axesAfterStep2`
- `finalAxes`
- `resetAxes`
- `selectedFinish`
- `profileKey`
- `updatedAt`

### `fragranceReservationDraft`

- graph 画面での調整後軸
- 仕上がりキー
- 要約見出し / 本文
- 更新時刻

### `fragranceReservationConfirmation`

- 予約確定後に完了画面へ渡す表示用 payload

## Supabase 利用ルール

- クライアント側では `anonKey` のみを使う
- `service role key` は使わない
- 管理画面は Supabase Auth の email / password + RLS を前提にする
- 公開ページは未認証でも使える範囲の policy を持つ
- Supabase 接続は `js/supabase-client.js` に集約する
- 公開導線のデータ入出力は `js/public-data.js` に集約する
- 管理画面の CRUD は `js/admin-data.js` に集約する
- 認証関連は `js/admin-auth.js` に集約する

## ページごとの責務

- `questionnaire.html`
  active scoring config の取得、STEP1 計算、STEP2 への引き渡し
- `questionnaire_step2.html`
  STEP2 と Q8 の計算、`questionnaire_results` 保存
- `fragrance-graph.html`
  調整後軸の保存、preset 適用、要約プロフィールの再計算
- `reservation.html`
  予約枠取得、予約保存、完了画面への遷移
- `reservation-complete.html`
  `reservationCode` による予約内容復元
- 管理画面
  認証、ダッシュボード、予約、予約枠、配点、原料、設定の管理

## fallback ルール

- 公開ページの優先順は `Supabase -> sessionStorage -> ローカル fallback / demo data`
- `questionnaire.html` と `questionnaire_step2.html` はローカル進行を維持できること
- `fragrance-graph.html` はローカル draft で使えること
- `reservation.html` は予約枠取得失敗時のみ demo slots fallback を許容すること
- `reservation-complete.html` は sessionStorage を優先しつつ、必要時は `reservationCode` で Supabase 参照できること

## 品質条件

- `null` / `undefined` / network error を安全に扱う
- 例外で画面全体が停止しない構造にする
- `console.error` の出力は許容する
- `alert` の乱用は避ける
- 長い重複コードは避け、共有化できるものだけ共有する
