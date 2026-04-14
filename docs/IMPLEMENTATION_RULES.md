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

## 顧客側 UI ルール

- 現在の FrontPage 群の見た目と導線を大きく崩さない
- 公開ページは匿名利用前提でよい
- 顧客が入力した回答や五軸は、後続の予約と店舗対応に引き継げること

## 店舗スタッフ / 管理者 UI ルール

- IT リテラシーが高くなくても使える粒度にする
- JSON 直接編集を前提にしない
- 数値調整はスピンボタンや明示的な入力欄で扱う
- 必要なページは役割単位で明確に分ける
- ボタン名称と入力項目名は業務用語に寄せる

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
- 再注文やおすすめテンプレート拡張に備えて、顧客、五軸、レシピ、材料構成の紐付けを残す
- 将来の推薦ロジック追加を前提に、五軸とレシピを再利用しやすい粒度で保存する

## 追記: UI 調整の合意必須ルール

- レイアウト調整、導線整理、非エンジニア向けの操作しやすさ改善は、実装候補をこちらだけで確定しない
- 上記の UI / UX 調整は `UNMET_REQUIREMENTS.md` に未達として残し、ユーザーと画面を見ながら詰める前提で扱う
- ユーザーの確認と承諾があるまでは、見た目や操作フローを勝手に進めない
- このルールは、2026-04-14 の「レイアウト調整や非エンジニアにもわかりやすいUI部分は未達として扱い、勝手に進めないことを明記したい」という要望に基づく追記である