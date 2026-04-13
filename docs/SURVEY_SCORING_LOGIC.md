# SURVEY_SCORING_LOGIC

本書は `ロジック実装.md` の配点仕様と `deep-research-report.md` の考え方を、現行実装に合わせて整理したものです。数値は現在の `questionnaire.html` 実装値を基準に固定します。

## この文書で正とする範囲

- 本書の数値は「現行 fallback 配点仕様」を固定する
- 公開ページの実行時最新値は active `scoring_configs` を正とする
- active `scoring_configs` が取得できない場合のみ、本書記載の値と `questionnaire.html` の `MASTER_SCORING_CONFIG` を正とする
- `deep-research-report.md` 側の数値案と差がある場合は、現行実装値を優先する

## 基本ルール

- 軸は `floral` / `fresh` / `woody` / `spicy` / `sweet`
- 初期値は全軸 `50`
- weight は `STEP1 = 1`、`STEP2 = 2`、`Q8 = 3`
- Q8 の後に `finishTemplates` を `0.25` ブレンドする
- 全軸は演算のたびに clamp する

## STEP1

```json
{
  "step1PrimaryAxes": {
    "Q1": ["floral", "fresh", "woody"],
    "Q2": ["floral", "fresh", "woody"],
    "Q3": ["floral", "fresh", "woody"],
    "Q4": ["floral", "fresh", "woody"],
    "Q5": ["floral", "fresh", "woody"]
  },
  "step1ScoreMap": {
    "Q1": {
      "A": {"floral": 3, "fresh": 1, "woody": -1, "spicy": -2, "sweet": 1},
      "B": {"floral": 0, "fresh": 3, "woody": 0, "spicy": -1, "sweet": -2},
      "C": {"floral": -1, "fresh": -1, "woody": 3, "spicy": 1, "sweet": -1}
    },
    "Q2": {
      "A": {"floral": 2, "fresh": 0, "woody": -1, "spicy": -2, "sweet": 2},
      "B": {"floral": 0, "fresh": 3, "woody": -1, "spicy": -1, "sweet": -1},
      "C": {"floral": -1, "fresh": -1, "woody": 3, "spicy": 1, "sweet": 0}
    },
    "Q3": {
      "A": {"floral": 2, "fresh": 0, "woody": 0, "spicy": -2, "sweet": 2},
      "B": {"floral": -1, "fresh": 3, "woody": 0, "spicy": 0, "sweet": -2},
      "C": {"floral": 0, "fresh": -1, "woody": 2, "spicy": 2, "sweet": -1}
    },
    "Q4": {
      "A": {"floral": 2, "fresh": 1, "woody": -1, "spicy": -1, "sweet": 1},
      "B": {"floral": 0, "fresh": 3, "woody": 0, "spicy": -1, "sweet": -1},
      "C": {"floral": 0, "fresh": -2, "woody": 2, "spicy": 2, "sweet": 1}
    },
    "Q5": {
      "A": {"floral": 1, "fresh": 3, "woody": -1, "spicy": -1, "sweet": 0},
      "B": {"floral": 2, "fresh": 0, "woody": 1, "spicy": -1, "sweet": 2},
      "C": {"floral": 0, "fresh": -1, "woody": 3, "spicy": 1, "sweet": -1}
    }
  }
}
```

## `ALL` / `NONE`

- UI の `全部好き` は `ALL`
- UI の `この中にはない` は `NONE`
- 実装上は `applySubOptionAdjustment()` で処理する
- `ALL` は primary axes を均等に少し押し上げる
- `NONE` は primary axes を抑え、それ以外を相対的に押し上げる

## STEP2 分岐判定

```json
{
  "branchTemplates": {
    "floral": {"floral": 62, "fresh": 54, "woody": 42, "spicy": 34, "sweet": 58},
    "fresh": {"floral": 46, "fresh": 64, "woody": 44, "spicy": 36, "sweet": 40},
    "woody": {"floral": 44, "fresh": 42, "woody": 64, "spicy": 52, "sweet": 44}
  },
  "branchDistanceWeights": {
    "floral": 1.3,
    "fresh": 1.3,
    "woody": 1.3,
    "spicy": 0.7,
    "sweet": 0.7
  }
}
```

- STEP1 終了時の 5 軸と `branchTemplates` の距離で `floral` / `fresh` / `woody` を決める
- 距離計算は weighted Manhattan distance を使う
- tie-break は `floral -> fresh -> woody`

```text
distance =
abs(floralDiff) * 1.3 +
abs(freshDiff)  * 1.3 +
abs(woodyDiff)  * 1.3 +
abs(spicyDiff)  * 0.7 +
abs(sweetDiff)  * 0.7
```

## STEP2

```json
{
  "step2PrimaryAxes": {
    "floral": {
      "Q6": ["floral", "sweet", "fresh"],
      "Q7": ["floral", "sweet", "woody"]
    },
    "fresh": {
      "Q6": ["fresh", "floral", "spicy"],
      "Q7": ["fresh", "woody", "floral"]
    },
    "woody": {
      "Q6": ["woody", "spicy", "sweet"],
      "Q7": ["woody", "spicy", "fresh"]
    }
  },
  "step2ScoreMap": {
    "floral": {
      "Q6": {
        "A": {"floral": 3, "fresh": 1, "woody": 0, "spicy": -1, "sweet": 1},
        "B": {"floral": 2, "fresh": 0, "woody": -1, "spicy": -2, "sweet": 3},
        "C": {"floral": 1, "fresh": 0, "woody": 2, "spicy": 0, "sweet": -1}
      },
      "Q7": {
        "A": {"floral": 2, "fresh": 1, "woody": -1, "spicy": -1, "sweet": 2},
        "B": {"floral": 1, "fresh": 0, "woody": 1, "spicy": -1, "sweet": 3},
        "C": {"floral": 1, "fresh": 1, "woody": 2, "spicy": 0, "sweet": -3}
      }
    },
    "fresh": {
      "Q6": {
        "A": {"floral": 0, "fresh": 3, "woody": -1, "spicy": -2, "sweet": -1},
        "B": {"floral": 0, "fresh": 3, "woody": 0, "spicy": -1, "sweet": -1},
        "C": {"floral": -1, "fresh": 2, "woody": 0, "spicy": 2, "sweet": -2}
      },
      "Q7": {
        "A": {"floral": -1, "fresh": 3, "woody": 0, "spicy": 0, "sweet": -2},
        "B": {"floral": 1, "fresh": 2, "woody": 1, "spicy": -1, "sweet": 0},
        "C": {"floral": 0, "fresh": 1, "woody": 2, "spicy": 0, "sweet": 1}
      }
    },
    "woody": {
      "Q6": {
        "A": {"floral": 0, "fresh": -1, "woody": 3, "spicy": 1, "sweet": 1},
        "B": {"floral": -1, "fresh": 0, "woody": 3, "spicy": 0, "sweet": -1},
        "C": {"floral": -1, "fresh": 0, "woody": 1, "spicy": 3, "sweet": -1}
      },
      "Q7": {
        "A": {"floral": 0, "fresh": 2, "woody": 1, "spicy": -1, "sweet": -1},
        "B": {"floral": 0, "fresh": 0, "woody": 2, "spicy": 1, "sweet": 0},
        "C": {"floral": -1, "fresh": -2, "woody": 2, "spicy": 2, "sweet": 1}
      }
    }
  }
}
```

## Q8 と仕上げ補正

```json
{
  "q8PrimaryAxes": ["fresh", "floral", "woody"],
  "q8ScoreMap": {
    "A": {"floral": 0, "fresh": 3, "woody": -2, "spicy": -2, "sweet": -1},
    "B": {"floral": 2, "fresh": 1, "woody": 0, "spicy": -2, "sweet": 2},
    "C": {"floral": 1, "fresh": -2, "woody": 2, "spicy": 3, "sweet": 1}
  },
  "finishKeyByAnswer": {
    "A": "light",
    "B": "balanced",
    "C": "strong",
    "ALL": "balanced",
    "NONE": "balanced"
  },
  "finishTemplates": {
    "light": {"floral": 62, "fresh": 72, "woody": 34, "spicy": 22, "sweet": 38},
    "balanced": {"floral": 68, "fresh": 58, "woody": 48, "spicy": 34, "sweet": 50},
    "strong": {"floral": 70, "fresh": 42, "woody": 58, "spicy": 52, "sweet": 57}
  },
  "finishBlendRatio": 0.25
}
```

```text
finalAfterQ8Delta = apply weighted delta
finalAxes = blendAxes(finalAfterQ8Delta, finishTemplate, 0.25)
axis = round(base * 0.75 + template * 0.25)
```

## graph 用 preset

```json
{
  "graphPresets": {
    "light": {"floral": 62, "fresh": 72, "woody": 34, "spicy": 22, "sweet": 38},
    "balanced": {"floral": 68, "fresh": 58, "woody": 48, "spicy": 34, "sweet": 50},
    "strong": {"floral": 70, "fresh": 42, "woody": 58, "spicy": 52, "sweet": 57}
  }
}
```

## summaryProfiles

`questionnaire_step2.html`、`fragrance-graph.html`、`reservation.html` は、最終 5 軸と `summaryProfiles` の距離を比較し、最も近い profile を使って要約文を決める。

```json
{
  "summaryProfiles": {
    "floral_soft": {
      "axes": {"floral": 74, "fresh": 54, "woody": 42, "spicy": 26, "sweet": 62},
      "headline": "やわらかな華やかさが主役の方向",
      "body": "花のやわらかさを中心に、甘さと親しみやすさが自然に残るバランスです。当日は軽さを見ながら、華やかさを少しずつ整えていく進め方が合います。"
    },
    "fresh_clear": {
      "axes": {"floral": 50, "fresh": 76, "woody": 38, "spicy": 24, "sweet": 36},
      "headline": "透明感と清潔感を主軸にした方向",
      "body": "みずみずしい抜け感と清潔感が中心です。重くしすぎず、必要に応じて花や木のニュアンスをあとから足していくとまとまりやすいです。"
    },
    "woody_deep": {
      "axes": {"floral": 44, "fresh": 40, "woody": 72, "spicy": 54, "sweet": 42},
      "headline": "落ち着きと深みを静かに残す方向",
      "body": "木の落ち着きや余韻の深さが主役です。当日は重たくなりすぎないよう、透明感ややわらかさを会話しながら重ねていく進め方が向いています。"
    },
    "light_airy": {
      "axes": {"floral": 62, "fresh": 72, "woody": 34, "spicy": 22, "sweet": 38},
      "headline": "軽やかさを優先してまとめる方向",
      "body": "抜け感と軽さを優先し、主張しすぎないまとまりを作る方向です。最初は軽めに試し、必要であれば後から深みを足す流れが自然です。"
    },
    "balanced_comfort": {
      "axes": {"floral": 68, "fresh": 58, "woody": 48, "spicy": 34, "sweet": 50},
      "headline": "やわらかさと心地よさのバランス方向",
      "body": "どれか一つを尖らせるよりも、全体を自然につなげるバランス型です。当日はこの土台から、香りの強さや残り方を少しずつ微調整しやすい状態です。"
    },
    "strong_presence": {
      "axes": {"floral": 70, "fresh": 42, "woody": 58, "spicy": 52, "sweet": 57},
      "headline": "少し印象を残す存在感のある方向",
      "body": "やわらかさを残しつつ、余韻や存在感をしっかり感じる方向です。当日は強さを見ながら、残し方の品の良さを整える進め方が合います。"
    },
    "floral_fresh": {
      "axes": {"floral": 72, "fresh": 66, "woody": 40, "spicy": 24, "sweet": 48},
      "headline": "花のやわらかさに透明感を重ねる方向",
      "body": "フローラルを軸にしながら、重くしすぎず透明感を保つタイプです。親しみやすさと清潔感の両立がしやすいバランスです。"
    },
    "woody_soft": {
      "axes": {"floral": 54, "fresh": 46, "woody": 62, "spicy": 42, "sweet": 52},
      "headline": "深みの中にやわらかさを残す方向",
      "body": "木や落ち着きの軸がありつつ、やわらかさや甘さで角を整えるタイプです。深さを活かしながら重さを抑えたいときの起点になります。"
    }
  }
}
```

## 研究メモから引き継ぐ考え方

- 5 軸と delta は、最終真値ではなく運用しながら調整可能な仮説パラメータとして扱う
- 原料プロファイルは `MATERIAL_POINTS.md` に分離する
- ワークショップ後の校正フローは `UNMET_REQUIREMENTS.md` に残す
- 研究メモ上の案は、本書の固定値を上書きしない
