# Implementation Roadmap

## Purpose

このファイルは、現在これから実施する作業だけを示す短いロードマップです。

過去の長いロードマップは、完了済み・一部完了済み・古い前提が混在して作業ノイズになるため、以下に退避しました。

`docs/archive/20260501_05_IMPLEMENTATION_ROADMAP_archive.md`

通常作業ではこのファイルを優先し、過去の詳細経緯が必要な場合だけ archive を参照します。

## 現在の正本

- `AGENTS.md`
- `docs/00_PROJECT_CORE.md`
- `docs/01_CURRENT_STATE.md`
- `docs/02_TARGET_ARCHITECTURE.md`
- `docs/03_DB_DESIGN_POLICY.md`
- `docs/04_QR_PRODUCT_FLOW.md`
- `docs/05_IMPLEMENTATION_ROADMAP.md`
- `docs/06_OPEN_ISSUES.md`
- `docs/UI_REBUILD_PLAN.md`

UI再構築については `docs/UI_REBUILD_PLAN.md` を作業計画の正本として扱います。

## 現在の最優先作業

### 1. ページレイアウト再構築

目的は、既存レイアウトの混在を解消し、`レイアウトimg` の参照画像を基準に全ページの表示層を作り直すことです。

実施内容:

- 現行ページを `archived/layout-rebuild-20260501/` に退避する。
- Supabase接続、認証、RPC、DB保存に関わるファイルは退避しない。
- HTML/CSSは参照画像を単に貼り付けず、パーツ単位で再構築する。
- 必要な画像素材は既存素材または生成素材を使う。
- ページ内に、実装メモ、クライアント説明用注釈、後続フェーズ説明を表示しない。

### 2. Supabase接続契約の維持

UI再構築中も、既存JSが参照しているID、name属性、data属性、script順、DB操作入口を壊さない。

維持対象の中心:

- `js/supabase-config.js`
- `js/supabase-client.js`
- `js/public-data.js`
- `js/admin-data.js`
- `js/admin-auth.js`
- `js/fragrance-master-data.js`
- `supabase/`

### 3. 顧客ページ再構築

対象:

- `index.html`
- `customer/customer-login.html`
- `customer/index.html`
- `customer/questionnaire.html`
- `customer/questionnaire_step2.html`
- `customer/fragrance-graph.html`
- `customer/reservation.html`
- `customer/reservation-complete.html`
- `customer/product-reservation.html`

`customer/shipping-info.html` は参照画像があるが、発送先入力フローが未確定のため、勝手に実装しない。

### 4. スタッフページ再構築

対象:

- `staff/staff-dashboard.html`
- `staff/staff-reservations.html`
- `staff/staff-slots.html`
- `staff/staff-customer-detail.html`
- `staff/staff-qr-requests.html`

QR作成可否判断、発送先入力、発送完了、通知対応済み操作は、UI再構築とは別タスクとして扱う。

### 5. 管理者ページ再構築

対象:

- `admin-login.html`
- `admin/admin-dashboard.html`
- `admin/admin-settings.html`
- `admin/admin-scoring.html`
- `admin/admin-materials.html`
- `admin/admin-qr-requests.html`

`admin/admin-qr-settings.html` は参照画像があるが、現行では `admin/admin-settings.html` のQR設定と役割が重なるため、分離するかどうかを確認してから扱う。

### 6. ブラウザ確認

再構築後に、主要ページをブラウザで確認する。

確認対象:

- 参照画像との大きな乖離がないこと
- テキストやUIが重ならないこと
- モバイル幅で破綻しないこと
- Supabase未設定時のエラー表示が崩れないこと
- ログイン、アンケート、予約、QR依頼、管理画面の主要導線が壊れていないこと

## 未確定のため実装しない項目

以下は `docs/06_OPEN_ISSUES.md` の確認対象であり、ユーザー確認なしに実装しない。

- 外部決済
- 送料の自動計算
- 同意文バージョン管理
- QR商品の再有効化
- 大量注文専用フォーム
- 会員ページの差分表示ロジック
- スタッフ成果指標の確定集計
- QR依頼の個人情報保持・削除・匿名化運用
- 発送先入力ページ
- QR商品設定ページの独立

## Markdown整理方針

完了済み、または一部完了済みで現行判断のノイズになるMarkdownは、削除せず `docs/archive/` に退避する。

同じパスに残すMarkdownは、現在しなければいけない作業だけを短く記載する。

仕様変更を書く場合は、元記述を消すのではなく、archiveに退避したうえで現行正本側に現在の判断を追記する。

## チェックリスト

- [ ] 現行ページを退避する
- [ ] 共通UI土台を作る
- [ ] 顧客ページを再構築する
- [ ] スタッフページを再構築する
- [ ] 管理者ページを再構築する
- [ ] 主要ページをブラウザで確認する
- [ ] UI再構築後に `docs/01_CURRENT_STATE.md` と `docs/UI_REBUILD_PLAN.md` を更新する

