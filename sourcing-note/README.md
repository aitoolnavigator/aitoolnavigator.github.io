# 仕入れノート（試作）

公開先： https://aitoolnavigator.github.io/sourcing-note/

静的HTML/CSS/JavaScriptの小さな仕入れ調査ツール。既存3サイトとはスタイル・スクリプトを分離。
調査日2026-10-18の4型番のみ掲載。リアルタイム収集・在庫保証・利益保証はしない。
出品価格、販売済み表示、正確な成約価格を区別する。条件達成の確認済み件数は0。

## 機能

- 型番・メーカー検索、証拠状態の絞り込み、国内価格順の並び替え。
- 元ページと注意点の開閉。JSなしでも候補・出典は読める。
- 商品IDだけをlocalStorageに保存。保存が使えない場合はメモリー内で保持。
- 全入力必須の差額計算。為替・手数料・販売価格に既定の仮定を入れない。
- 候補からは国内商品価格のみを計算欄へ引き継ぐ。海外掲載額を予定販売額へ自動入力しない。
- 検索・計算入力のネット送信、保存、アクセス解析、アフィリエイトはない。

試作のためnoindex,follow。既存サイトのsitemapに追加しない。
データ更新・自動収集・商用公開範囲は、取得／再利用条件と証拠を確認してから拡張する。

## 読みもの

`guides.html` に4カテゴリ各3本、合計12本を掲載。
月1万円の計画／仕入れ判断／調査記録／在庫リスク。
各記事に冒頭の要点、目次、具体例、関連3記事と試算へのリンクがある。
`monthly-units.html` は必要販売数と入力作業時間の合計を端末内で計算する。
数値例は仮定であり、実際の収益・料金・売却予測と区別する。

本文の編集元は `scripts/sourcing_articles.py`。
`python scripts/build-sourcing-guides.py` で静的HTMLを生成。
`python scripts/build-sourcing-guides.py --check` で更新漏れを検証する。
`python scripts/check-sourcing-content.py` でリンクとメタデータを検証する。
現段階では読みものもnoindex。広告や検索流入の設定は変更していない。

## 検証

`NODE_PATH`にPlaywrightのあるnode_modulesを指定し、`node scripts/check-sourcing.cjs`。
必要なら`SOURCING_PROOF`にスクリーンショット保存先を指定する。
新サイトのみの検証。既存の`python scripts/check-sites.py`も併用する。

## イラスト

`inspection.png`はbuilt-in image_genで生成した検品の概念図。特定商品の写真・状態の証拠ではない。
生成プロンプト：compact editorial illustration for a Japanese secondhand-camera sourcing research utility; landscape 3:2; original ink illustration on white with charcoal, forest-green and pale cyan; top-down generic optical attachment, magnifying glass, cloth, shipping carton, ruler and blank checklist; no specific product, brand, logo, text, price or chart.
元画像はCodex生成画像フォルダーに保持し、サイト内にもコピーした。
