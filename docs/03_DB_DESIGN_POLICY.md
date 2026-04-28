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

## 2026-04-28 Phase 1 implementation note

ユーザー要望により、Phase 1 のDB・認証・QR基盤として `supabase/schema.sql` と `supabase/migrations/20260428073000_phase1_identity_qr.sql` に以下を追加した。

- `customers`, `staff_profiles`, `fragrance_products`, `product_qr_codes`, `qr_product_requests`, `notification_events`
- `questionnaire_results.customer_id`, `questionnaire_results.edit_token_hash`, `reservation_slots.staff_profile_id`, `reservations.customer_id`, `workshop_sessions.staff_profile_id`, `admin_settings.is_public`
- Supabase Auth の `portal_role` / `role` と `staff_profiles` を参照する権限判定関数
- 公開フォーム用RPC: `create_questionnaire_result`, `update_questionnaire_result_by_token`, `create_public_reservation`, `fetch_reservation_by_code`
- anon は公開フォームに必要な限定操作に寄せ、管理者・スタッフ操作は `manager` / `staff` 判定に寄せる
- QR第三者は `customers` に入れず、`qr_product_requests` に保存する
- QR依頼者メール・発送先の保持/削除判定用に `email_retention_until`, `shipping_address_retention_until`, `pii_anonymized_at` を持たせる

初期実装では、メール実送信・自動削除/匿名化・期限超過ジョブはまだ接続しない。後続フェーズで Edge Functions / メールAPI / 管理画面ログに接続する。

## 2026-04-28 Phase 2 implementation note

ユーザー要望の anon 最小権限方針に合わせ、`create_questionnaire_result` は `result_code` 衝突時の再同期を本人 edit token で制限する。

- 新規作成は公開フォームから許可する
- 既存行の更新は `edit_token_hash` 未設定行、または呼び出し側 edit token が既存 hash と一致する場合だけ許可する
- QR第三者・会員・スタッフ/管理者の権限分離方針は変更しない

## 2026-04-28 Phase 2 auth operation note

ユーザー要望の「スタッフ/管理者アカウントを Supabase Auth で正式作成する運用」に合わせ、スタッフ/管理者ログインは Supabase Auth 側の `portal_role` または `role` を正式な権限根拠とする。

- スタッフ画面は Auth metadata が `staff` のアカウントだけ許可する
- 管理者画面は Auth metadata が `manager` または `admin` のアカウントだけ許可する
- ログイン画面で選んだロールや localStorage の保存値は、画面遷移補助であり権限根拠にはしない
- 運用時は Auth user と `staff_profiles.auth_user_id` を紐づけ、スタッフ表示名・成果集計・予約枠の責任者を追えるようにする
- `staff-customer-detail.html` の保存は、`staff_profiles.auth_user_id` から有効なスタッフプロフィールを取得できるアカウントだけ許可する

## 2026-04-28 Phase 4 implementation note

ユーザー要望のメール運用方針に合わせ、実送信前の送信イベント管理用に `email_events` を追加する。

- QR作成依頼受付時は `email_events` に `qr_request_received_v1` を `queued` として記録する
- フロントからメールは直接送信しない
- Edge Functions / メールAPI 接続までは `email_events` を mock / 管理画面ログ用のイベントとして扱う
- `recipient_email` は個人情報として扱い、`retention_until` / `pii_anonymized_at` で削除・匿名化対象を判別できるようにする
