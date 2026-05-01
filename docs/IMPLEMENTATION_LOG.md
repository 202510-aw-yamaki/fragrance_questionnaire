# Implementation Log

このファイルは、作業実装の記録用です。
`docs/00_PROJECT_CORE.md` から `docs/06_OPEN_ISSUES.md` までの正本仕様を置き換えるものではありません。
正本資料への追記を増やしすぎないため、実装したファイル、判断、未対応範囲をここに集約します。

## 2026-04-29

### トップページの質問プレビュー・基本情報の再構成

- 対象: `index.html`, `css/top-reference-layout.css`
- 参照: `レイアウトimg/01. index.html トップページ.png`
- 実装:
  - 質問プレビューを旧スクリーンショット画像の差し込みから、HTML/CSSで作るPCプレビュー + レーダー/スライダー構成へ変更。
  - 基本情報エリアを、看板・料金表・駅写真のラスター画像依存から、HTMLカード、料金カード、アクセスカード、地図iframeの構成へ変更。
  - hero-gallery へ旧プレビュー画像をJSで差し込む処理を停止。
- 未対応:
  - トップ全体の全セクション再設計は継続作業。今回の変更はユーザー指摘箇所の旧画像依存排除とレイアウト寄せ。

### STEP1通常設問のver.1.1反映

- 対象: `js/fragrance-master-data.js`, `customer/questionnaire.html`, `customer/questionnaire_step2.html`, `css/customer-survey-layout.css`, `docs/SURVEY_SCORING_LOGIC.md`, `ユーザー設定フォルダ/Supabase設定項目.txt`
- 参照: `deep-research-report-ver.1.1.md`, `レイアウトimg/04. customer questionnaire.html 初回アンケートページ.png`, `レイアウトimg/05. customer questionnaire_step2.html 分岐後アンケートページ.png`
- 実装:
  - STEP1初期設定をA/B/C/D + `ALL` / `NONE` の6択に更新。
  - `SCORING_LOGIC_SOURCE` を `deep-research-report-ver.1.1.md`、`SCORING_LOGIC_VERSION` を `2026-04-29` に更新。
  - 古い active `scoring_configs` がD未対応のまま採用されないよう、互換チェックに `step1ScoreMap.Q1.D` を追加。
  - `customer/questionnaire.html` のSTEP1表示文言をver.1.1方針に更新し、選択肢背景の旧画像参照を外した。
  - `customer/questionnaire_step2.html` の選択肢背景画像は描画しないようにし、文字を優先するカード表示へ寄せた。
  - Supabase側で active `scoring_configs` の再保存が必要になる可能性をユーザー設定メモに追記。
- 未対応:
  - STEP1/STEP2専用の新規生成画像差し込みは未実施。まず旧画像依存を外し、読めるカードとして整えた。

### 管理系ページのレイアウト調整

- 対象: `admin-login.html`, `admin/admin-settings.html`, `admin/admin-scoring.html`, `admin/admin-materials.html`
- 追加: `css/admin-phase7-ui.css`
- 実装:
  - 既存HTMLとインラインCSSは残し、外部CSSを後勝ちで読み込む構成にした。
  - ログイン、基本設定、配点ロジック、原料ポイントの管理系画面をレイアウト画像13/22/23/24へ寄せた。
  - レイアウト画像25のQR商品設定は、現状の `admin-settings.html` 内 `portal-qr-settings-panel` を対象として見た目を調整。
  - Auth、RLS、DB保存、配点JSON、原料保存、QR公開設定のロジックは変更していない。
- 未対応:
  - QR商品設定の専用ページ化、実メール送信、通知対応済み操作は後続フェーズ扱い。

### スタッフ運用ページのレイアウト調整

- 対象: `staff/staff-reservations.html`, `staff/staff-slots.html`, `staff/staff-customer-detail.html`
- 追加: `css/staff-phase7-layout.css`
- 実装:
  - 既存の巨大なインラインCSSは削除せず、`</style>` 直後の外部CSSで後勝ち調整。
  - 予約一覧、予約枠作成、スタッフ専用詳細の3ページを、レイアウト画像15/16/17のカード・ヘッダー・業務画面構成へ近づけた。
  - 既存IDとJS生成クラスを維持し、DB接続・予約状態更新・QR生成条件のロジックは変更していない。
- 未対応:
  - 香りのバランス調整モーダル、商品名入力モーダル、同意確認モーダルの専用フロー分離は後続作業。

### QR商品作成依頼ページの表示指摘対応

- 対象: `customer/product-reservation.html`, `css/qr-product-page.css`
- 実装:
  - 数量入力を10ml/30mlの横並び2カラムに調整。
  - `request-stage` の強制的な100vh配置をやめ、カード高さが不要に伸びないように調整。
  - 注意枠内の電話番号・営業時間が縦に崩れないよう、連絡先表示の折り返しを抑制。
- 未対応:
  - QRの作成可否判断、発送先入力、発送完了、通知対応済み操作は引き続き後続フェーズ扱い。

### 現在の作業フェーズ

- `docs/05_IMPLEMENTATION_ROADMAP.md` 上は、既存のQR依頼受付導線を見た目として整える `Phase 7: UI改善・仕上げ` の作業として扱う。
- QRの作成可否判断、発送先入力、発送完了、通知対応済み操作は `Phase 5: 通知・期限・管理者設定` 側の後続作業として残す。
- 会員ページの過去完成品との差分表示、過去完成品をもとにした再予約UIは `Phase 6: 会員ページ改善` の残タスクとして残す。

### QR商品作成依頼ページ

- 対象: `customer/product-reservation.html`
- 追加: `css/qr-product-page.css`
- 参照: `レイアウトimg/11. customer product-reservation.html QR商品作成依頼ページ.png`
- 実装:
  - 参照画像をページ内に差し込まず、後勝ちCSSでカード、価格行、数量ステッパー、依頼内容、メール入力、CTA、注意枠の見た目を調整。
  - 既存JSが参照する `product-name`, `price-10ml`, `price-30ml`, `quantity-10ml`, `quantity-30ml`, `request-summary`, `request-total`, `requester-email`, `submit-request`, `request-status`, `shop-phone`, `business-hours` は維持。
  - 数量行はラベルとステッパーの横並び2カラムを維持するCSSに調整。
  - 注意枠の疑似アイコンを絶対配置にし、電話番号と受付時間が縦に割れないように調整。
  - ヘッダーを固定配置にし、中央カードがビューポート内に収まりやすい高さへ調整。
- 未対応:
  - 作成可否判断、発送先入力、発送完了、通知対応済み操作は実装しない。

### 会員ログイン・会員トップページ

- 対象: `customer/customer-login.html`, `customer/index.html`
- 追加: `css/customer-portal-layout.css`
- 参照:
  - `レイアウトimg/02. customer login.html 会員ログインページ.png`
  - `レイアウトimg/03. customer index.html 会員トップページ.png`
- 実装:
  - 参照画像をページ内に差し込まず、後勝ちCSSで会員ログインと会員トップの背景、カード、ボタン、履歴リストの見た目を調整。
  - 既存JSが参照する `customer-login-form`, `setup-button`, `login-status`, `portal-status`, `login-link`, `logout-button`, `member-name`, `member-email`, `member-code`, `reservation-list`, `product-list` は維持。
  - `customer/customer-login.html` と `customer/index.html` にはCSS読み込みと `body` クラスのみ追加。
- 未対応:
  - 前回完成品との差分表示、過去完成品をもとにした再予約UIは `Phase 6` の残タスクとして実装しない。

### トップページ

- 対象: `index.html`
- 追加: `css/top-reference-layout.css`
- 参照: `レイアウトimg/01. index.html トップページ.png`
- 実装:
  - 参照画像をページ内に差し込まず、既存の `img/TOP/hero-visual.png` などの実在アセットと後勝ちCSSで、ヒーロー、CTA、3ステップ、FAQ、最終CTAの見た目を調整。
  - 既存のヘッダー、ナビゲーション、アンケート、会員ログイン、予約導線のリンクは維持。
  - `index.html` にはCSS読み込みと `body` クラスのみ追加。
- 未対応:
  - 文言や文字表示の修正は行わない。

### 予約・予約完了ページ

- 対象: `customer/reservation.html`, `customer/reservation-complete.html`
- 追加: `css/customer-booking-layout.css`
- 参照:
  - `レイアウトimg/09. customer reservation.html 来店予約ページ.png`
  - `レイアウトimg/10. customer reservation-complete.html 予約完了ページ.png`
- 実装:
  - 参照画像をページ内に差し込まず、既存アセットと後勝ちCSSで予約カード、予約枠選択、入力欄、確認CTA、完了カードの見た目を調整。
  - `reservation.html` は既存の `slot-list` と予約枠モーダルを維持し、DBから取得する予約枠表示・予約保存処理は変更しない。
  - 既存JSが参照する `confirm-btn`, `selected-status`, `slot-list`, `visit-type`, `guest-count`, `staff-memo`, `slot-modal`, `slot-modal-card`, `slot-modal-panels`, `slot-modal-title`, `slot-modal-copy` は維持。
  - `reservation-complete.html` は予約コード取得、sessionStorage復元、予約コード参照、カウントダウン処理を変更しない。
- 未対応:
  - 参照画像の静的カレンダーをそのまま実装することは避け、現行の公開予約枠データ導線を優先。

### アンケート・通常結果ページ

- 対象: `customer/questionnaire.html`, `customer/questionnaire_step2.html`, `customer/fragrance-graph.html`
- 追加: `css/customer-survey-layout.css`
- 参照:
  - `レイアウトimg/04. customer questionnaire.html 初回アンケートページ.png`
  - `レイアウトimg/05. customer questionnaire_step2.html 分岐後アンケートページ.png`
  - `レイアウトimg/06. customer fragrance-graph.html 通常結果ページ.png`
- 実装:
  - 参照画像をページ内に差し込まず、後勝ちCSSでアンケートカード、選択肢、サイドカード、結果グラフ、スライダー、CTAの見た目を調整。
  - 既存HTMLへの追加はCSS読み込みのみ。
  - CSS疑似要素で新しい見出し文言を表示する実装は避け、既存HTML上の文言を正とする。
- 未対応:
  - 会員比較モード、比較拡大モーダル、過去完成品との差分表示は `Phase 6` の残タスクとして実装しない。

### スタッフ・管理者ダッシュボード

- 対象: `staff/staff-dashboard.html`, `admin/admin-dashboard.html`
- 追加: `css/portal-dashboard-reference.css`
- 参照:
  - `レイアウトimg/14. staff staff-dashboard.html スタッフダッシュボード.png`
  - `レイアウトimg/21. admin admin-dashboard.html 管理者ダッシュボード.png`
- 実装:
  - 既存の `portal-staff-dashboard-page` / `portal-admin-dashboard-page` 構造を維持し、後勝ちCSSでヘッダー、ヒーロー、KPIカード、通知カード、導線カードの見た目を調整。
  - スタッフ側の `staff-kpi-today`, `staff-qr-request-count`, `staff-qr-request-list`, `staff-day-timeline`, `staff-day-events` は維持。
  - 管理者側の `kpi-reservations`, `kpi-reservations-week`, `kpi-slots`, `manager-qr-request-count`, `manager-qr-request-list` は維持。
- 未対応:
  - QR通知の対応済み操作、作成可否判断、発送完了操作は `Phase 5` の残タスクとして実装しない。

### visual-prototype の旧画像参照整理

- 対象: `visual-prototype/app.js`, `visual-prototype/styles.css`
- 実装:
  - `img/questionnaire/` の旧アンケート画像参照を外し、CSSで作る控えめなオーブ・カード表現へ変更。
  - `img/TOP/香水ハンドクリーム.png` と `img/TOP/中間イメージ.png` の参照を外し、CSS背景・装飾に置き換え。
  - 旧素材を `archived/legacy/` へ退避できるよう、現行ページおよび visual-prototype からの直接参照をなくした。
- 未対応:
  - 旧素材本体の移動は、参照解除のコミット後に別コミットで実施する。

### 旧アンケート・旧TOP素材の legacy 退避

- 対象:
  - `img/questionnaire/`
  - `img/questionnaire2/`
  - `img/TOP/クエスチョンPC版大.png`
  - `img/TOP/スマホ用プレビュー.png`
  - `img/TOP/質問ページＰＣプレビュー.png`
  - `img/TOP/中間イメージ.png`
  - `img/TOP/香水作成の工程(左).png`
  - `img/TOP/香水作成の工程(右).png`
  - `img/TOP/看板.png`
  - `img/TOP/値段表.png`
  - `img/TOP/香水ハンドクリーム.png`
  - `img/TOP/上野駅.png`
- 実装:
  - 現行ページおよび `visual-prototype` から直接参照が残っていないことを確認したうえで、`archived/legacy/img/` 配下へ移動。
  - 現行で参照が残っている `hero-visual.png`, `香水の瓶が並ぶ.png`, `香水対比.png`, `Final_Call_hope.png`, ロゴ、QR地図画像などは移動対象外。

### STEP1用の新規背景画像追加

- 対象: `customer/questionnaire.html`, `customer/questionnaire_step2.html`, `css/customer-survey-layout.css`, `img/questionnaire-v11/`
- 追加:
  - `img/questionnaire-v11/step1-a-floral.png`
  - `img/questionnaire-v11/step1-b-fresh.png`
  - `img/questionnaire-v11/step1-c-woody.png`
  - `img/questionnaire-v11/step1-d-warm.png`
- 実装:
  - STEP1のA/B/C/Dカードに、`deep-research-report-ver.1.1.md` の方向性に合わせた新規生成背景を割り当て。
  - 旧 `img/questionnaire/` は参照せず、文字可読性を保つために淡い写真背景の上へ白系グラデーションを重ねるCSSに調整。
  - STEP2は `survey-step2-page` として分離し、画像背景を強制的に使わない状態を維持。

### STEP1/STEP2カード画像とSTEP2傾向表示の追加

- 対象: `customer/questionnaire.html`, `customer/questionnaire_step2.html`, `css/customer-survey-layout.css`, `img/questionnaire-v11/`
- 追加:
  - STEP1 Q2〜Q5 の A/B/C/D カード背景を設問別に分けた。
  - STEP2 の A/B/C カード背景を branch 別に分け、縦長カードとして表示する。
  - `img/questionnaire-v11/吟ロゴ.png` を STEP1/STEP2 のヘッダーロゴとして使用する。
  - STEP2 の右側パネルは豆知識ではなく、現在の5軸傾向をスライダー表示に変更した。
- 補足:
  - STEP2 の5軸傾向表示は `scoreStep2Answers` の結果プレビューのみで、管理画面の配点や保存ロジックは変更していない。
  - レイアウト画像は直接参照せず、生成画像とCSSで近づける方針を継続する。

### スタッフ/管理者ポータル権限の整理

- 対象: `js/admin-auth.js`, `js/staff-customer-detail-page.js`
- 実装:
  - `staff` はスタッフ画面のみ、`manager` はスタッフ画面と管理者画面に入れる判定へ変更。
  - `manager` でログインしている場合、共通ヘッダーにスタッフ画面/管理者画面の切り替えリンクを追加。
  - `staff-customer-detail.html` 系の個別ヘッダーにも、`manager` セッション時だけ管理者画面へ戻る導線を追加。
- 補足:
  - Supabase Auth の `portal_role` / `role` は既存取得関数を使い、画面側の `role` パラメータだけで管理者権限を認めない。

### 共通ログイン画面のレイアウト修正

- 対象: `admin-login.html`, `css/admin-phase7-ui.css`
- 実装:
  - スタッフ/管理者ログインをタブ切り替えのまま維持し、表示中パネルのフォームを中央寄せに調整。
  - 背景画像を入れ、右側にスタッフ画面と管理者画面でできることを説明するガイドパネルを追加。
  - スマホ幅ではログインパネルとガイドを1カラムに戻す。
- 補足:
  - 認証方式やログインID処理は変更していない。

### 会員ログインと会員トップの注釈対応

- 対象: `customer/customer-login.html`, `customer/index.html`, `css/customer-portal-layout.css`
- 実装:
  - Supabase Auth の英語エラーをそのまま出さず、ログイン失敗・メール未確認・登録済みを丁寧な日本語メッセージへ変換。
  - 会員トップのヘッダーへロゴ画像を追加。
  - 会員情報カードを小さくし、ヒーロー右下の補足情報として扱う見た目に変更。
  - 会員トップのヒーロー背景を、レイアウト画像に近い香水ボトル系の既存画像へ変更。
- 補足:
  - 会員情報、予約履歴、制作履歴のDB接続IDは維持している。

### ページリニューアル方針の固定

- 対象: `docs/SPEC.md`
- 追記:
  - 捨ててよいものは、既存ページの見た目用HTML構造、過剰に重なったCSS、表示都合だけのJS。
  - 残すべきものは、Supabase接続、認証、RLS前提のデータ関数、アンケート配点ロジック、`sessionStorage` の契約、既存DOM IDのうちDB連携JSが参照するもの。
  - `レイアウトimg/` を完成イメージの正として、ページ単位で新しい薄いHTML/CSSへ置き換える。
  - 新ページでDB連携を維持できることを確認した後、旧HTML/CSS/表示都合JSを `archived/legacy/` へ退避する。

### questionnaire_result RPC の曖昧な result_code 参照修正

- 対象:
  - `supabase/schema.sql`
  - `supabase/migrations/20260501103000_fix_questionnaire_result_rpc_ambiguous_result_code.sql`
  - `ユーザー設定フォルダ/20260501_questionnaire_result_rpc_fix.txt`
- 原因:
  - `create_questionnaire_result` の戻り値列 `result_code` と、`on conflict (result_code)` の列参照が PL/pgSQL 内で衝突していた。
  - Supabase RPC では `42702 column reference "result_code" is ambiguous` として失敗していた。
- 実装:
  - フロントが期待する戻り値 `{ id, result_code }` は維持する。
  - `on conflict (result_code)` を `on conflict on constraint questionnaire_results_result_code_key` に変更し、曖昧な列参照を避ける。
  - SQL Editor で適用できる内容をユーザー設定フォルダに追加した。

### questionnaire_result RPC の PL/pgSQL 変数衝突ガード追加

- 対象:
  - `supabase/schema.sql`
  - `supabase/migrations/20260501112000_harden_questionnaire_result_rpc_variable_conflict.sql`
  - `ユーザー設定フォルダ/20260501_questionnaire_result_rpc_variable_conflict_guard.txt`
- 背景:
  - 前回SQL適用後もアンケート送信が失敗する報告があった。
  - `returns table(id uuid, result_code text)` の `result_code` は戻り値変数としても扱われるため、関数内の同名列と衝突する余地が残る。
- 実装:
  - `create_questionnaire_result` に `#variable_conflict use_column` を追加した。
  - 既存の戻り値 `{ id, result_code }` とフロント側の呼び出し契約は変更していない。
  - 前回SQL適用済みでも重ねて実行できるSQLをユーザー設定フォルダに追加した。

### questionnaire系RPCの pgcrypto search_path 修正

- 対象:
  - `supabase/schema.sql`
  - `supabase/migrations/20260501115000_fix_pgcrypto_search_path_for_questionnaire.sql`
  - `ユーザー設定フォルダ/20260501_questionnaire_pgcrypto_search_path.txt`
- 背景:
  - 前回の `result_code` 曖昧参照修正後、エラーが `42883 function crypt(text, text) does not exist` に変わった。
  - `crypt()` は `pgcrypto` 拡張の関数で、Supabaseでは `extensions` スキーマ側に存在する場合がある。
  - questionnaire系関数が `set search_path = public` のみだったため、関数内から `crypt()` を解決できなかった。
- 実装:
  - `extensions` スキーマと `pgcrypto` 拡張をSQL側で明示。
  - `hash_questionnaire_edit_token`, `update_questionnaire_result_by_token`, `create_questionnaire_result` の `search_path` を `public, extensions` に変更。
  - 戻り値やフロント側のRPC呼び出し契約は変更していない。

### active scoring_configs の公開読み取り権限修正

- 対象:
  - `supabase/schema.sql`
  - `supabase/migrations/20260501121000_allow_public_active_scoring_config_filter.sql`
  - `ユーザー設定フォルダ/20260501_scoring_configs_public_select.txt`
- 背景:
  - `customer/questionnaire.html` 起動時に `scoring_configs?select=config_json,version,updated_at&is_active=eq.true...` が 401 になった。
  - RLS policy は active 行のみselect可能にしているが、anon の列権限にフィルタ列 `is_active` が含まれていなかった。
- 実装:
  - anon の `scoring_configs` select列権限に `is_active` を追加。
  - 公開される行は既存RLSにより `is_active = true` のまま。

### レイアウト画像基準での顧客アンケート系再構成

- 対象:
  - `customer/questionnaire.html`
  - `customer/fragrance-graph.html`
  - `css/customer-survey-layout.css`
- 背景:
  - `レイアウトimg/04. customer questionnaire.html 初回アンケートページ.png`
  - `レイアウトimg/05. customer questionnaire_step2.html 分岐後アンケートページ.png`
  - `レイアウトimg/06. customer fragrance-graph.html 通常結果ページ.png`
  - 既存の見た目を無理に補正するのではなく、Supabase/配点/sessionStorage/DOM契約を残して、完成イメージに寄せる方針にした。
- 実装:
  - STEP1に5問ステッパー `question-stepper` を追加し、現在位置と回答済み状態が見えるようにした。
  - STEP1の質問タイトルは、既存の `question-title` IDを維持したまま2行表示にした。
  - STEP1/STEP2のカード、背景、右側情報カード、サブ選択ボタンをレイアウト画像に近い余白と比率に再調整した。
  - 結果ページに表示見出し `graph-page-title` を追加し、5軸グラフとスライダーを完成イメージ寄りの2カラム構成へ寄せた。
  - `option-list`, `progress-bar`, `progress-label`, `step2-status`, `axis-preview`, `radar-graph`, `slider-list`, `reserve-link` など、既存JS参照IDは維持した。

### レイアウト画像基準での顧客入口・予約系再構成

- 対象:
  - `index.html`
  - `customer/customer-login.html`
  - `customer/index.html`
  - `customer/reservation.html`
  - `customer/reservation-complete.html`
  - `css/top-reference-layout.css`
  - `css/customer-portal-layout.css`
  - `css/customer-booking-layout.css`
  - `css/qr-product-page.css`
- 背景:
  - `レイアウトimg/01. index.html トップページ.png`
  - `レイアウトimg/02. customer login.html 会員ログインページ.png`
  - `レイアウトimg/03. customer index.html 会員トップページ.png`
  - `レイアウトimg/09. customer reservation.html 来店予約ページ.png`
  - `レイアウトimg/10. customer reservation-complete.html 予約完了ページ.png`
  - `レイアウトimg/11. customer product-reservation.html QR商品作成依頼ページ.png`
- 実装:
  - トップページのCTAを、アンケート開始1段、その下に会員ログインとワークショップ予約の導線が並ぶ形へ寄せた。
  - 会員ログインは、会員本人向け入口であることを明示し、QR第三者導線と混ぜない説明へ変更した。
  - 会員トップは、会員情報カードを主役にせず、前回制作・新規作成・予約履歴を中心にした構成へ寄せた。
  - 予約ページの確定ボタンを入力欄の流れに近い位置へ移し、予約要約と枠選択の視線移動を整理した。
  - 予約完了ページは、表示内容の補助導線をレイアウト画像寄りにした。
  - QR商品ページはCSS側で2カラム数量入力と縦長崩れの抑制を進めた。QR作成可否、発送先入力、発送完了、通知対応済み操作は実装していない。
  - `customer-login-form`, `portal-status`, `reservation-list`, `product-list`, `confirm-btn`, `slot-list`, `qr-request-form`, `submit-request` など、既存JS参照IDは維持した。

### レイアウト画像基準でのスタッフ・管理者系再構成

- 対象:
  - `admin-login.html`
  - `staff/staff-dashboard.html`
  - `staff/staff-reservations.html`
  - `staff/staff-slots.html`
  - `staff/staff-customer-detail.html`
  - `admin/admin-dashboard.html`
  - `admin/admin-settings.html`
  - `admin/admin-scoring.html`
  - `admin/admin-materials.html`
  - `css/admin-phase7-ui.css`
  - `css/staff-phase7-layout.css`
  - `css/portal-dashboard-reference.css`
- 背景:
  - `レイアウトimg/13. admin-login.html 共通ログインページ.png`
  - `レイアウトimg/14`〜`24` のスタッフ/管理者画面完成イメージ。
- 実装:
  - 共通ログインにブランドバーとスタッフ/管理者共通入口の説明を追加し、タブ式ログインを維持した。
  - スタッフ予約一覧に当日サマリー補助パネルを追加し、一覧と確認観点を分けた。
  - スタッフ詳細に、お客様共有アクションの導線を追加し、香り調整・商品名・同意確認へ移動しやすくした。
  - 管理者ダッシュボードにQR依頼一覧/QR商品設定への導線を追加した。
  - 管理者設定、配点、原料ページの見出しを、完成イメージに近い管理画面の言い方へ寄せた。
  - `admin-header`, `data-login-role`, `data-login-tab`, `reservation-rows`, `reservation-empty`, `staff-detail-form`, `product-name`, `personal-info-consent`, `third-party-order-consent`, `recipe-list`, `qr-product-settings-form`, `scoring-form` など、現行JS参照IDは維持した。
  - QR作成可否、発送先入力、発送完了、通知対応済み操作は実装していない。
