#!/bin/bash
# Resizes and compresses photos for the website, so every photo in
# images/action and images/headshots is sized and saved the same way.
#
# Usage:
#   images/resize.sh action ~/Desktop/new-photo.jpg
#   images/resize.sh headshots ~/Desktop/photo1.jpg ~/Desktop/photo2.jpg
#
# What it does to each photo:
#   - Resizes it so the longest side is 1600px (camera photos are usually
#     4000-6000px, which is far bigger than needed and makes the site slow).
#   - Saves it as a JPEG at quality 80 (small file size, no visible
#     difference in quality on screen).
#   - Puts the result in images/action/ or images/headshots/, next to the
#     other photos, using the original filename.
#
# The original photo is never changed or deleted -- this only writes a new,
# smaller copy into the website's images folder.

set -e

DEST="$1"
if [ "$DEST" != "action" ] && [ "$DEST" != "headshots" ]; then
  echo "First argument must be 'action' or 'headshots', e.g.:"
  echo "  images/resize.sh headshots ~/Desktop/new-photo.jpg"
  exit 1
fi
shift

if [ "$#" -eq 0 ]; then
  echo "Give at least one photo to resize, e.g.:"
  echo "  images/resize.sh action ~/Desktop/photo1.jpg ~/Desktop/photo2.jpg"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/$DEST"

for SRC in "$@"; do
  if [ ! -f "$SRC" ]; then
    echo "Skipping, file not found: $SRC"
    continue
  fi

  NAME="$(basename "$SRC")"
  NAME="${NAME%.*}.jpg"
  OUT="$OUT_DIR/$NAME"

  cp "$SRC" "$OUT"
  sips -Z 1600 -s format jpeg -s formatOptions 80 "$OUT" >/dev/null

  BEFORE=$(du -h "$SRC" | cut -f1)
  AFTER=$(du -h "$OUT" | cut -f1)
  echo "$NAME: $BEFORE -> $AFTER  (saved to images/$DEST/)"
done
