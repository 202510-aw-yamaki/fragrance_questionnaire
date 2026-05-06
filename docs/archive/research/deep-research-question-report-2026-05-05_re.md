# 香りワークショップ向けの運用・安全・保存設計の調査レポート

## 調査結論の要約

最大の事故ポイントは、5軸スコアそのものよりも「その候補が安全に扱えるか」「その候補が法的に提供・再作成できるか」「その候補をスタッフが誤読せず使えるか」にあります。とくにentity["country","日本","east asia"]国内で、事業者が人に使うオーダーメイド香水を調合して販売するケースについて、entity["organization","厚生労働省","japan health ministry"]の公開回答は、既に届出済みの香料や香水を混ぜた場合でも、調合後の香水は別品目と解され、品目ごとの承認又は届出が必要だと示しています。逆に、あらかじめ組合せを決めて、その組合せ数に応じた届出を行っておけば、届出済み品の中から顧客の希望に応じて選んで提供することは可能だとされています。したがって、推薦ロジックで広く候補を出すことと、実際に販売・再作成できる式を管理することは、必ず分けるべきです。citeturn18view0turn17view1

安全制約は一層では足りません。実装上は、原料ごとに国内の化粧品基準、 finished product 基準での使用上限、原料供給者のSDSとGHS、火気・保管上の制約、自然複合原料に含まれる制限対象成分の寄与、使用上の注意文言、手動レビュー要否を重ねて持つ必要があります。entity["organization","IFRA","fragrance standards body"]は上限を「香料ミックス中」ではなく「最終消費者製品中」の濃度として扱い、製品カテゴリ別に管理するよう求めています。また、同基準は自然複合原料について、原料自体の基準と、その中の個別制限成分の両方を考慮し、より厳しい方で判定する考え方を示しています。国内側では、化粧品基準が配合禁止・配合制限を定め、労働安全衛生法系のルールはSDS対象物の表示・通知・リスクアセスメントを求め、危険物の保管は数量により消防法と市町村条例の対象になります。citeturn40view0turn17view3turn20view0turn21view0turn21view1

Top / Middle / Last は、第一段階では hard constraint よりも soft penalty として扱うのが現実的です。古典的な調香教育では、トップ・中間・ベースの比率が持続性や香りの展開に強く影響し、ベースが少なすぎるとtenacityが不足するとされていますが、同時に「絶対ルール」は置きにくく、役割は原料量や組合せで変わり得ます。実務上は、各原料に単一ラベルではなく `note_role = {top, middle, last}` の連続値を持たせ、その合成結果に対して「トップ弱い」「ラスト弱い」を警告する設計が向いています。citeturn28view0turn29view2turn30view0

スタッフ提示は1件固定より、冗長でない Top 3 の方が安全です。ただし、その3件は単純な上位3件ではなく、関連性と多様性を一緒に見て再順位付けする必要があります。これは推薦システム分野で古くから使われる Maximal Marginal Relevance の考え方と整合的で、関連度を維持しつつ重複を減らす再ランキングが有効です。香り候補でも、同一3原料・同一主原料・ほぼ同一比率を抑制する分散選抜が実務向きです。citeturn32search0turn32search9turn31search14

## 安全・法規・上限制約の実装方針

まず結論から言うと、`min_pct`, `max_pct`, `category_limit`, `restriction_note`, `allergen_note`, `safety_review_required` は、すべて持つべきです。ただし `category_limit` を単一数値にしてしまうと足りません。IFRAは上限を finished product の用途カテゴリごとに定めており、同じ原料でも fine fragrance と hair leave-on で許容度が変わります。また、ワークショップで扱う「perfume kits and fragrance mixtures for cosmetic kits」は Category 4 に置かれています。したがって、少なくとも `limits_by_scope = {jurisdiction, source, version, end_use_category, max_in_finished_product}` の形で持つのが妥当です。将来 hair mist や room spray を扱うなら、同じ材料でも別上限になります。citeturn17view0turn18view1turn40view0

原料マスタには、識別情報、供給者情報、安全情報、法規情報、使用情報を分けて持つのがよいです。実装上の最低限は、`material_id / 表示名 / CAS / supplier / SDS参照 / GHS分類 / flash_point / storage_class / material_family / note_role_top / note_role_middle / note_role_last / min_pct / max_pct / ifra_limits / ifra_amendment / ifra_certificate_ref / jp_cosmetic_status / jp_limit_basis / restriction_note / allergen_note / safety_review_required / reviewed_at` です。自然複合原料や精油では、原料そのもののIFRA判定だけでは不十分で、IFRAが示すように constituent ベースの制限成分も見る必要があるので、`restricted_constituent_profile` も持っておく方が安全です。citeturn40view0turn40view1

hard constraint に入れるべき条件は、感性ではなく「越えると売れない・危ない・追跡不能になる」条件です。具体的には、国内基準で配合禁止の物質、国内の配合上限超過、IFRAの該当 finished product カテゴリ上限超過、`safety_review_required = true` の未審査原料、SDS/供給者証明が未整備の原料、`min_pct` 未満や `max_pct` 超過、そして「この配合が日本で実販売・再作成可能な届出済み式に紐づかない」場合です。特に最後の点は重要で、推薦候補としては存在できても、注文確定・再作成確定へは進ませない設計にしないと、現場で“良い候補なのに売れない”事故が起きます。citeturn18view0turn17view1turn17view3turn40view0

一方、スタッフ確認で足りる条件は、香りの解釈や接客で補正しうるものです。甘さ・重さの出過ぎ、トップの弱さ、持続の弱さ、顧客メモとのズレ、候補間の差の小ささ、3原料だけでは構造が単調になりそうな点は、警告として出し、人が判断すべきです。これらは規制違反ではなく、接客品質の問題だからです。citeturn28view0turn30view0

法規面では、第三者からの作成依頼や再作成依頼をQRやWebで受けるなら、entity["organization","消費者庁","japan consumer agency"]の特定商取引法ガイドに沿って、販売業者名、住所、電話番号、価格、支払方法・時期、引渡時期、返品条件などの表示と、最終確認画面の要件を満たす必要があります。加えて、誇大広告や消費者を誤認させる表示は避ける必要があります。citeturn11search0turn11search1turn11search3turn11search4

顧客情報の扱いでは、アンケート回答、メモ、過去注文、再作成履歴はすべて個人情報です。もしアレルギー歴、肌トラブル歴、妊娠中などの健康に近い情報を取るなら、厳密には要配慮個人情報に該当するかの法的整理を別途要しますが、少なくとも暫定実装では、entity["organization","個人情報保護委員会","japan privacy regulator"]の考え方に沿って利用目的の明示、過剰取得の回避、アクセス制御、安全管理措置、漏えい時の報告・本人通知の体制を先に整えるべきです。健康情報に近い項目は、通常の嗜好情報より厳格に扱うべきです。citeturn9search0turn10search0turn12search2

ワークショップ現場の安全では、店頭で使うエタノールや香料原料がSDS対象なら、表示・SDS・リスクアセスメントが必要です。危険有害性のある化学物質を扱う事業場は、業種や規模にかかわらず対象となり、引火・爆発リスクと健康有害性リスクの両方を評価対象にします。保管については、指定数量以上は消防法の対象で、指定数量未満でも位置・構造・設備の基準を市町村条例が定めます。エタノール等のアルコール類は第四類危険物で指定数量が定められています。entity["organization","消防庁","japan fire agency"]の法令抜粋でも、指定数量以上の危険物は所定の場所以外で保管・取扱いできず、数量合算ルールもあります。citeturn20view0turn20view1turn21view0turn21view1

最後に、広告・説明文は「香りの印象」を伝える範囲に留めるのが安全です。entity["organization","日本化粧品工業連合会","japan cosmetics industry"]の広告ガイドラインと厚労省通知は、化粧品の効能効果表現には範囲があり、安全性保証や医薬品的表現は不可と整理しています。したがって、QR商品ページの説明文は「軽やかなフローラル」「落ち着いたウッディ」などの感性的表現に寄せ、「肌トラブルを防ぐ」「アレルギーが出にくい」のような表現は避けるべきです。citeturn15search3turn15search7turn41search3

## Top / Middle / Last 制約の推奨初期値

Top / Middle / Last に、最初から厳しい固定比率を課すのは勧めません。歴史的な調香教育では、トップ・修飾・ベースの比率が香りの持続や展開を大きく左右し、ベースが20%、修飾が30%、トップが50%のような組成は持続性を欠くと説明されています。一方で、その同じ文脈で「絶対的なルールを立てにくい」こと、修飾は20〜25%を超えすぎない方がよいこと、そして同じ素材でも配合量次第で modifier にも base にもなり得ることが示されています。citeturn28view0turn29view2

そのため、実装では `note_role = {top, middle, last}` を各原料に持たせ、レシピ全体の `structureScore` を  
`top = Σ(pct_i × role_top_i)`、`middle = Σ(pct_i × role_middle_i)`、`last = Σ(pct_i × role_last_i)`  
のように計算し、最終的に正規化して見るのがよいです。これは、香りの役割が離散的ではなく連続的だという教育上の知見とも整合します。実際、調香教育のA-Z分類でも、トップ・ミドル・ラストは“roughly” の配置であり、厳密にすべてを単純分類できるわけではないとされています。citeturn30view0

初期値として置くなら、hard range ではなく soft target を3種類ほど持つのが実務向きです。第一実装の既定値は、**標準型**を `top 0.20–0.35 / middle 0.25–0.50 / last 0.25–0.50`、中心を `0.25 / 0.40 / 0.35` に置くのが無難です。**軽め提案**は `0.30 / 0.40 / 0.30`、**深め提案**は `0.20 / 0.35 / 0.45` を中心にすると、Top 3 の比較もしやすくなります。これは規制値ではなく、3原料構成でも“立ち上がり・芯・余韻”の最低限を見失わないための運用テンプレートです。citeturn28view0turn30view0

hard constraint にしてよいのは、「どれかが極端にゼロに近い」ケースだけです。たとえば `top < 0.08` なら立ち上がり警告、`last < 0.12` なら余韻警告、`middle < 0.15` なら香りの芯が弱い警告にし、それ以外はペナルティで十分です。3原料だけでは香水構造が弱くなりやすいので、構造不足を塞ぐために比率を無理に縛るより、スタッフ画面で「この候補は3原料のため転調が少なめ」と見せる方が現場に合います。citeturn28view0turn30view0

## スタッフ向け警告項目と文言例

警告は、**info / caution / warning** の3段階で分けるのがよいです。`warning` は安全・法規・販売可否に関わるもの、`caution` は調香構造や接客で要確認のもの、`info` は比較選定を助けるものに限定すると、スタッフが「今止めるべきか」「今聞けばよいか」を即座に判断できます。citeturn19view0turn20view0turn21view0

`info` の文言は、迷わせず次の行動を促す短文が向いています。たとえば「**1位と2位が近いです。店頭で第一印象を確認してください**」「**似た候補が多いです。好き・苦手を一つ追加で聞くと選びやすくなります**」「**この候補は標準寄りです。比較用に軽め候補も確認できます**」です。これはスコア差が小さい時や、多様化後も候補が近い時の案内に使えます。citeturn32search0turn31search14

`caution` は嗜好ズレと構造ズレに使います。文言は専門語を避け、「何が起きそうか」が先に来る方が伝わります。実務上の候補は、  
「**甘さがやや強めです。軽さを好む場合は調整候補です**」  
「**スパイス感がやや強めです。やわらかさ希望なら確認が必要です**」  
「**トップが弱めです。最初の印象が穏やかに出る可能性があります**」  
「**余韻が短めです。持続感を重視する場合は調整候補です**」  
「**香りの芯がやや細いです。3原料では深みが不足する可能性があります**」  
「**この原料は上限に近いです。増量前に管理情報を確認してください**」  
「**顧客メモと方向性が少しずれています。ヒアリングを優先してください**」  
が使いやすいです。citeturn28view0turn30view0turn40view0

`warning` は「その場で止める」通知です。たとえば、  
「**安全確認待ちの原料が含まれます。責任者確認前は提案しないでください**」  
「**この配合は販売条件を満たしていません。候補比較のみ可、注文確定は不可です**」  
「**法定表示の確認が未完了です。再作成受付は保留してください**」  
「**副作用対応の確認対象です。過去履歴を確認してください**」  
のように、行動制限を明記します。曖昧な赤字表示より、何を禁止するかを文面に含める方が現場事故を減らせます。citeturn18view0turn19view0turn41search5turn33search7

UI上は、1行目を短文、2行目を「理由」または「確認先」に分けると効果的です。例として、「トップが弱めです。」を1行目、「fresh系を好むか口頭確認してください。」を2行目にします。専門家でないスタッフにも伝わる言葉に絞るなら、「トップ」「ラスト」だけは残してよく、代わりに説明欄で「最初の印象」「あと残り」と補うのが現実的です。citeturn28view0turn30view0

## Top 3候補の多様化ルール

Top 3 は、単なるランキングではなく「比較しやすい選択肢セット」にすべきです。最初に relevance だけで上位20〜30件を作り、その後に diversity 再ランキングをかける二段階方式がよいです。検索・推薦分野では、MMRのように「関連度」と「既に選んだ候補との非類似性」を両立させる再順位付けが定番です。香り候補でも同じ発想で、スタッフに見せる直前だけ diversity を効かせるのが扱いやすいです。citeturn32search0turn32search9turn31search14

香り候補の類似度は、ひとつの尺度にまとめすぎない方がよいです。実務上は、  
**原料集合の重なり**、**上位2原料の一致**、**比率差**、**5軸方向の近さ**、**ファミリーの近さ**  
の5つを併用するのがよいです。  
具体的な除外ルールは、**同一3原料かつ比率差が合計10ポイント未満なら1件だけ残す**、**同じ上位2原料の候補はTop 3内で1件まで**、**同一主原料の候補は原則2件まで**、**同一ファミリー3件独占は避ける**、の4つで十分に効きます。citeturn32search0turn31search14turn32search23

表示の仕方は「近い候補を3つ」より、「本命・軽め・深め」の3本立てが選びやすいです。最上位を**本命**にし、2件目は first impression が少し明るい方向に、3件目は余韻が少し深い方向に寄せます。顧客との会話で「最初の印象を明るくしたいですか」「もう少し落ち着かせたいですか」と分岐しやすくなるからです。これにより、スタッフは接客中に「好みのズレ」を調整しやすくなります。citeturn28view0turn30view0turn32search0

もし多様化ルールを適用しても十分に差が出ないなら、無理に3件出さない方がよいです。その場合は2件だけ表示し、「**近い候補が多いため、今回は2案に絞っています**」という info を添える方が、見かけ上の選択肢を増やすより安全です。香りでほとんど差のない3件を並べると、スタッフの時間を奪うだけでなく、根拠の薄い後出し調整につながります。citeturn32search9turn31search14

## DB保存設計

保存設計は、少なくとも **material master**, **recommendation run**, **candidate recipe**, **private formula**, **public product snapshot**, **regulatory label snapshot**, **order / reorder request**, **safety event** の8層に分けるのがよいです。ここで重要なのは、候補生成の痕跡、最終選定の理由、再作成に必要な秘匿式、顧客公開用の見せ方、法定表示用の文面を、同じレコードに混ぜないことです。副作用報告やPL対応では、いつ、どの式で、どの注意表示で、何を渡したかを遡れないと弱いからです。citeturn19view0turn8search1

`recommendation_run` には、`recommendationRunId`, `questionnaireAnswerSnapshot`, `questionnaireAxesComparable`, `customerMemoSnapshot`, `algorithmVersion`, `materialPointVersion`, `constraintVersion`, `generatedAt`, `reviewStatus`, `reviewedBy`, `reviewedAt` を入れるのが基本です。これは、後から「この候補はなぜ出たのか」を説明し、ロジック改善前後の比較や事故調査を可能にするためです。これは法文に書かれた必須項目ではありませんが、IFRA改定・基準変更・副作用調査・PL責任への対応を考えると、事実上の必須トレーサビリティです。citeturn40view0turn19view0turn8search1

`candidate_recipe` には、`candidateId`, `materialIds`, `materialPcts`, `rawRecipeAxesComparable`, `displayRecipeAxes`, `structureScoreTop`, `structureScoreMiddle`, `structureScoreLast`, `distanceScore`, `warningSummary`, `sellableFlag`, `sellableReason`, `notificationOrSkuRef`, `rankBeforeDiversify`, `rankAfterDiversify` を持たせるのがよいです。ここで `sellableFlag` を明示的に分けることが重要です。推薦として近くても、届出済み式に乗らないなら売れないためです。citeturn18view0turn17view1

`privateFormula` は、スタッフ専用の再作成レコードです。`selectedCandidateId`, `finalMaterialPcts`, `finalAxes`, `staffOverrideReason`, `staffOverrideDelta`, `scaledBottleSizeRule`, `formulaHash`, `encryptionVersion`, `lastAccessedAt`, `accessAuditLog` を入れてください。`staffOverrideReason` は「顧客が甘さを弱めたいと希望」「トップ弱めを補正」など短文で構いません。個人情報保護上、式そのものは暗号化保存し、閲覧権限を絞るべきです。citeturn9search0turn12search2

`publicProductSnapshot` は、顧客に見せる表現専用です。`publicProductId`, `publicName`, `customerFacingAxes`, `fragranceDescription`, `usageGuide`, `createdAt`, `reorderToken`, `requestFormLink`, `publicSnapshotVersion` を入れ、原料名・比率・内部スコア・rawRecipeAxes は入れません。顧客に見せる5軸値は、比較やDB保存のための内部軸とは別に持つ前提が安全です。ここはマーケティング表現なので、効能保証や医薬品的表現を防ぐため、説明文テンプレートにも version を振る方がよいです。citeturn15search3turn15search7

そのうえで、**第三のスナップショット**として `regulatoryLabelSnapshot` を強く推奨します。これは `labelName`, `ingredientDisplay`, `cautionText`, `manufacturerOrMarketingAuthorizationHolder`, `address`, `lotOrTraceCode`, `labelVersion` を持つ、法定表示・実ラベル専用の保存物です。顧客向けQRページは配合を見せない前提でも、物理製品の表示ルールは別です。全成分表示では香料は「香料」とまとめて表示できる一方、名称や注意表示、製造販売業者情報などは別に管理が必要です。つまり、**public page** と **legal label** を同一コンテンツ管理にしてはいけません。citeturn41search0turn41search5turn33search7turn15search0

`safety_event` には、`eventId`, `publicProductId`, `privateFormulaRef`, `lotOrTraceCode`, `eventDate`, `symptomSummary`, `severity`, `medicalFollowUp`, `actionTaken`, `reportedToPMDAFlag`, `pmdaReportRef` を持たせるのがよいです。化粧品の副作用報告は、既知・未知や重篤度に応じて15日・30日ルールがあり、販売店や使用者等からの情報でも医師判断を求める努力が求められています。現場運用として、問い合わせフォーム・店舗記録・法定報告の橋渡しができるデータ構造が必要です。entity["organization","PMDA","japan drug device agency"]への報告対応まで見越しておくべきです。citeturn19view0

## 顧客公開情報とスタッフ秘匿情報の分離方針

分離方針は、**公開用**, **法定表示用**, **秘匿再作用** の3系統にするのが最も事故が少ないです。`publicProductSnapshot` は顧客体験、`regulatoryLabelSnapshot` は法令対応、`privateFormula` は再作成と監査のための内部資産です。この3つを混ぜると、「秘密を守るために必要な法定表示が欠ける」「法定表示をQRページにそのまま出してUXが崩れる」「スタッフ権限が漏れて配合が見える」といった別種類の事故が同時に起こります。citeturn41search0turn41search5turn33search7turn9search0

顧客向けQR商品ページに表示してよいのは、商品名、顧客向け5軸表示、香り説明文、使用上の基本注意、作成依頼フォーム、問い合わせ導線までです。もしQRページから再作成依頼を受けるなら、販売条件や返品条件などは別ページでもよいので到達しやすく置く必要があります。citeturn11search1turn11search3turn11search4

顧客向けに表示してはいけないものは、原料名、原料比率、内部スコア、候補の順位ロジック、rawRecipeAxes、制約詳細、未確定の安全レビュー情報です。これは単なる営業秘密の保護だけでなく、未確認の制約情報を誤って顧客に見せないためでもあります。とくに `rawRecipeAxes` や制約詳細は、顧客価値より内部調整価値の方が高く、公開メリットが小さい割に誤解を生みやすいです。citeturn40view0turn15search3

スタッフだけが再作成できる設計には、RBAC、閲覧監査ログ、式の暗号化保存、式を平文で出さないAPI、`reproductionAllowedRole`, `formulaHash`, `accessedBy`, `accessedAt`, `overrideReason` などの監査列が必要です。加えて、再作成のたびに “同一式をそのまま出したか”“同一候補から微修正したか” を追えるよう、`sourceFormulaId` と `derivedFromFormulaId` を別に持つと、将来のロジック改善や事故対応で効きます。これはAPPIの安全管理措置と、PL・副作用対応の双方に効く設計です。citeturn12search2turn8search1turn19view0

## 実装時の優先順位と専門家確認事項

優先順位の第一は、候補生成の精度改善ではなく、**売れる候補と売れない候補を分けるゲート**の実装です。最初にやるべきは material master の安全属性整備、`safety_review_required` の運用、`sellableFlag` の導入、`public / private / regulatory` スナップショット分離です。これがないまま推薦ロジックだけ先に賢くすると、現場で“最適候補が法的に出せない”状態になります。citeturn18view0turn17view1turn40view0

第二は、スタッフの事前確認UIです。来店前確認の画面には、Top 3、多様化ラベル、本命/軽め/深め、警告レベル、上限接近、顧客メモとの矛盾、販売可否を一画面で見せる方がよいです。特に `warning` は候補カードの中ではなく画面上部の固定領域に置いた方が見落としにくくなります。ここまでできてから、候補の探索空間や距離関数の改善に進むのが安全です。citeturn32search0turn31search14turn19view0

第三は、QR作成依頼・再作成依頼の法務導線です。QRページから申し込みを受けるなら、特商法表示、最終確認画面、プライバシーポリシー、利用目的、問い合わせ導線、履歴照合トークンを整備してください。個人情報に健康情報が混ざるなら、同意文言の設計を後回しにしない方がよいです。citeturn11search0turn11search1turn9search0turn10search0

専門家確認が必要な点は、はっきり分けるべきです。最優先は、**あなたの具体的な運営形態が、どこまで化粧品の製造販売に当たるか**です。今回見つかった厚労省の公開回答は「事業者が顧客入力情報に基づきオーダーメイド香水を製造販売する」ケースには直接当たりますが、**顧客が店頭で自ら混ぜる体験型ワークショップ**のすべての変種まで明示した一般公開資料は見当たりませんでした。したがって、店頭セルフミックス、事後発送、再作成委託のそれぞれについて、薬機実務に詳しい弁護士や薬事コンサルに確認すべきです。citeturn18view0

その次に必要なのは、**法定表示と香料一括表示の実務確認**、**各原料のIFRAカテゴリ判定と国内基準の突合**、**危険物保管数量と換気・作業環境管理**、**アレルギー・肌トラブル申告をどこまで取るかとその同意文言**です。ここはシステムで先回りできる部分は多い一方、最終責任は評価者・製造販売責任側に残ります。したがって、実装は「専門家が判断しやすい情報を揃える」ことを目標にし、自動で最終決定する設計にはしない方が、今回の目的に最も合っています。citeturn40view0turn41search5turn20view0turn21view0turn12search2