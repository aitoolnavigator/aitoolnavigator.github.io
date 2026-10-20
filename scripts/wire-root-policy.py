"""Expose the root editorial policy without changing ads or tracking settings."""
import argparse
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
LINK = '<p data-root-policy><a href="./editorial-policy.html">運営・編集方針／プライバシー</a></p>'


class Footer(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.offsets = [0]
        for line in source.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.ends = []
        self.feed(source)

    def handle_endtag(self, tag):
        if tag == 'footer':
            line, column = self.getpos()
            self.ends.append(self.offsets[line - 1] + column)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    count = 0
    for file in ROOT.glob('*.html'):
        source = file.read_text(encoding='utf-8')
        if 'ca-pub-2190099808306732' not in source:
            continue
        footer = Footer(source)
        assert len(footer.ends) == 1, file.name
        if 'data-root-policy' not in source:
            assert not args.check, f'{file.name}: missing policy link'
            index = footer.ends[0]
            file.write_text(source[:index] + LINK + source[index:], encoding='utf-8', newline='\n')
        count += 1
    print(f'PASS: {count} root content pages expose the editorial/privacy policy.')
