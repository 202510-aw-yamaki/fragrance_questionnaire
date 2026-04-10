# fragrance_questionnaire

フレグランス体験向けのフロントエンド試作です。HTMLごとにページを分け、共通CSSとページ別CSSを組み合わせて構成しています。

## サイトマップ

```text
index.html
  └ questionnaire.html
      └ questionnaire_step2.html
          └ fragrance-graph.html
              └ reservation.html
                  └ reservation-complete.html
```

## ページ構成

- `index.html`
  - トップページ
  - 体験概要、導線、基本情報、安心材料を表示
- `questionnaire.html`
  - アンケート STEP1
  - 共通5問を表示
- `questionnaire_step2.html`
  - アンケート STEP2
  - STEP1 の回答傾向に応じて分岐3問を表示
- `fragrance-graph.html`
  - 香りバランスの可視化ページ
  - レーダーグラフとスライダーで調整
- `reservation.html`
  - 予約ページ
  - 香り傾向表示、予約枠選択、来店情報入力、メモ入力
- `reservation-complete.html`
  - 予約完了ページ
  - 予約内容確認、来店案内、地図導線を表示

## CSS依存関係

各HTMLは `css/common.css` を土台にし、必要に応じてページ専用CSSを追加しています。

```text
index.html
  - css/common.css
  - css/top-page.css

questionnaire.html
  - css/common.css
  - css/questionnaire-common.css
  - css/questionnaire-step1.css

questionnaire_step2.html
  - css/common.css
  - css/questionnaire-common.css
  - css/questionnaire-step2.css

fragrance-graph.html
  - css/common.css
  - css/fragrance-graph.css

reservation.html
  - css/common.css
  - css/reservation.css

reservation-complete.html
  - css/common.css
  - css/reservation-complete.css
```

## 補足

- JavaScript は外部ファイル化されておらず、各HTML末尾にインラインで記述されています。
- ページ間の一時データ受け渡しには `sessionStorage` を使用しています。
- 現在の予約ページと予約完了ページは、バックエンドAPIに依存せずフロント単体で動作する構成です。
