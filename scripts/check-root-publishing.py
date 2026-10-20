"""Check public root pages without implying AdSense approval or live revenue."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://aitoolnavigator.github.io/'


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.links, self.ids, self.canonical, self.robots = [], [], [], []
        self.h1 = 0
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.h1 += 1
        if tag in ('a', 'script', 'link'):
            href = attrs.get('href') or attrs.get('src')
            if href:
                self.links.append(href)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs['href'])
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots.append(attrs.get('content', ''))


files = [p for p in ROOT.glob('*.html') if not p.name.startswith('google')]
for file in files:
    source = file.read_text(encoding='utf-8')
    page = Page(source)
    assert page.h1 == 1 and len(page.ids) == len(set(page.ids)), file.name
    expected = BASE if file.name == 'index.html' else BASE + file.name
    assert page.canonical == [expected], file.name
    assert all('noindex' not in robots for robots in page.robots), file.name
    assert './editorial-policy.html' in page.links, file.name
    if file.name != 'editorial-policy.html':
        assert source.count('client=ca-pub-2190099808306732') == 1, file.name
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            continue
        target = ROOT / unquote(url.path or file.name)
        if target.is_dir():
            target /= 'index.html'
        assert target.exists(), f'{file.name}: missing {link}'
        if url.fragment and target.suffix == '.html':
            assert unquote(url.fragment) in Page(target.read_text(encoding='utf-8')).ids, link
    for block in source.split('<script type="application/ld+json">')[1:]:
        json.loads(block.split('</script>', 1)[0])
assert (ROOT / 'ads.txt').read_text().strip() == 'google.com, pub-2190099808306732, DIRECT, f08c47fec0942fa0'
urls = [e.text for e in ET.parse(ROOT / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls) == len(set(urls))
assert BASE + 'editorial-policy.html' in urls
print(f'PASS: {len(files)} root pages; policy navigation, local links, metadata, structured data, ads.txt and sitemap.')
