# Implementation Log

このファイルは、作業実装の記録用です。
`docs/00_PROJECT_CORE.md` から `docs/06_OPEN_ISSUES.md` までの正本仕様を置き換えるものではありません。
正本資料への追記を増やしすぎないため、実装したファイル、判断、未対応範囲をここに集約します。

## 2026-04-29

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
