#!/bin/sh
# Builds a self contained test page and prints its path.
#
# The browser pane renders local files as data: URL snapshots, so nothing
# relative resolves. Everything therefore gets inlined into one file.
#
# From api/send-guide.mjs this takes the imports off the top and the
# handler off the bottom, leaving the pure functions, and strips the
# export keywords so the result runs as a plain script rather than a
# module. That is why the handler must be the last thing in that file.

set -e
cd "$(dirname "$0")/.."
OUT="${1:-harness.html}"

DATA=$(sed 's/^export default /const GUIDES = /' guides/guides.mjs)

if [ -f api/send-guide.mjs ]; then
  PURE=$(sed '/^export default async function handler/,$d' api/send-guide.mjs \
         | sed '/^import /d' \
         | sed 's/^export function /function /')
else
  PURE="// api/send-guide.mjs does not exist yet"
fi

TESTS=$(cat tests/harness-tests.js)

cat > "$OUT" <<HTMLEOF
<!doctype html>
<meta charset="utf-8">
<title>harness</title>
<pre id="out">running</pre>
<script>
$DATA
$PURE
$TESTS
</script>
HTMLEOF

echo "$OUT"
