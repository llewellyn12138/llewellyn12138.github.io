# Old Maruko 1 (古馬路口1號) — display headings

A Source Han Sans derivative with deliberately broken strokes and ink-bleed
edges, i.e. the dry-brush / ink-starved look on a hei skeleton. Latin and
digits are not used from this file: `unicode-range` limits it to CJK, so
Asfalto still sets every Latin letter in the heading stack.

- Upstream: https://github.com/max32002/oldmaruko1
- License: SIL Open Font License 1.1 (see `OFL.txt`), commercial use allowed
- Weight used: DemiLight (the Regular build is noticeably thinner)
- File: `oldmaruko1-demilight-subset.woff2`, ~135 KB

## Why it is subsetted

The upstream font is ~19 MB per weight. Only heading text needs it, so the
shipped file contains exactly the CJK glyphs that appear in `<h1>`–`<h3>`
across the site (plus their punctuation). Any character outside that set simply
falls back to the next font in the stack, so a new heading never breaks — it
just renders in the system hei until the subset is rebuilt.

## Rebuilding the subset

Needs `python -m pip install fonttools brotli`.

```bash
# 1. collect every character used inside h1/h2/h3 in the built site
node scripts/collect-display-chars.js > /tmp/display-chars.txt
# 2. subset the upstream DemiLight build
python -m fontTools.subset OldMaruko1CJKsc-DemiLight-Lite.ttf \
  --text-file=/tmp/display-chars.txt --flavor=woff2 \
  --output-file=fonts/old-maruko/oldmaruko1-demilight-subset.woff2 \
  --no-hinting --layout-features=kern,liga --desubroutinize
```

`scripts/collect-display-chars.js` is committed for exactly this purpose; it is
not part of the build.
