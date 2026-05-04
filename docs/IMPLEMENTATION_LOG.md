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

### QR依頼一覧ページの確認専用レイアウト整理

- 対象:
  - `staff/staff-qr-requests.html`
  - `admin/admin-qr-requests.html`
- 背景:
  - QR依頼は管理者/スタッフの運用上確認が必要だが、作成可否・発送先入力・発送完了・通知対応済み操作は次フェーズとして扱う。
  - 現時点では一覧取得と読み取り確認に限定する。
- 実装:
  - スタッフ用と管理者用で、確認範囲を示すガイドカードを追加した。
  - 背景、カード角丸、見出し、フィルタ配置を他の管理画面に近づけた。
  - `qr-request-filter-form`, `qr-request-status-filter`, `qr-request-keyword-filter`, `qr-request-rows`, `qr-request-empty`, `qr-request-count` は維持した。
  - 状態変更ボタンやメール送信ボタンは追加していない。

### トップページ残課題の分担修正

- 対象:
  - `index.html`
  - `css/top-reference-layout.css`
- 背景:
  - ユーザー注釈で、ヒーローCTAは「アンケート開始」を1行目、下に「会員ログイン」「ワークショップ予約」を2カラムにする方針。
  - 3 STEP FLOW の箇条書きは不要。
  - BASIC INFORMATION 付近で料金カードが崩れていた。
- 実装:
  - サブエージェントには担当ファイルを `index.html` と `css/top-reference-layout.css` に限定して依頼した。
  - `flow-bullets` のHTMLを削除し、各ステップカードは本文1つで完結する構成にした。
  - ヒーローCTAを1段目のアンケート開始、2段目の会員ログイン/予約のグリッドへ調整した。
  - 基本情報セクションの3カラム、料金カード、ボタン配置を崩れにくい比率へ調整した。
  - `customer/questionnaire.html`, `customer/customer-login.html?mode=return`, `customer/reservation.html?source=direct` のリンクは維持した。

### 会員ログイン・会員トップの比率調整

- 対象:
  - `css/customer-portal-layout.css`
- 背景:
  - 会員情報を大きく見せず、会員トップは前回制作/新規作成/予約履歴を主役にする方針。
  - 会員ログインは左側ログイン、右側説明カード群へ寄せる方針。
- 実装:
  - サブエージェントには担当ファイルを `customer/customer-login.html`, `customer/index.html`, `css/customer-portal-layout.css` に限定して依頼した。
  - 実際の編集はCSSのみで、HTMLとSupabase Auth/会員データ取得契約は変更していない。
  - `customer-login-form`, `setup-button`, `login-status`, `name="email"`, `name="password"`, `portal-status`, `login-link`, `logout-button`, `member-name`, `member-email`, `member-code`, `reservation-list`, `product-list` は維持した。

### QR商品ページの連絡先表示崩れ抑制

- 対象:
  - `customer/product-reservation.html`
  - `css/qr-product-page.css`
- 背景:
  - ユーザー注釈で、まとまった本数の電話案内部分が崩れていた。
- 実装:
  - 文章と連絡先を分け、電話番号/受付時間を `.contact-lines` として2カラム表示にした。
  - 小さい幅では1カラムに戻るようにした。
  - `shop-phone`, `business-hours`, `qr-request-form`, `submit-request` などのJS参照IDは維持した。

### 2026-05-01 レイアウト再構築

- 対象:
  - `index.html`
  - `admin-login.html`
  - `customer/*.html`
  - `staff/*.html`
  - `admin/*.html`
  - `css/rebuild-ui.css`
  - `js/rebuild-customer-flow.js`
  - `js/customer-auth-page.js`
  - `js/admin-login-page.js`
- 背景:
  - 旧ページレイアウトの混在を解消し、`レイアウトimg/` の参照画像を基準にページ単位で作り直す方針となった。
  - Supabase接続、認証、DB保存に関わる既存JSと `supabase/` は維持対象とした。
- 実装:
  - 旧HTMLと旧レイアウトCSSを `archived/layout-rebuild-20260501/` に退避した。
  - 顧客・スタッフ・管理者ページを共通CSS `css/rebuild-ui.css` ベースに再構築した。
  - 顧客フロー用に `js/rebuild-customer-flow.js`、会員導線用に `js/customer-auth-page.js`、共通ログイン用に `js/admin-login-page.js` を追加した。
  - 既存JSが参照する主要ID、name、data属性は維持した。
- 確認:
  - `node --check` で追加JSの構文確認を行った。
  - Edge/Playwrightで20ページをデスクトップ幅・スマホ幅の計40表示確認し、ローカルJSエラーなしを確認した。
- 残作業:
  - Supabase実接続でのログイン、保存、予約、QR依頼送信の結合確認。
  - QR依頼の作成可否判断、通知、メール、期限管理、発送入力、成果集計の実装。

### 2026-05-01 スタッフ側注釈対応

- 対象:
  - `admin-login.html`
  - `staff/staff-dashboard.html`
  - `staff/staff-reservations.html`
  - `css/rebuild-ui.css`
  - `js/admin-auth.js`
  - `js/staff-dashboard-page.js`
  - `js/admin-reservations-page.js`
- 背景:
  - ユーザー注釈で、共通ログイン・スタッフダッシュボード・スタッフ予約一覧が参照画像と大きく乖離していると指摘された。
  - スタッフ側は1ページずつ参照画像を確認し、ノートPC/タブレット幅でも収まりやすい構成へ寄せる方針となった。
- 実装:
  - 共通ログインは、スタッフ/管理者をカード上部のタブで切り替える構成へ変更した。
  - スタッフダッシュボードは、ヘッダー表示を `Staff Dashboard` に整理し、スタッフ名をページ見出し側へ移動した。
  - スタッフダッシュボードは、KPI・予約リスト・通知をノートPC幅で収まりやすい密度に調整した。
  - スタッフ予約一覧は、絞り込みを1ロウ4カラムへ変更し、予約テーブルとサマリーの構成へ寄せた。
  - 認証、ステータス変更、予約詳細リンクに関わる既存ID/data属性は維持した。
- 確認:
  - `node --check js/admin-auth.js`
  - `node --check js/staff-dashboard-page.js`
  - `node --check js/admin-reservations-page.js`
  - Edge/Playwrightで検証用スタブを使い、ログインなしでスタッフダッシュボードと予約一覧の表示確認を行った。

### 2026-05-03 customer/fragrance-graph.html 通常結果ページの見本反映
- 対象:
  - `customer/fragrance-graph.html`
  - `css/customer/customer-fragrance-graph.css`
  - `js/rebuild-customer-flow.js`
- 参照:
  - `レイアウトimg/06. customer fragrance-graph.html 通常結果ページ.png`
- 実装:
  - 通常結果ページ専用CSSを追加し、見本のレーダー、診断コメント、詳細バー、CTA構成へ調整。
  - 既存JSはアンケート結果の読み取りと予約への受け渡しを維持し、表示用の結果コメント・バー描画だけ追加。
  - 会員比較モード・比較拡大モーダルは今回の対象外。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - Playwright screenshot desktop/mobile/full-page

### 2026-05-03 customer/fragrance-graph.html 通常結果ページの見本寄せ再調整
- 対象:
  - `css/customer/customer-fragrance-graph.css`
- 背景:
  - 見本画像に対して、初回実装がカード配置・背景小物・CTA位置の再現精度不足だったため、通常結果ページ専用CSSを追加調整した。
- 実装:
  - 1160px幅以下でも右側の診断コメントを早く下へ落とさず、見本の横並び構成を維持。
  - デスクトップ基準でメインカード、詳細バランスカード、CTAの縦位置を見本に近づけた。
  - 既存素材 `台の上の瓶.png` を背景右側へ重ね、見本の右側ボトル配置に寄せた。
  - 固定ヘッダー指定を解除し、フルページ表示時のヘッダー重複を解消。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - Playwright screenshot 1674x940 / 390x844 / 390x844 full-page

### 2026-05-03 customer/fragrance-graph.html 通常結果ページの挙動調整
- 対象:
  - `customer/fragrance-graph.html`
  - `css/customer/customer-fragrance-graph.css`
  - `js/rebuild-customer-flow.js`
- 背景:
  - 通常結果ページについて、ヘッダー・TOP導線・5軸名称・未回答時テンプレート・スライダー調整・初期値復帰の追加要望があった。
- 実装:
  - ヘッダーのロゴを吟ロゴに変更し、サイト共通ヘッダーの見え方へ寄せた。
  - 「もう一度回答する」を「TOPページへ戻る」に変更し、TOP遷移時に確認ダイアログを出すようにした。
  - 「結果の活用方法はこちら」を削除した。
  - 結果ページの5軸表記を `フローラル / フレッシュ / ウッディ / スパイシー / スウィート` に変更した。
  - アンケート回答済みの場合は `resetAxes` または `finalAxes` を初期値として表示し、スライダー調整値を `adjustedAxes` として扱うようにした。
  - 未回答で直接開いた場合は、左側説明文の代わりに `軽やか / バランス / 印象強め` のテンプレートボタンを表示し、クリックで5軸へ反映するようにした。
  - 詳細バランスを直接スライダー操作できるようにし、「初期値」ボタンでアンケート由来の初期状態へ戻せるようにした。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwright screenshot 1674x940 / 390x844 full-page
  - Playwright screenshot 1674x940 / 390x844 / 390x844 full-page
  - in-app browserでテンプレート切り替えと初期値復帰を確認

### 2026-05-03 customer/fragrance-graph.html 通常結果ページの文言と未回答時制御
- 対象:
  - `customer/fragrance-graph.html`
  - `css/customer/customer-fragrance-graph.css`
  - `js/rebuild-customer-flow.js`
- 背景:
  - 結果ページ上部の説明文削除、回答済み時の説明文追加、未回答直接アクセス時のタイトル変更とスライダー操作不可の要望があった。
- 実装:
  - ページ上部の「5つの軸から、今のあなたに似合う香りの方向性をまとめました。」を削除。
  - 回答済み時の説明文を「各軸のバランスから、あなたらしい香りの個性を可視化しました。下のスライダーでお好みの軸を少しだけ動かすとよりあなたの好みに近くなります。」に変更。
  - 未回答で直接開いた場合のタイトルを「香りのバランスを選んでください」に変更。
  - 未回答で直接開いた場合はテンプレート選択のみ可能とし、5軸スライダーを disabled にした。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwrightで未回答直接アクセス時のタイトル・テンプレート件数・スライダーdisabledを確認。
  - Playwrightで回答済み状態のタイトル・説明文・スライダー操作可能状態を確認。

### 2026-05-03 customer/fragrance-graph.html ヘッダーCTAと狭幅表示順の調整
- 対象:
  - `customer/fragrance-graph.html`
  - `css/customer/customer-fragrance-graph.css`
  - `js/rebuild-customer-flow.js`
- 背景:
  - 結果ページのヘッダー右側に予約CTAを追加し、860px以下では診断コメントを非表示にして表示順を `5つの軸` → `5つの軸の詳細バランス` にしたいという要望があった。
- 実装:
  - ヘッダー右側に「この香りで予約」ボタンを追加し、下部予約CTAと同じ予約データ受け渡し処理に接続。
  - 560px以下ではヘッダー内に収めるため、結果ページのみブランド文字を隠して吟ロゴと予約CTAを表示。
  - 860px以下では `.graph-comment-card` を非表示にし、`.graph-balance-card` の次に `.graph-detail-card` が続く表示にした。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwright screenshot 1674x940 / 390x844 full-page

### 2026-05-03 customer/fragrance-graph.html 結果ページのカラム構造整理
- 対象:
  - `customer/fragrance-graph.html`
  - `css/customer/customer-fragrance-graph.css`
- 背景:
  - 添付注釈のとおり、左列に香りバランスと詳細バランス、右列に診断コメントを置く単純な2カラム構造へ整理したいという要望があった。
- 実装:
  - `.graph-result-layout` 内に `.graph-main-column` を追加し、`.graph-balance-card` と `.graph-detail-card` を同じ左列に配置。
  - `.graph-comment-card` は右列専用にし、PC幅で左列と右列が分かれる構造に整理。
  - 詳細バランスカードの負の余白と固定的な横ずらし指定を外し、左列内で自然に縦積みされるCSSへ変更。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwright screenshot 1674x940 / 390x844 full-page

### 2026-05-03 customer/fragrance-graph.html 香りバランスカード内比率の調整
- 対象:
  - `css/customer/customer-fragrance-graph.css`
- 背景:
  - `.graph-balance-card` 内でグラフ側が大きく見えるため、テキスト・テンプレート側を強くして 2:1 の比率にしたいという要望があった。
- 実装:
  - 通常幅の `.graph-balance-card` を、左のテキスト・テンプレート領域 `2fr`、右のレーダーグラフ領域 `1fr` に変更。
  - 1160px以下かつ861px以上の表示でも同じ方向性になるよう、狭め幅用のグリッド比率を調整。
  - 860px以下の縦積み表示は既存指定を維持。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwright screenshot 1674x940

### 2026-05-03 会員比較モードの別ページ化
- 対象:
  - `customer/fragrance-compare.html`
  - `css/customer/customer-fragrance-compare.css`
  - `customer/index.html`
  - `js/rebuild-customer-flow.js`
  - `docs/SPEC.md`
- 背景:
  - 通常結果ページに会員比較モードを混在させず、会員ログイン済みかつ前回完成品がある場合は別ページで比較する方針にした。
- 実装:
  - `customer/fragrance-compare.html` を新設し、前回完成品と今回アンケート結果を並べて5軸比較する画面を追加。
  - `css/customer/customer-fragrance-compare.css` を新設し、比較ページ専用の2カラム・レスポンシブレイアウトを追加。
  - 会員ページの比較リンクを `fragrance-compare.html` に変更。
  - アンケートSTEP2完了時、会員ログイン済みかつ比較可能な前回完成品データがある場合のみ比較ページへ遷移するようにした。
  - 通常結果ページと会員比較ページを分ける方針を `docs/SPEC.md` に追記。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwright screenshot 1674x940 / 390x844 full-page

### 2026-05-03 会員比較ページの操作UI調整
- 対象:
  - `customer/fragrance-compare.html`
  - `css/customer/customer-fragrance-compare.css`
  - `js/rebuild-customer-flow.js`
  - `docs/SPEC.md`
- 背景:
  - 比較不可時の案内文、右側の比較コメントカード、見出し「5つの軸の変化」を外し、詳細は下部ボタンからモーダルで確認したいという要望があった。
  - 会員比較ページでも今回結果の5軸をスライダー調整できるようにしたいという要望があった。
- 実装:
  - 比較不可時の通常案内文と右側コメントカードを削除。
  - 下部アクションに「通常結果ページへ戻る」と「詳細を確認する」を追加。
  - 「詳細を確認する」クリックで、前回・今回の5軸グラフと比較テキストを表示するモーダルを追加。
  - 今回結果の5軸スライダーを追加し、変更時にレーダー、数値、詳細モーダル、予約へ渡す `sessionStorage` を更新するようにした。
  - 会員比較ページの操作仕様を `docs/SPEC.md` に追記。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwrightで直接アクセス、今回結果あり、スライダー変更、詳細モーダル、モバイル表示を確認。

### 2026-05-03 会員比較ページの注釈反映
- 対象:
  - `customer/fragrance-compare.html`
  - `css/customer/customer-fragrance-compare.css`
  - `js/rebuild-customer-flow.js`
  - `docs/SPEC.md`
- 背景:
  - ブラウザ注釈で、上段の5軸リスト削除、前回日付欄への不足メッセージ集約、スライダー左側への3アクション配置、背景画像表示の要望があった。
- 実装:
  - 上段カード内の前回・今回5軸リストを削除し、下段スライダーとの重複を解消。
  - 前回側の日付欄は、前回完成品の日付が取れる場合は日付、取れない場合は「表示できる５軸データがありません。」を表示するように変更。
  - 下段カードを左1:右2の比率にし、左に「この香りで予約する」「通常結果ページへ戻る」「詳細を確認する」、右に5軸スライダーを配置。
  - 比較ページ背景に通常結果ページと同系統の背景画像・右側ボトル表示を追加。
  - 仕様追記として、会員比較ページの上段リスト非表示とアクション配置方針を `docs/SPEC.md` に追記。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwright screenshot 913x909

### 2026-05-03 会員比較ページの縦積みとスライダー行調整
- 対象:
  - `customer/fragrance-compare.html`
  - `css/customer/customer-fragrance-compare.css`
  - `js/rebuild-customer-flow.js`
  - `docs/SPEC.md`
- 背景:
  - ブラウザ注釈で、下段5軸スライダーの前回値・差分表示削除、縦積み時の今回結果優先表示、前回完成品データなし時の前回カード非表示、スライダー1行表示の要望があった。
- 実装:
  - 下段5軸スライダーの差分列を削除し、「軸名・スライダー・今回値」の3列構成へ変更。
  - 860px以下では今回のアンケート結果カードを前回カードより上に表示。
  - 前回完成品の5軸データがない場合、860px以下では前回カードを非表示にする `has-no-previous-axes` クラス制御を追加。
  - 縦積み表示でもスライダーが1行に収まるようCSSを調整。
  - 仕様追記として、スライダー表示と縦積み時の表示順を `docs/SPEC.md` に追記。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwright screenshot 913x909 / 820x1180

### 2026-05-03 会員比較ページの前回データなし表示と初期値復帰
- 対象:
  - `customer/fragrance-compare.html`
  - `css/customer/customer-fragrance-compare.css`
  - `js/rebuild-customer-flow.js`
  - `docs/SPEC.md`
- 背景:
  - ブラウザ注釈で、前回完成品の5軸データがない場合のページ見出し・説明文の切り替え、今回グラフ直下への「初期値に戻す」ボタン追加、詳細モーダルの縦積み順と前回データ非表示の要望があった。
- 実装:
  - 前回完成品の5軸データがない場合、ページ見出しを「今回のアンケート結果」に変更し、比較説明文を非表示にするJS制御を追加。
  - 今回グラフ直下に「初期値に戻す」ボタンを追加し、`resetAxes` を優先してアンケート完了時点の5軸へ戻すようにした。
  - 詳細モーダルの前回・今回グラフに専用クラスを付け、860px以下では今回を上、前回データなしでは前回を非表示にするCSSを追加。
  - 仕様追記として、前回データなし表示、初期値復帰、詳細モーダルの表示順を `docs/SPEC.md` に追記。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `git diff --check`
  - Playwright screenshot 820x1180 / modal

### 2026-05-03 来店予約ページのカレンダー化と連絡先保存
- 対象:
  - `customer/reservation.html`
  - `customer/reservation-complete.html`
  - `css/customer/customer-reservation.css`
  - `js/rebuild-customer-flow.js`
  - `js/public-data.js`
  - `js/staff-customer-detail-page.js`
  - `supabase/schema.sql`
  - `supabase/migrations/20260503090000_reservation_contact_fields.sql`
  - `docs/03_DB_DESIGN_POLICY.md`
  - `docs/01_CURRENT_STATE.md`
  - `docs/UI_REBUILD_PLAN.md`
- 背景:
  - ユーザー要望で、見本画像 `レイアウトimg/09. customer reservation.html 来店予約ページ.png` に寄せ、左側カレンダーから予約枠作成済みの日付を選び、その日の時間を選べるようにする指示があった。
  - 予約ページでは香りバランス等を表示しないが、予約確定時に必要な内部データは保持する方針。
  - 名前とメールアドレス入力欄を設け、名前欄にはニックネーム可が伝わるプレースホルダーを入れる指示があった。
- 実装:
  - ヘッダーは吟ロゴ画像と `Fragrance Workshop` のブランド表示にし、右側メニューは置かない構成へ変更。
  - `reservation_slots` を日付ごとに集約し、カレンダー上では予約枠がある日だけ選択可能にした。
  - 日付選択後、`slot-list` にはその日の時間枠だけを表示し、選択中日時と担当スタッフ表示を更新するようにした。
  - `summary-headline`、`summary-body`、`axis-list` は既存契約としてDOMに残しつつ非表示にし、payloadの `axes`、`questionnaire_result_id`、`summary_*` は維持。
  - `customer_name`、`customer_email` を予約payloadに追加し、`reservations` のnullable列として保存できるようにした。
  - 予約完了ページとスタッフ詳細ページで、保存済みの名前・メールを参照できるようにした。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `node --check js/public-data.js`
  - `git diff --check`
  - Playwrightでモック予約データを使い、デスクトップ/スマホ幅の完了カード、名前、日時、所要時間、メール表示を確認。
  - `node --check js/staff-customer-detail-page.js`
  - `git diff --check`
  - Playwrightで `customer/reservation.html?source=direct` のデスクトップ/モバイル表示、香り軸非表示、入力欄プレースホルダーを確認。
  - Playwrightのモック予約枠で、5月12日の 11:00 / 13:00 表示、13:00 選択、選択中日時・担当スタッフ更新を確認。

### 2026-05-03 来店予約ページのレスポンシブ幅調整
- 対象:
  - `css/customer/customer-reservation.css`
- 背景:
  - ユーザー確認で、1100px時点でカレンダーと時間枠が縦積みになっているため、ここまでの顧客ページとレスポンシブ基準を揃える要望があった。
- 実装:
  - 予約ページの縦積み開始幅を 1100px から 860px に変更。
  - 861px〜1160px は横並びを維持しつつ、カード余白、日付セル、時間ボタン、予約者情報の左カラム幅を調整。
- 確認:
  - `git diff --check`

### 2026-05-04 ゲスト予約と会員予約の明示分離
- 対象:
  - `js/supabase-client.js`
  - `js/public-data.js`
  - `js/rebuild-customer-flow.js`
  - `js/customer-auth-page.js`
  - `customer/index.html`
  - `supabase/migrations/20260504120000_reservation_contact_persistence_guard.sql`
  - `supabase/schema.sql`
  - `docs/03_DB_DESIGN_POLICY.md`
- 背景:
  - 同じブラウザに残ったSupabase Authセッションだけで `customer_id` が入り、家族など別利用者の予約が前の会員情報に引っ張られる問題がある。
- 実装:
  - ゲスト予約保存用に `persistSession: false` のSupabase clientを追加した。
  - 通常の公開予約ではゲストclientを使い、会員ページからの `member=1` 導線だけ `linkCustomer` として通常clientを使うようにした。
  - 予約保存とアンケート同期の両方で `linkCustomer` を渡すようにした。
  - 古い `sessionStorage` のアンケート結果IDは、今回の会員/ゲスト意図と一致する場合だけ再利用し、不一致時は新しい結果コードで保存するようにした。
  - DB関数側も `link_customer=true` の場合だけ `current_customer_profile_id()` を使うようにした。
- 確認:
  - `node --check js/supabase-client.js`
  - `node --check js/public-data.js`
  - `node --check js/rebuild-customer-flow.js`
  - `node --check js/customer-auth-page.js`
  - `git diff --check`
  - Playwrightで 1100px / 1000px の横並び維持と 860px の縦積み切替を確認。

### 2026-05-03 予約完了ページの見本反映と所要時間保存
- 対象:
  - `customer/reservation-complete.html`
  - `customer/reservation.html`
  - `css/customer/customer-reservation-complete.css`
  - `js/rebuild-customer-flow.js`
  - `js/public-data.js`
  - `supabase/schema.sql`
  - `supabase/migrations/20260503100000_reservation_duration_minutes.sql`
- 参照:
  - `レイアウトimg/10. customer reservation-complete.html 予約完了ページ.png`
- 背景:
  - ユーザー要望で、予約完了ページを見本画像に寄せ、ヘッダーに吟ロゴを使用し、`○○○○` 部分へ予約時に入力した名前またはニックネームを表示する指示があった。
  - 所要時間は予約枠で設定された時間を表示する指示があった。
- 実装:
  - 予約完了ページを中央カード型の完了表示へ更新し、日時、所要時間、香りの傾向、メールアドレスを表示する構成にした。
  - 予約完了メッセージは `customer_name` を使って `○○様のご予約を受け付けました。` と表示する。
  - 予約枠の `slot_label` に含まれる `11:00-12:00` 形式の時間幅から所要時間を算出し、予約payloadへ `duration_minutes` として保存する。
  - `reservations.duration_minutes` を追加し、`create_public_reservation()` と `fetch_reservation_by_code()` で扱うようにした。
  - 予約ページの選択中サマリーでも、選んだ予約枠の所要時間を表示するようにした。
- 確認:
  - `node --check js/rebuild-customer-flow.js`
  - `node --check js/public-data.js`

### 2026-05-03 共通ログインページのロゴと左右高さ調整
- 対象:
  - `admin-login.html`
  - `css/rebuild-ui.css`
- 参照:
  - `レイアウトimg/13. admin-login.html 共通ログインページ.png`
- 背景:
  - ユーザー要望で、共通ログインページに吟ロゴを入れ、右側ガイドの高さが大きく見える崩れを見本の左右高さに近づける指示があった。
- 実装:
  - ヘッダーブランドの記号を `img/TOP/吟ロゴ.png` に差し替えた。
  - 共通ログインページ専用のグリッド幅、余白、左右カラムの高さを調整し、デスクトップ幅では左ログインカードと右ガイド列の下端が揃うようにした。
  - 右側ガイドは大きな説明カードではなく、見本に近いコンパクトな機能リスト表示へ調整した。
- 確認:
  - `git diff --check`
  - Playwrightで 1674px / 1100px / 390px の表示、吟ロゴ表示、左右高さ揃え、スマホ縦積みを確認。

### 2026-05-03 共通ログインページの右側ガイドとヘッダー再調整
- 対象:
  - `admin-login.html`
  - `css/rebuild-ui.css`
- 背景:
  - ユーザー要望で、右側ガイドの文言をスタッフ/管理者別の短いメニューに変更し、四角マークを内容に合うアイコンへ置き換える指示があった。
  - 「WORKSHOP ADMIN SYSTEM」は `Fragrance Atelier` の右に置き、ヘッダーを1ロウにまとめ、吟ロゴサイズをトップページと揃える指示があった。
- 実装:
  - 右側ガイドを、スタッフ「予約枠作成」「予約確認」「接客ページ」「ＱＲ・メール対応」、管理者「スタッフ管理」「素材・配点設定」「ＱＲ関連設定」の構成へ変更した。
  - 各メニューの四角マークを、カレンダー、確認、接客、QR、スタッフ管理、配点調整、QR設定を示すインラインSVGアイコンへ変更した。
  - 「当日の運用をすぐ確認」「設定と店舗状況を管理」の見出し文言を削除した。
  - 共通ログインヘッダーのロゴをトップページと同じ 42px 基準へ変更し、サブテキストをブランド名の右に並べた。
- 確認:
  - Playwrightで 1674px / 1100px / 390px の表示、右側メニュー7件、アイコン7件、見出し文言削除、ヘッダー高さとロゴサイズを確認。

### 2026-05-03 共通ログインページのヘッダー上余白調整
- 対象:
  - `css/rebuild-ui.css`
- 背景:
  - ユーザー確認で、共通ログインページのヘッダーがトップページより微妙に下がって見えるという指摘があった。
- 実装:
  - `admin-login-stage` の上余白を外し、共通ログインページのヘッダーがトップページと同じく画面上端から始まるようにした。
- 確認:
  - Playwrightで 1674px / 1100px / 390px の表示を確認し、ヘッダーの `y=0`、ロゴサイズ、左右カラムの高さ維持を確認。

### 2026-05-03 共通ログインページの縦積み時ガイド非表示
- 対象:
  - `css/rebuild-ui.css`
- 背景:
  - ユーザー要望で、縦積み時に右側から下へ移動するスタッフ/管理者ガイド項目は非表示にする指示があった。
- 実装:
  - 1カラムへ切り替わる 820px 以下で `.admin-login-guide` を非表示にした。
- 確認:
  - Playwrightで 820px / 390px はガイド非表示、821px / 1100px はガイド表示を確認。

### 2026-05-03 スタッフダッシュボードの見本寄せと予約枠作成アラート
- 対象:
  - `staff/staff-dashboard.html`
  - `css/rebuild-ui.css`
  - `js/staff-dashboard-page.js`
  - `js/admin-auth.js`
- 参照:
  - `レイアウトimg/14. staff staff-dashboard.html スタッフダッシュボード.png`
- 背景:
  - ユーザー要望で、スタッフダッシュボードを見本画像に寄せ、ヘッダーには吟ロゴを使う指示があった。
  - 見本にはない追加要素として、予約枠作成が必要な状態をスタッフに知らせるアラートも表示する指示があった。
- 実装:
  - スタッフヘッダーの記号ロゴを `img/TOP/吟ロゴ.png` に変更した。
  - ダッシュボードを、ヒーロー、通知件数ピル、KPI4枚、予約枠作成アラート、本日の予約リスト、通知、次の対応カードの構成へ調整した。
  - KPIは本日の予約、未確認予約、QR作成依頼、予約枠未作成を表示する構成へ変更した。
  - 予約枠作成アラートは、担当スタッフの向こう2週間の稼働曜日に予約枠未作成日がある場合のみ表示し、予約枠作成ページへの導線を置いた。
  - 本日の予約リストは、時間、顧客名、香り傾向、事前メモ有無、詳細導線を見本に近い横並び行で表示するようにした。
  - 次の対応カードは、選択日の予約から次に確認すべき予約を表示するようにした。
- 確認:
  - `node --check js/staff-dashboard-page.js`
  - `node --check js/admin-auth.js`
  - Playwrightでスタブデータを使い、1674px / 1100px / 390px の表示、吟ロゴ、予約枠作成アラート、通知、次の対応カード、予約リストの収まりを確認。

### 2026-05-03 スタッフダッシュボードの通知件数とKPI調整
- 対象:
  - `staff/staff-dashboard.html`
  - `css/rebuild-ui.css`
  - `js/staff-dashboard-page.js`
- 背景:
  - ユーザー確認で、右上の通知件数が `1` なのに下部通知が「未対応の通知はありません」と表示され、件数の意味がずれている指摘があった。
  - KPIカードがやや大きいため、もう少しコンパクトにまとめ、作成済み予約枠に対する予約数も表示する要望があった。
- 実装:
  - 右上の通知件数は下部通知パネルと同じ未対応QR通知件数だけを数えるようにし、予約枠作成アラートは通知件数に含めないようにした。
  - KPI2枚目を「予約枠利用」に変更し、今日の予約数 / 作成済み予約枠数を `2/4` のように表示するようにした。
  - KPIカードの余白、アイコン、数値サイズを縮小し、全体をコンパクトにした。
- 確認:
  - `node --check js/staff-dashboard-page.js`
  - Playwrightでスタブデータを使い、QR通知0件時は右上0/下部空表示、QR通知2件時は右上2/下部2件表示、予約枠利用の `予約数/枠数` 表示、390px表示を確認。

### 2026-05-03 スタッフダッシュボードの未確認予約KPI復帰と発送準備中追加
- 対象:
  - `staff/staff-dashboard.html`
  - `css/rebuild-ui.css`
  - `js/staff-dashboard-page.js`
- 背景:
  - ユーザー確認で、前回調整により未確認予約のKPIが見えなくなったため、おおもとの未確認予約も残す要望があった。
  - KPIが5枚になる場合はレスポンシブで扱いづらいため、「発送準備中」カードを追加して6枚構成にする要望があった。
- 実装:
  - KPIを `本日の予約 / 未確認予約 / 予約枠利用 / QR作成依頼 / 発送準備中 / 予約枠未作成` の6枚構成へ変更した。
  - 未確認予約は当日予約のうち `confirmed`、`requested`、またはstatus未設定の件数として表示する。
  - 発送準備中は `qr_product_requests.status = shipping_pending` を既存RLSの範囲で取得して表示する。
  - デスクトップのKPIグリッドを3列2行に変更し、偶数枚でレスポンシブしやすい構成にした。
- 確認:
  - `node --check js/staff-dashboard-page.js`
  - Playwrightでスタブデータを使い、1674px / 1100px / 390px の6枚KPI、未確認予約、予約枠利用、発送準備中、通知件数一致を確認。

### 2026-05-04 スタッフダッシュボードのKPI横アラート配置
- 対象:
  - `staff/staff-dashboard.html`
  - `css/rebuild-ui.css`
  - `js/admin-auth.js`
  - `js/staff-dashboard-page.js`
- 背景:
  - ユーザー注釈で、ヘッダー内の「通知」リンクは不要、予約枠作成アラートの存在感が大きく画面を圧迫しているため、KPIエリアと横並びにして `ダッシュボード:アラート = 2:1` 程度にしたい要望があった。
  - アラート内の「予約枠作成アラート」という補足pは、下の「予約枠が未作成の日があります」だけで意味が通じるため不要という指示があった。
- 実装:
  - KPI6枚と予約枠作成アラートを `staff-kpi-alert-layout` で包み、デスクトップでは2:1の横並びに変更した。
  - アラートは右列の縦詰めカードにし、未作成日のチップを縦に並べ、その下に小さめの「予約枠を作成する」ボタンを配置した。
  - アラート内の補足pと本文説明文を非表示にし、画面の圧迫感を抑えた。
  - スタッフダッシュボードのヘッダーリンクを `予約一覧 / 予約枠` に限定し、ヘッダー内の「通知」リンクを表示しないようにした。
- 確認:
  - `node --check js/admin-auth.js`
  - `node --check js/staff-dashboard-page.js`
  - `git diff --check`
  - Playwrightで1024px表示時にKPI幅647px、アラート幅323pxの2:1配置、通知リンク非表示、未作成日チップの縦並び、補足p非表示を確認。

### 2026-05-04 スタッフダッシュボードの未作成日チップ上限調整
- 対象:
  - `staff/staff-dashboard.html`
  - `css/rebuild-ui.css`
  - `js/staff-dashboard-page.js`
- 背景:
  - ユーザー確認で、予約枠作成アラートの見出しを「予約枠が未作成！」へ短縮し、日付表示は最大4枚の2行×2列にして、4日以上ある場合は4枚目に「要確認」を表示する要望があった。
- 実装:
  - アラート見出しを「予約枠が未作成！」へ変更した。
  - 未作成日が4日以上ある場合、表示チップを先頭3日分と「要確認」の4枚に制限した。
  - 未作成日チップを2列グリッド化し、アラートの余白を調整してKPIエリアと高さを揃えた。
- 確認:
  - `node --check js/staff-dashboard-page.js`
  - `git diff --check`
  - Playwrightで1024px表示時にKPI高さ212px、アラート高さ212px、2×2チップと「要確認」表示を確認。

### 2026-05-04 スタッフダッシュボードのタブレット幅アラート配置調整
- 対象:
  - `css/rebuild-ui.css`
- 背景:
  - ユーザー確認で、PC幅の配置は良いが、タブレット幅でもダッシュボード:アラートを2:1にし、アラート内は縦積みにしたい要望があった。
- 実装:
  - 980px以下のスタッフダッシュボードでも、KPIエリアと予約枠作成アラートを `2:1` の横並びで維持するようにした。
  - タブレット幅では未作成日チップを1列にし、アラート内の見出し、チップ、ボタンが縦に積まれるようにした。
  - 560px以下では従来どおりKPIとアラートを縦積みに戻し、スマホ表示ではチップを2列に戻すようにした。
- 確認:
  - `git diff --check`
  - Playwrightで900px / 820px / 768pxはKPIとアラートが同一行の2:1、390pxは縦積みへ戻ることを確認。

### 2026-05-04 スタッフダッシュボードのスマホ幅最終調整
- 対象:
  - `css/rebuild-ui.css`
  - `js/admin-auth.js`
- 背景:
  - ユーザー確認で、スマホ幅ではログアウトボタンをハンバーガーメニュー内に入れ、予定日切替を横並びに戻し、KPIを2列3行にしたい要望があった。
- 実装:
  - スタッフヘッダーのハンバーガーメニュー内にログアウトボタンを追加し、スマホ幅では外側のログアウトボタンを非表示にした。
  - スマホ幅の予定日切替を `前日 / 日付 / 翌日` の1行配置にした。
  - スマホ幅のKPI6枚を2列3行にし、カード内のアイコン、余白、数値サイズを収まるように調整した。
- 確認:
  - `node --check js/admin-auth.js`
  - `git diff --check`
  - Playwrightで390px表示時に外側ログアウト非表示、メニュー内ログアウト表示、日付切替横並び、KPI2列3行を確認。

### 2026-05-04 接客詳細の予約者情報保存・表示補強
- 対象:
  - `js/public-data.js`
  - `js/staff-customer-detail-page.js`
  - `supabase/migrations/20260504120000_reservation_contact_persistence_guard.sql`
- 背景:
  - ユーザー確認で、予約枠への予約時に名前（ニックネーム可）とメールアドレスを入力する構造のため、その時点で保存され、接客詳細で表示される必要がある。
- 実装:
  - 予約作成の直接insertフォールバックで `customer_name` / `customer_email` を落とさないようにした。
  - RPC返却値にも予約者情報をマージし、予約完了直後の画面状態で入力情報を保持するようにした。
  - 接客詳細では `reservations.customer_name/customer_email` に加えて、`reservation.customer_id` に紐づく `customers.display_name/email` をフォールバック表示するようにした。
  - Supabase migrationで予約者名・メール・枠時間カラムと `create_public_reservation` / `fetch_reservation_by_code` を再定義し、DB側でも保存される状態を補強した。
- 確認:
  - `node --check js/public-data.js`
  - `node --check js/staff-customer-detail-page.js`
  - `git diff --check`

### 2026-05-04 接客詳細の予約者情報フォールバック修正
- 対象:
  - `js/staff-customer-detail-page.js`
- 背景:
  - ユーザー確認で、予約時に `test` / `test@example` を入力したはずなのに、会員プロフィール側の名前・メールが表示されている指摘があった。
  - DB側で `reservations.customer_name` / `reservations.customer_email` が未適用の場合、会員プロフィールへのフォールバックが保存漏れを隠してしまうため、予約時入力情報としては不適切だった。
- 実装:
  - 接客詳細のお客様名・メール表示は `fragranceCustomerDraft:<reservation.id>` と `reservations.customer_name/customer_email` のみに限定した。
  - `customers.display_name/email` への表示フォールバックを外し、会員登録状況とは別の情報として扱うように戻した。
- 確認:
  - `node --check js/staff-customer-detail-page.js`
  - `git diff --check`

### 2026-05-04 予約者情報migrationの関数再作成対応
- 対象:
  - `supabase/migrations/20260504120000_reservation_contact_persistence_guard.sql`
- 背景:
  - SQL Editorで `fetch_reservation_by_code(text)` の戻り値定義変更に対して `cannot change return type of existing function` が発生した。
- 実装:
  - `fetch_reservation_by_code(text)` を再定義前に `drop function if exists` するようにした。
- 確認:
  - `git diff --check`
