# SURVEY_SCORING_LOGIC

## 2026-04-28 DB sync note

ユーザー要望により、アンケート結果は `questionnaire_results` へ保存し、予約前に再同期できる導線を追加した。

- STEP2 完了時に保存できなかった場合は、`fragranceScoreState` に `answered_unsaved` と `questionnaireSyncError` を残す
- `fragrance-graph.html` では、微調整保存前に未保存のアンケート結果を再作成する
- `reservation.html` では、予約作成直前に未保存のアンケート結果を再作成し、成功した場合は `reservations.questionnaire_result_id` に紐づける
- 再同期できない場合も予約自体は継続し、`questionnaire_flow_status` / `questionnaire_sync_error` でスタッフ側が判別できるようにする

本書は `deep-research-report.md` を基準にした、目標スコアリング仕様書です。  
現行コードの数値と差がある場合は、本書側を正とします。

## 現行画面との対応

- 配点フォールバック定義の保持先は `customer/questionnaire.html`
- STEP2 の反映先は `customer/questionnaire_step2.html`
- 5軸の可視化と微調整は `customer/fragrance-graph.html`
- 予約文言への反映は `customer/reservation.html`
- 管理者向けの配点編集画面は `admin/admin-scoring.html`
- `admin-login.html` はスタッフ / 管理者共通ログインであり、顧客トップ `index.html` からは直接紐づけない

## ロジックの前提

- 五軸は `floral` / `fresh` / `woody` / `spicy` / `sweet`
- 初期値は全軸 `50`
- `STEP1 = weight 1`
- `STEP2 = weight 2`
- `Q8 = weight 3`
- Q8 の後に `finishTemplates` へ `0.25` ブレンドする
- 最後に全軸を clamp する

## 五軸の意味

- `floral`
  花のやわらかさ、ブーケ感、華やかさ
- `fresh`
  シトラス、水、グリーン、透明感、清潔感
- `woody`
  木質、樹脂、落ち着き、深み
- `spicy`
  スパイス、紅茶、刺激、余韻の引き締まり
- `sweet`
  甘さ、やわらかさ、バニラ感、果実感

## `ALL` / `NONE`

- `ALL` は A / B / C の平均 delta を使う
- `NONE` は 0 ベクトルを使う
- 実装上の表示文言は変えてよいが、内部キーは `ALL` / `NONE` で扱う

## STEP1 delta

| 設問 | 回答キー | floral | fresh | woody | spicy | sweet |
|---|---|---:|---:|---:|---:|---:|
| Q1 惹かれる香り | A 花がふわっと | +8 | +1 | -2 | -1 | +2 |
|  | B みずみずしく爽やか | +1 | +8 | -2 | -1 | 0 |
|  | C 木や森の落ち着き | -2 | -2 | +8 | +2 | -1 |
|  | ALL | +2 | +2 | +1 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q2 好きな色 | A ピンク / ベージュ | +5 | +1 | -1 | -1 | +3 |
|  | B 白 / 水色 / 透明 | +1 | +5 | -1 | -1 | -1 |
|  | C ブラウン / 深緑 | -1 | -1 | +5 | +1 | 0 |
|  | ALL | +2 | +2 | +1 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q3 なりたい気分 | A やさしく癒やされたい | +4 | +1 | 0 | -1 | +3 |
|  | B すっきり切り替えたい | 0 | +5 | 0 | +1 | -2 |
|  | C 自分らしさを出したい | 0 | -1 | +4 | +2 | 0 |
|  | ALL | +1 | +2 | +1 | +1 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q4 使いたい時 | A 休日に気分UP | +2 | +2 | -1 | 0 | +3 |
|  | B 仕事や外出で整えたい | +1 | +3 | +1 | -1 | -1 |
|  | C 夜 / 特別な時間を深く | 0 | -2 | +3 | +3 | +2 |
|  | ALL | +1 | +1 | +1 | +1 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q5 好きな音楽 | A 明るいポップ | +1 | +3 | -1 | 0 | +2 |
|  | B しみるストリングス | +2 | +1 | +1 | 0 | +2 |
|  | C 耳に残るクラシック | 0 | 0 | +3 | +1 | -1 |
|  | ALL | +1 | +1 | +1 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |

## STEP2 delta

STEP2 は `floral` / `fresh` / `woody` の route ごとに質問が変わる。  
以下の表は素 delta であり、実際の計算では `weight 2` を掛ける。

| 設問 | 回答キー | floral | fresh | woody | spicy | sweet |
|---|---|---:|---:|---:|---:|---:|
| Q6-A floral 印象 | A やわらかく華やか | +4 | +1 | 0 | 0 | +1 |
|  | B 親しみやすく甘い | +2 | 0 | 0 | -1 | +4 |
|  | C 上品で落ち着いた | +2 | 0 | +2 | +1 | -1 |
|  | ALL | +3 | 0 | +1 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q6-B fresh 抜け感 | A みずみずしく軽い | +1 | +5 | -1 | -1 | 0 |
|  | B 清潔感がある | 0 | +4 | 0 | -1 | +1 |
|  | C 少しだけシャープ | -1 | +3 | +1 | +2 | -2 |
|  | ALL | 0 | +4 | 0 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q6-C woody 深み | A 木のぬくもり | 0 | 0 | +4 | +1 | +1 |
|  | B 静かな落ち着き | 0 | +1 | +4 | 0 | 0 |
|  | C 個性のある刺激 | -1 | -1 | +3 | +3 | 0 |
|  | ALL | 0 | 0 | +4 | +1 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7-A floral 甘さの出方 | A 最初にふわっと | +3 | +2 | 0 | 0 | +1 |
|  | B 時間とともにやさしく | +2 | 0 | +1 | 0 | +3 |
|  | C 甘さ控えめ | +2 | +2 | 0 | 0 | -3 |
|  | ALL | +2 | +1 | 0 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7-B fresh 香り印象 | A 朝の空気みたい | 0 | +5 | 0 | 0 | -1 |
|  | B 雨上がりのように | +2 | +3 | 0 | 0 | 0 |
|  | C 静かに長く心地よい | 0 | +3 | +2 | 0 | +1 |
|  | ALL | +1 | +4 | +1 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7-C woody 余韻 | A すっと消えて軽やか | 0 | +3 | +2 | -1 | -1 |
|  | B じんわり変化 | 0 | 0 | +3 | 0 | +2 |
|  | C 最後に深く残る | 0 | -2 | +4 | +2 | +1 |
|  | ALL | 0 | 0 | +3 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |

## Q8 delta

Q8 は共通質問であり、実際の計算では `weight 3` を掛ける。

| 設問 | 回答キー | floral | fresh | woody | spicy | sweet |
|---|---|---:|---:|---:|---:|---:|
| Q8 仕上がり | A 軽やかにまとめたい | +1 | +4 | -2 | -2 | -1 |
|  | B やわらかく心地よく | +3 | +1 | 0 | -1 | +2 |
|  | C 少し印象を残したい | 0 | -2 | +3 | +3 | +2 |
|  | ALL | +1 | +1 | 0 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |

## finishTemplates

Q8 の後は、delta 加点だけでなく finishTemplates へ `0.25` ブレンドする。

```json
{
  "finishTemplates": {
    "A": {"floral": 45, "fresh": 75, "woody": 35, "spicy": 25, "sweet": 30},
    "B": {"floral": 65, "fresh": 55, "woody": 40, "spicy": 25, "sweet": 60},
    "C": {"floral": 55, "fresh": 40, "woody": 70, "spicy": 55, "sweet": 65},
    "ALL": {"floral": 55, "fresh": 57, "woody": 48, "spicy": 35, "sweet": 52},
    "NONE": null
  }
}
```

計算式:

```text
finalAfterQ8Delta = apply weighted delta
finalAxes = blendAxes(finalAfterQ8Delta, finishTemplate, 0.25)
axis = round(base * 0.75 + template * 0.25)
```

## STEP2 route 判定の補完仕様

`deep-research-report.md` では STEP2 の route ごとの質問内容は定義されているが、route 判定用テンプレート値までは固定されていない。  
実装可能にするため、route 判定は次の補完仕様を採用する。

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

```text
distance =
abs(floralDiff) * 1.3 +
abs(freshDiff)  * 1.3 +
abs(woodyDiff)  * 1.3 +
abs(spicyDiff)  * 0.7 +
abs(sweetDiff)  * 0.7
```

tie-break は `floral -> fresh -> woody` とする。

## 運用上の前提

- 五軸値と delta は、最終真値ではなく校正可能な仮説パラメータとして扱う
- 将来の校正フローは `UNMET_REQUIREMENTS.md` で管理する
- 現行コードが本書の値と違う場合は、将来コードを本書へ寄せる

## 追記: 2026-04-19 配点ロジック管理画面の運用要件

この追記は `レイアウトimg/配点ロジックページ.png` と管理者導線画像の確認を受けて、配点ロジックの編集運用要件を固定するために追加する。

- `branchTemplates` と `branchDistanceWeights` は STEP1 / STEP2 / Q8 の配点テーブルと同一画面で確認 / 編集できること
- 配点数値の入力 UI はスピンボタンなどで上下調整できる数値入力を基本とする
- 保存先は DB を基本としつつ、ローカル保存用 JSON の書き出しと JSON 読込も扱えること
- STEP1 / STEP2 / Q8 の設問文と回答文は、現状では別ページへ分けず、このページ内で変更可能とする
- 管理スタッフ確認ページ `admin/admin-dashboard.html` の「アンケート編集」は、本ページへの導線として扱う
