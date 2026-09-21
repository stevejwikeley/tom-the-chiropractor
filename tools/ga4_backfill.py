#!/usr/bin/env python3
"""GA4 range pull + before/after comparison for the marketing plan.

Standalone — does not import daily_pull.py. Pulls a daily series over an
arbitrary date range, splits it around the day the Ads changes were made,
and prints a like-for-like comparison. Raw rows are written to JSON so the
numbers can be pushed into the dashboard or handed back for analysis.

Run it with the dashboard's own venv and service account:

    GOOGLE_APPLICATION_CREDENTIALS=~/.tom-chiro-dashboard/service-account.json \
      ~/.tom-chiro-dashboard/venv/bin/python3 tools/ga4_backfill.py

Defaults to cutover 2026-09-09 (the day the ad group was rebuilt, keywords
added, final URLs moved to book-online.html and the CPC cap raised), with the
"before" window auto-sized to match the "after" window.
"""

import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    Metric,
    RunReportRequest,
)

PROPERTY_ID = "550256386"

TRACKED_EVENTS = [
    "ads_conversion_Book_appointment_1",
    "booking_widget_engage",
    "whatsapp_click",
    "phone_click",
    "email_click",
    "contact_form_submit",
    "desk_check_lead",
]

FLOAT_METRICS = {"advertiserAdCost", "userEngagementDuration"}


def ymd(d):
    return d.strftime("%Y-%m-%d")


def from_ga_date(s):
    return datetime.strptime(s, "%Y%m%d").date()


def to_num(metric, raw):
    if metric in FLOAT_METRICS:
        return round(float(raw or 0), 2)
    return int(float(raw or 0))


def run_report(client, start, end, dims, metrics, dim_filter=None):
    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        date_ranges=[DateRange(start_date=ymd(start), end_date=ymd(end))],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in metrics],
        dimension_filter=dim_filter,
        limit=100000,
    )
    response = client.run_report(request)
    rows = []
    for row in response.rows:
        record = {d: row.dimension_values[i].value for i, d in enumerate(dims)}
        for i, m in enumerate(metrics):
            record[m] = to_num(m, row.metric_values[i].value)
        rows.append(record)
    return rows


def event_filter():
    return FilterExpression(
        filter=Filter(
            field_name="eventName",
            in_list_filter=Filter.InListFilter(values=TRACKED_EVENTS),
        )
    )


def pull(client, start, end):
    return {
        "traffic": run_report(
            client, start, end,
            ["date"],
            ["sessions", "totalUsers", "screenPageViews", "userEngagementDuration"],
        ),
        # CLAUDE.md: cost import is campaign-level only. Crossing
        # sessionCampaignName with sessionGoogleAdsAdGroupName is rejected.
        "campaigns": run_report(
            client, start, end,
            ["date", "sessionCampaignName"],
            ["advertiserAdCost", "advertiserAdClicks", "advertiserAdImpressions", "sessions"],
        ),
        "events": run_report(
            client, start, end,
            ["date", "eventName"],
            ["eventCount", "totalUsers"],
            dim_filter=event_filter(),
        ),
        "channels": run_report(
            client, start, end,
            ["date", "sessionDefaultChannelGroup"],
            ["sessions", "totalUsers"],
        ),
        "landingPages": run_report(
            client, start, end,
            ["landingPagePlusQueryString"],
            ["sessions", "totalUsers"],
        ),
    }


def in_window(row, start, end):
    d = from_ga_date(row["date"])
    return start <= d <= end


def summarise(data, start, end):
    traffic = [r for r in data["traffic"] if in_window(r, start, end)]
    campaigns = [r for r in data["campaigns"] if in_window(r, start, end)]
    events = [r for r in data["events"] if in_window(r, start, end)]
    channels = [r for r in data["channels"] if in_window(r, start, end)]

    by_campaign = defaultdict(lambda: {"cost": 0.0, "clicks": 0, "impressions": 0, "sessions": 0})
    for r in campaigns:
        c = by_campaign[r["sessionCampaignName"] or "(not set)"]
        c["cost"] += r["advertiserAdCost"]
        c["clicks"] += r["advertiserAdClicks"]
        c["impressions"] += r["advertiserAdImpressions"]
        c["sessions"] += r["sessions"]

    by_event = defaultdict(int)
    for r in events:
        by_event[r["eventName"]] += r["eventCount"]

    by_channel = defaultdict(int)
    for r in channels:
        by_channel[r["sessionDefaultChannelGroup"] or "(not set)"] += r["sessions"]

    return {
        "start": ymd(start),
        "end": ymd(end),
        "days": (end - start).days + 1,
        "sessions": sum(r["sessions"] for r in traffic),
        "users": sum(r["totalUsers"] for r in traffic),
        "pageviews": sum(r["screenPageViews"] for r in traffic),
        "cost": round(sum(c["cost"] for c in by_campaign.values()), 2),
        "clicks": sum(c["clicks"] for c in by_campaign.values()),
        "impressions": sum(c["impressions"] for c in by_campaign.values()),
        "byCampaign": {k: dict(v, cost=round(v["cost"], 2)) for k, v in by_campaign.items()},
        "byEvent": dict(by_event),
        "byChannel": dict(by_channel),
    }


def pct(after, before):
    if not before:
        return "n/a" if not after else "new"
    return f"{(after - before) / before * 100:+.0f}%"


def rate(num, den, places=2):
    return round(num / den, places) if den else None


def fmt(v):
    if v is None:
        return "—"
    return f"{v:.2f}" if isinstance(v, float) else str(v)


def print_comparison(before, after, cutover_day):
    w = 34
    print()
    print("=" * 78)
    print(f"BEFORE  {before['start']} → {before['end']}  ({before['days']} days)")
    print(f"AFTER   {after['start']} → {after['end']}  ({after['days']} days)")
    print(f"(cutover day {cutover_day} excluded from both — changes landed mid-day)")
    print("=" * 78)

    def line(label, b, a):
        print(f"{label:<{w}} {fmt(b):>13} {fmt(a):>13} {pct(a, b) if isinstance(b, (int, float)) and isinstance(a, (int, float)) else '':>9}")

    print(f"{'':<{w}} {'before':>13} {'after':>13} {'change':>9}")
    print("-" * 78)
    line("Ad spend (£)", before["cost"], after["cost"])
    line("Ad clicks", before["clicks"], after["clicks"])
    line("Ad impressions", before["impressions"], after["impressions"])
    line("Avg CPC (£)", rate(before["cost"], before["clicks"]), rate(after["cost"], after["clicks"]))
    line("CTR (%)", rate(before["clicks"] * 100, before["impressions"]), rate(after["clicks"] * 100, after["impressions"]))
    print("-" * 78)
    line("Site sessions", before["sessions"], after["sessions"])
    line("Site users", before["users"], after["users"])
    line("Pageviews", before["pageviews"], after["pageviews"])
    line("Sessions/day", rate(before["sessions"], before["days"], 1), rate(after["sessions"], after["days"], 1))
    print("-" * 78)

    for event in TRACKED_EVENTS:
        line(event, before["byEvent"].get(event, 0), after["byEvent"].get(event, 0))

    print("-" * 78)
    for name in sorted(set(before["byChannel"]) | set(after["byChannel"])):
        line(f"[ch] {name}", before["byChannel"].get(name, 0), after["byChannel"].get(name, 0))

    print("-" * 78)
    for name in sorted(set(before["byCampaign"]) | set(after["byCampaign"])):
        b = before["byCampaign"].get(name, {})
        a = after["byCampaign"].get(name, {})
        print(f"\n  {name}")
        line("    spend (£)", b.get("cost", 0), a.get("cost", 0))
        line("    clicks", b.get("clicks", 0), a.get("clicks", 0))
        line("    impressions", b.get("impressions", 0), a.get("impressions", 0))
        line("    attributed sessions", b.get("sessions", 0), a.get("sessions", 0))
    print()


def print_daily(data, start, end):
    traffic = {r["date"]: r for r in data["traffic"]}
    cost = defaultdict(float)
    clicks = defaultdict(int)
    for r in data["campaigns"]:
        cost[r["date"]] += r["advertiserAdCost"]
        clicks[r["date"]] += r["advertiserAdClicks"]
    booked = defaultdict(int)
    for r in data["events"]:
        if r["eventName"] == "ads_conversion_Book_appointment_1":
            booked[r["date"]] += r["eventCount"]

    print(f"{'date':<12}{'sessions':>10}{'users':>8}{'spend':>10}{'clicks':>8}{'CPC':>8}{'booked':>8}")
    print("-" * 64)
    day = start
    while day <= end:
        key = day.strftime("%Y%m%d")
        t = traffic.get(key, {})
        c, k = round(cost[key], 2), clicks[key]
        cpc = f"{c / k:.2f}" if k else "—"
        print(f"{ymd(day):<12}{t.get('sessions', 0):>10}{t.get('totalUsers', 0):>8}"
              f"{c:>10.2f}{k:>8}{cpc:>8}{booked[key]:>8}")
        day += timedelta(days=1)
    print()


def main():
    today = date.today()
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--cutover", default="2026-09-09",
                   help="day the changes landed; excluded from both windows (default 2026-09-09)")
    p.add_argument("--start", help="start of the before window (default: auto, mirrors the after window)")
    p.add_argument("--end", default=ymd(today), help="end of the after window (default: today)")
    p.add_argument("--out", default="ga4-backfill.json", help="where to write raw rows")
    args = p.parse_args()

    cutover = datetime.strptime(args.cutover, "%Y-%m-%d").date()
    end = datetime.strptime(args.end, "%Y-%m-%d").date()

    after_days = (end - cutover).days
    if after_days < 1:
        sys.exit(f"--end ({end}) must be at least a day after --cutover ({cutover})")

    start = datetime.strptime(args.start, "%Y-%m-%d").date() if args.start else cutover - timedelta(days=after_days)

    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("warning: GOOGLE_APPLICATION_CREDENTIALS is not set", file=sys.stderr)

    client = BetaAnalyticsDataClient()
    data = pull(client, start, end)

    before = summarise(data, start, cutover - timedelta(days=1))
    after = summarise(data, cutover + timedelta(days=1), end)

    print_daily(data, start, end)
    print_comparison(before, after, ymd(cutover))

    payload = {
        "property": PROPERTY_ID,
        "pulledAt": datetime.now().astimezone().isoformat(),
        "window": {"start": ymd(start), "end": ymd(end), "cutover": ymd(cutover)},
        "before": before,
        "after": after,
        "raw": data,
    }
    with open(args.out, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"raw rows → {args.out}")

    landing = sorted(data["landingPages"], key=lambda r: -r["sessions"])[:15]
    print("\ntop landing pages over the whole window:")
    for r in landing:
        print(f"  {r['sessions']:>6}  {r['landingPagePlusQueryString'] or '(not set)'}")


if __name__ == "__main__":
    main()
