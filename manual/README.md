# 操作マニュアル

このフォルダには、Fragrance Workshop の操作説明用PPTXを役割別に置いています。

## ファイル

- `customer-operation-manual.pptx`: 顧客操作マニュアル
- `staff-operation-manual.pptx`: スタッフ操作マニュアル
- `admin-operation-manual.pptx`: 管理者操作マニュアル

## 確認順

1. まず対象者に合うPPTXを開きます。
2. 表紙の確認順に沿って、1スライドずつ操作を確認します。
3. 各スライドでは「手順」「注意」「完了の目安」を確認します。

## フォルダ構成

- `assets/generated-images/`: PPTX内で使用している生成画像
- `previews/`: 各PPTXの確認用PNGプレビュー
- `build-manuals.cjs`: PPTXとプレビューを再生成するためのスクリプト

## 更新時の注意

- 実画面のスクリーンショットは使わず、説明文はPPTX側の編集可能テキストとして更新してください。
- 画像を差し替える場合は、生成画像を `assets/generated-images/` に置いてからPPTXを再生成してください。
- 操作文言を変更した場合は、PPTXだけでなく `previews/` も再生成して確認してください。
