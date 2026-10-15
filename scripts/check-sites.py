from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import hashlib
import re
import subprocess
import xml.etree.ElementTree as ET


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.styles, self.links, self.ids, self.canonicals = [], [], set(), []
        self.h1 = 0
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'h1':
            self.h1 += 1
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'link':
            if attrs.get('rel') == 'stylesheet':
                self.styles.append(attrs['href'])
            if attrs.get('rel') == 'canonical':
                self.canonicals.append(attrs['href'])


root = Path(__file__).resolve().parent.parent
files = [file for site in ('serious-dating-lab', 'aga-hair-start', 'mens-cleanlook-lab')
         for file in (root / site).glob('*.html')]
pages = {file: Page(file.read_text(encoding='utf-8')) for file in files}
errors = []
for file, page in pages.items():
    relative = file.relative_to(root).as_posix()
    if page.h1 != 1 or len(page.canonicals) != 1:
        errors.append(f'{relative}: expected one h1 and canonical')
    if len(page.styles) != 1:
        errors.append(f'{relative}: expected one CSS request')
        continue
    bundle = (file.parent / page.styles[0]).resolve()
    css = bundle.read_text(encoding='utf-8')
    sources = re.findall(r'/\* Source: ([a-z0-9-]+\.css) \*/', css)
    expected = '\n'.join(f'/* Source: {name} */\n' + (root / 'assets' / name).read_text(encoding='utf-8') for name in sources)
    if css != expected or hashlib.sha256(css.encode()).hexdigest()[:10] not in bundle.name:
        errors.append(f'{relative}: stale bundle; run node scripts/build-styles.cjs')
    original = subprocess.run(['git', 'show', f'7088576:{relative}'], cwd=root, capture_output=True, check=True).stdout.decode('utf-8')
    original_styles = Page(original).styles
    if ['../assets/' + name for name in sources] != original_styles:
        errors.append(f'{relative}: stylesheet cascade changed')
    for href in page.links:
        url = urlsplit(href)
        if url.scheme or url.netloc:
            continue
        target = ((root if url.path.startswith('/') else file.parent) / unquote(url.path.lstrip('/'))).resolve() if url.path else file
        if target.is_dir():
            target /= 'index.html'
        if not target.exists():
            errors.append(f'{relative}: missing link {href}')
        elif url.fragment and target.suffix == '.html':
            target_page = pages.get(target) or Page(target.read_text(encoding='utf-8'))
            if unquote(url.fragment) not in target_page.ids:
                errors.append(f'{relative}: missing anchor {href}')
ET.parse(root / 'sitemap.xml')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(files)} pages, exact CSS cascade, deterministic bundles, h1/canonicals, local links/anchors and sitemap XML.')
