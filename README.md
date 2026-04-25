# fragrance_questionnaire

フレグランス体験向けのフロントエンド試作です。HTMLごとにページを分け、現段階では各ファイル内のインラインスタイルを中心に構成しています。

## サイトマップ

```text
index.html
├ customer/
│ ├ questionnaire.html
│ ├ questionnaire_step2.html
│ ├ fragrance-graph.html
│ ├ reservation.html
│ ├ reservation-complete.html
│ └ product-reservation.html
├ admin-login.html
├ staff/
│ ├ staff-dashboard.html
│ ├ staff-customer-detail.html
│ ├ staff-slots.html
│ └ staff-reservations.html
└ admin/
  ├ admin-dashboard.html
  ├ admin-settings.html
  ├ admin-scoring.html
  └ admin-materials.html
```

## ページ構成

- `index.html`
  - トップページ
  - 顧客向け導線のみを表示
- `customer/questionnaire.html`
  - アンケート STEP1
  - 共通5問を表示
- `customer/questionnaire_step2.html`
  - アンケート STEP2
  - STEP1 の回答傾向に応じて分岐3問を表示
- `customer/fragrance-graph.html`
  - 香りバランスの可視化ページ
  - レーダーグラフとスライダーで調整
- `customer/reservation.html`
  - 予約ページ
  - 香り傾向表示、予約枠選択、来店情報入力、メモ入力
- `customer/reservation-complete.html`
  - 予約完了ページ
  - 予約内容確認、来店案内、地図導線を表示
- `customer/product-reservation.html`
  - 商品予約向けの顧客ページ
  - 現行構成では `customer/` 配下に置く
- `admin-login.html`
  - スタッフ / 管理者共通ログイン
  - 意図的に `index.html` からは紐づけていない
- `staff/staff-dashboard.html`
  - スタッフ用ダッシュボード
  - 本日の予定、予約件数、予約枠導線を扱う
- `staff/staff-reservations.html`
  - スタッフ用予約一覧
  - 絞り込みと顧客詳細導線を扱う
- `staff/staff-slots.html`
  - スタッフ用予約枠作成 / 管理
  - 単件登録と一括作成を扱う
- `staff/staff-customer-detail.html`
  - スタッフ用顧客詳細
  - 回答内容、5軸比較、接客記録を扱う
- `admin/admin-dashboard.html`
  - 管理者用ダッシュボード
  - 出勤状況、予約枠状況、配点 / 原料導線を扱う
- `admin/admin-settings.html`
  - 管理者用設定 / スタッフ登録管理ページ
- `admin/admin-scoring.html`
  - 管理者用配点ロジック管理ページ
- `admin/admin-materials.html`
  - 管理者用原料ポイント管理ページ

## スタイル方針

- 現在のHTMLは `index.html` を含めて各ファイル内のインラインスタイルで構成しています。
- 共通化できるCSSはありますが、現段階では整理せず、現行のインラインスタイル構成を正とします。
- 同一スタイルの統合は将来対応とし、今はページ単位で見た目を維持することを優先します。

## 補足

- JavaScript は各HTML末尾のインライン script と共有JSを併用しています。
- ページ間の一時データ受け渡しには `sessionStorage` を使用しています。
- 現在の予約ページと予約完了ページは、バックエンドAPIに依存せずフロント単体で動作する構成です。
- `admin-login.html` はスタッフおよび管理者用ページであり、現状はトップページからリンクしていません。

## 配点調整ポイント

### 主編集箇所

- ファイル: `customer/questionnaire.html`
- 検索文字列: `FRAGRANCE SCORING EDIT POINT: MASTER CONFIG START`
- 通常はこのブロックだけを編集すればよい

### 変更できる内容

- 初期ポイント: `initialAxisScore`
- 問題の重み: `questionWeights`
- STEP1 の補助選択肢対象軸: `step1PrimaryAxes`
- STEP1 の配点: `step1ScoreMap`
- STEP2 分岐テンプレート: `branchTemplates`
- 分岐距離の重み: `branchDistanceWeights`
- STEP2 の補助選択肢対象軸: `step2PrimaryAxes`
- STEP2 の配点: `step2ScoreMap`
- Q8 の補助選択肢対象軸: `q8PrimaryAxes`
- Q8 の配点: `q8ScoreMap`
- Q8 から仕上がりテンプレートへの対応: `finishKeyByAnswer`
- 仕上がりテンプレート: `finishTemplates`
- Q8 のテンプレート寄せ率: `finishBlendRatio`
- graph ボタンの preset 値: `graphPresets`
- reservation の見出し・説明文テンプレート: `summaryProfiles`

### 他ページの役割

- `customer/questionnaire_step2.html`
  - master config を読み、STEP2 の反映と最終確定を行う
- `customer/fragrance-graph.html`
  - アンケート結果を初期値にして可視化・微調整する
- `customer/reservation.html`
  - 5軸に最も近い profile を選んで文言表示する

### 注意

- fallback 定数が別ファイルにあっても、通常の編集は `customer/questionnaire.html` の master config を優先
- `customer/questionnaire_step2.html` / `customer/fragrance-graph.html` / `customer/reservation.html` には主編集箇所への誘導コメントがある
- `sessionStorage` を消して直接中間ページを開くと fallback が使われる場合がある
- UI 文言を変えたくない場合は score key と配点定数だけ編集する

## Supabase 前提の静的HTMLアプリ構成

### 更新後サイトマップ
```text
顧客向けページ
- index.html
- customer/questionnaire.html
- customer/questionnaire_step2.html
- customer/fragrance-graph.html
- customer/reservation.html
- customer/reservation-complete.html
- customer/product-reservation.html

スタッフ / 管理者共通ログイン
- admin-login.html

スタッフページ
- staff/staff-dashboard.html
- staff/staff-customer-detail.html
- staff/staff-slots.html
- staff/staff-reservations.html

管理者ページ
- admin/admin-dashboard.html
- admin/admin-settings.html
- admin/admin-scoring.html
- admin/admin-materials.html
```

### スタイル構成
- `index.html` を含む現行HTMLはすべてインラインスタイル主体で構成している
- 共通CSSへの整理は将来対応とし、現段階では文書上もインラインスタイル構成を正として扱う
- `admin-login.html` も同様に単体HTMLとしてスタイルを内包している

### Supabase 設定方法
- `js/supabase-config.js` に `url` と `anonKey` を設定する
- client 側では anon key のみ使用し、service role key は使わない
- `supabase/schema.sql` を Supabase SQL Editor で実行する
- 管理画面ログインは Supabase Auth の email/password を使う
- RLS は `schema.sql` に含めている

### 共有JS
- `js/supabase-client.js`
  - Supabase client 生成
  - `getSupabaseClient()` / `isSupabaseConfigured()` を提供
- `js/public-data.js`
  - 公開ページ用の scoring config / questionnaire result / reservation slot / reservation 操作
- `js/admin-auth.js`
  - 管理画面のログイン確認、ヘッダー、ログアウト
- `js/admin-data.js`
  - 管理画面の共通 CRUD

### テーブルと画面の対応
- `questionnaire_results`
  - `customer/questionnaire_step2.html` で insert
  - `customer/fragrance-graph.html` で adjusted axes を update
- `reservation_slots`
  - `customer/reservation.html` で select
  - `staff/staff-slots.html` で CRUD
- `reservations`
  - `customer/reservation.html` で insert
  - `customer/reservation-complete.html` で reservation code から復元
  - `staff/staff-reservations.html` で一覧確認
  - `staff/staff-customer-detail.html` で詳細確認と記録更新
- `scoring_configs`
  - `customer/questionnaire.html` で active config を select
  - `admin/admin-scoring.html` で version 追加と active 切替
- `material_points`
  - `admin/admin-materials.html` で CRUD
- `admin_settings`
  - `admin/admin-settings.html` で CRUD

### public page のデータフロー
1. `customer/questionnaire.html`
   - active scoring config を Supabase から取得できれば優先
   - 取得できない場合は `MASTER_SCORING_CONFIG` を fallback として使用
2. `customer/questionnaire_step2.html`
   - STEP2 完了時に `questionnaire_results` へ保存
3. `customer/fragrance-graph.html`
   - スライダー調整後の axes を debounce 付きで `questionnaire_results.adjusted_axes` に反映
4. `customer/reservation.html`
   - `reservation_slots` を取得
   - 予約確定時に `reservations` へ保存
5. `customer/reservation-complete.html`
   - `sessionStorage` がなければ `reservationCode` で `reservations` から復元

### 配点調整ポイントの更新
- fallback の主編集箇所は引き続き `customer/questionnaire.html`
- 検索文字列は `FRAGRANCE SCORING EDIT POINT: MASTER CONFIG START`
- 本番運用で active config を切り替える主画面は `admin/admin-scoring.html`
- 実データとして保持するテーブルは `scoring_configs`
- public page は `scoring_configs.is_active = true` の設定を優先し、取得失敗時のみ fallback を使う
- `customer/questionnaire_step2.html` / `customer/fragrance-graph.html` / `customer/reservation.html` の誘導コメントはそのまま維持している

### material_points の位置づけ
- `material_points` は将来の提案ロジック拡張用
- 現段階では管理画面から CRUD できる土台までを実装
- 公開ページの提案ロジックへはまだ直接組み込んでいない

### フォールバック方針
- 優先順は `Supabase -> sessionStorage -> fallback 定数 / demo data`
- 公開ページは Supabase 未設定でも遷移を止めない
- `customer/reservation.html` は slot 取得失敗時のみ demo slots を使う
- 管理ページは Supabase 未設定時にログインできないことを明示する
- `admin-login.html` はスタッフ / 管理者専用のため、引き続き `index.html` からは直接遷移させない
