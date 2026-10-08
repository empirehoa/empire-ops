# Empire Ops operating system

How the pieces fit, as of October 8, 2026. The hub page is the front door; the
database is the record; routines keep both current.

## The house

| Piece | What it is | Where |
|---|---|---|
| Hub page | Daily brief, pipeline, money, KPIs, every routine and its instructions, projects, setup checklist | claude.ai artifact "Empire Ops" (private to the owner until shared) |
| Database | Supabase project `empire-ops`; schema in `supabase/migrations/` | `0001` tables, `0002` daily brief, `0003` ingest functions |
| Routines | Scheduled Claude runs that load data, compute the brief and write drafts | Listed with their instructions on the hub's Routines tab |
| Command Center | Role KPIs, scorecards, org chart, commission, market intelligence | Separate artifact; Empire Ops writes company KPIs into it daily |
| Web app | Sign-in, Vantaca import, dashboards | This repository; deploys on Vercel when the project is created |

## Daily flow (Eastern time)

1. 5:22 AM: **Daily data sync** pulls HubSpot deals and QuickBooks reports into
   the database through `ops_ingest_deals` and `ops_ingest_financial`, runs
   `ops_publish_brief()`, writes the brief to the hub and the company KPIs to the
   Command Center.
2. 6:00 AM: **Command Center refresh** (billing sheet, role KPIs, market intelligence).
3. 6:56 AM, Monday to Saturday: **Morning brief** (calendar, inbox triage, the
   business pulse). Its full text stays in the owner's private area of the hub.
4. 1:23 PM: **Routine watchdog** checks every routine fired on schedule and alerts
   only when one did not.

Weekly and monthly: growth brief (Mondays), LinkedIn drafts (Sundays), media
opportunities (Tuesdays and Fridays), awards and recognition (the 1st), and the
CAM Skills compliance routines.

## Rules every routine follows

The hub stores one set of house rules that every routine reads first: one data home,
no invented figures, a source and date on every number, test associations excluded,
each association kept separate, drafts only (nothing is sent or posted), collections
matters routed to counsel, and every run reported back to the hub.

## Shared definitions

- **Win rate**: closed won / closed, counting deals whose close date falls in the
  trailing 365 days. The Command Center uses the same definition.
- **Stalled deal**: judged by days in stage or past close date. HubSpot automation
  refreshes last-modified dates, so they are not used.
- **QuickBooks**: only reported 12-month totals are stored. On Oct 8, 2026 the
  connector's monthly breakdown did not reconcile to its own totals.

## Boundaries

Vera belongs to Amanda's team. Empire Ops reads nothing from Vera and writes
nothing to it.
