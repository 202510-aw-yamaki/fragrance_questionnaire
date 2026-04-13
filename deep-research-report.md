# 香りワークショップにおける原料プロファイル数値化とアンケート配点の細粒度設計

## 背景とゴール定義
ご要望は大きく二つです。  
ひとつは、提示された **原料（定番12＋限定4）** が、香り項目（**フローラル／フレッシュ／ウッディ／スパイシー／スウィート**）の各軸へ「どの程度寄与するか」を **数値（プロファイル）** として持つこと。もうひとつは、8問アンケートの各回答（A/B/C/ALL/NONE）が、5軸スコアに与える影響を **より細粒度の数値（配点＝delta）** として定義することです。

ただし、香りの「混ざり方」は線形足し算では説明しきれません。嗅覚受容体レベルでも、混合物に対して **競合結合（competitive binding）による非線形性** が生じ、抑制・マスキング・相乗などの **非加算的な相互作用** が起こり得るため、最初から完全な“真値”を固定するのは難しいです。したがって本レポートの数値は、**公開されている香性記述（olfactive descriptors）と香調分類の定義を根拠にした「初期パラメータ」**として提示し、ワークショップ運用の実データで校正して精度を上げる前提が安全です。citeturn31view0

## 数値化の前提とスケール設計
### 五軸の意味づけ
本件の5軸は、香水業界で広く用いられる香調ファミリー（例：Floral / Citrus / Water / Woods / Amber等）を、ワークショップ用途に合わせて再投影したものとして整理すると安定します。

- **Floral（フローラル）**：花の香りのブーケ感（「生きた花のエッセンスを捉える」系の説明）。citeturn21view0  
- **Fresh（フレッシュ）**：シトラス／ウォーター（マリン・オゾニック）／グリーンなどの「清潔感・みずみずしさ」。Citrus の説明（ベルガモット、レモン、グレープフルーツ等）と Water の説明（海風・滝・湿った空気のオゾン）を根拠に扱えます。citeturn21view0  
- **Woody（ウッディ）**：木質（シダー、サンダルウッド、ベチバー等）方向。citeturn21view0  
- **Spicy（スパイシー）**：ここでは「香辛料そのもの」だけでなく、アンバー系に含まれる **スパイス／樹脂** の“温かい刺激”も含めた「Warm Spicy」寄りに定義すると、原料ラインナップ（アンバー、ティー、ラム等）で軸が成立します。Soft Amber の「sweet spices and resins」や Woody Amber の「Spicy amber accords」の説明が根拠になります。citeturn21view0  
- **Sweet（スウィート）**：バニラ／樹脂の甘さ、フルーティの甘さ、ラクトニック（ココナッツ等）の甘さを包含。Amber の「sweet vanilla」などが根拠になります。citeturn21view0  

### 「原料→5軸」の数値表現
実装で扱いやすいよう、ここでは各原料を **5軸合計=100の分配（composition-like profile）** として定義します。  
こうすると、ブレンド比率（例：トップ30%・ミドル60%・ラスト10%）で **加重平均** が取りやすく、UIのスライダー値やターゲットに近づける設計が単純になります。

### 「アンケート→5軸」の数値表現
ご提示ロジック（初期値50、STEP1=weight1、STEP2=weight2、Q8=weight3＋finishTemplatesへ0.25ブレンド、最後にclamp）を維持しつつ、各回答の delta を **5成分ベクトル**にします。

- **ALL（全部好き）**：安全な実装として、A/B/Cの平均delta（各軸を平均→四捨五入）にするのが、偏りが少なく説明可能です。  
- **NONE（この中にはない）**：0ベクトル（影響なし）にしておくと、無理に誤推定しません（後段のスライダー調整で吸収）。  

## 原料が五軸へ与える影響度合いマトリクス
以下は、各原料について、公開されている香性記述（例：TGSCのodor descriptors）と香調ファミリー定義に基づく **初期プロファイル（合計100）** です。  
同じ名称でも「精油」「アコード」「香料会社の再現香料」で香りは変わるため、**運用後の校正前提**でご利用ください（＝最初から“真値”とみなさない）。混合が非線形になり得る点もこの前提を支持します。citeturn31view0  

### 原料プロファイル表
| 原料 | 想定ノート位置 | Floral | Fresh | Woody | Spicy | Sweet | 根拠（要旨） |
|---|---|---:|---:|---:|---:|---:|---|
| ベルガモット | Top | 10 | 60 | 15 | 10 | 5 | 「citrus floral woody」「spicy green」等の記述。citeturn49view0 |
| レモン | Top | 2 | 78 | 5 | 5 | 10 | 「fresh lemon peel」「sweet citrus」「sharp lemon sweet」等。citeturn9view0 |
| グレープフルーツ | Top | 5 | 70 | 5 | 5 | 15 | 「strong fresh grapefruit」「sweet…citrus…bitter」等。citeturn22view0turn21view0 |
| ラベンダー | Top〜Middle | 35 | 25 | 15 | 15 | 10 | 「lavender floral herbal woody」「sweet…spicy…woody」等。citeturn9view2turn21view0 |
| ミュゲ（スズラン） | Middle | 55 | 25 | 5 | 5 | 10 | 「fresh lily floral sweet」「watery green」等。citeturn9view3turn21view0 |
| ダマスクローズ | Middle | 60 | 10 | 5 | 5 | 20 | ローズの「fresh rose…sweet」「honey rose」「dewy rose…fresh clean」等。citeturn11view3turn21view0 |
| アッサムティー（ブラックティー） | Middle | 10 | 25 | 35 | 20 | 10 | ブラックティーに「leather…hay…smoky」、さらに「spicey, black pepper-like…」等。citeturn12view0turn21view0 |
| カシス（ブラックカラント） | Top〜Middle | 5 | 25 | 5 | 15 | 50 | 「fruity sweet…cassis」「green spicy herbal berry…jammy」等。citeturn12view1turn21view0 |
| マグノリア | Middle | 55 | 15 | 10 | 10 | 10 | 「floral lily green…spicy」「floral fresh petal magnolia」等。citeturn11view2turn21view0 |
| ムスク | Base | 10 | 25 | 10 | 5 | 50 | 「sweet clean musk amber」「powdery sweet…musk woody」等。citeturn11view1turn25view0 |
| アンバー | Base | 5 | 15 | 35 | 20 | 25 | 「woody amber」「amber woody spicy」「sweet…ambergris…」等（“暖かさ＋甘さ＋木質”）。citeturn11view0turn21view0turn25view0 |
| サンダルウッド | Base | 5 | 5 | 55 | 10 | 25 | 「sandalwood clean sweet woody」「creamy woody milky」「herbal spicy」等。citeturn7view2turn25view0turn21view0 |
| スカッシュ | Top | 10 | 65 | 3 | 2 | 20 | 「レモン果汁＋シュガー＋サイダー」「TOP:レモン/ライム/グレープフルーツ」「LAST:シュガー」。citeturn24view0turn21view0 |
| シーブルー | Top | 10 | 75 | 5 | 5 | 5 | マリン・オゾン系（CALONEが「intense ozone and marine…floral undertones」）。Waterファミリー説明も一致。citeturn13view1turn21view0turn20view0 |
| ハイビスカス | Middle | 50 | 15 | 5 | 5 | 25 | 「floral hibiscus berry」。citeturn12view2turn21view0 |
| ココナッツラム | Base | 5 | 10 | 15 | 10 | 60 | ココナッツの「lactonic…tropical creamy」「sweet coconut」＋ラム系の「alcoholic rum…sweet…vanilla…spicy nutmeg」等。citeturn12view3turn13view0turn25view0 |

### 実装に落とすためのJSON例
（ここでは **“初期パラメータ”** としての固定値を提示します。校正で更新する前提です。混合の非線形性があるため「永遠の真値」にはしません。citeturn31view0）

```json
{
  "ingredientProfiles": {
    "bergamot":   {"floral":10,"fresh":60,"woody":15,"spicy":10,"sweet":5},
    "lemon":      {"floral":2,"fresh":78,"woody":5,"spicy":5,"sweet":10},
    "grapefruit": {"floral":5,"fresh":70,"woody":5,"spicy":5,"sweet":15},
    "lavender":   {"floral":35,"fresh":25,"woody":15,"spicy":15,"sweet":10},
    "muguet":     {"floral":55,"fresh":25,"woody":5,"spicy":5,"sweet":10},
    "damaskRose": {"floral":60,"fresh":10,"woody":5,"spicy":5,"sweet":20},
    "assamTea":   {"floral":10,"fresh":25,"woody":35,"spicy":20,"sweet":10},
    "cassis":     {"floral":5,"fresh":25,"woody":5,"spicy":15,"sweet":50},
    "magnolia":   {"floral":55,"fresh":15,"woody":10,"spicy":10,"sweet":10},
    "musk":       {"floral":10,"fresh":25,"woody":10,"spicy":5,"sweet":50},
    "amber":      {"floral":5,"fresh":15,"woody":35,"spicy":20,"sweet":25},
    "sandalwood": {"floral":5,"fresh":5,"woody":55,"spicy":10,"sweet":25},
    "squash":     {"floral":10,"fresh":65,"woody":3,"spicy":2,"sweet":20},
    "seaBlue":    {"floral":10,"fresh":75,"woody":5,"spicy":5,"sweet":5},
    "hibiscus":   {"floral":50,"fresh":15,"woody":5,"spicy":5,"sweet":25},
    "coconutRum": {"floral":5,"fresh":10,"woody":15,"spicy":10,"sweet":60}
  }
}
```

## アンケート回答が五軸に与える影響の細粒度配点案
### 根拠の置き方
- **色→匂い**の対応は、実験的にも「参加者が特定の匂いを特定の色に一貫して結びつける」ことが示され、連想が体系的になり得ます。よってQ2（色）は、フレッシュ（青・透明）／フローラル（ピンク）／ウッディ（ブラウン・深緑）に寄せる設計が説明可能です。citeturn26view0  
- **音楽→匂い**も、匂いが「ピッチ（高低）」「楽器カテゴリ」などと対応づけられることが示され、たとえば **candied orangeやirisが高いピッチ、muskやroasted coffeeが低いピッチ**に寄りやすい、といった結果が報告されています。よってQ5（音楽）は、ポップ＝高ピッチ/明るい→フレッシュ/スウィート寄り、クラシック＝低ピッチ/落ち着き→ウッディ/スパイシー寄り、という設計が作れます。citeturn26view1  

### delta定義の基本方針
- deltaは **「各軸に±が入る5次元ベクトル」**  
- STEP1（Q1〜Q5）は weight=1  
- STEP2（Q6/Q7）は weight=2（＝同じdeltaでも影響が2倍）  
- Q8は weight=3（＋finishTemplatesへ0.25ブレンド）  

ALL/NONEは以下で統一すると実装と説明がシンプルです。  
- **ALL**：A/B/Cの平均（四捨五入）  
- **NONE**：0ベクトル  

### STEP1 固定5問のdelta（weight=1の“素”delta）
| 設問 | 回答キー | floral | fresh | woody | spicy | sweet |
|---|---|---:|---:|---:|---:|---:|
| Q1 惹かれる香り | A 花がふわっと | +8 | +1 | -2 | -1 | +2 |
|  | B みずみずしく爽やか | +1 | +8 | -2 | -1 | 0 |
|  | C 木や森の落ち着き | -2 | -2 | +8 | +2 | -1 |
|  | ALL（平均） | +2 | +2 | +1 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q2 好きな色 | A ピンク/ベージュ | +5 | +1 | -1 | -1 | +3 |
|  | B 白/水色/透明 | +1 | +5 | -1 | -1 | -1 |
|  | C ブラウン/深緑 | -1 | -1 | +5 | +1 | 0 |
|  | ALL（平均） | +2 | +2 | +1 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q3 なりたい気分 | A やさしく癒やされたい | +4 | +1 | 0 | -1 | +3 |
|  | B すっきり切り替えたい | 0 | +5 | 0 | +1 | -2 |
|  | C 自分らしさを出したい | 0 | -1 | +4 | +2 | 0 |
|  | ALL（平均） | +1 | +2 | +1 | +1 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q4 使いたい時 | A 休日に気分UP | +2 | +2 | -1 | 0 | +3 |
|  | B 仕事や外出で整えたい | +1 | +3 | +1 | -1 | -1 |
|  | C 夜/特別な時間を深く | 0 | -2 | +3 | +3 | +2 |
|  | ALL（平均） | +1 | +1 | +1 | +1 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q5 好きな音楽 | A 明るいポップ | +1 | +3 | -1 | 0 | +2 |
|  | B しみるストリングス | +2 | +1 | +1 | 0 | +2 |
|  | C 耳に残るクラシック | 0 | 0 | +3 | +1 | -1 |
|  | ALL（平均） | +1 | +1 | +1 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |

色連想（Q2）を使う妥当性は、匂いと色の対応が一貫して生じ得ることを示す研究により裏打ちできます。citeturn26view0  
音楽連想（Q5）も、匂いが音のピッチ等と対応づけられる報告があり、明るさ・甘さ・快さが高ピッチ側に寄る傾向が示されています。citeturn26view1  

### STEP2 分岐質問のdelta（素delta × weight=2）
STEP2は route（floral / fresh / woody）ごとに Q6/Q7 が変わる前提なので、以下は **設問ごとの素delta** です（実際の加算は×2）。

| 設問 | 回答キー | floral | fresh | woody | spicy | sweet |
|---|---|---:|---:|---:|---:|---:|
| Q6-A（floral分岐）印象 | A やわらかく華やか | +4 | +1 | 0 | 0 | +1 |
|  | B 親しみやすく甘い | +2 | 0 | 0 | -1 | +4 |
|  | C 上品で落ち着いた | +2 | 0 | +2 | +1 | -1 |
|  | ALL（平均） | +3 | 0 | +1 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q6-B（fresh分岐）抜け感 | A みずみずしく軽い | +1 | +5 | -1 | -1 | 0 |
|  | B 清潔感がある | 0 | +4 | 0 | -1 | +1 |
|  | C 少しだけシャープ | -1 | +3 | +1 | +2 | -2 |
|  | ALL（平均） | 0 | +4 | 0 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q6-C（woody分岐）深み | A 木のぬくもり | 0 | 0 | +4 | +1 | +1 |
|  | B 静かな落ち着き | 0 | +1 | +4 | 0 | 0 |
|  | C 個性のある刺激 | -1 | -1 | +3 | +3 | 0 |
|  | ALL（平均） | 0 | 0 | +4 | +1 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7-A（floral分岐）甘さの出方 | A 最初にふわっと | +3 | +2 | 0 | 0 | +1 |
|  | B 時間とともにやさしく | +2 | 0 | +1 | 0 | +3 |
|  | C 甘さ控えめ | +2 | +2 | 0 | 0 | -3 |
|  | ALL（平均） | +2 | +1 | 0 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7-B（fresh分岐）香り印象 | A 朝の空気みたい | 0 | +5 | 0 | 0 | -1 |
|  | B 雨上がりのように | +2 | +3 | 0 | 0 | 0 |
|  | C 静かに長く心地よい | 0 | +3 | +2 | 0 | +1 |
|  | ALL（平均） | +1 | +4 | +1 | 0 | 0 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |
| Q7-C（woody分岐）余韻 | A すっと消えて軽やか | 0 | +3 | +2 | -1 | -1 |
|  | B じんわり変化 | 0 | 0 | +3 | 0 | +2 |
|  | C 最後に深く残る | 0 | -2 | +4 | +2 | +1 |
|  | ALL（平均） | 0 | 0 | +3 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |

### Q8 共通質問のdelta（素delta × weight=3）
| 設問 | 回答キー | floral | fresh | woody | spicy | sweet |
|---|---|---:|---:|---:|---:|---:|
| Q8 仕上がり | A 軽やかにまとめたい | +1 | +4 | -2 | -2 | -1 |
|  | B やわらかく心地よく | +3 | +1 | 0 | -1 | +2 |
|  | C 少し印象を残したい | 0 | -2 | +3 | +3 | +2 |
|  | ALL（平均） | +1 | +1 | 0 | 0 | +1 |
|  | NONE | 0 | 0 | 0 | 0 | 0 |

## Q8の仕上げ補正とfinishTemplatesの設計案
### 仕上げ補正を「香調定義」に沿って設計する
Q8は「最後の微調整」なので、deltaだけではなく **仕上げテンプレートに軽く寄せる**のは合理的です。  
テンプレートは、香調ファミリーの定義（Citrus/Water=フレッシュ、Amber=甘さ、Woody Amber=スパイシー＋木質）から、説明可能な形で置けます。citeturn21view0  

### finishTemplates（案）
- A「軽やか」：Citrus/Water寄りで Fresh 高めciteturn21view0  
- B「やわらか」：Soft Floral/Amber寄りで Floral/Sweet 中〜高citeturn21view0  
- C「印象」：Woody Amber寄りで Woody/Spicy/Sweet 高めciteturn21view0  

```json
{
  "finishTemplates": {
    "A": {"floral":45,"fresh":75,"woody":35,"spicy":25,"sweet":30},
    "B": {"floral":65,"fresh":55,"woody":40,"spicy":25,"sweet":60},
    "C": {"floral":55,"fresh":40,"woody":70,"spicy":55,"sweet":65},
    "ALL": {"floral":55,"fresh":57,"woody":48,"spicy":35,"sweet":52},
    "NONE": null
  }
}
```

※ALLはA/B/C平均の例です（運用で調整可）。NONEは「ブレンドしない」扱い（template=null）にすると安全です。

### 既存式との整合
ご提示の式（0.25ブレンド）は以下でOKです。

- `finalAfterQ8Delta = apply weighted delta`
- `finalAxes = blendAxes(finalAfterQ8Delta, finishTemplate, 0.25)`
- `axis = round(base*0.75 + template*0.25)`
- その後 clamp

この「最後に軽く寄せる」思想は、トップ/ミドル/ラストの概念（香りは時間で変化し、トップはシトラス等で短時間、ラストはサンダルウッド/ムスク/アンバー等が残りやすい）とも相性が良いです。citeturn25view0  

## 五軸スコアから原料ブレンドへ落とす計算手順
ここは「数値を作った後、実際に原料提案へ繋げる」ための、実装しやすい最短手順です。

### ノート設計を固定して探索空間を狭める
ワークショップの説明にある通り、初心者向けには **Top1 / Middle2 / Last1** などの固定構成は強力です。  
トップ例にシトラス（レモン等）、ラスト例にサンダルウッド／ムスク／アンバーが挙げられるため、今回の原料群にも自然に当てはまります。citeturn25view0turn21view0  

### 推定軸ベクトルの計算
各原料プロファイルが合計100の分配なので、ブレンド比率（例：Top=0.30, Middle=0.60, Last=0.10）で

- `blendProfile = 0.30*top + 0.30*mid1 + 0.30*mid2 + 0.10*last`  
  （※Middleを2本なら 0.60を2等分して0.30/0.30 など）

で「推定プロフィール（合計100）」が出ます。

### ターゲットへの近さ（距離）
UIの五軸スコア（0〜100）をそのまま使うと合計が一定ではないため、比較の仕方を決めます。

運用が簡単なのは、五軸スコアを一度「合計100」に正規化してから比較する方法です。

- `targetNorm[i] = target[i] / sum(target) * 100`
- 距離は `L2（ユークリッド）` か `L1` で十分

### 例：フレッシュ高め・柔らかい仕上がり
仮にアンケート結果（＋微調整後）が  
- floral 62 / fresh 70 / woody 38 / spicy 25 / sweet 45  
だったとします（例）。

Top候補は「フレッシュ高め」なので レモン or シーブルー or スカッシュが素直です（シーブルーはマリン・オゾンでFresh強い）。citeturn13view1turn24view0turn21view0  
Middleは「フローラルも欲しい」ので ミュゲ＋マグノリア、Lastは「柔らかさ」ならムスク、などが機械的に提案できます（実際にはスタッフが“好み”で微調整）。citeturn9view3turn11view2turn11view1turn25view0  

## 運用上の注意点と校正ロードマップ
### 「数値＝真理」にしないための安全策
匂いの混合ルールは、色の加法混色のように確立していない側面があり、受容体応答レベルでも競合結合など非線形性が支配的になり得ます。したがって、**初期プロファイルとdeltaは“仮説パラメータ”**として扱い、ワークショップの実運用で更新できる構造にしておくと破綻しにくいです。citeturn31view0  

### 校正の最小実装
1回の来店で「作った香り」をムエットで確認したあと、最後に5軸を各0〜100で主観評価してもらう（30秒で終わる）だけで、校正が可能になります。

- 原料プロファイル校正：実際に使った原料と比率を特徴量にして、出力（5軸評価）を回帰する  
- 質問delta校正：回答（A/B/C）をダミー変数にして回帰する  
- うまくいくと「この原料は思ったよりSweetが強い」「この質問はWoodyに効きすぎ」などが数字で分かります

---

上記の **原料プロファイル（16種×5軸）** と **質問delta（各設問×A/B/C/ALL/NONE）** は、そのまま実装に入れられる粒度で定義してあります。香調の根拠は、香調ファミリー定義（Citrus/Water/Woods/Amber等）と、各ノートの代表的な香性記述（TGSC、dsm-firmenich、カーメイトのノート表記）に寄せています。citeturn21view0turn49view0turn20view0turn13view1turn24view0