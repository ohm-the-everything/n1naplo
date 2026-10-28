#!/usr/bin/env bash
# Subsets Noto Sans (OFL) to Latin + Hungarian for the offline PDF summary.
# Usage: scripts/subset-fonts.sh [dir with NotoSans-Regular.ttf, NotoSans-Bold.ttf]
set -euo pipefail
SOURCE=https://raw.githubusercontent.com/notofonts/notofonts.github.io/main/fonts/NotoSans/hinted/ttf
OUT="$(cd "$(dirname "$0")/.." && pwd)/src/assets/fonts"
SRC="${1:-$(mktemp -d)}"
mkdir -p "$OUT"
for weight in Regular Bold; do
  [ -f "$SRC/NotoSans-$weight.ttf" ] || curl -fsSL -o "$SRC/NotoSans-$weight.ttf" "$SOURCE/NotoSans-$weight.ttf"
  uvx --from fonttools pyftsubset "$SRC/NotoSans-$weight.ttf" \
    --unicodes='U+0000-024F,U+2010-2027,U+20AC' --no-hinting \
    --output-file="$OUT/NotoSans-$weight.subset.ttf"
done
version=$(uv run --quiet --with fonttools python -I -c \
  "import sys; from fontTools.ttLib import TTFont; print(TTFont(sys.argv[1])['name'].getDebugName(5))" \
  "$SRC/NotoSans-Regular.ttf")
printf 'Noto Sans, %s\nSource: %s\nSubset: U+0000-024F, U+2010-2027, U+20AC (scripts/subset-fonts.sh)\n' \
  "$version" "$SOURCE" > "$OUT/SOURCE.txt"
