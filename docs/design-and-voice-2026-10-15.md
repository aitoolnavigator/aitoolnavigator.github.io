# Magazine Layout and Natural Japanese

## Scope

- Redesigned three homepages and 22 article reading layouts; the shared masthead and type system also apply to three editorial policies.
- Rewrote all 22 four-panel dialogue scripts, their article introductions, selected transitions, and repeated unnatural body copy.
- Kept the six previously generated original story illustrations. This update does not claim newly drawn images or measured popularity/conversion gains.
- Retained scientific references, visible medical caveats, disclosures, prices, official links, affiliate state, calculators and consultation memos.

## Design Decisions

The homepages now distinguish a lead story, two supporting stories, direct routes by reader concern, and a grouped reading library. Images and titles carry different weights instead of every article being a similar text row. Flat tinted bands and restrained contrasting accents add warmth without replacing article content with a marketing hero.

The article view has a bounded reading column, a desktop contents/recommendation rail, and a native collapsed mobile contents menu. Links point to real headings. Existing image sheets are intentionally viewport-cropped without changing their intrinsic proportions; white dialogue space is excluded from editorial thumbnails. Whole four-panel illustrations remain available in articles.

Reference pages, consulted for category hierarchy and editorial organization rather than copied text, claims or assets:

- Hanako: https://hanako.tokyo/
- MEN'S NON-NO Beauty: https://www.mensnonno.jp/beauty/

## Voice

Mio speaks enthusiastically, Riko responds as a friend rather than an instructor. Yuu's uncertainty is not mocked; Nao helps make questions concrete. Sota and Kei use relaxed everyday conversation. Fragments were expanded where they sounded like captions rather than speech. The reader-requested heart appears in the bakery line, not throughout medical or professional copy.

Practical prose describes situations and examples instead of issuing content-production instructions. Mandatory safety, privacy and advertising information remains distinct from casual dialogue.

## Typography and Licensing

The self-hosted font is a character subset of Noto Sans JP, licensed under SIL OFL 1.1. The notice is included in assets/fonts/OFL-NotoSansJP.txt and original metadata is retained in the WOFF2. FontTools and Brotli were used only for local font conversion/subsetting. The served subset is approximately 350 KB, rather than serving the roughly 9.6 MB source TTF. No external font service is contacted.

The subset covers the current three sites. Regenerate it from current HTML when adding characters not covered by the subset; system fallback fonts remain specified.

## Plugin State

Product Design was found and offered for installation. The available integration cannot silently complete installation/connection, so it was not used or represented as installed. Implementation and verification proceeded with existing local tools.
