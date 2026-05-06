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

## 追記: 2026-04-28 Phase 2 共通配点参照

ユーザー要望により、Markdown / PPTX 資料の実装順序に戻して Phase 2 の安定化を進める。

今回の実装では、`customer/questionnaire.html`、`customer/questionnaire_step2.html`、`customer/reservation.html` が `js/fragrance-master-data.js` を読み込むようにした。

- 通常の配点編集は `admin/admin-scoring.html` から `scoring_configs` に保存する
- 公開アンケートは active な `scoring_configs` を優先する
- active な `scoring_configs` は保存処理と DB 制約で 1 件に限定する
- `sessionStorage` や DB 読込が使えない場合は、`js/fragrance-master-data.js` の共通初期値を fallback とする
- `fragrance-graph.html` は既に `material_points` を読み込み、未登録時は `js/fragrance-master-data.js` の原料テンプレートを使う
- 旧来の `customer/questionnaire.html` 内 fallback 定義は、互換用として残す

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

### 2026-04-29 追記: STEP1 初期設定を ver.1.1 へ更新

ユーザー要望により、STEP1 は `deep-research-report-ver.1.1.md` を基準にする。
既存の A/B/C + `ALL` / `NONE` ではなく、A/B/C/D + `ALL` / `NONE` の6択とする。

- A: 清潔・軽やか / fresh 中心
- B: 花・やわらか / floral 中心
- C: 木・落ち着き / woody 中心
- D: 温かさ・余韻 / spicy・sweet 中心、woody 補助
- `ALL`: A-D の平均を丸めた明示 delta
- `NONE`: 0 ベクトル

実装初期値は `js/fragrance-master-data.js` の `SCORING_LOGIC_SOURCE = deep-research-report-ver.1.1.md`、`SCORING_LOGIC_VERSION = 2026-04-29` を正とする。
公開ページは Supabase の active `scoring_configs` を優先するため、DB側に古い active config が残っている場合は、この初期値を管理画面から保存し直す必要がある。

### 2026-05-02 追記: Question_template.md の表示文言

ユーザー要望により、`docs/Question_template.md` の質問文と回答文は `scoring_configs.config_json.questionTextOverrides` に保持する。
配点の内部キーは `A` / `B` / `C` / `D` / `ALL` / `NONE` のまま維持し、公開アンケート画面は active `scoring_configs` の `questionTextOverrides` を優先して表示する。
`questionTextOverrides` がない場合は、画面側のローカル定義へ fallback する。

| 設問 | 回答キー | floral | fresh | woody | spicy | sweet |
|---|---|---:|---:|---:|---:|---:|
| Q1 最初の香り立ちとして、いちばん心地よいのはどれですか？ | A せっけんや水のようにみずみずしい | +1 | +8 | -2 | -2 | 0 |
|  | B 白い花がふわっとやわらかい | +8 | +1 | -2 | -1 | +2 |
|  | C 木や葉のように静かで落ち着く | -2 | -1 | +8 | +2 | -1 |
|  | D 紅茶やスパイスのように温かく印象に残る | 0 | -1 | +1 | +4 | +4 |
|  | ALL | +2 | +2 | +1 | +1 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q2 どんな場面で使いやすいと感じますか？ | A 朝の外出や仕事前に、清潔に整う | 0 | +5 | 0 | -1 | -1 |
|  | B 人と近い距離で、やさしく上品に見せたい | +4 | +1 | 0 | -1 | +2 |
|  | C 一人時間や読書のときに、静かに落ち着きたい | 0 | -1 | +4 | +1 | 0 |
|  | D 夜や特別な時間に、少し色気や深みがほしい | +1 | -2 | +1 | +3 | +3 |
|  | ALL | +1 | +1 | +1 | +1 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q3 香りの甘さや温度感は、どれがちょうどいいですか？ | A 甘さは少なく、さらっと涼しい | 0 | +4 | -1 | 0 | -3 |
|  | B 花の蜜のように、やさしくほのか | +4 | +1 | 0 | -1 | +2 |
|  | C 木や樹脂のように、まろやかで落ち着く | 0 | -1 | +4 | +1 | +1 |
|  | D バニラやスパイスのように、温かくしっかり | 0 | -2 | +1 | +3 | +4 |
|  | ALL | +1 | +1 | +1 | +1 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q4 香りの残り方は、どれが心地よいですか？ | A つけたてにすっと広がって、軽く引く | 0 | +4 | -1 | -1 | -1 |
|  | B 近づいたときにふんわり感じる | +3 | +1 | 0 | -1 | +2 |
|  | C 静かに落ち着いて、長めに続く | 0 | 0 | +4 | +1 | 0 |
|  | D 後半にぬくもりや深みが出てくる | 0 | -1 | +2 | +3 | +2 |
|  | ALL | +1 | +1 | +1 | +1 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q5 会った人に、香りでどんな印象が伝わるとしっくりきますか？ | A 清潔で軽やか、話しかけやすい | 0 | +4 | 0 | 0 | -1 |
|  | B やわらかく上品で、親しみやすい | +4 | +1 | 0 | -1 | +2 |
|  | C 落ち着いて知的で、安心感がある | 0 | 0 | +4 | +1 | 0 |
|  | D 印象に残る、あたたかい余韻がある | +1 | -1 | +1 | +2 | +3 |
|  | ALL | +1 | +1 | +1 | +1 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |

以下の既存表は、`deep-research-report.md` 基準の旧STEP1初期値として残す。

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
| Q6 floral 身につけたとき、どんな印象に近づけたいですか？ | A やわらかく華やか | +4 | +1 | 0 | 0 | +1 |
|  | B 親しみやすく甘い | +2 | 0 | 0 | -1 | +4 |
|  | C 上品で落ち着いた | +2 | 0 | +2 | +1 | -1 |
|  | ALL | +3 | 0 | +1 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q6 fresh 爽やかさの中でも、どんな抜け感が好きですか？ | A みずみずしく軽い | +1 | +5 | -1 | -1 | 0 |
|  | B 清潔感がある | 0 | +4 | 0 | -1 | +1 |
|  | C 少しだけシャープ | -1 | +3 | +1 | +2 | -2 |
|  | ALL | 0 | +4 | 0 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q6 woody 落ち着きや深みは、どんな雰囲気が好きですか？ | A 木のぬくもり | 0 | 0 | +4 | +1 | +1 |
|  | B 静かな落ち着き | 0 | +1 | +4 | 0 | 0 |
|  | C 個性のある刺激 | -1 | -1 | +3 | +3 | 0 |
|  | ALL | 0 | 0 | +4 | +1 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7 floral 甘さは、どんな出方が好みですか？ | A 最初にふわっと感じたい | +3 | +2 | 0 | 0 | +1 |
|  | B 時間とともにやさしく出てほしい | +2 | 0 | +1 | 0 | +3 |
|  | C 甘さは控えめがいい | +2 | +2 | 0 | 0 | -3 |
|  | ALL | +2 | +1 | 0 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7 fresh その爽やかさは、どんな印象で残ってほしいですか？ | A 朝の空気みたいにすっきり | 0 | +5 | 0 | 0 | -1 |
|  | B 雨上がりのようにやわらかい | +2 | +3 | 0 | 0 | 0 |
|  | C 静かに長く心地よい | 0 | +3 | +2 | 0 | +1 |
|  | ALL | +1 | +4 | +1 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7 woody 香りの余韻は、どんな残り方が心地よいですか？ | A すっと消えて軽やか | 0 | +3 | +2 | -1 | -1 |
|  | B じんわり変化してほしい | 0 | 0 | +3 | 0 | +2 |
|  | C 最後に深く残ってほしい | 0 | -2 | +4 | +2 | +1 |
|  | ALL | 0 | 0 | +3 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |

## Q8 delta

Q8 は共通質問であり、実際の計算では `weight 3` を掛ける。

| 設問 | 回答キー | floral | fresh | woody | spicy | sweet |
|---|---|---:|---:|---:|---:|---:|
| Q8 最後に、今日の香りはどんな仕上がりにしたいですか？ | A 軽やかにまとめたい | +1 | +4 | -2 | -2 | -1 |
|  | B やわらかく心地よくしたい | +3 | +1 | 0 | -1 | +2 |
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

## 追記: 2026-04-28 Phase 2 アンケート結果の本人トークン制限

ユーザー要望の「公開 Supabase で anon に許可する最小操作範囲」に合わせて、`create_questionnaire_result` の `result_code` 衝突時更新を制限した。

- 新規アンケート結果は公開フォームから作成できる
- 既存 `result_code` の再同期は、既存行の `edit_token_hash` が未設定、または呼び出し側の edit token が既存 hash と一致する場合だけ許可する
- 一致しない場合は結果行を返さず、画面側は既存の `answered_unsaved` / `questionnaireSyncError` の失敗導線へ進む

## 追記: 2026-04-28 Phase 2 予約保存失敗時の扱い

公開サイト運用時に、DBへ保存されていない予約を完了扱いにしないため、`reservation.html` は `createReservation` が `reservation_code` を返した場合だけ完了画面へ進む。

- Supabase未接続、RPC失敗、insert失敗の場合は完了画面へ遷移しない
- 失敗時は予約ページ上に再試行案内を表示し、同じ選択内容で再送できる状態に戻す
- アンケート結果の保存に失敗した場合は既存方針通り、予約自体は継続し `questionnaire_flow_status` / `questionnaire_sync_error` に残す

## 追記: 2026-05-06 おすすめ配合用の回答パターン識別

ユーザー要望により、今回の主実装範囲を「8問アンケート回答パターン → 5軸算出 → 3原料×5%刻み比率の最適レシピ呼び出し → おすすめ配合1件表示」に限定する。

- 回答パターン識別子 `question_signature` は `Q1`〜`Q8`、`branch`、`finish` を固定順で連結する
- 5軸算出は現行 `scoring_configs` と同じ配点ロジックを使う
- 表示用5軸は従来のアンケート結果値を使い、比較用5軸は `normalizeAxesToProfile()` で100合計のプロファイルへ変換する
- おすすめ配合の距離関数は v1 として重みなし L1 距離を使う
- 計算式は `distance = Σ abs(questionnaireComparableAxes[axis] - recipeComparableAxes[axis])`
- アルゴリズムバージョンは `recipe-l1-profile-v1` とする
