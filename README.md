# 日本語の無料ツールと登録前ガイド

GitHub Pagesで公開している日本語サイトのソースです。

## 婚活プロフィールの自己紹介文メーカー

[無料ツールを開く](https://aitoolnavigator.github.io/serious-dating-lab/profile-builder.html?utm_source=github&utm_medium=referral&utm_campaign=first_decision&utm_content=profile_builder)

休日の楽しみ、出会いへの希望、文章の雰囲気を選び、自分の言葉を添えて
プロフィールの下書きを作れます。作った文章は編集してコピーできます。
無料・登録不要で、外部の生成AI APIは使用していません。

- 入力した文章はサーバーへ送信・保存しません。
- 共有ボタンがコピーするのはツールの固定URLだけです。
- JavaScriptが無効でも、ページ内の例文と確認事項は読めます。
- 返信率・交際・結婚を保証するものではありません。

![プロフィールについて話す二人](https://aitoolnavigator.github.io/assets/comic-dating-profile-v2-720.webp)

## 公開サイト

- [Serious Dating Lab](https://aitoolnavigator.github.io/serious-dating-lab/): 恋活・婚活の読みもの
- [AGA Hair Start](https://aitoolnavigator.github.io/aga-hair-start/): 診察で確認したいことと費用の整理
- [Mens Cleanlook Lab](https://aitoolnavigator.github.io/mens-cleanlook-lab/): 身だしなみと施術の登録前ガイド

広告・アフィリエイトリンクを含むページがあります。アクセス解析は同意後に
開始します。広告・アフィリエイトのCookie等はアクセス解析とは別であり、
詳しくは各サイトの運営・編集方針を確認してください。

## 開発・検証

```sh
node scripts/wire-consent.cjs
node scripts/build-styles.cjs
python scripts/build-affiliates.py
python scripts/check-sites.py
node scripts/check-consent.cjs
python scripts/check-affiliates.py
node scripts/check-affiliate-events.cjs
node scripts/check-profile-builder.cjs
```

静的HTMLとして動作します。広告リンクの更新手順は
[docs/affiliate-build.md](docs/affiliate-build.md)を参照してください。
