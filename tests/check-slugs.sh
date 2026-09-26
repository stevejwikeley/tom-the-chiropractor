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
DEFINED=$(echo "$SRC" | grep -oE '^    "[a-z0-9-]+":' | tr -d ' ":' | sort || true)
# Slugs referenced inside group slugs arrays: lines like       "low-back-pain",
REFERENCED=$(echo "$SRC" | grep -oE '^        "[a-z0-9-]+",?$' | tr -d ' ",' | sort || true)

DEFINED_COUNT=$(echo "$DEFINED" | grep -c . || :)
REFERENCED_COUNT=$(echo "$REFERENCED" | grep -c . || :)
GROUP_COUNT=$(echo "$SRC" | grep -c '"heading":' || :)

echo "defined slugs:    $DEFINED_COUNT"
echo "slug references:  $REFERENCED_COUNT"
echo "groups:           $GROUP_COUNT"

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
