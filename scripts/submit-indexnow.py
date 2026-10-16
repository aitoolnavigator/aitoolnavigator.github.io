"""Notify IndexNow once about published URLs; dry run unless --submit is given."""
import argparse
import json
from pathlib import Path
import urllib.request
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HOST = 'aitoolnavigator.github.io'
KEY = '2f5df4d290f2477d9db07bd4ebce9a60'
KEY_URL = f'https://{HOST}/{KEY}.txt'
PREFIXES = ('/serious-dating-lab/', '/aga-hair-start/', '/mens-cleanlook-lab/')


def payload(urls=None):
    if (ROOT / f'{KEY}.txt').read_text(encoding='utf-8').strip() != KEY:
        raise ValueError('Verification file mismatch')
    if urls is None:
        urls = [node.text for node in ET.parse(ROOT / 'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
                if urlsplit(node.text).path.startswith(PREFIXES)]
    urls = list(dict.fromkeys(urls))
    if not 0 < len(urls) <= 10000:
        raise ValueError('Invalid URL count')
    for value in urls:
        url = urlsplit(value)
        if url.scheme != 'https' or url.netloc != HOST or url.query or url.fragment or not url.path.startswith(PREFIXES):
            raise ValueError('Only canonical public site URLs may be submitted')
        target = ROOT / url.path.lstrip('/')
        if url.path.endswith('/'):
            target /= 'index.html'
        if not target.is_file():
            raise ValueError('Missing local page: ' + value)
    return {'host': HOST, 'key': KEY, 'keyLocation': KEY_URL, 'urlList': urls}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--submit', action='store_true')
    parser.add_argument('--url', action='append', help='Submit only this changed canonical URL; repeat as needed')
    args = parser.parse_args()
    data = payload(args.url)
    if not args.submit:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return
    with urllib.request.urlopen(KEY_URL, timeout=30) as response:
        if response.status != 200 or response.read().decode('utf-8').strip() != KEY:
            raise ValueError('Published verification file is not ready')
    request = urllib.request.Request('https://api.indexnow.org/indexnow', data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json; charset=utf-8', 'User-Agent': 'SiteUpdateNotifier/1.0'}, method='POST')
    with urllib.request.urlopen(request, timeout=30) as response:
        status = response.status
        print(json.dumps({'status': status, 'submitted_urls': len(data['urlList']), 'meaning': 'received; key validation pending' if status == 202 else 'received; not an indexing or ranking guarantee'}))
        if status not in (200, 202):
            raise SystemExit('Unexpected response; do not retry in a loop')


if __name__ == '__main__':
    main()
