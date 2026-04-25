# IMPLEMENTATION_RULES

本書は、今後このリポジトリで実装を進める際の共通ルールです。

## 文書運用ルール

- `SPEC.md`、`IMPLEMENTATION_RULES.md`、`SURVEY_SCORING_LOGIC.md`、`MATERIAL_POINTS.md` は固定仕様書として扱う
- `COMPLETED_REQUIREMENTS.md` は実装済みだけを書く
- `UNMET_REQUIREMENTS.md` は未達だけを書く
- 未達が達成されたら `UNMET_REQUIREMENTS.md` から削除し、`COMPLETED_REQUIREMENTS.md` へ移す
- 同じ項目を `COMPLETED` と `UNMET` の両方に置かない
- 実装状況の変化で更新するのは主に `COMPLETED` と `UNMET`
- 要件そのものが変わったときに更新するのは `SPEC`、`SURVEY_SCORING_LOGIC`、`MATERIAL_POINTS`

## 現行ファイル配置ルール

- 顧客向けページは `index.html` と `customer/` 配下を正とする
  - `customer/questionnaire.html`
  - `customer/questionnaire_step2.html`
  - `customer/fragrance-graph.html`
  - `customer/reservation.html`
  - `customer/reservation-complete.html`
  - `customer/product-reservation.html`
- スタッフ / 管理者の共通ログインは `admin-login.html`
- スタッフ向けページは `staff/` 配下を正とする
  - `staff/staff-dashboard.html`
  - `staff/staff-customer-detail.html`
  - `staff/staff-slots.html`
  - `staff/staff-reservations.html`
- 管理者向けページは `admin/` 配下を正とする
  - `admin/admin-dashboard.html`
  - `admin/admin-settings.html`
  - `admin/admin-scoring.html`
  - `admin/admin-materials.html`
- `admin-login.html` はスタッフ / 管理者用ページのため、`index.html` からリンクしない前提を正とする
- 現段階のスタイル管理は各HTML内のインラインスタイルを正とし、同一スタイルの共通化は将来対応とする

## 判断優先順位

1. 最新のユーザー指示
2. `docs/SPEC.md`
3. `docs/SURVEY_SCORING_LOGIC.md`
4. `docs/MATERIAL_POINTS.md`
5. `deep-research-report.md`
6. 現行コード

補足:

- 配点や原料プロファイルで現行コードと `deep-research-report.md` が異なる場合、仕様上は `deep-research-report.md` 側を正とする
- その差分は「未実装」または「未追従」として `UNMET_REQUIREMENTS.md` に残す
- `レイアウトimg` 配下の画像は、スタッフ / 管理者 UI の導線、カード構成、ボタン名、モーダル構成を補う参考資料として扱う
- ただし `レイアウトimg` 配下の画像内の数値はモック値やコピペ値を含み得るため、配点値、5軸値、テンプレート値、原料ポイント値の根拠にしてはならない
- 数値を実装または文書へ反映する際は、必ず `deep-research-report.md` を参照し、必要に応じて `docs/SURVEY_SCORING_LOGIC.md` と `docs/MATERIAL_POINTS.md` を正として扱う

## 顧客側 UI ルール

- 現在の FrontPage 群の見た目と導線を大きく崩さない
- 顧客向け導線は `index.html` と `customer/` 配下の構成を維持する
- 公開ページは匿名利用前提でよい
- 顧客が入力した回答や五軸は、後続の予約と店舗対応に引き継げること
- 公開ページのデータ取得 / 保存は Supabase を主経路とし、取得失敗時でも `sessionStorage` や demo data で継続できるようにする

## 店舗スタッフ / 管理者 UI ルール

- IT リテラシーが高くなくても使える粒度にする
- ログイン導線は `admin-login.html` を共通入口とし、スタッフ画面は `staff/`、管理者画面は `admin/` へ分ける
- JSON 直接編集を前提にしない
- 数値調整はスピンボタンや明示的な入力欄で扱う
- 必要なページは役割単位で明確に分ける
- ボタン名称と入力項目名は業務用語に寄せる
- スタッフ / 管理者 UI の導線やレイアウトで迷った場合は、`レイアウトimg` 配下の画像を参照して意図を補完する
- 画像の見た目を参照する場合でも、画面内の数値はそのまま採用せず、`deep-research-report.md` を確認してから反映する

## 認証・権限ルール

- 顧客側は基本的に未認証で使える構成
- 管理導線は Supabase Auth を使う
- ロールは最低限 `staff` と `manager` を分ける
- `manager` は `staff` の権限に加えて、権限管理、基剤管理、原料管理を扱える
- クライアント側で `service role key` は使わない

## データ管理ルール

- `customer_id` で顧客履歴を束ねる
- 五軸は最低限次の 3 時点を持つ
  - アンケート結果
  - 予約時点で確定した値
  - 店舗調整後の最終値
- レシピは、最終五軸と材料構成が結びついた形で保存する
- 材料マスタは `material_type = base | ingredient` を持つ共通設計を正とする
- UI 上は基剤と原料を分けて見せてもよい

## 数値入力ルール

- 五軸は `floral` / `fresh` / `woody` / `spicy` / `sweet` の 5 軸固定
- 基剤・原料の数値は「単位量あたり五軸へ与える値」で持つ
- 基剤・原料ともに次を管理対象とする
  - 名称
  - ID
  - 商品種
  - ロット
  - 単位量あたり五軸値
  - テンプレート種別

## 実装上の前提

- バックエンドは Supabase
- 公開導線と管理導線でデータを分断しない
- 公開ページは Supabase 未設定や一時失敗で完全停止させず、`sessionStorage` とローカルフォールバックで最低限の導線を維持する
- 再注文やおすすめテンプレート拡張に備えて、顧客、五軸、レシピ、材料構成の紐付けを残す
- 将来の推薦ロジック追加を前提に、五軸とレシピを再利用しやすい粒度で保存する

## 追記: UI 調整の合意必須ルール

- レイアウト調整、導線整理、非エンジニア向けの操作しやすさ改善は、実装候補をこちらだけで確定しない
- 上記の UI / UX 調整は `UNMET_REQUIREMENTS.md` に未達として残し、ユーザーと画面を見ながら詰める前提で扱う
- ユーザーの確認と承諾があるまでは、見た目や操作フローを勝手に進めない
- このルールは、2026-04-14 の「レイアウト調整や非エンジニアにもわかりやすいUI部分は未達として扱い、勝手に進めないことを明記したい」という要望に基づく追記である
## 追記 2026-04-20 スタッフ登録/管理ページの仮データ

- `admin/admin-settings.html` / `js/admin-settings-page.js` の「本日（04/20）の出勤者」は、3カラム2ロウの見え方確認のため、登録済みスタッフが 6 人未満の場合のみ仮スタッフ表示で不足分を補完している
- この仮データは画面確認用の一時対応であり、実スタッフデータの登録後、または最終調整時に削除する前提とする
- 2026-04-20 の要望「本日（04/20）の出勤者部分は仮データでもよいので 3カラム2ロウ確認用に入れ、最後に消すデータであることが分かるように記述」に対応して追記
