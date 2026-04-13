# MATERIAL_POINTS

本書は `deep-research-report.md` を基準に、材料マスタと初期原料プロファイルを定義する仕様書です。

## 基本方針

- 基剤と原料は、DB 上は共通マスタ `material_points` で管理し、`material_type` に `base` / `ingredient` を持たせる方針を正とする
- UI 上は「基剤管理」と「原料管理」を分けてよい
- 数値は「単位量あたり五軸へ与える値」で持つ
- 入力 UI はスピンボタンで微調整できる形を基本とする

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

以下は `deep-research-report.md` の 16 原料プロファイルを、そのまま初期値として採用したものです。  
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
