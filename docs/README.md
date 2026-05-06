# docs の役割

このフォルダは、現在仕様・設計・参照資料・過去資料を分けて管理します。

## 現在の正本

通常作業では、以下を上から順に確認します。

- `00_PROJECT_CORE.md`: プロジェクトの核
- `01_CURRENT_STATE.md`: 現在の実装状態
- `02_TARGET_ARCHITECTURE.md`: 目標構成
- `03_DB_DESIGN_POLICY.md`: DB設計方針
- `04_QR_PRODUCT_FLOW.md`: QR商品導線。現時点では後続課題を含む
- `05_IMPLEMENTATION_ROADMAP.md`: 実装順序と残作業
- `06_OPEN_ISSUES.md`: 未確定事項

## 個別仕様

- `SPEC.md`: 画面・運用の仕様
- `SURVEY_SCORING_LOGIC.md`: アンケート配点・分岐ロジック
- `MATERIAL_POINTS.md`: 原料ポイント
- `Question_template.md`: 質問文テンプレート
- `IMPLEMENTATION_LOG.md`: 実装ログ。旧パスは当時の参照として残す

## 資料・画像

- `presentation/`: 現行説明用PPTXとPNG出力
- `assets/layout-reference/`: レイアウト参照画像。数値はモックを含むため、配点・DB値の正本にはしない

## 過去資料

- `archive/`: 完了済み・旧前提・調査資料・旧PPTX・ユーザー設定メモ

過去資料を現在仕様として直接実装しないでください。必要な場合は、現在の正本資料と照合してから参照します。
