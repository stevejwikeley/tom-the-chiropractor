#!/bin/sh
# Checks the guide data module against reality:
#   every slug it names has a real guide file
#   every slug a group references is defined
#   the totals are what the design says they are
# Run from the repo root: sh tests/check-slugs.sh

set -e
cd "$(dirname "$0")/.."
FAIL=0

if [ ! -f guides/guides.mjs ]; then
  echo "FAIL: guides/guides.mjs does not exist"
  exit 1
fi

# .gitattributes normalises this repo to CRLF, so carriage returns are
# stripped before matching. Without this the anchored patterns below match
# in the working copy but fail on a fresh clone, which is worse than
# failing outright.
SRC=$(tr -d '\r' < guides/guides.mjs)

# Slugs defined as keys of the guides object: lines like   "low-back-pain": {
DEFINED=$(echo "$SRC" | grep -oE '^    "[a-z0-9-]+":' | tr -d ' ":' | sort)
# Slugs referenced inside group slugs arrays: lines like       "low-back-pain",
REFERENCED=$(echo "$SRC" | grep -oE '^        "[a-z0-9-]+",?$' | tr -d ' ",' | sort)

DEFINED_COUNT=$(echo "$DEFINED" | grep -c .)
REFERENCED_COUNT=$(echo "$REFERENCED" | grep -c .)
GROUP_COUNT=$(echo "$SRC" | grep -c '"heading":')

echo "defined slugs:    $DEFINED_COUNT (expect 21)"
echo "slug references:  $REFERENCED_COUNT (expect 27)"
echo "groups:           $GROUP_COUNT (expect 6)"

[ "$DEFINED_COUNT" -eq 21 ] || { echo "FAIL: expected 21 defined guides"; FAIL=1; }
[ "$REFERENCED_COUNT" -eq 27 ] || { echo "FAIL: expected 27 slug references"; FAIL=1; }
[ "$GROUP_COUNT" -eq 6 ] || { echo "FAIL: expected 6 groups"; FAIL=1; }

for slug in $DEFINED; do
  if [ ! -f "guides/$slug.html" ]; then
    echo "FAIL: guides/$slug.html does not exist"
    FAIL=1
  fi
done

for slug in $(echo "$REFERENCED" | sort -u); do
  if ! echo "$DEFINED" | grep -qx "$slug"; then
    echo "FAIL: group references undefined slug: $slug"
    FAIL=1
  fi
done

for slug in $DEFINED; do
  if ! echo "$REFERENCED" | grep -qx "$slug"; then
    echo "FAIL: guide is defined but in no group: $slug"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 0 ]; then
  echo "PASS: guide data is consistent"
else
  echo "FAILED"
  exit 1
fi
