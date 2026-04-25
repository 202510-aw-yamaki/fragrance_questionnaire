あなたは既存フロントエンドを壊さずに、Supabase 前提の静的HTMLアプリへ移行する慎重な実装者です。
VSCode ワークスペース内の既存ファイルを直接編集してください。

今回の目的は以下です。

1. 現在の Fragrance Workshop フロントを Supabase 前提へ切り替える
2. Spring Boot / MyBatis / MySQL 前提の実装発想をやめ、静的HTML + Supabase JS + RLS を前提にする
3. 一般ユーザー向けフロー
   - index.html
   - questionnaire.html
   - questionnaire_step2.html
   - fragrance-graph.html
   - reservation.html
   - reservation-complete.html
   を維持しつつ、保存先と取得先を Supabase に切り替える
4. 管理画面を別HTMLページ群として追加する
5. 将来的に IT 知識が薄い人でも
   - 予約情報
   - 予約枠
   - 配点ロジック
   - 原料ごとのポイント
   を管理しやすい方向へ土台を作る

==================================================
0. 最重要方針
==================================================

- まず README.md を読む
- 次に以下を読む
  - questionnaire.html
  - questionnaire_step2.html
  - fragrance-graph.html
  - reservation.html
  - reservation-complete.html
  - common.css
  - questionnaire-common.css
  - questionnaire-step1.css
  - questionnaire-step2.css
  - fragrance-graph.css
  - reservation.css
  - reservation-complete.css
- 現在の UI / レイアウト / class / DOM / 導線 / テキストトーンは極力維持する
- 既存の共通CSS依存を壊さない
- 既存のページ名は変えない
- 既存の見た目は大きく変えない
- ただし、Supabase 接続や共通データアクセスのために最小限の shared JS ファイルを追加するのは許可する
- 外部ビルドツールは使わない
- npm / Vite / React 化は禁止
- 静的HTML + CSS + JavaScript で完結させる
- Supabase の service role key は絶対にクライアントへ埋め込まない
- クライアント側では anon key のみ使用する
- 権限制御は Supabase Auth + RLS 前提で組む
- フロント側の失敗時には、現行 `sessionStorage` フォールバックで画面が壊れないようにする

==================================================
1. 先に理解すべき現状
==================================================

このプロジェクトは現在、
- HTML をページごとに分割
- JavaScript は主に各 HTML 末尾のインライン script
- ページ間受け渡しは sessionStorage
- 配点ロジックの主編集箇所は questionnaire.html の MASTER_SCORING_CONFIG
- STEP2 で fragranceScoreState を確定
- graph で fragranceReservationDraft を保存
- reservation で summary / axes / profileKey をまとめる
- reservation-complete で fragranceReservationConfirmation を読む
という構成になっている。

この思想は保ちつつ、
「保存先・取得先を Supabase に移す」
「配点ロジックを将来管理画面から変更可能にする」
「予約枠・予約情報・原料ポイントも管理画面で触れるようにする」
方向へ実装すること。

==================================================
2. 実装の全体方針
==================================================

## 2-1. 一般ユーザー向けフロー
既存の以下は維持する。
- index.html
- questionnaire.html
- questionnaire_step2.html
- fragrance-graph.html
- reservation.html
- reservation-complete.html

## 2-2. 新規追加する管理画面
以下の別ページを追加すること。

- admin-login.html
- admin-dashboard.html
- admin-reservations.html
- admin-slots.html
- admin-scoring.html
- admin-materials.html
- admin-settings.html

必要なら以下も追加してよい。
- admin-common.css
- admin-dashboard.css
- admin-table.css
- js/supabase-config.js
- js/supabase-client.js
- js/public-data.js
- js/admin-data.js
- js/admin-auth.js
- supabase/schema.sql

## 2-3. パス方針
まずは既存構成との相性を優先して、
管理画面もルート直下の HTML として実装してよい。
例:
- admin-dashboard.html
- admin-reservations.html

サブフォルダ化は今回は不要。

==================================================
3. Supabase 接続の実装方針
==================================================

## 3-1. 設定ファイル
新規作成:
- js/supabase-config.js
- js/supabase-client.js

### js/supabase-config.js
以下のような構造にすること。
- window.SUPABASE_CONFIG = { url: "...", anonKey: "..." }

ただし実値はダミーでよい。
README に設定方法を書くこと。

### js/supabase-client.js
- Supabase CDN を使ってクライアントを生成
- `window.supabaseClient` または export で再利用可能にする
- 一般ページ / 管理ページの両方から使えるようにする

例:
- getSupabaseClient()
- isSupabaseConfigured()
のような関数を持たせる

## 3-2. 重要な制約
- service role key は使わない
- 管理画面の CRUD も anon key + authenticated + RLS で成立する設計にする
- 未ログイン管理ページは admin-login.html に飛ばす
- 一般ページは未認証でも利用できる範囲で動くようにする

==================================================
4. Supabase のテーブル設計
==================================================

`supabase/schema.sql` を新規作成し、以下のテーブルを作成する SQL を実装すること。
Postgres / Supabase でそのまま使える SQL にすること。

## 4-1. questionnaire_results
用途:
アンケート結果の保存。STEP2完了時点のロジック結果と、graph 調整後の結果を保持する。

推奨カラム:
- id uuid primary key default gen_random_uuid()
- result_code text unique not null
- step1_answers_json jsonb
- step1_answer_keys_json jsonb
- step2_answers_json jsonb
- step2_answer_keys_json jsonb
- branch_key text
- axes_after_step1 jsonb
- axes_after_step2 jsonb
- final_axes jsonb
- adjusted_axes jsonb
- reset_axes jsonb
- selected_finish text
- profile_key text
- summary_headline text
- summary_body text
- source text default 'public_web'
- created_at timestamptz default now()
- updated_at timestamptz default now()

## 4-2. reservation_slots
用途:
予約枠管理

推奨カラム:
- id uuid primary key default gen_random_uuid()
- slot_code text unique not null
- slot_date date not null
- slot_time time not null
- slot_label text not null
- instructor_name text
- instructor_gender text
- status text not null default 'open'
- capacity integer not null default 1
- sort_order integer not null default 0
- is_active boolean not null default true
- created_at timestamptz default now()
- updated_at timestamptz default now()

status の想定:
- open
- recommended
- closed

## 4-3. reservations
用途:
予約情報保存

推奨カラム:
- id uuid primary key default gen_random_uuid()
- reservation_code text unique not null
- questionnaire_result_id uuid references questionnaire_results(id) on delete set null
- slot_id uuid references reservation_slots(id) on delete set null
- slot_label text
- visit_type text
- guest_count text
- staff_memo text
- summary_headline text
- summary_body text
- profile_key text
- axes jsonb
- status text not null default 'confirmed'
- created_at timestamptz default now()
- updated_at timestamptz default now()

## 4-4. scoring_configs
用途:
現在の配点ロジックの保存。将来 admin-scoring.html から編集できるようにする。

推奨カラム:
- id uuid primary key default gen_random_uuid()
- config_key text unique not null
- version integer not null default 1
- is_active boolean not null default false
- config_json jsonb not null
- note text
- created_at timestamptz default now()
- updated_at timestamptz default now()

運用方針:
- active なレコードは 1件だけ
- 現在の MASTER_SCORING_CONFIG を初期投入できる構造にする

## 4-5. material_points
用途:
原料ごとのポイント管理。将来の提案ロジック拡張用。

推奨カラム:
- id uuid primary key default gen_random_uuid()
- material_code text unique not null
- material_name text not null
- category text
- point_axes jsonb not null
- note text
- is_active boolean not null default true
- sort_order integer not null default 0
- created_at timestamptz default now()
- updated_at timestamptz default now()

point_axes の中身例:
{ floral: 10, fresh: 0, woody: 3, spicy: -1, sweet: 4 }

## 4-6. admin_settings
用途:
店舗情報や文言など将来管理したい設定の保存

推奨カラム:
- id uuid primary key default gen_random_uuid()
- setting_key text unique not null
- setting_value jsonb not null
- updated_at timestamptz default now()

==================================================
5. RLS と認可方針
==================================================

schema.sql には RLS の有効化と、最低限の policy も含めること。

## 5-1. 公開ページ用の想定
未認証でも許可:
- reservation_slots の公開用 select
  - is_active = true
  - status in ('open','recommended')
- scoring_configs の active config の select
- questionnaire_results の insert
- questionnaire_results の update
  - ただし result_code ベースの更新に限定しやすい形にする
- reservations の insert
- reservation-complete 用の reservations の select
  - reservation_code ベース参照を想定

## 5-2. 管理画面用の想定
authenticated ユーザーに許可:
- reservation_slots の full CRUD
- reservations の閲覧 / 更新
- scoring_configs の full CRUD
- material_points の full CRUD
- admin_settings の full CRUD

注意:
静的HTMLアプリなので、厳密な複雑ロール分離までは今回不要。
ただし最低でも「一般公開アクセス」と「管理者ログイン後アクセス」は分けること。

==================================================
6. 一般ユーザー向けページの改修
==================================================

==================================================
6-A. questionnaire.html
==================================================

目的:
- 既存の MASTER_SCORING_CONFIG は維持する
- ただし public page 起動時に Supabase 上の active scoring_configs を取得できるなら優先して使う
- 取得失敗時は現行 MASTER_SCORING_CONFIG を fallback として使う
- 最終的に sessionStorage.fragranceScoringConfig に保存する

実装要件:
- 既存の FRAGRANCE SCORING EDIT POINT コメントは残す
- 既存の MASTER_SCORING_CONFIG は fallback として維持
- ページ初期化時に
  1. Supabase の active scoring_configs を取得
  2. あれば sessionStorage に保存
  3. なければ MASTER_SCORING_CONFIG を保存
- STEP1 の回答保存ロジックは維持
- fragranceStep1Answers, fragranceScoreState も維持
- 既存UIは変えない

重要:
このページではまだ questionnaire_results を DB 保存しなくてよい。
保存は STEP2 完了時でよい。

==================================================
6-B. questionnaire_step2.html
==================================================

目的:
- STEP2 完了時に questionnaire_results を Supabase へ insert
- 返ってきた id / result_code を fragranceScoreState に保持
- 今後 graph / reservation から参照できるようにする

実装要件:
- 既存の score state 確定ロジックは維持
- showCompletion() または最終確定処理の中で、Supabase insert を行う
- 保存する内容:
  - step1_answers_json
  - step1_answer_keys_json
  - step2_answers_json
  - step2_answer_keys_json
  - branch_key
  - axes_after_step1
  - axes_after_step2
  - final_axes
  - reset_axes
  - selected_finish
  - profile_key
  - summary_headline
  - summary_body
- summary はここでは簡易でもよいが、reservation と整合するようにできるだけ近い値を入れる
- 保存成功時:
  - fragranceScoreState に questionnaireResultId / questionnaireResultCode を追加
- 失敗時:
  - 画面遷移は止めない
  - sessionStorage ベースで継続可能にする
  - console.error は出してよいが、ユーザー向け文言は壊さない

==================================================
6-C. fragrance-graph.html
==================================================

目的:
- graph 調整後の axes を questionnaire_results.adjusted_axes へ update できるようにする
- ただし update 失敗時も既存フローは壊さない

実装要件:
- 既存の graph 初期値読み込みロジックは維持
- 既存の fragranceReservationDraft 保存は維持
- 追加で、questionnaireResultCode か questionnaireResultId があれば Supabase update する
- update は slider の every input ではなく、過剰通信を避ける
  - debounce 300〜500ms 程度
- update 内容:
  - adjusted_axes
  - updated_at
- 既存の preset ボタンは維持
- 既存UIは変えない

==================================================
6-D. reservation.html
==================================================

目的:
- 予約枠を Supabase reservation_slots から取得
- 予約確定時に reservations へ insert
- questionnaire_results との紐付けも行う

実装要件:
- 既存の UI と slot modal は維持
- loadReservationSlots() は Supabase select を優先
- 取得条件:
  - is_active = true
  - status in ('open','recommended')
  - slot_date が今日以降
  - 並び順は slot_date asc, slot_time asc, sort_order asc
- Supabase 取得失敗時のみ demo slot fallback を使う
- handleReservationComplete() で reservations に insert
- 保存内容:
  - questionnaire_result_id
  - slot_id
  - slot_label
  - visit_type
  - guest_count
  - staff_memo
  - summary_headline
  - summary_body
  - profile_key
  - axes
- reservation_code を生成して保存する
  - クライアント生成でよい
  - 例: FR + 年月日 + ランダム英数字
- 保存成功時:
  - fragranceReservationConfirmation にも保存
  - reservation-complete.html?reservationCode=... に遷移
- 保存失敗時:
  - 現在の sessionStorage fallback で最低限遷移できるようにしてもよい
  - ただし優先は Supabase 保存成功

==================================================
6-E. reservation-complete.html
==================================================

目的:
- sessionStorage に reservation がなければ Supabase から reservation_code で取得する
- Spring の `/api/reservations/...` は使わない

実装要件:
- 現在の `/api/reservations/${code}` fetch は削除
- 代わりに Supabase reservations テーブルから reservation_code で select
- sessionStorage にあればまずそれを表示
- なければ query string の reservationCode で Supabase select
- 取得失敗時は index.html に戻す
- 既存 UI / countdown / accordion は維持

==================================================
7. 管理画面の実装
==================================================

管理画面は「IT知識が薄い人でも見やすい」を最優先にする。
テーブル直打ちの雰囲気ではなく、
- 見出し
- 説明
- フィルタ
- 一覧
- 編集フォーム
の順で整理する。

共通方針:
- common.css を活かす
- 必要なら admin-common.css を追加
- デザインは現行 public UI の延長線にする
- いきなり複雑なSPAにしない
- 1ページ1責務でよい

==================================================
7-A. admin-login.html
==================================================

目的:
- 管理者ログイン画面
- Supabase Auth email/password でサインイン
- サインイン済なら admin-dashboard.html に飛ばす

実装要件:
- シンプルなログインフォーム
- メール
- パスワード
- ログインボタン
- エラー表示
- ログアウト導線は管理画面ヘッダーに置く

==================================================
7-B. admin-dashboard.html
==================================================

目的:
管理トップ。
以下の入口カードを置く:
- 予約情報
- 予約枠管理
- 配点ロジック
- 原料ごとのポイント
- その他設定

表示内容:
- 今日以降の予約件数
- open / recommended の予約枠件数
- active scoring config の version
- material_points の件数

==================================================
7-C. admin-reservations.html
==================================================

目的:
予約情報の閲覧・管理

要件:
- 一覧表示
  - reservation_code
  - slot_label
  - visit_type
  - guest_count
  - summary_headline
  - created_at
  - status
- フィルタ
  - 日付
  - status
  - キーワード
- 詳細表示
  - memo
  - axes
  - profile_key
  - questionnaire_result_id
- status 更新
  - confirmed
  - canceled
  - completed
- 少なくとも閲覧 + status 更新はできるようにする

==================================================
7-D. admin-slots.html
==================================================

目的:
予約枠の CRUD

要件:
- 一覧表示
  - slot_date
  - slot_time
  - slot_label
  - instructor_name
  - status
  - capacity
  - is_active
- 新規作成フォーム
- 編集フォーム
- 削除または非表示切り替え
- status を open / recommended / closed から選べる
- 非ITの人でも操作しやすいよう select / date / time input を使う

==================================================
7-E. admin-scoring.html
==================================================

目的:
配点ロジック管理

最重要:
現段階では「わかりやすく編集できる」ことを優先し、
最初から超細かい GUI にしすぎない。

要件:
- 現在 active の scoring_configs を取得して表示
- version / note / updated_at を表示
- config_json を編集できる
- ただし生 JSON のみは避ける
- 以下の単位でセクション化する
  - 初期値 / 重み
  - STEP1 配点
  - branchTemplates
  - STEP2 配点
  - Q8 / finishTemplates
  - summaryProfiles
- 保存時は scoring_configs に新 version として insert し、
  旧 active を false、新 active を true にする
- questionnaire.html の fallback MASTER_SCORING_CONFIG との対応が分かるように README にも記載する

重要:
現段階では public page から active config を読めればよい。
admin-scoring で編集した値が public page に反映されるところまで実装する。

==================================================
7-F. admin-materials.html
==================================================

目的:
原料ごとのポイント管理

要件:
- 一覧表示
  - material_code
  - material_name
  - category
  - point_axes
  - is_active
- 新規作成
- 編集
- 並び順変更
- point_axes は 5軸を個別入力できる form にする
  - floral
  - fresh
  - woody
  - spicy
  - sweet
- JSON直接編集ではなく、数値 input で編集できるようにする

==================================================
7-G. admin-settings.html
==================================================

目的:
将来管理したい雑多な設定の置き場

最低限入れるもの:
- 店舗名
- 住所
- 予約時注意文言
- 予約完了ページ補足文言
- default instructor 候補などを置ける余地

現段階では:
- admin_settings テーブルの CRUD
- `setting_key` / `setting_value`
- シンプルなフォームで十分

==================================================
8. 共通ヘッダー・ナビ
==================================================

管理画面ページには共通ヘッダーを持たせること。
最低限:
- ロゴまたは Admin 表示
- Dashboard
- 予約情報
- 予約枠
- 配点ロジック
- 原料ポイント
- その他設定
- ログアウト

必要なら `admin-common.css` と `js/admin-auth.js` を使うこと。

==================================================
9. README.md 更新
==================================================

README.md を更新し、以下を追記すること。

## 9-1. サイトマップ更新
管理ページを追加:
- admin-login.html
- admin-dashboard.html
- admin-reservations.html
- admin-slots.html
- admin-scoring.html
- admin-materials.html
- admin-settings.html

## 9-2. CSS依存更新
追加した admin CSS を明記

## 9-3. Supabase 連携の説明
- js/supabase-config.js の設定方法
- schema.sql の実行手順
- public page と admin page のデータ流れ
- どのテーブルがどの画面で使われるか

## 9-4. 配点調整ポイント更新
今後は
- fallback は questionnaire.html の MASTER_SCORING_CONFIG
- 本番運用上の主編集は admin-scoring.html + scoring_configs
であることを明記する

## 9-5. 原料ポイントの位置づけ
material_points は将来の提案ロジック拡張用であり、
現段階では主に管理用 CRUD として実装することを記載する

==================================================
10. フォールバック方針
==================================================

Supabase が未設定・未接続でも、画面は壊さないこと。

優先順:
1. Supabase
2. sessionStorage
3. 既存 fallback 定数 / demo data

具体的に:
- questionnaire / step2 はローカルで進行できる
- graph は local draft で使える
- reservation は slot 取得失敗時だけ demo slots fallback
- complete は sessionStorage 優先
- admin pages は未設定なら明示メッセージを出す

==================================================
11. 実装品質条件
==================================================

- UI を大きく変えない
- CSS を荒らさない
- 既存 class 名を壊さない
- 既存の mobile 表示を壊さない
- null / undefined / network error を安全に扱う
- 例外で全画面が死なないようにする
- console.error は許可
- alert の乱用は禁止
- 長い重複コードは避ける
- Supabase 接続ロジックは shared 化する
- 管理画面の CRUD ロジックも shared 化してよい

==================================================
12. 受け入れ条件
==================================================

以下を満たすこと。

1. 一般ページフローが壊れない
2. STEP2 完了時に questionnaire_results を Supabase へ保存できる
3. graph 調整後に adjusted_axes を update できる
4. reservation_slots を Supabase から取得できる
5. reservation 確定時に reservations を insert できる
6. reservation-complete が reservationCode で Supabase から復元できる
7. 管理ログインができる
8. admin-dashboard から各管理ページへ遷移できる
9. admin-reservations で予約一覧を見られる
10. admin-slots で予約枠 CRUD ができる
11. admin-scoring で active scoring config を編集・反映できる
12. admin-materials で原料ポイント CRUD ができる
13. README が更新されている
14. 既存の public UI デザインを大きく壊していない

==================================================
13. 最終出力形式
==================================================

作業完了後は以下だけを簡潔に出力してください。

- 変更した既存ファイル一覧
- 追加した新規ファイル一覧
- Supabase テーブル一覧
- public page で Supabase 化した箇所
- admin page 一覧と役割
- README に追記した内容
- 残る注意点があれば 3〜6 点

まず README.md と既存HTML/CSS を読み、
現在の UI と導線を維持しながら、
Supabase 前提 + 管理画面追加の実装を進めてください。

==================================================
14. 追記: 2026-04-26 現行サイト構成への読み替え
==================================================

このメモは元の移行指示を残したまま、現行のファイル配置に合わせて参照先を補正するための追記です。

- 顧客向けページはルート直下ではなく `customer/` 配下を正とする
  - `customer/questionnaire.html`
  - `customer/questionnaire_step2.html`
  - `customer/fragrance-graph.html`
  - `customer/reservation.html`
  - `customer/reservation-complete.html`
  - `customer/product-reservation.html`
- スタッフ向けページは `staff/` 配下を正とする
  - `staff/staff-dashboard.html`
  - `staff/staff-customer-detail.html`
  - `staff/staff-slots.html`
  - `staff/staff-reservations.html`
- 管理者向けページは `admin/` 配下を正とする
  - `admin/admin-dashboard.html`
  - `admin/admin-settings.html`
  - `admin/admin-scoring.html`
  - `admin/admin-materials.html`
- 共通ログインのみ `admin-login.html` としてルート直下に置く
- `admin-login.html` はスタッフ / 管理者専用ページのため、現状は `index.html` から紐づけない
- スタイル管理は共通CSS整理よりも現行のインラインスタイル維持を優先し、将来整理を前提とする
