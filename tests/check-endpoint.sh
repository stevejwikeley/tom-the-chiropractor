#!/bin/sh
# Guards the promises the request handler makes that no test can reach.
#
# The handler is an async serverless function, so the browser harness strips
# it and tests only the pure builders above it. That leaves the feature's
# defining guarantees uncovered: who the email goes to, who is blind copied,
# where a reply lands, and that nobody is added to a mailing list. The
# sibling endpoint api/send-assessment.mjs does add people to a Resend
# audience, so a copy paste from it would pass every existing check.
#
# These are source assertions, not behavioural ones. They are coarse, and
# they catch a regression only if it is written the way this code is written.
# Run from the repo root: sh tests/check-endpoint.sh

set -e
cd "$(dirname "$0")/.."
FAIL=0

if [ ! -f api/send-guide.mjs ]; then
  echo "FAIL: api/send-guide.mjs does not exist"
  exit 1
fi

SRC=$(tr -d '\r' < api/send-guide.mjs)

expect() {
  if echo "$SRC" | grep -qF "$2"; then
    echo "ok:   $1"
  else
    echo "FAIL: $1"
    FAIL=1
  fi
}

refuse() {
  if echo "$SRC" | grep -qiF "$2"; then
    echo "FAIL: $1"
    FAIL=1
  else
    echo "ok:   $1"
  fi
}

expect "the patient is the only recipient" "to: [email]"
expect "the clinic is blind copied" "bcc: [clinic]"
expect "the clinic address comes from the environment" "process.env.CLINIC_EMAIL"
expect "reply to is the fixed constant" "reply_to: REPLY_TO"
expect "the constant is the clinic address" 'const REPLY_TO = "hello@tomthechiropractor.co.uk";'
# These name the three code shapes the sibling endpoint uses, rather than the
# bare word, so the file above is still free to say in prose that it does not
# do any of them.
refuse "no Resend audience endpoint is called" "resend.com/audiences"
refuse "no audience id is read from the environment" "RESEND_AUDIENCE_ID"
refuse "no contact record is created" "/contacts"

if [ "$FAIL" -eq 0 ]; then
  echo "endpoint guards pass"
else
  echo "endpoint guards FAILED"
  exit 1
fi
