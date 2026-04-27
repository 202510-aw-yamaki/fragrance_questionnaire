# DB Design Policy

## 基本方針

後から機能を足しても破綻しないよう、以下を明確に分ける。

- customers: 会員・来店客本人
- questionnaire_results: アンケート回答
- reservations: 来店予約
- workshop_sessions: ワークショップ実施記録
- fragrance_products: 完成した香水
- product_qr_codes: 完成品に紐づくQR
- qr_product_requests: QRからの第三者作成依頼
- staff_profiles: スタッフ
- admin_settings: 管理者設定
- notification_events: 通知

## 重要な分離

QRから来た第三者は customers に入れない。
QR依頼は qr_product_requests として扱う。

会員導線とQR商品導線を混ぜない。

## QR依頼ステータス

qr_product_requests.status は以下を想定する。

- requested
- available_email_sent
- reminder_email_sent
- expired
- unavailable
- shipping_pending
- shipped
- auto_unavailable_overdue

各ステータスの詳細な意味と遷移条件は、`docs/04_QR_PRODUCT_FLOW.md` の `QR Request Status` を参照する。

## スタッフ成果の分離

fragrance_products.created_by_staff_id
→ ワークショップで香水を作成したスタッフ

qr_product_requests.handled_by_staff_id
→ QR依頼の在庫確認・発送対応をしたスタッフ

成果Aは created_by_staff_id に紐づくQR依頼数。
成果Bは created_by_staff_id に紐づく発送完了数。