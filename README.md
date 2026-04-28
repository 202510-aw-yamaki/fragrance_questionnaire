# fragrance_questionnaire

香りワークショップ向けの、アンケート・予約・スタッフ管理・管理者設定・QR商品導線を扱う静的HTMLベースの試作リポジトリです。

このリポジトリでは、まずアンケート・スコアリングロジック・DB保存・スタッフ運用を安定させることを優先します。  
その上で、ワークショップで完成した香水をQR商品として第三者が作成依頼できる導線を追加していきます。

---

## 現在の位置づけ

現時点では、以下を中心に整理・実装しています。

- アンケート回答
- 香り5軸の算出
- 来店予約
- スタッフ画面での予約者確認
- 管理者画面でのロジック調整
- 原料ポイント調整
- Supabase連携
- 今後のQR商品導線に向けた設計整理

このREADMEは概要のみを扱います。  
詳細な仕様・設計・実装順序は `docs/` 配下の設計資料を参照してください。

---

## 重要な設計資料

作業前に、以下を確認してください。

- `AGENTS.md`
  - Codex向けの作業ルール
  - 文字化け対応、修正方針、参照すべき設計資料の優先順位

- `docs/00_PROJECT_CORE.md`
  - プロジェクトの芯

- `docs/01_CURRENT_STATE.md`
  - 現在の実装状況と課題

- `docs/02_TARGET_ARCHITECTURE.md`
  - 目指す全体構造

- `docs/03_DB_DESIGN_POLICY.md`
  - DB設計方針

- `docs/04_QR_PRODUCT_FLOW.md`
  - QR商品作成依頼導線

- `docs/05_IMPLEMENTATION_ROADMAP.md`
  - 実装順序

- `docs/06_OPEN_ISSUES.md`
  - 未確定事項・将来検討事項

- `docs/presentation/fragrance_questionnaire_architecture_v5.pptx`
  - 全体構想をまとめたPPTX資料

- `レイアウトimg`フォルダ`
  - サイトマップ及びＤＢ関係図、ホームページレイアウトのイメージ画像

- `presentation\fragrance_image_explanations_v1.pptx`
  - 上記イメージ画像の説明PPTX資料

---

## 現在の主なページ

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

---

## 現在の主要課題

詳細は `docs/01_CURRENT_STATE.md` を参照してください。

主な課題は以下です。

- 会員登録のDB接続が未完了
- 会員ページから再予約した際、前回完成品との差分表示がない
- 商品予約ページが未作成
- QR商品価格設定が管理者画面にない
- スタッフ自動ログインと管理者ログインの整理が必要
- `staff-customer-detail.html` に商品名入力・個人情報同意・第三者作成同意が未整備
- QRコードと完成品データの紐づけを明確にする必要がある

---

## Supabase設定

Supabaseを利用する場合は、以下を設定します。

- `js/supabase-config.js`
  - `url`
  - `anonKey`

DBスキーマは以下を参照してください。

```text
supabase/schema.sql
```

client側では anon key のみを使用し、service role key は使用しません。

---

## 実装時の注意

- UIだけを先に作らない
- DB・認証・状態管理を優先する
- QR商品導線と会員導線を混ぜない
- QR経由の第三者を会員DBに入れない
- QRコードは完成品に紐づける
- 未確定事項は `docs/06_OPEN_ISSUES.md` を確認し、勝手に仕様化しない
- 大きな仕様変更や全体置換は、作業前に確認する

---

## 詳細仕様について

READMEには詳細仕様を載せません。

詳細は以下に分けて管理します。

```text
docs/00_PROJECT_CORE.md
docs/01_CURRENT_STATE.md
docs/02_TARGET_ARCHITECTURE.md
docs/03_DB_DESIGN_POLICY.md
docs/04_QR_PRODUCT_FLOW.md
docs/05_IMPLEMENTATION_ROADMAP.md
docs/06_OPEN_ISSUES.md
```

READMEは、リポジトリ全体の入口として扱います。