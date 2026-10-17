"""Static search entries and optional comics; keep unrelated markup intact."""
from html import escape
from pathlib import Path
from runpy import run_path

navigation = run_path(str(Path(__file__).with_name('improve-wayfinding.py')))
Document, HOME, ROOT = (navigation[key] for key in ('Document', 'HOME', 'ROOT'))


ALIASES = {
    'comparison': '比較 選び方 アプリ 相談 紹介 おすすめ',
    'bridalnet-trial': '無料 トライアル ブライダルネット メッセージ 制限',
    'paid-plan': '料金 費用 値段 課金 総額 解約 退会 自動更新',
    'profile-builder': '自己紹介 プロフィール 作成 無料 ツール 例文',
    'profile-template': '自己紹介 プロフィール 写真 メッセージ 例文 書き方',
    'safety-check': '安全 危険 断る 断り方 初対面 待ち合わせ 詐欺',
    'first-month': '準備 最初 はじめて 初めて 予約 相談 30日',
    'marriage-life': '結婚 生活 家事 価値観 お金',
    'weekend-partner': '休日 デート 趣味',
    'cost': '料金 費用 値段 薬代 総額 半年 計算 送料',
    'doctor-questions': '医師 医者 質問 薬 副作用 相談 診察',
    'online-consultation': 'オンライン 通院 診察 相談 予約 比較',
    'clinic-check': 'クリニック 選び方 比較 医師 医者 相談',
    'hair-confidence': '薄毛 気持ち 不安 悩み',
    'photo-impression': '写真 記録 照明 薄毛',
    'hair-removal': '脱毛 ヒゲ ひげ 髭 料金 費用 値段 痛み 麻酔 リスク 回数 期間',
    'beard-attraction': '脱毛 ヒゲ ひげ 髭 残す 形 デザイン',
    'date-cleanlook': '初対面 デート 服 髪 爪 持ち物 身支度 清潔感',
    'deodorant': 'におい ニオイ 臭い 汗 衣服',
    'products': '用品 道具 化粧品 スキンケア 口コミ 買う',
    'routine': '洗顔 保湿 日焼け 日焼け止め 肌 スキンケア 朝',
}


def improve(file, site):
    source = file.read_text(encoding='utf-8')
    doc = Document(source)
    edits = []
    for node in doc.nodes:
        if node.tag == 'strong' and node.inside('analytics-consent'):
            edits.append((node.start, node.end, '<strong>アクセス解析の設定</strong>'))
        if node.tag == 'p' and node.inside('analytics-consent'):
            edits.append((node.start, node.end, '<p>同意した場合のみ、Google アナリティクスで閲覧・リンク利用を計測します。同意なしでも利用できます。<a href="./editorial-policy.html#analytics">詳しい取り扱い</a></p>'))
    if file.name == 'index.html' and 'data-reader-search' not in source:
        directory = next(n for n in doc.nodes if n.has('topic-directory'))
        heading = next(n for n in directory.children if n.tag == 'h2')
        entries = []
        for page in sorted(file.parent.glob('*.html')):
            if page.name in ('index.html', 'editorial-policy.html'):
                continue
            article = Document(page.read_text(encoding='utf-8'))
            title = next(n.text.strip() for n in article.nodes if n.tag == 'h1')
            keywords = escape(title + ' ' + ALIASES[page.stem], quote=True)
            entries.append(f'<li data-search-terms="{keywords}"><a href="./{page.name}">{escape(title)}</a></li>')
        search = '<div class="reader-search" data-reader-search hidden><label for="article-search">記事を検索</label><div class="search-controls"><input id="article-search" type="search" placeholder="料金、解約、写真など" maxlength="100" autocomplete="off" aria-controls="article-search-results"><button type="button" data-search-clear hidden>検索をクリア</button></div><p class="search-status" role="status" aria-live="polite"></p><ul id="article-search-results" class="search-results" hidden>' + ''.join(entries) + '</ul></div>'
        edits.append((heading.end, heading.end, search))
        head = next(n for n in doc.nodes if n.tag == 'head')
        edits.append((head.end - 7, head.end - 7, '<script src="../assets/reader-search.js?v=1" defer></script>'))
    comic = next((n for n in doc.nodes if n.has('comic-story')), None)
    if comic and not comic.inside('story-extra'):
        heading = next(n for n in comic.children if n.tag == 'h2')
        turn = next((n for n in doc.nodes if n.has('story-turn')), None)
        end = turn.end if turn else comic.end
        if turn and turn.start < comic.end:
            raise ValueError('Unexpected comic / story order')
        details = '<details class="story-extra"><summary>漫画で読む：' + escape(heading.text.strip()) + '</summary>' + source[comic.start:end] + '</details>'
        edits.append((comic.start, end, details))
    for start, end, value in sorted(edits, reverse=True):
        source = source[:start] + value + source[end:]
    file.write_text(source, encoding='utf-8', newline='\n')


if __name__ == '__main__':
    for site in HOME:
        for file in (ROOT / site).glob('*.html'):
            improve(file, site)
    print('Added local article search, optional comic reading and concise consent copy.')
