# 香りワークショップ向けアンケート・調香支援システムの推奨設計

結論から言うと、この案件で最も重要なのは、`questionnaireAxes` と `rawRecipeAxes` を「同じ5軸だからそのまま比較できる」とみなさないことです。感性評価では、記述的な香りプロファイルは「製品がどんな属性をどれくらい持つか」を表し、嗜好データは「それをどれくらい好むか」を表す別種の情報です。したがって、現段階で安全なのは、raw 同士の一致ではなく、**中心化・標準化した相対プロファイル**を比較し、そこへ**順位情報・香水設計制約・スタッフ補正**を重ねる設計です。香水推薦そのものも文脈依存性が高いため、最終判断をスタッフに残す今の運用思想は理にかなっています。citeturn21view0turn14search1turn25search0

## 現行方式の問題点

現行案の最大の問題は、**アンケート5軸と原料ポイント由来5軸の意味が違う**ことです。アンケート側は顧客の好みや志向を表す準嗜好的データで、原料側は香料や配合の記述的プロファイルです。感性評価の実務文献でも、記述テストは製品属性とその強度を定量化するためのものであり、それだけでは受容や好ましさは決められず、消費者のヘドニックな結果と結びつけてはじめて「何が受け入れられるか」を判断できる、と整理されています。したがって、質問1への答えは **「raw のまま同スケール比較する設計は妥当ではない」** です。citeturn21view0turn14search1turn3search11

次に、質問2の「`rawRecipeAxes` を `questionnaireAxes` の合計値に合わせて倍率補正する方法」も、**スコアリング用途としては推奨しません**。理由は二つあります。第一に、現在のアンケートは5軸それぞれ初期値50なので、回答前の合計は **250** であり、その合計には「基準点」が大きく混ざっています。第二に、総和を一定値へそろえる操作は、統計学では closure と呼ばれる扱いになり、相互関係を人工的に歪めたり、見かけ上の相関を生んだりします。総和合わせは「方向だけを見たい」場面の雑な代用にはなりますが、嗜好とレシピの橋渡しとしては粗すぎます。citeturn24view0turn5view0

さらに、質問4の「3原料の全組み合わせ＋5%刻み探索」自体は v1 として妥当ですが、そこで最適化されるのはあくまで**今の代理目的関数**です。香水の時間変化は揮発性、フィキサティブ、溶媒マトリクス、成分間相互作用に左右され、推薦も強く文脈依存です。つまり、この探索は「あなたの現在の5軸モデルに最も近い候補」を返すのであって、「実際に最も好まれる香り」を保証するわけではありません。ここはスタッフ補正を前提にした方が安全です。citeturn7view1turn7view0turn25search0

## 推奨するスケール変換

質問3に対する結論は明確で、**アンケート5軸を合計100へ正規化するのは避けるべき**です。合計100化は、5軸が互いに独立に高くも低くもなり得るという現在のアンケート設計を壊し、「全体に高めの人」と「一部だけ極端に高い人」を区別しにくくします。統計学的にも、定数和への正規化は closure の問題を持ち込みます。したがって、三択なら **「50からの偏差＋順位の併用」** が最も実務向きです。citeturn24view0turn5view0turn20view0

実装上は、**保存値**と**比較用値**と**表示用値**を分けるべきです。距離ベースの比較では、変数スケールが異なると近さが歪むため、前処理としての標準化が重要です。また、候補レシピ側は外れ値や偏った素材分布の影響を受けやすいので、平均と標準偏差よりも、**中央値とIQR** を使うロバストな標準化が向いています。順位については、上位の入れ替わりを強く扱う考え方が自然です。citeturn18view0turn18view1turn20view0

私なら、比較用の変換は次のように置きます。これは**アンケートロジックも原料ポイント値も変更せず**、比較前に変換レイヤーを1枚挟むだけです。

```text
入力として保存する値
- questionnaireAxesRaw[a]    = 現行の 50 + deltas
- rawRecipeAxes[a]           = 現行の配合加重和

比較用に生成する値
- qDev[a]        = (questionnaireAxesRaw[a] - 50) / questionnaireAxisMaxAbsDelta[a]
- qProfile[a]    = qDev[a] - mean(qDev)

- rStd[a]        = (rawRecipeAxes[a] - medianFeasibleRecipeAxis[a]) / IQRFeasibleRecipeAxis[a]
- rProfile[a]    = rStd[a] - mean(rStd)
```

ここで `questionnaireAxisMaxAbsDelta[a]` は、**現行アンケートの delta テーブルから計算できる理論上の最大絶対偏差**です。`medianFeasibleRecipeAxis[a]` と `IQRFeasibleRecipeAxis[a]` は、制約をかけた後の**実現可能レシピ全集合**から軸ごとに前計算します。こうすると、アンケート側は「その人の好みの偏り」、レシピ側は「実現可能レシピ空間の中での相対的位置」として比較できます。raw 同士を無理に合わせるより、ずっと意味が通ります。citeturn18view0turn18view1

表示用の `displayRecipeAxes` は、**ランキングに使わず UI 専用**にしてください。おすすめは 0–100 のパーセンタイル表示です。たとえば各軸について「このレシピは実現可能レシピ群の中で floral が上位何%か」を表示すれば、スタッフは直感的に見られます。一方で、これをアンケート点数と同じ心理尺度だと誤認させずに済みます。つまり、質問2の「倍率補正」は捨て、**質問3は『100正規化ではなく、50偏差＋順位併用』** に寄せるのが推奨方針です。citeturn24view0turn20view0

## 推奨する距離関数と組み合わせ最適化方法

質問5への答えは、**主指標は重み付き L1 距離**、補助として**順位ペナルティ**、必要に応じて**嫌悪軸ペナルティ**を足す、です。L1 は各軸のズレをそのまま足し上げるので解釈しやすく、一部の軸の大ズレが全体スコアを過度に支配しにくい、という実務上の利点があります。L2 は二乗のため、一つの軸の外れが強く効きます。コサインはグローバルスケールに不変で方向比較には便利ですが、ベクトルの大きさを無視するので、主指標にすると「方向は似ているが強弱が違う」ケースを見逃しやすいです。したがって、**L1 を主、コサインを補助的な再順位付けに使う**のが最もバランスがよいです。citeturn19view1turn18view2turn18view3turn10search0

推奨スコアは、概念的には次の形です。

```text
score(recipe, customer)
 = Σ_a w[a] * | qProfile[a] - rProfile[a] |
 + λ_rank * rankPenalty(qRank, rRank)
 + λ_neg  * dislikePenalty(qDev, rProfile)
 + λ_note * notePenalty(recipe)
```

ここで `w[a]` は顧客の偏りが強い軸ほど重くする重みで、たとえば `1 + α * |qDev[a]|` で十分です。`rankPenalty` は 5軸しかないので、重み付き Kendall を厳密実装してもよいですし、より簡単に**軸ペアの順序逆転数**でも十分です。順位相関の研究でも、上位の入れ替わりは下位より重大として扱うのが自然だとされています。つまり、質問5の選択肢の中では、**「50からの偏差比較」単独ではなく、「偏差比較を主体に、順位一致を補助で使う」** のが最も強いです。citeturn20view0

質問4の「原料単体ランキングではなく、3原料の全組み合わせ＋5%刻み比率探索にするのは妥当か」については、**はい、v1 として妥当**です。混合比率の問題は、一般の独立変数最適化ではなく、比率の総和が100%に固定される**混合設計**として扱うのが標準です。加えて、成分ごとの上限・下限があるなら、制約付き混合設計として扱うのが自然です。citeturn17view0

この方針は計算量の面でも扱いやすいです。3原料、5%刻み、3原料すべてを入れる前提なら、比率パターン数は 171 通り、0% を許すなら 231 通りです。したがって、材料数を `M` とすると候補数はおおむね `171 × C(M,3)` です。たとえば `M=60` なら約 585 万候補、`M=100` でも約 2765 万候補で、**オフライン前計算**なら十分現実的です。実運用では、全探索を毎回リアルタイムに行うより、**制約をかけた候補カタログを事前生成**し、来店前にはそのカタログに対してスコアリングだけする構成が安全です。これは質問4に対する実装上の最適解です。

ただし、5% 刻みは素材によっては粗すぎます。強いスパイス系や拡散の強い材料は、5% がすでに過大なことがあります。そのため v1 では、**5% 刻みで扱って問題ない素材だけを探索対象にする**か、素材ごとに `min_pct` を持たせて候補生成から除外するのがよいです。将来的に十分な履歴がたまったら、上位候補の近傍だけ 1–2% 刻みへ局所探索する拡張がよいでしょう。

## Top / Middle / Last 制約の扱いと DB保存値

質問6への答えは、**Top / Middle / Last 制約は入れるべきだが、最初は soft constraint にすべき**です。トップ・ミドル・ベースという分類には物理的な意味があり、トップは高揮発、ミドルは香りの本体、ベースは持続とフィキサティブ的役割を担います。一方で、文献でも伝統的な香料ピラミッドはあくまで簡略化であり、実際には全成分が最初から蒸発を始め、相互作用で時間変化は単純な階段にはなりません。だから、いきなり hard rule にすると良い候補を落としやすいです。citeturn7view1turn7view0

実務上は、制約を三層に分けるとよいです。**第一層は hard constraint** で、安全・法規・技術上の不可条件です。**第二層は soft constraint** で、開きの明るさ、ハートの厚み、ドライダウンの持続といった設計上のバランスです。**第三層は接客補正** で、その日の気分、用途、季節感などをスタッフが上書きします。v1 では、たとえば `notePenalty` として「トップ比率が低すぎる」「ベースがゼロで持続が弱すぎる」などを罰点化するだけで十分です。香水設計上の常識は必要ですが、最終的に人が調整する前提なら、それをアルゴリズムに100% 固定化しない方がよいです。citeturn7view1turn7view0

質問7の「比率の最小値・最大値・カテゴリ別上限」は、**必須**です。業界の安全基準では、素材ごとの禁止・制限・仕様があり、完成品カテゴリごとの上限濃度と、配方中で最も厳しい原料が最終使用上限を決めます。また、混合比率に追加制約がある場合は、混合実験でも制約付き混合設計として扱うのが標準です。従って、各原料に `min_pct`, `max_pct`, `potency_class`, `note_role`, `family`, `category_limit` を持たせ、候補生成の時点で hard filter してください。citeturn26view2turn26view1turn17view0

質問8の「おすすめ配合は1件だけか、上位3〜5件か」については、**スタッフには上位3件を標準表示**、高度表示で 5 件まで、を推奨します。推薦システムの実務では、最終提示が「best bet の少数候補」になる Top-N タスクが中核であり、多くの商用システムでも単一の予測値ではなく少数候補が提示されます。しかも香水推薦は文脈依存が強いので、あなたの業務フローでは「上位候補からスタッフが接客中に寄せる」方が、1件固定より失敗が少ないです。なお、3件は**多様化**してください。トップ3が全部ほぼ同じレシピでは意味が薄いので、主要2成分やノートファミリーが被りすぎないようにします。citeturn28search6turn25search0

質問9と質問11への答えは、**保存は raw / match / display / final を全部残し、公開情報と秘匿配合を分離する**です。再現性と障害解析のために、コード版・データ版・制約版をタグ付けできるようにするのが重要です。一般的な ML 運用ガイドでも、コード版・データ版・ビルド識別子の記録は、トラブルシュートとガバナンスに有効とされています。citeturn27view0

推奨保存項目は、少なくとも次です。

- `questionnaireAxesRaw`
- `questionnaireMatchAxes`
- `recommendedCandidates`（候補ID・スコア・順位・警告）
- `selectedRecommendedRecipeId`
- `rawRecipeAxes`
- `matchRecipeAxes`
- `displayRecipeAxes`
- `finalBlendRatios`
- `finalRawAxes`
- `finalMatchAxes`
- `finalDisplayAxes`
- `algorithmVersion`
- `materialPointVersion`
- `constraintVersion`
- `staffOverrideReason`
- `staffId`
- `publicProductSnapshot`（商品名、顧客向け5軸表示、物語ラベル）

そして配合比率は**顧客向けテーブルや API に出さない**ことです。`publicProductSnapshot` と `privateFormula` を分け、両者は opaque ID でのみ結び、スタッフ権限でのみ `privateFormula` を読めるようにします。これで、顧客には割合を見せず、スタッフだけが確実に再作成できます。

## スタッフ向け確認項目と実装疑似コード

質問10の「来店前におすすめ配合におかしなところがないか」を見るチェック項目は、**スコア妥当性・香水構造・安全制約・運用妥当性**の4群に分けると回しやすいです。トップ/ミドル/ベースの時間変化、安全上限、そして推薦の不確実性が実務上の主要な失敗要因なので、この4群で事前確認すると漏れが減ります。citeturn7view1turn26view2turn25search0

来店前チェックは、次の 10 項目を標準化するのがよいです。

1. **上位2軸が本当に反映されているか**。顧客の最上位軸と二位軸が候補レシピでも上位に来ているか。  
2. **明確な低評価軸が出すぎていないか**。たとえば sweet が明確に低いのに、レシピが sweet 高めになっていないか。  
3. **トップ・ミドル・ラストの骨格が破綻していないか**。開きだけ明るくて持続がない、あるいは重すぎて立ち上がりがない、など。  
4. **原料上限・カテゴリ上限・製品カテゴリ上限に触れていないか**。  
5. **5% グリッド由来の“入っているだけ成分”がないか**。存在しても寄与が薄く、設計上の意味がない成分は外した方がよい。  
6. **一成分の支配が強すぎないか**。特定の材料が家のスタイル意図なしに支配していないか。  
7. **候補間のスコア差が十分か**。1位と2位の差が極小なら「自信低」とみなし、必ず候補を複数確認する。  
8. **三原料が冗長すぎないか、逆に喧嘩していないか**。同系統3つの冗長配合や、開きとドライダウンが断絶する組み合わせを避ける。  
9. **スタッフが接客で動かせる余地があるか**。すでに上限ぎりぎりで、現場調整余地がない配合は扱いにくい。  
10. **保存再現に必要な秘匿データがそろっているか**。原料ID、比率、バージョン、顧客向け表示が整合しているか。  

実装疑似コードは、次の形が最も安全です。質問4〜9をまとめて実装できる最小構成になっています。

```python
AXES = ["floral", "fresh", "woody", "spicy", "sweet"]

def rank_desc(d):
    # rank 1 = largest
    return {
        k: i + 1
        for i, (k, _) in enumerate(sorted(d.items(), key=lambda x: x[1], reverse=True))
    }

def questionnaire_match_axes(questionnaire_axes_raw, axis_max_abs_delta):
    q_dev = {
        a: (questionnaire_axes_raw[a] - 50.0) / max(axis_max_abs_delta[a], 1e-6)
        for a in AXES
    }
    mean_dev = sum(q_dev.values()) / len(AXES)
    q_profile = {a: q_dev[a] - mean_dev for a in AXES}
    q_rank = rank_desc(q_profile)
    return q_dev, q_profile, q_rank

def compute_raw_recipe_axes(blend_ratios, ingredient_axes):
    # blend_ratios: {"ingredient_id": ratio}  ratio sum = 1.0
    out = {a: 0.0 for a in AXES}
    for ing_id, ratio in blend_ratios.items():
        for a in AXES:
            out[a] += ratio * ingredient_axes[ing_id][a]
    return out

def recipe_match_axes(raw_recipe_axes, feasible_recipe_stats):
    # feasible_recipe_stats[a] = {"median": ..., "iqr": ...}
    r_std = {
        a: (raw_recipe_axes[a] - feasible_recipe_stats[a]["median"]) /
           max(feasible_recipe_stats[a]["iqr"], 1e-6)
        for a in AXES
    }
    mean_std = sum(r_std.values()) / len(AXES)
    r_profile = {a: r_std[a] - mean_std for a in AXES}
    r_rank = rank_desc(r_profile)
    return r_std, r_profile, r_rank

def rank_penalty(q_rank, r_rank, q_profile):
    axes_sorted = sorted(AXES, key=lambda a: q_rank[a])
    penalty = 0.0
    for i in range(len(axes_sorted)):
        for j in range(i + 1, len(axes_sorted)):
            a, b = axes_sorted[i], axes_sorted[j]
            q_order = q_rank[a] < q_rank[b]
            r_order = r_rank[a] < r_rank[b]
            if q_order != r_order:
                top_bonus = 2.0 if min(q_rank[a], q_rank[b]) <= 2 else 1.0
                magnitude = abs(q_profile[a] - q_profile[b])
                penalty += top_bonus * (1.0 + magnitude)
    return penalty

def dislike_penalty(q_dev, r_profile, dislike_threshold=-0.25):
    penalty = 0.0
    for a in AXES:
        if q_dev[a] <= dislike_threshold and r_profile[a] > 0.0:
            penalty += (abs(q_dev[a]) * r_profile[a]) * 2.0
    return penalty

def note_penalty(blend_ratios, ingredient_meta, rules):
    # rules example:
    # rules = {
    #   "top":    {"min": 0.10, "max": 0.40, "mode": "soft"},
    #   "middle": {"min": 0.20, "max": 0.60, "mode": "soft"},
    #   "base":   {"min": 0.20, "max": 0.60, "mode": "soft"},
    # }
    shares = {"top": 0.0, "middle": 0.0, "base": 0.0}
    for ing_id, ratio in blend_ratios.items():
        role = ingredient_meta[ing_id]["note_role"]  # e.g. {"top":0.7,"middle":0.3,"base":0.0}
        for k in shares:
            shares[k] += ratio * role.get(k, 0.0)

    penalty = 0.0
    for k, cfg in rules.items():
        if shares[k] < cfg["min"]:
            penalty += (cfg["min"] - shares[k]) * 3.0
        if shares[k] > cfg["max"]:
            penalty += (shares[k] - cfg["max"]) * 3.0
    return penalty

def hard_constraint_ok(blend_ratios, ingredient_meta, product_category):
    ratio_sum = sum(blend_ratios.values())
    if abs(ratio_sum - 1.0) > 1e-9:
        return False

    for ing_id, ratio in blend_ratios.items():
        meta = ingredient_meta[ing_id]
        if ratio < meta["min_pct"] or ratio > meta["max_pct"]:
            return False
        if ratio > meta["category_limit"].get(product_category, 1.0):
            return False
    return True

def display_recipe_axes(raw_recipe_axes, axis_percentile_fn):
    # percentile mapping only for UI, not for scoring
    return {a: axis_percentile_fn[a](raw_recipe_axes[a]) * 100.0 for a in AXES}

def total_score(
    questionnaire_axes_raw,
    blend_ratios,
    ingredient_axes,
    ingredient_meta,
    axis_max_abs_delta,
    feasible_recipe_stats,
    product_category,
    note_rules,
):
    q_dev, q_profile, q_rank = questionnaire_match_axes(
        questionnaire_axes_raw, axis_max_abs_delta
    )

    if not hard_constraint_ok(blend_ratios, ingredient_meta, product_category):
        return None  # infeasible

    raw_axes = compute_raw_recipe_axes(blend_ratios, ingredient_axes)
    _, r_profile, r_rank = recipe_match_axes(raw_axes, feasible_recipe_stats)

    weights = {
        a: 1.0 + min(abs(q_dev[a]), 1.0)
        for a in AXES
    }

    axis_loss = sum(weights[a] * abs(q_profile[a] - r_profile[a]) for a in AXES)

    score = (
        axis_loss
        + 0.8 * rank_penalty(q_rank, r_rank, q_profile)
        + 1.2 * dislike_penalty(q_dev, r_profile)
        + 1.0 * note_penalty(blend_ratios, ingredient_meta, note_rules)
    )
    return score, raw_axes

def generate_candidates(ingredient_ids):
    # 5% grid, all 3 ingredients present:
    # x+y+z=100, x,y,z in {5,10,...,90}
    # => 171 patterns
    for i in range(len(ingredient_ids)):
        for j in range(i + 1, len(ingredient_ids)):
            for k in range(j + 1, len(ingredient_ids)):
                triplet = [ingredient_ids[i], ingredient_ids[j], ingredient_ids[k]]
                for x in range(5, 100, 5):
                    for y in range(5, 100 - x, 5):
                        z = 100 - x - y
                        if z < 5 or z % 5 != 0:
                            continue
                        yield {
                            triplet[0]: x / 100.0,
                            triplet[1]: y / 100.0,
                            triplet[2]: z / 100.0,
                        }

def recommend_top_k(..., k=3):
    scored = []
    for blend_ratios in generate_candidates(...):
        result = total_score(...)
        if result is None:
            continue
        score, raw_axes = result
        scored.append((score, blend_ratios, raw_axes))

    scored.sort(key=lambda x: x[0])

    # diversify near-duplicate candidates
    top = diversify_top_k(scored, k=k)

    return top

def save_recommendation_run(...):
    # save questionnaireAxesRaw, questionnaireMatchAxes, top candidates,
    # chosen candidate, versions, warnings, displayRecipeAxes
    pass

def save_final_formula(final_blend_ratios, ...):
    final_raw_axes = compute_raw_recipe_axes(final_blend_ratios, ingredient_axes)
    final_display_axes = display_recipe_axes(final_raw_axes, axis_percentile_fn)
    # save finalBlendRatios, finalRawAxes, finalDisplayAxes, versions, staff memo
    pass
```

この疑似コードの意図は、**raw を保存しつつ、比較は transformed space で行い、表示はさらに別変換にする**ことです。これにより、「比較の意味」と「UIの見やすさ」と「再現性保存」をきれいに分離できます。距離計算に入る前に制約で候補を落とし、最後に上位 3 件を出す構成なので、スタッフ運用にも乗せやすいです。citeturn18view1turn19view1turn17view0turn28search6

## 現行実装からの移行手順

質問12への答えとして、移行は **加算的スキーマ変更 → 候補カタログ前計算 → shadow mode → feature flag 付き段階公開** の順が安全です。一般的な運用ガイドでも、コード版・データ版・ビルド識別子のタグ付け、既存判断に影響を与えない shadow 比較、本番での段階露出と即時ロールバック可能なフラグ制御は、品質とガバナンスの両立に有効とされています。citeturn27view0turn27view2turn27view1

推奨手順は次の通りです。

1. **現行ロジックを凍結する。**  
   アンケート delta テーブル、原料ポイント、原料ID をまず version 固定します。ここでは一切ロジックを変えません。

2. **DB を加算的に拡張する。**  
   既存テーブルを壊さず、`recommendation_run`, `recipe_catalog`, `final_formula`, `public_product_snapshot` を追加します。顧客向け API には新しい配合比率列を絶対に出しません。

3. **原料メタデータを整備する。**  
   `min_pct`, `max_pct`, `note_role`, `family`, `potency_class`, `category_limit`, `active_flag` を持たせます。ここがないと探索が暴れます。

4. **制約付き候補カタログをオフライン生成する。**  
   3原料×5% 刻みで feasible recipe を前計算し、`rawRecipeAxes` と軸統計量（median / IQR / percentile 関数）を保存します。

5. **新スコアラーを shadow mode で並走させる。**  
   現行のおすすめはそのまま使いながら、裏で新方式の Top 3 とスコア、警告、1位-2位差、スタッフ override 想定理由をログします。この段階では判断に使わず、比較だけします。citeturn27view0

6. **スタッフ専用 UI を feature flag で解放する。**  
   最初は一部のスタッフだけに、Top 3、注意フラグ、候補間差分、非表示の再現情報を見せます。問題が出たら flag を即時 OFF にして戻せるようにします。citeturn27view2turn27view1

7. **評価指標を決める。**  
   少なくとも、`hard constraint 違反率`, `スタッフ override 率`, `recommend→final の編集距離`, `1位と2位のスコア差`, `所要時間`, `再作成成功率` を見ます。ここで「妙な候補」がどこから出るかを炙り出します。

8. **限定的に canary rollout する。**  
   店舗、スタッフ、時間帯などで限定し、徐々に利用範囲を増やします。旧方式は常に fallback として残します。citeturn27view0

9. **正式切替後も raw と final を継続蓄積する。**  
   `questionnaireAxesRaw`、推薦候補、選ばれた候補、最終配合、スタッフ修正理由、簡易満足度を蓄積します。記述プロファイルと受容データをつなぐ履歴が、あとで初めて校正に使えます。citeturn21view0

10. **十分な履歴がたまったら、初めて校正モデルへ進む。**  
    その時点で、`qProfile -> chosen/final recipe` の写像を学習し、軸重みや notePenalty をデータで再推定します。そこではじめて、5% より細かい局所探索や、素材相互作用の補正を検討します。

この移行順なら、最初のリリースでは**探索方法だけ**を改善し、感性モデルの意味づけを変えずに安全に前進できます。そして十分なログが集まった段階で、はじめて「嗜好5軸」と「配合由来5軸」の橋渡しを、経験則ではなくデータで校正できます。現段階でいきなりそこまで行こうとせず、**スタッフ支援の精度向上**を第一目標に置くのが最も堅実です。citeturn27view0turn25search0turn21view0