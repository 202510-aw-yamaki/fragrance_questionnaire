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

## 2026-04-29 admin settings auth note

ユーザー要望の「スタッフ/管理者アカウントを Supabase Auth で正式作成する運用」に合わせ、管理者設定画面のスタッフ登録データはログイン補助・勤務表示用に限定する。

- `admin_settings.staff_directory` にはスタッフ/管理者パスワードを保存しない
- 既存データに `staffPassword` / `managerPassword` が残っている場合は、運用時に限定SQLで削除する
- 管理者設定画面からのスタッフ保存は、Auth user 作成や `staff_profiles.auth_user_id` 紐づけを自動実行しない
- 正式ログイン・権限判定は Supabase Auth metadata と `staff_profiles` を正本とする
- `fragrancePortalLoginIndex` のようなlocalStorage上のログインID一覧は、ログイン可否判定に使わない
- スタッフ/管理者ロールは `app_metadata` だけを参照し、ユーザー自身が編集できる `user_metadata` は権限根拠にしない

2026-05-05 追記:

- 管理者設定画面で入力されたスタッフ/管理者のAuthパスワードは、`admin_settings` や `staff_profiles` に平文保存しない。
- パスワード入力がある場合は、管理者セッションを検証する Supabase Edge Function `admin-upsert-portal-auth-user` 経由で Supabase Auth ユーザーへ設定する。
- Edge Function は service role key をサーバー側環境変数として使い、フロントエンドへ service role key を置かない。
- `staff_profiles.auth_user_id` は、保存対象プロフィールの主ログインAuthユーザーに紐づける。

## 2026-04-28 Phase 4 implementation note

ユーザー要望のメール運用方針に合わせ、実送信前の送信イベント管理用に `email_events` を追加する。

- QR作成依頼受付時は `email_events` に `qr_request_received_v1` を `queued` として記録する
- フロントからメールは直接送信しない
- Edge Functions / メールAPI 接続までは `email_events` を mock / 管理画面ログ用のイベントとして扱う
- `recipient_email` は個人情報として扱い、`retention_until` / `pii_anonymized_at` で削除・匿名化対象を判別できるようにする

## 2026-04-29 QR public insert guard note

公開QR商品依頼の保存は、フロント側バリデーションだけに依存しない。

- `qr_product_public_max_volume_ml()` で公開設定 `qr_product_public_settings.max_volume_ml` をDB側から参照する
- `qr_product_requests` の公開insertは、メール形式、依頼容量、QR有効期限、QR公開状態、完成品公開状態をRLSで検証する
- 最大容量設定が未登録または数値でない場合は、DB側の既定値を100mlとする

## 2026-04-29 QR access tracking note

QR商品ページのアクセス記録は `record_qr_product_access()` を入口にする。

- 公開QRトークンまたはQRコード値から `product_qr_codes` を解決し、`access_count` と `last_accessed_at` を更新する
- 公開selectの対象は、有効期限内の `active` / `is_public` QRに限定する
- 期限切れ・無効化QRへのアクセス記録は行うが、作成依頼フォームは有効化しない
- 無効化QRの直近アクセス集計、管理者通知、自動無効化処理は後続フェーズで扱う

## 2026-04-29 customer auth connection note

会員ログインページは、Supabase Auth と `customers` を接続する入口として扱う。

- 初回パスワード設定は Supabase Auth signUp を呼び、メール確認不要の設定ではその場で `customers.auth_user_id` を作成する
- メール確認が必要なSupabase設定では、確認後のログイン時に `customers` 行を作成する
- 会員ロールは `user_metadata` ではなく、`customers.auth_user_id` の存在で判定する
- スタッフ/管理者 `app_metadata` を持つAuthユーザーは、フロントとRLSの両方で会員 `customers` insert から除外する
- 会員本人の制作履歴表示、過去完成品との比較、再予約導線は後続フェーズで扱う
- QR第三者はこの導線に入れず、引き続き `qr_product_requests` だけに保存する

## 2026-04-29 customer record link note

会員ログイン中の公開導線では、`customers.id` をアンケート結果・予約・完成品へ紐づける。

- `create_questionnaire_result()` と `create_public_reservation()` は、payload内の任意 `customer_id` ではなく、現在のSupabase Authユーザーから `current_customer_profile_id()` で会員IDを解決する
- anon利用時、またはスタッフ/管理者Auth利用時は `customer_id` を付けない
- 直接insert fallbackでも、RLSにより `customer_id` は本人の `customers.id` または null のみに制限する
- `fragrance_products.customer_id` は、スタッフ画面の完成品保存時に予約の `customer_id` を引き継ぐ
- QR第三者はこの紐づけには入れず、引き続き `qr_product_requests` のみで扱う
- 会員ページでの制作履歴表示・差分表示・再予約UIは後続フェーズで扱う

## 2026-04-29 customer portal summary note

会員ページ表示は、base tableを直接広く読ませるのではなく、`fetch_customer_portal_summary()` を入口にする。

- 現在のSupabase Authユーザーから `current_customer_profile_id()` で本人の `customers.id` を解決する
- 返却するのは会員情報、予約履歴、制作履歴の表示に必要な限定項目のみとする
- QR第三者、スタッフ、管理者は会員ページの履歴取得対象にしない
- 過去完成品との差分計算や再予約生成は、このRPCとは分けて後続フェーズで扱う

## 2026-05-03 reservation contact fields note

来店予約ページで名前とメールアドレスを入力する要望に合わせ、`reservations` に予約連絡用のnullable列を追加する。

- `customer_name`: 来店予約時に入力された識別名。ニックネームも許容する
- `customer_email`: 来店予約時に入力された連絡先メールアドレス
- 会員ログイン中の予約では、従来通り `customer_id` は `current_customer_profile_id()` で本人に紐づける
- 初見客や未ログイン予約では `customer_id` は null のまま、予約連絡用情報として `reservations` 側に保持する
- 香りバランス等は予約ページ上では表示しないが、`questionnaire_result_id` と `axes` は予約payloadで維持する
- `create_public_reservation()` と `fetch_reservation_by_code()` は `customer_name` / `customer_email` を扱う

## 2026-05-03 reservation duration note

予約完了ページで、予約枠に設定された所要時間を表示する要望に合わせ、`reservations` に予約時点の所要時間を保持するnullable列を追加する。

- `duration_minutes`: 来店予約時に選択した予約枠の所要時間（分）
- 管理画面側の予約枠は `slot_label` に `11:00-12:00` のような時間幅を持つため、公開予約時にフロントで分数へ変換して保存する
- `slot_label` は予約日時表示用として維持し、所要時間表示は `duration_minutes` を優先する
- `create_public_reservation()` と `fetch_reservation_by_code()` は `duration_minutes` を扱う

## 2026-05-04 explicit customer link note

予約・アンケート結果を会員に紐づけるかどうかは、ブラウザ内に残ったSupabase Authセッションの有無だけでは判断しない。

- 通常の公開予約はゲスト予約として扱い、`reservations.customer_id` と `questionnaire_results.customer_id` は `null` のままにする。
- 会員ページから予約・アンケートへ遷移した場合だけ、URLの `member=1` と保存payloadの `link_customer=true` を明示的な会員予約フラグとして扱う。
- `create_public_reservation()` と `create_questionnaire_result()` は `link_customer=true` のときだけ `current_customer_profile_id()` を使う。
- フロント側はゲスト予約保存時に `persistSession: false` のSupabase clientを使い、同じブラウザに残った別会員のAuthセッションを読まない。

## 2026-05-04 staff previsit recipe and product tag note

スタッフ詳細画面の事前配合提案とQR商品タグの要望に合わせ、DB上の保存先を以下に分ける。

- `workshop_sessions.previsit_recipe_items`: 来店前にスタッフが作った提案配合。
- `workshop_sessions.previsit_recipe_axes`: 提案配合を5軸表示用に補正した値。
- `fragrance_products.product_tags`: QR商品ページに表示する完成品タグ。商品名と同じく完成品に紐づく表示情報として扱う。
- 管理者が選べるタグ候補は `admin_settings.setting_key = 'qr_product_public_settings'` の `product_tags` に保持する。

事前配合はブラウザ一時保存ではなく、予約に紐づく `workshop_sessions` から復元できる状態を正とする。QR経由の第三者を `customers` に入れない方針は変更しない。

## 2026-05-04 RLS policy recursion note

`fragrance_products` と `product_qr_codes` のRLSポリシーが互いのテーブルを直接参照すると、完成品保存後の `select()` で再帰エラーになる。

- `fragrance_products` の公開判定は `has_active_public_product_qr(product_id)` で行う。
- `product_qr_codes` のスタッフ所有判定は `can_current_staff_access_fragrance_product(product_id)` で行う。
- どちらも `security definer` 関数で判定し、ポリシー本文で相互にbase tableを直接参照しない。

## 2026-05-07 QR request public insert RLS note

`qr_product_requests` の公開 insert 判定は `can_create_public_qr_product_request(product_qr_code_id, fragrance_product_id)` を入口にする。
anon が `product_qr_codes` / `fragrance_products` を直接読める前提にせず、Security Definer 関数側で QR 公開状態・有効期限・完成品公開状態を確認する。

## 2026-05-06 material points tags note

管理者の原料ポイント編集ページで任意タグを扱うため、`material_points` に `tags jsonb not null default '[]'::jsonb` を追加する。

- タグは原料検索、JSON保存、JSON読込、DB保存の対象に含める。
- 既存RLS方針は変更せず、公開側の原料参照に必要な anon select grant に `tags` を追加する。
- 原料ポイントの正本は引き続き `material_points` であり、DBが空または取得できない場合だけフロント側テンプレートを表示する。

## 2026-05-06 reservation capacity and notification note

公開予約保存は `create_public_reservation(p_payload jsonb)` を正本とし、フロントからの直接insert fallbackでは扱わない。

- `slot_id` がある予約では、`reservation_slots` の対象行を `FOR UPDATE` でロックしてから保存する。
- 予約可能な枠は `is_active = true` かつ `status in ('open', 'recommended')` で、枠日時が過去ではないものに限定する。
- 枠使用数は `reservations.status <> 'canceled'` を有効予約として数え、`reservation_slots.capacity` 以上の場合は `slot_full` を返す。
- 条件違反時のRPCエラーは `slot_not_found`、`slot_closed`、`slot_past`、`slot_full` の判別可能な文字列にする。
- `reservations` insert後、`notification_events.event_type = 'reservation_created'` を作成する。
- `target_staff_id` は `reservation_slots.staff_profile_id` を優先し、未設定枠では `null` のスタッフ全体通知として扱う。
- 予約通知payloadには `reservation_id`、`reservation_code`、`slot_id`、`slot_date`、`slot_time`、`slot_label`、`customer_name`、`summary_headline`、`profile_key` を保存する。
