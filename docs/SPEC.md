# SPEC

本書は、今後このリポジトリで目標とする仕様の固定書です。  
配点設計と原料プロファイル設計の正本は `deep-research-report.md` とし、実装の進捗管理は `COMPLETED_REQUIREMENTS.md` / `UNMET_REQUIREMENTS.md` で行います。

## 正本の考え方

- 配点ロジックと原料プロファイルの基準は `deep-research-report.md`
→最新は`deep-research-report-ver.1.1.md`
- 目標仕様の整理先は `docs/SPEC.md`、`docs/IMPLEMENTATION_RULES.md`、`docs/SURVEY_SCORING_LOGIC.md`、`docs/MATERIAL_POINTS.md`
- 実装済み / 未達の状態管理は `docs/COMPLETED_REQUIREMENTS.md`、`docs/UNMET_REQUIREMENTS.md`
- `レイアウトimg` 配下の画像は、主にスタッフ / 管理者画面の導線、画面構成、ラベル、モーダル構成を補う参考資料として扱う
- `レイアウトimg` 配下の画像内にある数値はモック値を含み得るため、配点値、5軸値、テンプレート値、原料ポイント値の正本としては扱わない
- 数値仕様が必要な場合は、必ず`deep-research-report-ver.1.1`、 `deep-research-report.md`、`docs/SURVEY_SCORING_LOGIC.md`、`docs/MATERIAL_POINTS.md` を参照する
- 現行コードが仕様書と異なる場合は、原則としてコード側が未追従とみなす

## システムの到達目標

- 顧客側は現状のフロント導線を大きく崩さず使えること
- 顧客側の保存・取得は Supabase を主経路とし、取得失敗時でも `sessionStorage` や demo data で画面遷移が止まらないこと
- 店舗スタッフが IT に強くなくても、予約枠作成、予約確認、来店前準備、ワークショップ結果登録、レシピ登録まで扱えること
- 店舗管理者が、スタッフ権限、基剤、原料、将来のテンプレート拡張を管理できること
- バックエンドは Supabase を使用すること
- 再注文時に過去レシピと五軸グラフを参照でき、蓄積結果を将来のおすすめテンプレートへ反映できること

## 現行サイト構成

- 顧客向け入口は `index.html`
- 顧客向けページは `customer/` 配下に置く
  - `customer/questionnaire.html`
  - `customer/questionnaire_step2.html`
  - `customer/fragrance-graph.html`
  - `customer/reservation.html`
  - `customer/reservation-complete.html`
  - `customer/product-reservation.html`
- スタッフ / 管理者の共通ログインは `admin-login.html`
- スタッフ向けページは `staff/` 配下に置く
  - `staff/staff-dashboard.html`
  - `staff/staff-customer-detail.html`
  - `staff/staff-slots.html`
  - `staff/staff-reservations.html`
- 管理者向けページは `admin/` 配下に置く
  - `admin/admin-dashboard.html`
  - `admin/admin-settings.html`
  - `admin/admin-scoring.html`
  - `admin/admin-materials.html`
- `admin-login.html` はスタッフ / 管理者専用のため、フッターに小さく導線を置く方針へ変更する
- スタイル管理は現段階では各HTML内のインラインスタイルを正とし、共通CSS整理は将来対応とする

### 追加予定:

- customer/login.html
- customer/index.html
- customer/shipping-info.html
- admin/admin-qr-settings.html

## 役割

### A. 顧客側

- 現状の FrontPage 群をそのまま使う
- 対象ページ
  - `index.html`
  - `customer/questionnaire.html`
  - `customer/questionnaire_step2.html`
  - `customer/fragrance-graph.html`
  - `customer/reservation.html`
  - `customer/reservation-complete.html`
  - `customer/product-reservation.html`
- 取得したい情報
  - アンケート回答
  - アンケート計算後の五軸
  - 予約時点で確定した五軸
  - 予約情報
  - 顧客識別用の `customer_id`
- 顧客向けページのデータ取得 / 保存は、Supabase を優先しつつ `sessionStorage` フォールバックを持つ

### B. 店舗スタッフ側

- 共通ログインページ `admin-login.html` から入る
- 現行の対象ページ
  - `staff/staff-dashboard.html`
  - `staff/staff-reservations.html`
  - `staff/staff-slots.html`
  - `staff/staff-customer-detail.html`
- 出勤シフトに応じた予約枠作成
- 予約状況確認
- 来店前の顧客情報確認
  - 予約情報
  - 事前アンケート回答
  - 五軸グラフ
- 店舗での対話後に確定した最終五軸グラフの入力
- 商品作成時のレシピ登録
  - 基剤
  - 原料
  - 各割合
  - ロット
  - 商品種

### C. 店舗管理者側

- 共通ログインページ `admin-login.html` から入る
- 現行の対象ページ
  - `admin/admin-dashboard.html`
  - `admin/admin-settings.html`
  - `admin/admin-scoring.html`
  - `admin/admin-materials.html`
- 管理者画面への登録権限 / 編集
- 店舗スタッフ権限の登録 / 編集
- 基剤登録 / 編集
- 原料登録 / 編集
- 将来のおすすめテンプレート管理

## 管理画面の考え方

- UI 上は「店舗スタッフ向け機能」と「店舗管理者向け機能」を分ける
- ただしログイン導線は共通管理ログインでよい
- ファイル配置は `staff/` と `admin/` を分け、共通ログインのみルートの `admin-login.html` に置く
- 権限はロールで分ける
  - `staff`
  - `admin`

## Supabase で扱う情報

- 公開ページは Supabase を主経路として利用する
- ただし中間ページ直開きや一時的な取得失敗に備え、`sessionStorage` や demo data のフォールバックを併用する

### 顧客・予約・結果

- `customer_id`
- 予約情報
- 事前アンケート回答
- 五軸グラフ
  - アンケート計算直後
  - 予約時点
  - 店舗調整後の最終値
- スタッフメモ
- 再注文履歴

### レシピ

- 店舗で確定した五軸グラフ
- 使用した基剤
- 使用した原料
- 各割合
- ロット
- 商品種
- 五軸との紐付け

### マスタ

- 原料マスタ
- 将来のおすすめテンプレート候補
- スタッフ / 管理者権限

## 原料の扱い


- 数値管理は「単位量あたり五軸へ与える値」で扱う

## 最終成果物の定義

- 店舗スタッフが迷わず使える粒度のページ構成
- Supabase を用いたバックエンド
- スタッフがシフトに応じて予約枠を作成できること
- 予約状況や事前アンケートを見て来店前準備ができること
- ワークショップで出来上がった内容を登録できること
- レシピと五軸グラフの紐付け粒度を高く保てること
- 再注文実績が増えたものを将来のフロントおすすめテンプレートに追加できること
- QR コードは商品の作成依頼ページと紐づき、顧客の顧客からの注文を受けれること

### QRコード導線

- QRコードの初期実装の遷移先は、`customer/product-reservation.html` とする
- `customer/product-reservation.html` は、QR経由の第三者が会員登録なしで商品作成依頼を行うページとして扱う
- QRコードは会員本人ではなく、ワークショップで完成した香水に紐づける
- QR商品導線は、会員導線とは分けて扱う

## ページリニューアル時の保持・破棄方針

- 捨ててよいもの:
  - 既存ページの見た目用HTML構造
  - 過剰に重なったCSS
  - 表示都合だけのJS
- 残すべきもの:
  - Supabase接続
  - 認証
  - RLS前提のデータ関数
  - アンケート配点ロジック
  - `sessionStorage` の契約
  - 既存DOM IDのうちDB連携JSが参照するもの
- 補足:
  - `レイアウトimg/` を完成イメージの正として、ページ単位で新しい薄いHTML/CSSへ置き換える。
  - 新ページでDB連携が維持できることを確認した後、旧HTML/CSS/表示都合JSを `archived/legacy/` へ退避する。

## 2026-05-03 会員比較モードのページ分離方針

- 通常結果ページは `customer/fragrance-graph.html` とし、今回のアンケート結果の表示・5軸調整・予約への受け渡しを担当する。
- 会員比較モードは `customer/fragrance-compare.html` とし、会員ログイン済みで前回完成品の5軸データがある場合に、前回完成品と今回アンケート結果を比較するページとして扱う。
- 通常結果ページに `mode=compare` のような状態を混在させず、ページを分けることで通常結果、未回答テンプレート、会員比較の責務を分離する。
- 会員ページの比較導線は `customer/fragrance-compare.html` に向ける。
- アンケート完了時は、会員ログイン済みかつ比較可能な前回完成品データがある場合のみ `customer/fragrance-compare.html` へ遷移し、それ以外は `customer/fragrance-graph.html` へ遷移する。
- レーダー描画、5軸名称、予約へ渡す `sessionStorage` の契約は通常結果ページと共通の考え方を使う。
- 2026-05-03追記: 会員比較ページは右側の固定コメントカードを置かず、詳細説明は下部の「詳細を確認する」ボタンから開くモーダルに表示する。
- 2026-05-03追記: 会員比較ページの下部アクションには「この香りで予約する」「通常結果ページへ戻る」「詳細を確認する」を並べる。
- 2026-05-03追記: 会員比較ページでは今回結果の5軸をスライダーで調整でき、調整値は通常結果・予約へ渡す値に反映する。
