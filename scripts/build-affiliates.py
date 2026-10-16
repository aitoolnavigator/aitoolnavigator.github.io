"""Bake approved offers into HTML so links also work before JavaScript loads."""
import json
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITES = ('serious-dating-lab', 'aga-hair-start', 'mens-cleanlook-lab')


def validate_url(value, pixel=False):
    url = urlsplit(value)
    hosts = {'www16.a8.net'} if pixel else {'px.a8.net'}
    if url.scheme != 'https' or url.netloc not in hosts or url.username or url.fragment:
        raise ValueError('Unrecognized affiliate URL; review the actual A8 creative first')


class Page(HTMLParser):
    def __init__(self, html, slots):
        super().__init__(convert_charrefs=True)
        self.html, self.slots, self.edits = html, slots, []
        self.lines = [0]
        for line in html.splitlines(keepends=True):
            self.lines.append(self.lines[-1] + len(line))
        self.anchor = None
        self.count = 0

    def position(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        start = self.position()
        if tag == 'img' and 'data-affiliate-pixel' in attrs:
            self.edits.append((start, start + len(self.get_starttag_text()), ''))
        if tag == 'script' and attrs.get('src', '').startswith('../assets/affiliate-slots.js'):
            attrs['src'] = '../assets/affiliate-slots.js?v=2'
            self.edits.append((start, start + len(self.get_starttag_text()), self.tag(tag, attrs)))
        if tag != 'a' or 'data-affiliate-slot' not in attrs:
            return
        slot = self.slots.get(attrs['data-affiliate-slot'])
        if not slot:
            raise ValueError('Unknown slot')
        self.anchor = (start, attrs, slot)

    @staticmethod
    def tag(tag, attrs):
        return '<' + tag + ''.join(' ' + k + ('="' + escape(v, quote=True) + '"' if v is not None else '') for k, v in attrs.items()) + '>'

    def handle_endtag(self, tag):
        if tag != 'a' or self.anchor is None:
            return
        start, attrs, slot = self.anchor
        self.anchor = None
        end = self.position() + len('</a>')
        inner_start = self.html.index('>', start) + 1
        original_label = attrs.get('data-official-label', self.html[inner_start:self.position()])
        original_url = attrs.get('data-official-url', attrs['href'])
        approved = slot.get('approved_url') and slot.get('approved_program_id') == attrs.get('data-affiliate-program')
        pixel = ''
        if approved:
            attrs['data-official-url'] = original_url
            attrs['data-official-label'] = original_label
            attrs['data-affiliate-approved'] = slot['approved_program_id']
            attrs['href'] = slot['approved_url']
            attrs['rel'] = 'nofollow sponsored noopener'
            attrs['target'] = '_blank'
            label = escape(slot.get('cta_text') or original_label)
            if slot.get('tracking_pixel'):
                pixel = self.tag('img', {'src': slot['tracking_pixel'], 'width': '1', 'height': '1', 'alt': '', 'data-affiliate-pixel': attrs['data-affiliate-slot']})
            self.count += 1
        elif 'data-affiliate-approved' in attrs:
            attrs['href'] = original_url
            attrs['rel'] = 'noopener'
            for key in ('data-affiliate-approved', 'data-official-url', 'data-official-label'):
                attrs.pop(key, None)
            label = original_label
        else:
            return
        self.edits.append((start, end, self.tag('a', attrs) + label + '</a>' + pixel))


def build():
    data = json.loads((ROOT / 'affiliate-slots.json').read_text(encoding='utf-8'))
    slots = {s['id']: s for s in data['slots']}
    if len(slots) != len(data['slots']):
        raise ValueError('Duplicate slot ID')
    for slot in slots.values():
        if slot.get('approved_url'):
            if not slot.get('approved_program_id'):
                raise ValueError('Approved URL without approved program')
            validate_url(slot['approved_url'])
            if slot.get('tracking_pixel'):
                validate_url(slot['tracking_pixel'], pixel=True)
    outputs, count = [], 0
    for site in SITES:
        for file in (ROOT / site).glob('*.html'):
            html = file.read_text(encoding='utf-8')
            parser = Page(html, slots)
            parser.feed(html)
            for start, end, replacement in sorted(parser.edits, reverse=True):
                html = html[:start] + replacement + html[end:]
            outputs.append((file, html))
            count += parser.count
    for file, html in outputs:
        file.write_text(html, encoding='utf-8', newline='\n')
    print(f'Built {count} approved links across {len(outputs)} pages; pending programs unchanged.')


if __name__ == '__main__':
    build()
