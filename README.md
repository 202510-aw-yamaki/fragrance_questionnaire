# Fragrance Workshop

香りワークショップ向けの、アンケート・予約・会員ページ・スタッフ運用・管理者設定をまとめたWebアプリです。

お客様はアンケートから香りの傾向を確認し、ワークショップ予約へ進めます。スタッフは予約・顧客詳細・QR商品作成依頼を確認でき、管理者は配点ロジック、原料ポイント、予約枠、QR設定を管理できます。

## 主な入口

- `index.html`: お客様向けトップページ
- `customer/questionnaire.html`: 香りアンケート
- `customer/reservation.html`: 来店予約
- `customer/customer-login.html`: 会員ログイン
- `customer/index.html`: 会員マイページ
- `admin/login.html`: スタッフ・管理者ログイン
- `staff/staff-dashboard.html`: スタッフダッシュボード
- `admin/admin-dashboard.html`: 管理者ダッシュボード

## フォルダ構成

```text
index.html
README.md
AGENTS.md
customer/        お客様向けページ
staff/           スタッフ向けページ
admin/           管理者向けページとログイン
assets/
  css/           画面スタイル
  js/            画面制御・Supabase連携
  img/           画像素材
docs/            仕様・運用設計資料
scripts/         運用補助スクリプト
supabase/        DBスキーマ・マイグレーション
```

## 設定が必要なファイル

Supabaseを接続する場合は、次のファイルを環境に合わせて設定します。

```text
assets/js/supabase-config.js
```

DB構成は次を参照してください。

```text
supabase/schema.sql
supabase/migrations/
```

## 確認方法

ローカルサーバーでリポジトリのルートを配信し、ブラウザで `index.html` を開いてください。

主要確認ページ:

- `index.html`
- `customer/questionnaire.html`
- `customer/questionnaire_step2.html`
- `customer/index.html`
- `customer/product-reservation.html`
- `admin/login.html`
- `admin/admin-scoring.html`
- `staff/staff-dashboard.html`

## 補足

- `AGENTS.md` は作業者向けの実装ルールです。公開用整理後も、運用上の判断基準として残しています。
- 仕様の詳細は `docs/` 配下を参照してください。
- Supabaseの `service role key` はブラウザ側に置かず、クライアント側では anon key のみを使用します。
