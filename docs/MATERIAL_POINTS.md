# MATERIAL_POINTS

本書は `deep-research-report.md` の原料プロファイル案と、`Supabase 前提の静的HTMLアプリへ移行.md` の `material_points` テーブル定義を再編したものです。

## この文書で正とする範囲

- 本書は `material_points` の初期テンプレートと将来拡張の前提を定義する
- 本書の値は、現行のアンケート配点ロジックそのものを決める主データではない
- 公開導線の現在挙動に差分がある場合は、`SURVEY_SCORING_LOGIC.md` と実装コードを優先する

## 現在の位置づけ

- `material_points` は将来の提案ロジック拡張用の基礎データ
- 現段階では管理画面 `admin-materials.html` から CRUD できることを主目的とする
- 公開導線ではまだ原料推薦や自動ブレンド計算に直結していない

## `material_points` テーブルの想定

- `material_code`
- `material_name`
- `category`
- `point_axes`
- `note`
- `is_active`
- `sort_order`

`point_axes` は次の 5 軸を持つ。

- `floral`
- `fresh`
- `woody`
- `spicy`
- `sweet`

## 初期原料プロファイル案

以下は研究メモから移した初期値であり、将来の提案ロジックや校正対象のベースとする。

```json
{
  "ingredientProfiles": {
    "bergamot":   {"floral": 10, "fresh": 60, "woody": 15, "spicy": 10, "sweet": 5},
    "lemon":      {"floral": 2, "fresh": 78, "woody": 5, "spicy": 5, "sweet": 10},
    "grapefruit": {"floral": 5, "fresh": 70, "woody": 5, "spicy": 5, "sweet": 15},
    "lavender":   {"floral": 35, "fresh": 25, "woody": 15, "spicy": 15, "sweet": 10},
    "muguet":     {"floral": 55, "fresh": 25, "woody": 5, "spicy": 5, "sweet": 10},
    "damaskRose": {"floral": 60, "fresh": 10, "woody": 5, "spicy": 5, "sweet": 20},
    "assamTea":   {"floral": 10, "fresh": 25, "woody": 35, "spicy": 20, "sweet": 10},
    "cassis":     {"floral": 5, "fresh": 25, "woody": 5, "spicy": 15, "sweet": 50},
    "magnolia":   {"floral": 55, "fresh": 15, "woody": 10, "spicy": 10, "sweet": 10},
    "musk":       {"floral": 10, "fresh": 25, "woody": 10, "spicy": 5, "sweet": 50},
    "amber":      {"floral": 5, "fresh": 15, "woody": 35, "spicy": 20, "sweet": 25},
    "sandalwood": {"floral": 5, "fresh": 5, "woody": 55, "spicy": 10, "sweet": 25},
    "squash":     {"floral": 10, "fresh": 65, "woody": 3, "spicy": 2, "sweet": 20},
    "seaBlue":    {"floral": 10, "fresh": 75, "woody": 5, "spicy": 5, "sweet": 5},
    "hibiscus":   {"floral": 50, "fresh": 15, "woody": 5, "spicy": 5, "sweet": 25},
    "coconutRum": {"floral": 5, "fresh": 10, "woody": 15, "spicy": 10, "sweet": 60}
  }
}
```

## 運用メモ

- 同名原料でも精油、アコード、仕入先差で香りは変わるため、固定真値として扱わない
- 研究値は「初期パラメータ」として保持し、実運用後に見直せる前提にする
- 原料推薦ロジック、Top/Middle/Last のブレンド探索、比率最適化は今後の拡張範囲
