"""Apply the reader-navigation migration without reserializing unrelated HTML."""
from dataclasses import dataclass, field
from html import escape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME = {
    'serious-dating-lab': ('出会い方・料金・自己紹介。知りたいことから選べます。', [
        ('出会い方を比べたい', 'アプリと紹介型の違い', 'comparison.html'),
        ('無料で使える範囲を知りたい', 'ブライダルネットの条件', 'bridalnet-trial.html'),
        ('料金・解約を確認したい', '総額と自動更新の確認', 'paid-plan.html'),
        ('自己紹介文を作りたい', '無料・登録不要のメーカー', 'profile-builder.html'),
        ('写真・メッセージを整えたい', 'プロフィールと最初の一通', 'profile-template.html'),
        ('会う前の安全を確認したい', '待ち合わせ・断り方', 'safety-check.html')]),
    'aga-hair-start': ('費用・診察・クリニック選び。相談前の疑問から探せます。', [
        ('治療費を確認したい', '半年分の総額を計算', 'cost.html'),
        ('診察で何を聞くか知りたい', '薬・副作用・費用の質問', 'doctor-questions.html'),
        ('オンラインと通院を比べたい', '診察方法と準備', 'online-consultation.html'),
        ('クリニックを選びたい', '費用・診療・相談窓口', 'clinic-check.html'),
        ('何から始めるか知りたい', '記録から相談まで', 'first-month.html'),
        ('髪の変化を記録したい', '写真の条件と残し方', 'photo-impression.html')]),
    'mens-cleanlook-lab': ('ヒゲ脱毛の費用から毎日の手入れまで、気になることを選べます。', [
        ('ヒゲ脱毛の費用を知りたい', '総額・追加費用・通い方', 'hair-removal.html'),
        ('脱毛の相談準備をしたい', '予約から見積もりまで', 'first-month.html'),
        ('ヒゲを残すか迷っている', '仕上がりの希望を整理', 'beard-attraction.html'),
        ('毎日の手入れを知りたい', '洗顔・保湿・日差し対策', 'routine.html'),
        ('手入れ用品を選びたい', '買う前の確認事項', 'products.html'),
        ('会う前の身支度を整えたい', '服・髪・爪・持ち物', 'date-cleanlook.html')]),
}
SUMMARIES = {
    'bridalnet-trial': ['無料と有料では、写真やメッセージの利用範囲が違います。', '有料へ進む前に、最低利用期間・支払い方法・更新条件を確認。', 'トライアルの条件は公式案内で確かめてから登録しましょう。'],
    'comparison': ['自分で探すか、紹介や相談を受けたいかで比較しましょう。', '希望の地域・目的と、活動に使える時間を先に整理。', '料金だけでなく、無料範囲と解約条件も確認しましょう。'],
    'paid-plan': ['月額表示と、最初に支払う金額は別です。', '最低利用期間・自動更新・解約の締切を先に確認。', '下の計算欄で、自分の条件に合わせた総額を確認できます。'],
    'profile-template': ['趣味は大きく見せず、普段の過ごし方を具体的に。', '例文・写真・最初のメッセージを、それぞれ確認できます。'],
    'profile-builder': ['選択肢から自己紹介文の下書きを作れます。無料・登録不要です。', 'できた文章は、自分に当てはまる内容と言い方に直して使ってください。'],
    'safety-check': ['初対面は公共の場所を選び、帰る手段を自分で確保。', '金銭の要求や不安な誘いには応じず、会うのをやめても構いません。'],
    'marriage-life': ['特別な日より、普段の生活をどう過ごしたいか考えてみましょう。', '家事・お金・ひとりの時間など、話したいことを整理できます。'],
    'weekend-partner': ['一緒にしてみたい小さな楽しみから、出会いの希望を考えましょう。', '休日の過ごし方を自己紹介に取り入れる例も紹介します。'],
    'clinic-check': ['価格だけでなく、診療内容と困ったときの相談先も確認。', '説明を受けてから、治療するかどうかを考えましょう。'],
    'cost': ['初回価格だけでなく、診察・薬・送料を含む継続費用で比較。', '半年など同じ期間でそろえ、更新・中止の条件も確認。', '計算欄と質問メモを、相談前の整理に使えます。'],
    'doctor-questions': ['気になり始めた時期・場所と、使用中の薬をメモ。', '原因、治療の選択肢、副作用、続ける費用を医師に確認しましょう。'],
    'hair-confidence': ['他人の写真だけで、自分の状態や治療の要否は判断できません。', '気になる変化と心配なことを、相談で伝える言葉に整理しましょう。'],
    'online-consultation': ['オンラインと通院は、診察の方法・受けられる対応を比べましょう。', '薬代以外の費用と、症状が出たときの連絡先も確認。', '薄毛の原因や治療の要否は、医師に相談してください。'],
    'photo-impression': ['写真は照明や角度をそろえて記録しましょう。', '写真の見え方だけで進行や治療効果を判断せず、診察で確認してください。'],
    'hair-removal': ['残したいヒゲと、減らしたい部位を先に整理。', 'コース料金だけでなく、麻酔・追加照射・交通費も確認。', '痛みや肌のリスク、予約の条件も、契約前に相談しましょう。'],
    'beard-attraction': ['全部なくす以外に、一部を残す希望も相談できます。', '将来の仕上がりを考え、減らしたい場所を具体的に伝えましょう。'],
    'date-cleanlook': ['服・髪・爪・持ち物を、いつもの手入れで整えましょう。', '新しい道具を増やす前に、下の初対面チェックを使えます。'],
    'deodorant': ['香りを重ねる前に、衣服や持ち物の状態を確認。', '日常の見直しと、気になる状態を相談する目安をまとめています。'],
    'products': ['口コミの好みと、効果の根拠は分けて考えましょう。', '肌の状態や使い続けやすさを確認してから、必要なものを選びます。'],
    'routine': ['買い足す前に、洗顔・保湿・日差しへの備えを確認。', '服や持ち物、口元の手入れも、朝のチェックに使えます。'],
}
FIRST_MONTH = {
    'serious-dating-lab': ['活動に使える時間と予算を先に決めましょう。', 'プロフィールの準備から無料機能の確認まで、順に進められます。'],
    'aga-hair-start': ['気になる時期や場所を記録して、診察で伝える準備から。', '治療を急いで決めず、費用や心配なことを相談しましょう。'],
    'mens-cleanlook-lab': ['希望の部位と予算を整理してから、相談予約へ。', '見積もりは総額で確認し、持ち帰って考えても構いません。'],
}


@dataclass
class Node:
    tag: str
    attrs: dict
    start: int
    head_end: int
    end: int = 0
    parent: object = None
    children: list = field(default_factory=list)
    text: str = ''

    def has(self, name):
        return name in self.attrs.get('class', '').split()

    def inside(self, name):
        return self.has(name) or bool(self.parent and self.parent.inside(name))

    def hidden(self):
        return 'hidden' in self.attrs or bool(self.parent and self.parent.hidden())


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source, self.nodes, self.stack = source, [], []
        self.lines = [0]
        for line in source.splitlines(keepends=True):
            self.lines.append(self.lines[-1] + len(line))
        self.feed(source)

    def position(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self.position()
        node = Node(tag, dict(attrs), start, start + len(self.get_starttag_text()))
        if self.stack:
            node.parent = self.stack[-1]
            node.parent.children.append(node)
        self.nodes.append(node)
        if tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            self.stack.append(node)
        else:
            node.end = node.head_end

    def handle_endtag(self, tag):
        if self.stack and self.stack[-1].tag == tag:
            self.stack.pop().end = self.source.index('>', self.position()) + 1

    def handle_data(self, data):
        for node in self.stack:
            node.text += data


def migrate(file, site):
    if file.name == 'editorial-policy.html':
        return
    source = file.read_text(encoding='utf-8')
    if 'class="topic-directory"' in source or 'class="article-directory"' in source:
        return
    doc = Document(source)
    edits = []
    def replace(node, value):
        edits.append((node.start, node.end, value))
    if file.name == 'index.html':
        intro = next(n for n in doc.nodes if n.has('magazine-intro'))
        replace(next(n for n in intro.children if n.tag == 'p'), '<p>' + HOME[site][0] + '</p>')
        links = ''.join(f'<li><a href="./{url}"><strong>{title}</strong><span>{detail}</span></a></li>' for title, detail, url in HOME[site][1])
        directory = '<nav class="topic-directory" id="topics" aria-labelledby="topics-title"><h2 id="topics-title">知りたいことから探す</h2><ul>' + links + '</ul><a class="all-guides" href="#guides">すべての記事を見る →</a></nav>'
        edits.append((intro.end, intro.end, directory))
        acquisition = next((n for n in doc.nodes if n.has('acquisition-entry')), None)
        if acquisition:
            replace(acquisition, '')
        start = next(n for n in doc.nodes if n.has('start-here'))
        replace(start, '<div id="start"></div>')
        for n in doc.nodes:
            if n.tag == 'h2' and n.parent and n.parent.has('section-heading'):
                replace(n, '<h2>すべての記事</h2>')
            if n.tag == 'p' and n.parent and n.parent.has('section-heading'):
                replace(n, '')
    else:
        article = next((n for n in doc.nodes if n.tag == 'article' and n.has('article')), None)
        if not article:
            return
        h1 = next(n for n in article.children if n.tag == 'h1')
        points = FIRST_MONTH[site] if file.stem == 'first-month' else SUMMARIES[file.stem]
        summary = '<section class="reader-summary" aria-labelledby="summary-title"><h2 id="summary-title">先に要点</h2><ul>' + ''.join('<li>' + p + '</li>' for p in points) + '</ul></section>'
        toc = ['<li><a href="#builder">自己紹介文を作る</a></li>'] if file.stem == 'profile-builder' else []
        for n in doc.nodes:
            if n.tag != 'h2' or not n.inside('article') or n.hidden() or any(n.inside(c) for c in ('mobile-outline', 'comic-story', 'story-turn', 'next-step', 'related')):
                continue
            parent = n.parent
            target = n.attrs.get('id') or parent.attrs.get('id')
            if not target:
                target = 'topic-' + str(len(toc) + 1)
                edits.append((n.start, n.head_end, source[n.start:n.head_end - 1] + ' id="' + target + '">'))
            label = {'choose': '選び方と比較', 'budget': '費用の計算', 'check': '申込み前のチェック', 'memo': '相談用メモ', 'faq': 'よくある質問', 'official': 'サービスの公式情報', 'research': '研究で分かること・限界'}.get(parent.attrs.get('id'), n.text.strip())
            toc.append(f'<li><a href="#{target}">{escape(label)}</a></li>')
        directory = '<nav class="article-directory" aria-labelledby="contents-title"><h2 id="contents-title">この記事の目次</h2><ul>' + ''.join(toc) + '</ul></nav>'
        edits.append((h1.end, h1.end, summary + directory))
        for n in doc.nodes:
            if n.has('mobile-outline') or (n.has('reading-outline') and not n.inside('mobile-outline')) or n.has('answer') or (n.tag == 'p' and n.has('lead')):
                replace(n, '')
    for n in doc.nodes:
        if n.tag == 'a' and n.parent and n.parent.tag == 'nav' and n.attrs.get('href') in ('./#guides', './#start'):
            replace(n, '<a href="./#topics">目次から探す</a>' if n.attrs['href'] == './#guides' else '<a href="./#guides">記事一覧</a>')
    # Detect overlapping replacements before touching a file.
    last_end = -1
    for start, end, _ in sorted(edits):
        if start < last_end:
            raise ValueError(f'Overlapping changes in {file}')
        last_end = end
    for start, end, value in sorted(edits, reverse=True):
        source = source[:start] + value + source[end:]
    file.write_text(source, encoding='utf-8', newline='\n')


def complete_short_contents(file):
    source = file.read_text(encoding='utf-8')
    doc = Document(source)
    directory = next((n for n in doc.nodes if n.has('article-directory')), None)
    if not directory:
        return
    listing = next(n for n in directory.children if n.tag == 'ul')
    if len(listing.children) >= 3:
        return
    edits, extra = [], []
    for node in doc.nodes:
        if node.has('steps') or node.has('next-step'):
            target = node.attrs.get('id') or ('month-plan' if node.has('steps') else 'next-reading')
            if f'href="#{target}"' in source[listing.start:listing.end]:
                continue
            if not node.attrs.get('id'):
                edits.append((node.start, node.head_end, source[node.start:node.head_end - 1] + ' id="' + target + '">'))
            label = '最初の30日の進め方' if node.has('steps') else '次に確認すること'
            extra.append(f'<li><a href="#{target}">{label}</a></li>')
    if not extra:
        return
    edits.append((listing.end - 5, listing.end - 5, ''.join(extra)))
    for start, end, value in sorted(edits, reverse=True):
        source = source[:start] + value + source[end:]
    file.write_text(source, encoding='utf-8', newline='\n')


def complete_tool_contents(file):
    if file.name != 'profile-builder.html':
        return
    source = file.read_text(encoding='utf-8')
    doc = Document(source)
    for node in doc.nodes:
        if node.tag == 'li' and node.inside('article-directory') and '#profile-result' in source[node.start:node.end]:
            source = source[:node.start] + '<li><a href="#builder">自己紹介文を作る</a></li>' + source[node.end:]
            file.write_text(source, encoding='utf-8', newline='\n')
            break


if __name__ == '__main__':
    for site in HOME:
        for file in (ROOT / site).glob('*.html'):
            migrate(file, site)
            complete_short_contents(file)
            complete_tool_contents(file)
    print('Applied homepage directories and article summaries / visible contents.')
