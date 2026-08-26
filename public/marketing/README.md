# ZERO-PAPER HUB marketing

This folder contains the editable, print-ready A4 landscape tri-fold marketing document.

## Files

- `zero-paper-hub-marketing.html` — editable marketing source
- `zero-paper-hub-marketing.pdf` — print/share version
- `assets/zero-paper-hub-logo.png` — high-resolution ZERO-PAPER HUB logo

## Printing

Print the PDF double-sided on A4 paper, flip on the short edge, and fold into thirds. Use “Actual size” or 100% scale. The faint vertical guides indicate the folds.

## Re-exporting the PDF

From the project root, run:

```bash
chromium --headless --no-sandbox --disable-gpu \
  --print-to-pdf="$(pwd)/public/marketing/zero-paper-hub-marketing.pdf" \
  --no-pdf-header-footer \
  "file://$(pwd)/public/marketing/zero-paper-hub-marketing.html"
```
