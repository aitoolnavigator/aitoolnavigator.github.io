"""Build the categorized reading library from reviewed, versioned article sources."""
import argparse
import re
from html import escape
from pathlib import Path
from sourcing_articles import ARTICLES, CATEGORIES

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'sourcing-note'
BASE = 'https://aitoolnavigator.github.io/sourcing-note/'
NAMES = {key: title for key, title, _ in CATEGORIES}
BY_SLUG = {article['slug']: article for article in ARTICLES}


def display_title(title):
    return re.sub(r'\d[\d,]*(?:ドル|万円|円|型番|個|分)', lambda match: '<span class="keep-phrase">' + match[0] + '</span>', escape(title))


def head(title, description, path, script=False):
    return f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow"><title>{escape(title)} | 仕入れノート</title><meta name="description" content="{escape(description, quote=True)}">
<link rel="canonical" href="{BASE}{path}"><link rel="stylesheet" href="./style.css?v=1"><link rel="stylesheet" href="./reading.css?v=1">
{'<script src="./reading.js?v=1" defer></script>' if script else ''}</head><body>
<header class="header"><a class="wordmark" href="./">仕入れノート<span>SOURCING NOTE</span></a><nav aria-label="サイト内"><a href="./guides.html">読みもの</a><a href="./index.html#candidates">商品候補</a><a href="./index.html#calculator">経費の試算</a><a href="./index.html#criteria">確認基準</a></nav><span class="preview-label">試作版</span></header>'''


FOOTER = '''<footer>仕入れノート<span>利益・売却を保証するものではありません。</span><a href="./index.html#policy">掲載・プライバシー方針</a></footer></body></html>'''


def row(article):
    return f'<li data-guide-terms="{escape(article["title"] + " " + article["description"], quote=True)}"><a class="guide-row" href="./{article["slug"]}.html"><strong>{escape(article["title"])}</strong><span>{escape(article["description"])}</span></a></li>'


def build_library():
    nav = ''.join(f'<a href="#{key}">{title}<span>3本</span></a>' for key, title, _ in CATEGORIES)
    groups = ''.join(f'<section class="guide-group" id="{key}" aria-labelledby="{key}-title"><div class="section-heading"><h2 id="{key}-title">{title}</h2><span>{description}</span></div><ul>' + ''.join(row(article) for article in ARTICLES if article['category'] == key) + '</ul></section>' for key, title, description in CATEGORIES)
    return head('副収入と仕入れの読みもの', '月1万円の計画、仕入れ判断、実商品の調査記録、在庫リスク。計算例と確認項目から、無理のない進め方を考える12記事。', 'guides.html', script=True) + '''
<main class="guide-library"><p class="breadcrumb"><a href="./">仕入れノート</a> / 読みもの</p>
<div class="library-heading"><p class="eyebrow">副収入を考える、その前に</p><h1>副収入と仕入れの読みもの</h1><p>何個売る？ いくらで買う？ 売れなかったら？<br>気になる疑問から、ひとつずつ。</p></div>
<nav class="category-index" aria-label="読みもののカテゴリ">''' + nav + '''</nav>
<div class="guide-search" hidden><label for="guide-query">記事を検索<input type="search" id="guide-query" placeholder="月1万円、送料、在庫など" maxlength="100" autocomplete="off" aria-controls="guide-groups"></label><p role="status" id="guide-count" aria-live="polite">12本の記事</p></div>
<aside class="reading-start"><strong>最初に読むなら</strong><a href="./monthly-units.html">月1万円には、何個売ればいい？ →</a></aside>
<div id="guide-groups">''' + groups + '''</div><div class="guide-empty" hidden><p>一致する記事がありません。別の言葉で探してみてください。</p><button type="button" id="guide-clear">検索をクリア</button></div>
<section class="library-tools"><h2>自分の条件で確かめる</h2><a href="./index.html#calculator">送料・手数料を入れて試算する →</a><a href="./index.html#candidates">調査した商品と出典を見る →</a><p>掲載の金額は、実際の調査結果と仮の計算例を区別しています。サイト全体は検証中の試作版です。</p></section>
</main>''' + FOOTER


def build_article(article):
    key = article['category']
    section_nav = ''.join(f'<li><a href="#section-{index}">{escape(title)}</a></li>' for index, (title, _) in enumerate(article['sections'], 1))
    sections = ''.join(f'<section class="reading-section" aria-labelledby="section-{index}"><h2 id="section-{index}">{escape(title)}</h2>{body}</section>' for index, (title, body) in enumerate(article['sections'], 1))
    summary = ''.join('<li>' + escape(point) + '</li>' for point in article['summary'])
    related = ''.join(row(BY_SLUG[slug]) for slug in article['related'])
    sources = ''
    if article['sources']:
        sources = '<section class="article-sources"><h2>参照・確認先</h2><p>確認日：2026年10月18日。料金・条件・表示内容は変更されます。</p><ul>' + ''.join(f'<li><a href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">{escape(label)} ↗</a></li>' for label, url in article['sources']) + '</ul></section>'
    return head(article['title'], article['description'], article['slug'] + '.html', script=article['slug'] == 'monthly-units') + f'''
<main class="reading-shell"><article class="reading-article"><p class="breadcrumb"><a href="./">仕入れノート</a> / <a href="./guides.html#{key}">{NAMES[key]}</a></p>
<p class="article-meta">{NAMES[key]} · 2026年10月18日</p><h1>{display_title(article['title'])}</h1>
<section class="reading-summary" aria-labelledby="summary-title"><h2 id="summary-title">先に要点</h2><ul>{summary}</ul></section>
<nav class="reading-contents" aria-labelledby="contents-title"><h2 id="contents-title">この記事の目次</h2><ol>{section_nav}</ol></nav>
{sections}
<aside class="reading-caution">計算例は仮の条件です。利益・売却・必要な期間を保証するものではありません。税金や作業代など、含めていない費用は本文の条件を確認してください。</aside>
{sources}
<section class="article-related"><h2>次に気になることから</h2><ul>{related}</ul></section>
<p class="back-library"><a href="./guides.html#{key}">{NAMES[key]}の記事一覧へ →</a></p>
</article><aside class="reading-rail"><p class="eyebrow">自分の数字で確かめる</p><h2>経費を引いたら、いくら残る？</h2><a href="./index.html#calculator">差額を試算する →</a><hr><nav aria-label="読みもののカテゴリ">''' + ''.join(f'<a href="./guides.html#{cat}">{title}</a>' for cat, title, _ in CATEGORIES) + '</nav><figure><img src="./inspection.png" width="1536" height="1024" loading="lazy" alt="検品と梱包のイメージ。特定商品の写真ではありません。"></figure></aside></main>' + FOOTER


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    assert len(BY_SLUG) == 12
    assert all(sum(a['category'] == key for a in ARTICLES) == 3 for key, _, _ in CATEGORIES)
    pages = {'guides.html': build_library(), **{a['slug'] + '.html': build_article(a) for a in ARTICLES}}
    for name, source in pages.items():
        if args.check:
            assert (OUT / name).read_text(encoding='utf-8') == source, name + ' is stale'
        else:
            (OUT / name).write_text(source, encoding='utf-8', newline='\n')
    print(f'{"PASS" if args.check else "Built"}: 4 categories, 12 articles, linked library and deterministic article sources.')
