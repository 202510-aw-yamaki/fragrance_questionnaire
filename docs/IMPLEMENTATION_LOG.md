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
