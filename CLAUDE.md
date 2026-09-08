# Marketing dashboard — "First 20 Patients"

A daily-status Artifact tracking the marketing plan (traffic, funnel, site
conversions, ad performance, flagged actions):
https://claude.ai/code/artifact/bb79006d-6b25-402d-b650-f7dc2321d78e

## How it's built

- Data source: GA4 Data API (property 550256386), via a service account —
  `ga4-reader@project-7e87fbcc-d97c-43b0-b25.iam.gserviceaccount.com`.
  Google Ads cost/clicks/impressions come through GA4's linked Ads import,
  so no separate Ads API access is needed.
- Everything lives outside this git repo, under `~/.tom-chiro-dashboard/`:
  `service-account.json` (credentials — never commit these), `daily_pull.py`
  (the GA4 query + insight logic), `venv/` (its Python environment),
  `run_daily.sh` (wrapper), `run.log` (its output).
- A macOS LaunchAgent (`~/Library/LaunchAgents/com.tomchiro.dashboard.daily.plist`)
  runs `run_daily.sh` every day at 06:30 local time, writing the day's
  snapshot to `~/.tom-chiro-dashboard/latest-snapshot.json`.

## Why it isn't fully automatic

Writing the snapshot into the dashboard's live database requires the
Artifact tool, which is only available inside an interactive Claude Code
session connected to its host app — a plain scheduled script (launchd, or
a cloud routine) cannot reach it. So the LaunchAgent only pre-computes the
numbers; getting them into the dashboard needs a one-off nudge.

## When the user asks to "update"/"refresh" the dashboard

1. Check whether `~/.tom-chiro-dashboard/latest-snapshot.json` is from
   today. If not (or if you want the very latest numbers), regenerate it:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=~/.tom-chiro-dashboard/service-account.json \
     ~/.tom-chiro-dashboard/venv/bin/python3 ~/.tom-chiro-dashboard/daily_pull.py \
     > ~/.tom-chiro-dashboard/latest-snapshot.json
   ```
2. Read the `date` field from that file.
3. Call the Artifact tool: `action: "write_db"`, `db_op: "set"`, the URL
   above, `collection: "daily"`, `doc_id` = that date string, `file_path`
   pointing at the snapshot file.
4. The page itself needs no changes — it subscribes to the latest document
   in that collection and re-renders automatically.

If you ever change `daily_pull.py`'s output shape, the page's `render()`
function has to change to match — they're not auto-synced. The page's
source lives at `~/.tom-chiro-dashboard/dashboard-page.html`; edit it,
then republish with the Artifact tool passing `url` (the link above) so
it updates in place rather than creating a new artifact.

## Ad-group breakdown (spend isn't automatable there)

GA4's linked Google Ads cost import only supports campaign-level
granularity — `sessionCampaignName` + a cost metric works, but crossing
that with `sessionGoogleAdsAdGroupName` is rejected by the Data API. So
the automated pull can only get **sessions and bookings** per ad group
(query added in `daily_pull.py`, written to `ads.adGroups` in the
snapshot), not spend/clicks/impressions/CTR.

For real ad-group-level cost data, the user periodically downloads an
"Ad report" CSV from the Ads UI's Ads tab (per-campaign export — it has
no Campaign column, so the campaign name is passed separately) and it
gets folded in manually:

```
~/.tom-chiro-dashboard/venv/bin/python3 ~/.tom-chiro-dashboard/import_ad_csv.py \
  --campaign "Exact Campaign Name" \
  "/path/to/Ad report.csv"
```

This writes/merges into `~/.tom-chiro-dashboard/ad-group-import.json`
(persists across days — not overwritten by the daily pull). `daily_pull.py`
reads it each run and merges matching ad groups into `ads.adGroups`,
tagged with an `imported` block (`asOf`, `dateRange`, `status`, `clicks`,
`impressions`, `cost`, `conversions`, `costPerConv`) so the dashboard can
show "as of <date>" rather than implying it's live. If the user hands you
a new Ads CSV export, run the import before the next dashboard refresh.
