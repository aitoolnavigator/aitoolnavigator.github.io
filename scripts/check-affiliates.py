import importlib.util
import json
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('builder', Path(__file__).with_name('build-affiliates.py'))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def render(html, slots):
    page = builder.Page(html, slots)
    page.feed(html)
    for start, end, value in sorted(page.edits, reverse=True):
        html = html[:start] + value + html[end:]
    return html


class Affiliates(unittest.TestCase):
    link = '<a href="https://official.example/" data-affiliate-slot="test" data-affiliate-program="program">Official</a>'
    approved = {'id': 'test', 'approved_program_id': 'program', 'approved_url': 'https://px.a8.net/svt/ejp?a8mat=verified', 'tracking_pixel': 'https://www16.a8.net/0.gif?a8mat=verified', 'cta_text': 'Visit official'}

    def test_static_link_and_pixel(self):
        html = render(self.link, {'test': self.approved})
        self.assertIn('href="https://px.a8.net/', html)
        self.assertIn('rel="nofollow sponsored noopener"', html)
        self.assertEqual(html.count('data-affiliate-pixel='), 1)
        self.assertEqual(render(html, {'test': self.approved}), html)

    def test_pending_and_other_provider_unchanged(self):
        self.assertEqual(render(self.link, {'test': {'id': 'test'}}), self.link)
        other = dict(self.approved, approved_program_id='other')
        self.assertEqual(render(self.link, {'test': other}), self.link)

    def test_revoked_link_restores_original(self):
        html = render(self.link, {'test': self.approved})
        html = render(html, {'test': {'id': 'test'}})
        self.assertIn('href="https://official.example/"', html)
        self.assertIn('>Official</a>', html)
        self.assertNotIn('data-affiliate-pixel', html)
        self.assertNotIn('data-affiliate-approved', html)

    def test_only_reviewed_hosts(self):
        for url in ('http://px.a8.net/svt/ejp', 'https://px.a8.net.evil.test/', 'https://user@px.a8.net/', 'javascript:alert(1)'):
            with self.assertRaises(ValueError):
                builder.validate_url(url)

    def test_published_pages_match_config(self):
        data = json.loads((builder.ROOT / 'affiliate-slots.json').read_text(encoding='utf-8'))
        slots = {slot['id']: slot for slot in data['slots']}
        count = 0
        for site in builder.SITES:
            for file in (builder.ROOT / site).glob('*.html'):
                html = file.read_text(encoding='utf-8')
                self.assertEqual(render(html, slots), html, str(file))
                count += html.count('data-affiliate-approved=')
        self.assertEqual(count, 5)


if __name__ == '__main__':
    unittest.main()
