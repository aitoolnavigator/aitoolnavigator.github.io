"""Check every local content link, canonical, image and CSS reference."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'sourcing-note'


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids, self.links, self.assets, self.canonicals = [], [], [], []
        self.h1 = 0
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.h1 += 1
        if tag == 'a' and 'href' in attrs:
            self.links.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.assets.append(attrs['href'])
        if tag in ('img', 'script') and 'src' in attrs:
            self.assets.append(attrs['src'])
        if tag == 'img':
            assert 'alt' in attrs


pages = {p: Page(p.read_text(encoding='utf-8')) for p in SITE.glob('*.html')}
assert len(pages) == 14
for path, page in pages.items():
    assert page.h1 == 1, path
    assert len(page.ids) == len(set(page.ids)), path
    expected = 'https://aitoolnavigator.github.io/sourcing-note/' + ('' if path.name == 'index.html' else path.name)
    assert page.canonicals == [expected], path
    for href in page.links + page.assets:
        url = urlsplit(href)
        if url.scheme or url.netloc:
            assert url.scheme in ('https', 'mailto'), href
            continue
        target = (path.parent / unquote(url.path)).resolve() if url.path else path
        if target.is_dir():
            target /= 'index.html'
        assert target.exists(), (path.name, href)
        if url.fragment:
            assert target in pages and unquote(url.fragment) in pages[target].ids, (path.name, href)
print('PASS: 14 pages; all local links/anchors/assets, unique IDs, h1, canonicals and image alt text.')
