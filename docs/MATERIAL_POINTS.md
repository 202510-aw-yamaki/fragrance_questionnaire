# MATERIAL_POINTS

## 2026-05-04 追記: 配合調整モーダルの5軸表示

- `staff/staff-customer-detail.html` の事前配合調整 / 配合調整モーダルでは、アンケート結果の5軸と配合による5軸を並列表示する。
- 原料選択、割合の数値入力、割合スライダー操作のいずれでも、配合による5軸をリアルタイムに再計算して表示する。
- 配合による5軸は原料ポイントの素点をそのまま表示せず、アンケート結果の5軸と比較しやすい見え方になるよう表示補正を通した値を使う。

本書は `docs/archive/research/deep-research-report.md` を基準に、材料マスタと初期原料プロファイルを定義する仕様書です。

## 基本方針

- 基剤と原料は、DB 上は共通マスタ `material_points` で管理し、`material_type` に `base` / `ingredient` を持たせる方針を正とする
- UI 上は「基剤管理」と「原料管理」を分けてよい
- 数値は「単位量あたり五軸へ与える値」で持つ
- 入力 UI はスピンボタンで微調整できる形を基本とする

## 現行画面との対応

- 管理者向けの原料ポイント編集画面は `admin/admin-materials.html`
- 管理者ダッシュボードからの導線元は `admin/admin-dashboard.html`
- 管理導線の入口は `admin-login.html` であり、現状は `index.html` から直接リンクしない
- スタイル管理は各HTML内のインラインスタイルを正とし、共通CSS整理は将来対応とする

## 管理対象項目

- `material_type`
- `material_name`
- `material_id`
- `product_type`
- `lot`
- `unit_label`
- `point_axes_per_unit`
- `template_tags`
- `note`
- `is_active`
- `sort_order`

## `point_axes_per_unit`

`point_axes_per_unit` は次の 5 軸を持つ。

- `floral`
- `fresh`
- `woody`
- `spicy`
- `sweet`

## マスタの扱い

### 基剤

- 基剤名
- 基剤 ID
- 商品種
- ロット
- 香りゲージに与える数値 / 料単位
- テンプレート種類

### 原料

- 原料名
- 原料 ID
- 商品種
- ロット
- 香りゲージに与える数値 / 料単位
- テンプレート種類

## 初期原料プロファイル

以下は `docs/archive/research/deep-research-report.md` の 16 原料プロファイルを、そのまま初期値として採用したものです。
これは現段階の正本であり、将来の校正前提の初期値です。

```json
{
  "ingredientProfiles": {
    "bergamot":   {"floral": 10, "fresh": 60, "woody": 15, "spicy": 10, "sweet": 5},
    "lemon":      {"floral": 2,  "fresh": 78, "woody": 5,  "spicy": 5,  "sweet": 10},
    "grapefruit": {"floral": 5,  "fresh": 70, "woody": 5,  "spicy": 5,  "sweet": 15},
    "lavender":   {"floral": 35, "fresh": 25, "woody": 15, "spicy": 15, "sweet": 10},
    "muguet":     {"floral": 55, "fresh": 25, "woody": 5,  "spicy": 5,  "sweet": 10},
    "damaskRose": {"floral": 60, "fresh": 10, "woody": 5,  "spicy": 5,  "sweet": 20},
    "assamTea":   {"floral": 10, "fresh": 25, "woody": 35, "spicy": 20, "sweet": 10},
    "cassis":     {"floral": 5,  "fresh": 25, "woody": 5,  "spicy": 15, "sweet": 50},
    "magnolia":   {"floral": 55, "fresh": 15, "woody": 10, "spicy": 10, "sweet": 10},
    "musk":       {"floral": 10, "fresh": 25, "woody": 10, "spicy": 5,  "sweet": 50},
    "amber":      {"floral": 5,  "fresh": 15, "woody": 35, "spicy": 20, "sweet": 25},
    "sandalwood": {"floral": 5,  "fresh": 5,  "woody": 55, "spicy": 10, "sweet": 25},
    "squash":     {"floral": 10, "fresh": 65, "woody": 3,  "spicy": 2,  "sweet": 20},
    "seaBlue":    {"floral": 10, "fresh": 75, "woody": 5,  "spicy": 5,  "sweet": 5},
    "hibiscus":   {"floral": 50, "fresh": 15, "woody": 5,  "spicy": 5,  "sweet": 25},
    "coconutRum": {"floral": 5,  "fresh": 10, "woody": 15, "spicy": 10, "sweet": 60}
  }
}
```

## レシピとの紐付け方針

- 最終五軸グラフと、基剤 / 原料 / 割合 / ロットを 1 セットで保存する
- レシピは再注文時に参照できること
- 将来は、再注文が増えたレシピや五軸傾向をおすすめテンプレート化できる構造にする

## 運用メモ

- 同名の基剤や原料でも、ロット差や仕入先差で香り傾向は変わり得る
- 初期値は固定真値ではなく、将来の校正前提で扱う
- 基剤の初期テンプレート値は、店舗で扱う商品種に応じて今後追加していく

## 追記: 2026-04-19 原料管理画面 / 登録モーダル要件

この追記は `docs/assets/layout-reference/` 配下の原料ポイント編集ページ画像と関連モーダル画像の確認を受けて、原料管理 UI の固定要件を補足するために追加する。

### 原料管理画面

- 保存先は DB を基本としつつ、ローカル保存用 JSON の書き出しと JSON 読込も扱えること
- 2026-04-25 追記: ページ表示時に既存 DB 行がない場合は 16 原料テンプレートを読み込み、上部の「16原料テンプレートを一括反映」ボタンは DB 保存ボタンへ置き換える
- 2026-04-25 追記: `Json メモ` は JSON 本文の表示 / 入力欄ではなく、非エンジニアが保存データの時期や補足を残すメモ欄として扱う
- 並び替えは「登録順 正 / 逆」「50音順 正 / 逆」「ノート順 正 / 逆」を持つ
- ノート順の正順は `Top -> Middle -> Last` とし、逆順はその反転とする
- 50音順は「清音 -> 濁音 -> 半濁音」を正とし、小文字は大文字と同じ扱いで比較する
- 新規登録ボタンで新規原料登録モーダルを開き、編集ボタンでは対象原料の保存済みデータを読み込んだ同モーダルを開く
- 管理スタッフ確認ページ `admin/admin-dashboard.html` から遷移した原料名に応じて、原料ポイントページ内の対象原料へ自動スクロールできること

### 新規原料登録モーダル

- 先頭項目の UI ラベルは「管理コード」ではなく「管理名」を正とする
- 管理名には英語名を入力し、50 音順並び替えの補助キーとして使う
- 表示名は原料ポイントページ上のボタン表示に使い、8 文字以内が望ましい旨を案内文として表示する
- 分類はプルダウンで `Top` / `Middle` / `Last` を選択する
- 5 軸ポイントの合計が 100 でない場合は保存できない
- 運用メモは、原料ポイントページ上で表示する短文を保存できること

## 追記: 2026-04-28 Phase 2 保存失敗時の扱い

ユーザー要望により、Markdown / PPTX 資料の実装順序に戻して Phase 2 の安定化を進める。

今回の実装では、`admin/admin-materials.html` の原料ポイント保存で DB 保存に失敗した場合、成功表示へ進まずエラー表示で止めるようにした。

- JSON 取込時の `material_points` upsert 失敗は、取込完了扱いにしない
- 新規作成 / 編集モーダルの `insert` / `update` 失敗は、モーダルを閉じずエラー表示で止める
- 5軸合計100チェックは既存どおり保存前に行う

## 追記: 2026-05-06 おすすめ配合候補の生成ルール

ユーザー要望により、原料単体ランキングと固定比率ではなく、原料ポイントを使った3原料レシピ探索をおすすめ配合の正とする。

- 対象原料は `material_points.is_active = true` の原料のみ
- 1レシピは3原料固定
- 各原料の比率は5%以上、5%刻み、合計100%
- `raw_recipe_axes` は `sum(material.point_axes[axis] * ratio)` で算出する
- `raw_recipe_axes` とアンケート5軸は、比較前に `normalizeAxesToProfile()` で同じ100合計スケールへ合わせる
- 最小距離の1件のみをスタッフ画面のおすすめ配合として扱う
- 同距離の場合は原料の `sort_order` / `material_code` と比率シグネチャにより決定的に1件へ寄せる
- 全回答パターンの事前生成は `scripts/precompute-recommendation-cache.js` を使い、保存先は `recommendation_recipe_cache` とする
