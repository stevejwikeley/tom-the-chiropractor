# QR codes

Codes for printed adverts. Nothing on the website references these files, so
don't delete them as unused assets: they exist to be dropped into artwork.

## golf-qr.svg

For the printed advert at Rothley Park Golf Club.

- **Encodes** `https://www.tomthechiropractor.co.uk/golf` and nothing else.
  The campaign tags (`utm_source=rothley-park`, `utm_medium=qr`,
  `utm_campaign=golf`) are added by the redirect in `vercel.json`, not by the
  code, which keeps the pattern small enough to scan reliably off paper.
  GA4 sees the same tags either way.
- **Lands on** `lp/golf.html`.
- **Format** version 4, error correction level Q (about 25% of the code can be
  obscured or damaged and it still reads). 33 modules a side, plus the 4
  module light margin the spec requires, so 41 across the artboard.
- **Sizing** the file declares 40mm square, and being an SVG it scales to any
  size without going soft. Keep it at 25mm or larger on print, keep the white
  margin around it, and don't put anything on top of it.
- **Colours** plain black on white. Inverting it or tinting it is the usual
  reason a code stops scanning, so change the colours only if you test the
  result with a phone afterwards.

Generated here from the ISO 18004 specification, not from a third-party QR
site, so Tom's URL was never handed to anyone else. Verified three ways: all
Reed-Solomon syndromes come out zero, an independent decoder read the finished
matrix back to the exact URL, and the SVG's path data was parsed back and
compared module by module against that matrix.
