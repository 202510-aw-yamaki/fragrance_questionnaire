# fragrance_questionnaire

フレグランス体験向けのフロントエンド試作です。HTMLごとにページを分け、共通CSSとページ別CSSを組み合わせて構成しています。

## サイトマップ

```text
index.html
  └ questionnaire.html
      └ questionnaire_step2.html
          └ fragrance-graph.html
              └ reservation.html
                  └ reservation-complete.html
```

## ページ構成

- `index.html`
  - トップページ
  - 体験概要、導線、基本情報、安心材料を表示
- `questionnaire.html`
  - アンケート STEP1
  - 共通5問を表示
- `questionnaire_step2.html`
  - アンケート STEP2
  - STEP1 の回答傾向に応じて分岐3問を表示
- `fragrance-graph.html`
  - 香りバランスの可視化ページ
  - レーダーグラフとスライダーで調整
- `reservation.html`
  - 予約ページ
  - 香り傾向表示、予約枠選択、来店情報入力、メモ入力
- `reservation-complete.html`
  - 予約完了ページ
  - 予約内容確認、来店案内、地図導線を表示

## CSS依存関係

各HTMLは `css/common.css` を土台にし、必要に応じてページ専用CSSを追加しています。

```text
index.html
  - css/common.css
  - css/top-page.css

questionnaire.html
  - css/common.css
  - css/questionnaire-common.css
  - css/questionnaire-step1.css

questionnaire_step2.html
  - css/common.css
  - css/questionnaire-common.css
  - css/questionnaire-step2.css

fragrance-graph.html
  - css/common.css
  - css/fragrance-graph.css

reservation.html
  - css/common.css
  - css/reservation.css

reservation-complete.html
  - css/common.css
  - css/reservation-complete.css
```

## 補足

- JavaScript は外部ファイル化されておらず、各HTML末尾にインラインで記述されています。
- ページ間の一時データ受け渡しには `sessionStorage` を使用しています。
- 現在の予約ページと予約完了ページは、バックエンドAPIに依存せずフロント単体で動作する構成です。

## 配点調整ポイント

### 主編集箇所

- ファイル: `questionnaire.html`
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

- `questionnaire_step2.html`
  - master config を読み、STEP2 の反映と最終確定を行う
- `fragrance-graph.html`
  - アンケート結果を初期値にして可視化・微調整する
- `reservation.html`
  - 5軸に最も近い profile を選んで文言表示する

### 注意

- fallback 定数が別ファイルにあっても、通常の編集は `questionnaire.html` の master config を優先
- `questionnaire_step2.html` / `fragrance-graph.html` / `reservation.html` には主編集箇所への誘導コメントがある
- `sessionStorage` を消して直接中間ページを開くと fallback が使われる場合がある
- UI 文言を変えたくない場合は score key と配点定数だけ編集する

## Supabase 前提の静的HTMLアプリ構成

### 更新後サイトマップ
```text
公開ページ
- index.html
- questionnaire.html
- questionnaire_step2.html
- fragrance-graph.html
- reservation.html
- reservation-complete.html

管理ページ
- admin-login.html
- admin-dashboard.html
- admin-reservations.html
- admin-slots.html
- admin-scoring.html
- admin-materials.html
- admin-settings.html
```

### CSS依存関係の追記
```text
admin-login.html
  - css/common.css
  - css/admin-common.css

admin-dashboard.html
  - css/common.css
  - css/admin-common.css

admin-reservations.html
  - css/common.css
  - css/admin-common.css

admin-slots.html
  - css/common.css
  - css/admin-common.css

admin-scoring.html
  - css/common.css
  - css/admin-common.css

admin-materials.html
  - css/common.css
  - css/admin-common.css

admin-settings.html
  - css/common.css
  - css/admin-common.css
```

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
  - `questionnaire_step2.html` で insert
  - `fragrance-graph.html` で adjusted axes を update
- `reservation_slots`
  - `reservation.html` で select
  - `admin-slots.html` で CRUD
- `reservations`
  - `reservation.html` で insert
  - `reservation-complete.html` で reservation code から復元
  - `admin-reservations.html` で閲覧と status 更新
- `scoring_configs`
  - `questionnaire.html` で active config を select
  - `admin-scoring.html` で version 追加と active 切替
- `material_points`
  - `admin-materials.html` で CRUD
- `admin_settings`
  - `admin-settings.html` で CRUD

### public page のデータフロー
1. `questionnaire.html`
   - active scoring config を Supabase から取得できれば優先
   - 取得できない場合は `MASTER_SCORING_CONFIG` を fallback として使用
2. `questionnaire_step2.html`
   - STEP2 完了時に `questionnaire_results` へ保存
3. `fragrance-graph.html`
   - スライダー調整後の axes を debounce 付きで `questionnaire_results.adjusted_axes` に反映
4. `reservation.html`
   - `reservation_slots` を取得
   - 予約確定時に `reservations` へ保存
5. `reservation-complete.html`
   - `sessionStorage` がなければ `reservationCode` で `reservations` から復元

### 配点調整ポイントの更新
- fallback の主編集箇所は引き続き `questionnaire.html`
- 検索文字列は `FRAGRANCE SCORING EDIT POINT: MASTER CONFIG START`
- 本番運用で active config を切り替える主画面は `admin-scoring.html`
- 実データとして保持するテーブルは `scoring_configs`
- public page は `scoring_configs.is_active = true` の設定を優先し、取得失敗時のみ fallback を使う
- `questionnaire_step2.html` / `fragrance-graph.html` / `reservation.html` の誘導コメントはそのまま維持している

### material_points の位置づけ
- `material_points` は将来の提案ロジック拡張用
- 現段階では管理画面から CRUD できる土台までを実装
- 公開ページの提案ロジックへはまだ直接組み込んでいない

### フォールバック方針
- 優先順は `Supabase -> sessionStorage -> fallback 定数 / demo data`
- 公開ページは Supabase 未設定でも遷移を止めない
- `reservation.html` は slot 取得失敗時のみ demo slots を使う
- 管理ページは Supabase 未設定時にログインできないことを明示する