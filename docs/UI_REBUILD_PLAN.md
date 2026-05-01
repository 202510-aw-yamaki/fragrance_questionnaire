# UI Rebuild Plan

## 目的

現行ページに残っている旧レイアウトの混在を解消し、`レイアウトimg` の参照画像を基準に、全ページの表示層を作り直す。

ただし、Supabase 接続、認証、RPC、DB保存、既存データ契約は壊さない。

## 基本方針

- 既存ページは退避して、現行導線と旧レイアウトを混在させない。
- 退避先は `archived/layout-rebuild-20260501/` を候補にする。
- `supabase/` は退避対象にしない。
- `js/supabase-config.js`、`js/supabase-client.js`、`js/public-data.js`、`js/admin-data.js`、認証・DB保存に必要な JS は維持対象として扱う。
- HTML/CSS は `レイアウトimg` を基準に再作成する。
- 参照画像を単に貼り付けるのではなく、ヘッダー、ナビ、フォーム、カード、表、モーダル、ステータス表示などをパーツ単位で構成する。
- 必要なビジュアル素材は、既存素材または画像生成で作成し、ページの実体として組み込む。
- ページ内に、クライアント説明用の注釈、実装メモ、後続フェーズ説明、参考画像説明を表示しない。
- UIだけを先に進めず、フォームID、ボタンID、DB保存処理、画面遷移は必ず維持または明示的に再接続する。

## 退避対象候補

- `index.html`
- `admin-login.html`
- `customer/*.html`
- `staff/*.html`
- `admin/*.html`
- 旧レイアウトに密結合した CSS
- 旧ページに直接埋め込まれた大きな表示用 CSS

退避前に、各ページが参照している JS、ID、フォーム、name属性、data属性を固定する。

## 維持対象候補

- `supabase/`
- `js/supabase-config.js`
- `js/supabase-client.js`
- `js/public-data.js`
- `js/admin-data.js`
- `js/admin-auth.js`
- `js/fragrance-master-data.js`
- DB/RPC/認証に必要な既存 JS ロジック

表示都合だけの JS は、ページ再構築時に再整理する。

## 参照画像と対象ページ

- `01. index.html トップページ.png` -> `index.html`
- `02. customer login.html 会員ログインページ.png` -> `customer/customer-login.html`
- `03. customer index.html 会員トップページ.png` -> `customer/index.html`
- `04. customer questionnaire.html 初回アンケートページ.png` -> `customer/questionnaire.html`
- `05. customer questionnaire_step2.html 分岐後アンケートページ.png` -> `customer/questionnaire_step2.html`
- `06. customer fragrance-graph.html 通常結果ページ.png` -> `customer/fragrance-graph.html`
- `07. 親：customer fragrance-graph.html 会員比較モード.png` -> `customer/fragrance-graph.html` の会員比較モード
- `08. 子：customer fragrance-graph.html 比較拡大モーダル.png` -> `customer/fragrance-graph.html` の比較モーダル
- `09. customer reservation.html 来店予約ページ.png` -> `customer/reservation.html`
- `10. customer reservation-complete.html 予約完了ページ.png` -> `customer/reservation-complete.html`
- `11. customer product-reservation.html QR商品作成依頼ページ.png` -> `customer/product-reservation.html`
- `12. customer shipping-info.html 発送先入力ページ.png` -> 未実装候補。QR発送先入力フロー確定後に作成する。
- `13. admin-login.html 共通ログインページ.png` -> `admin-login.html`
- `14. staff staff-dashboard.html スタッフダッシュボード.png` -> `staff/staff-dashboard.html`
- `15. staff staff-reservations.html スタッフ予約一覧ページ.png` -> `staff/staff-reservations.html`
- `16. staff staff-slots.html 予約枠作成ページ.png` -> `staff/staff-slots.html`
- `17. 親：staff staff-customer-detail.html スタッフ専用詳細ページ.png` -> `staff/staff-customer-detail.html`
- `18. 子：staff-customer-detail 香りのバランス調整モーダル.png` -> `staff/staff-customer-detail.html` のモーダル
- `19. 子：staff-customer-detail 商品名入力モーダル.png` -> `staff/staff-customer-detail.html` のモーダル
- `20. 子：staff-customer-detail 同意確認モーダル.png` -> `staff/staff-customer-detail.html` のモーダル
- `21. admin admin-dashboard.html 管理者ダッシュボード.png` -> `admin/admin-dashboard.html`
- `22. admin admin-settings.html 基本設定・店舗情報ページ.png` -> `admin/admin-settings.html`
- `23. admin admin-scoring.html 配点ロジック調整ページ.png` -> `admin/admin-scoring.html`
- `24. admin admin-materials.html 原料ポイント編集ページ.png` -> `admin/admin-materials.html`
- `25. admin admin-qr-settings.html QR商品設定ページ.png` -> 未作成候補。現行 `admin/admin-settings.html` の QR設定分離として検討する。
- `26. admin admin-dashboard.html QR関連通知詳細モーダル.png` -> `admin/admin-dashboard.html` のモーダル

## 未確定のため勝手に実装しない対象

- 外部決済
- 送料の自動計算
- 同意文バージョン管理
- QR商品の再有効化
- 大量注文専用フォーム
- 会員ページの差分表示ロジック
- スタッフ成果指標の確定集計
- QR依頼の個人情報保持・削除・匿名化運用

必要な場合は、`docs/06_OPEN_ISSUES.md` と照合し、ユーザー確認後に作業する。

## 再構築順

1. 契約棚卸し
   - HTML側で維持するID、name、data属性、script順を確定する。
   - Supabase/RPC/table 操作の入口を整理する。

2. 退避
   - 対象ページと旧レイアウトCSSを `archived/layout-rebuild-20260501/` へ移す。
   - 退避前後で Git 差分を確認する。

3. 共通UI土台
   - 顧客向け、スタッフ向け、管理者向けの共通CSSを整理する。
   - 旧ページ由来の巨大な埋め込みCSSを新規ページへ持ち込まない。

4. 顧客ページ再構築
   - トップ、会員ログイン、会員トップ、アンケート、結果、予約、予約完了、QR商品作成依頼を順に作る。

5. スタッフページ再構築
   - ダッシュボード、予約一覧、予約枠作成、顧客詳細、QR依頼一覧を作る。

6. 管理者ページ再構築
   - 共通ログイン、管理者ダッシュボード、基本設定、配点、原料、QR依頼一覧を作る。

7. 動作確認
   - 主要ページをブラウザで開く。
   - レイアウト崩れ、文字の重なり、ボタンの折り返し、フォーム送信、ログイン導線を確認する。
   - DB接続が必要な画面は、Supabase未設定時の表示も確認する。

## チェックリスト

- [x] 契約棚卸しを完了する
  → 参照画像一覧と、HTML/JS/Supabase 接続に必要な主要ID・data属性・依存テーブルを読み取りで棚卸しした。
- [ ] 退避対象と維持対象をユーザー確認する
- [ ] 現行ページを `archived/layout-rebuild-20260501/` に退避する
- [ ] 共通UI土台を作る
- [ ] 顧客ページを再構築する
- [ ] スタッフページを再構築する
- [ ] 管理者ページを再構築する
- [ ] ブラウザ確認を行う
- [ ] 関連ドキュメントに結果を追記する

## 2026-05-01 契約棚卸し追記

### 共有基盤

- `js/supabase-client.js`: `SUPABASE_CONFIG` から `window.supabaseClient` を作る入口。
- `js/admin-auth.js`: 管理者/スタッフログイン、ロール判定、ヘッダー生成、`staff_profiles` 参照。
- `js/admin-data.js`: `listRows`、`upsertRow`、`insertRow`、`updateRow`、`updateRows`、`deleteRow` の汎用CRUD層。
- `js/public-data.js`: 顧客公開導線、アンケート、予約、会員ログイン、QR商品依頼の主要データ入口。

### 顧客ページの主要契約

- `customer/customer-login.html`: `customer-login-form`、`setup-button`、`login-status`、`name="email"`、`name="password"`。
- `customer/index.html`: `logout-button`、`login-link`、`portal-status`、`member-name`、`member-name-inline`、`member-email`、`member-code`、`reservation-list`、`product-list`。
- `customer/questionnaire.html`: `brand-link`、`header-prev-btn`、`header-next-btn`、`nav-list`、`question-index`、`helper-text`、`progress-bar`、`progress-label`、`question-stepper`、`question-title`、`question-caption`、`option-list`、`sub-options`、`note-title`、`note-body`。
- `customer/questionnaire_step2.html`: `questionnaire.html` の契約に加え、`step2-status`、`axis-preview`、`questionnaire-sync-modal`、`questionnaire-sync-retry`、`questionnaire-sync-continue`、`questionnaire-sync-status`。
- `customer/fragrance-graph.html`: `radar-graph`、`grid-polygons`、`axis-lines`、`axis-labels`、`radar-shape`、`vertex-dots`、`slider-list`、`summary-list`、`reset-btn`、`reserve-link`、`data-preset`。
- `customer/reservation.html`: `summary-headline`、`summary-body`、`axis-list`、`slot-list`、`selected-status`、`visit-type`、`guest-count`、`staff-memo`、`confirm-btn`、`slot-modal` 系。
- `customer/reservation-complete.html`: `countdown-seconds`、`reservation-slot`、`reservation-guests`、`reservation-visit-type`、`reservation-memo`、`memo-item`、`stay-here-btn`、`detail-status-label`、`detail-toggle`。
- `customer/product-reservation.html`: `product-name`、`price-10ml`、`price-30ml`、`qr-request-form`、`quantity-10ml`、`quantity-30ml`、`request-summary`、`request-total`、`requester-email`、`request-status`、`submit-request`、`shop-phone`、`business-hours`、`data-quantity-target`。

### スタッフ・管理者ページの主要契約

- `admin-login.html`: `config-error`、`login-error`、`staff-login-tab`、`manager-login-tab`、`staff-login-panel`、`manager-login-panel`、`data-login-role`、`data-login-field="identifier"`、`data-login-field="password"`。
- `staff/staff-customer-detail.html`: `customer-edit-open`、`staff-detail-form`、`session-record-id`、`submit-mode`、`session-status`、`preparation-note`、`staff-summary`、`hearing-note`、`product-name`、`personal-info-consent`、`third-party-order-consent`、`recipe-list`、`axis-floral`、`axis-fresh`、`axis-woody`、`axis-spicy`、`axis-sweet`、`axis-total`、`final-axis-preview`、`customer-feedback`、`qr-preview`、`save-draft`、`save-complete`、`generate-qr`、`customer-modal`、`customer-form`、`customer-name`、`customer-email`、`customer-phone`、`customer-consent`。
- `staff/staff-qr-requests.html` / `admin/admin-qr-requests.html`: `qr-request-filter-form`、`qr-request-status-filter`、`qr-request-keyword-filter`、`qr-request-rows`、`qr-request-empty`、`qr-request-count`。
- `admin/admin-settings.html`: `settings-today-label`、`settings-today-staff`、`staff-create-button`、`staff-manage-select`、`staff-shift-button`、`shift-manage-select`、`qr-product-settings-form`、`qr-price-10ml`、`qr-price-30ml`、`qr-max-volume-ml`、`qr-shop-phone`、`qr-business-hours`、`settings-week-prev`、`settings-week-next`、`settings-calendar-head`、`settings-calendar-body`、`staff-modal`、`staff-form`、`staff-id`、`staff-code`、`staff-name`、`staff-role`、`staff-email`、`staff-phone`、`staff-color`、`staff-default-start`、`staff-default-end`、`staff-weekly-pattern`。
- `admin/admin-scoring.html`: `scoring-load-template`、`scoring-load-active`、`scoring-import-json`、`scoring-branch-settings`、`scoring-step1-section`、`scoring-q8-section`、`scoring-step2-section`、`scoring-finish-section`、`scoring-form`、`scoring-note`、`scoring-json`、`scoring-sections`、`scoring-question-*`。
- `admin/admin-materials.html`: `material-seed-btn`、`material-export-json`、`material-create-button`、`material-import-trigger`、`material-import-file`、`material-search`、`material-sort-mode`、`material-filter`、`material-rows`、`material-chip-grid`、`material-modal`、`material-form`、`material-id`、`material-code`、`material-name`、`material-category`、`material-sort`、`material-active`、`axis-floral`、`axis-fresh`、`axis-woody`、`axis-spicy`、`axis-sweet`、`material-note`、`material-reset`。

### 依存テーブル・RPC

- 公開導線: `scoring_configs`、`material_points`、`questionnaire_results`、`reservation_slots`、`reservations`、`customers`、`admin_settings`、`product_qr_codes`、`fragrance_products`、`qr_product_requests`。
- 管理/スタッフ導線: `reservations`、`reservation_slots`、`scoring_configs`、`material_points`、`admin_settings`、`notification_events`、`email_events`、`staff_profiles`、`workshop_sessions`、`fragrance_products`、`product_qr_codes`、`qr_product_requests`。
- RPC: `create_questionnaire_result`、`update_questionnaire_result_by_token`、`create_public_reservation`、`fetch_reservation_by_code`、`fetch_customer_portal_summary`、`record_qr_product_access`。

