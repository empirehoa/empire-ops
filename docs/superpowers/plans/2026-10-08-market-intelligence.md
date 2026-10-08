# Market Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every week, gather what can actually be sourced about the Florida association-management market and named competitors. Store each figure with its source and date, and show it next to EMG's own numbers.

**Architecture:** Facts live in `market_facts`. The database itself refuses a fact without a source URL, a source name, and a retrieval date. A weekly Claude Routine uses the Semrush, Similarweb, and Firecrawl connectors to collect facts, and writes them as `pending`. JR approves or rejects them in `/admin/market`; only approved facts appear in views and agent outputs. Florida public records (DBPR condo lists, Sunbiz) load through a separate, repeatable importer.

**Tech Stack:** Supabase (constraints and a pending/approved workflow), Next.js admin page, Claude Routines (fresh session per run), and the Semrush, Similarweb, and Firecrawl connectors, already connected to JR's account.

**Gate:** Phase 2 (Data Foundations v2) is done. This can run in parallel with Phases 3 and 4.

---

## Sources, and what each can honestly provide

| Source | Provides | Does not provide |
|---|---|---|
| Semrush | organic keywords, traffic estimates, and ad activity for competitor domains | revenue, door counts, fees |
| Similarweb | website traffic, engagement, and audience estimates | revenue, door counts, fees |
| Firecrawl (web pages) | published claims on a competitor's own site ("managing X communities"), press releases, job posts per Florida office | anything not published |
| FL DBPR condo lists | registered condominium and cooperative associations by county region (CSV: `Condo_NF.csv`, `condo_CE.csv`, `Condo_CW.csv`, `Condo_MD.csv`, `condo_PB.csv`, `coopmailing.csv`), page last updated 10/03/2026 | HOAs (ch. 720 associations are not registered with DBPR) |
| Sunbiz data downloads | Florida corporate filings (fixed-length text files), including nonprofit association entities, from which HOAs can be counted by name pattern and county | who manages them |

Competitors tracked:
- **Management companies:** FirstService Residential, Castle Group, Leland Management, Associa, RealManage.
- **Platforms, not competitors for contracts:** CINC Systems and Vantaca (including its HOAi agents). Vantaca is EMG's own vendor, so it is tracked for capability changes, not as a rival.

**Competitor per-door fees are rarely published.** A missing fee is recorded as "not published", which is a valid finding. The agent never estimates one.

## Data model

```sql
-- supabase/migrations/0004_market_facts.sql
create table market_facts (
  id            uuid primary key default gen_random_uuid(),
  subject       text not null,             -- e.g. 'FirstService Residential' or 'Florida condo market'
  subject_type  text not null check (subject_type in ('competitor','platform','market','region')),
  metric        text not null,             -- e.g. 'organic_traffic_monthly', 'communities_claimed', 'condo_associations'
  value_numeric numeric,
  value_text    text,
  unit          text,
  region        text,                      -- county or 'FL'
  period        text,                      -- e.g. '2026-09' for monthly traffic
  source_name   text not null check (length(source_name) > 0),
  source_url    text not null check (source_url ~ '^https://'),
  retrieved_at  timestamptz not null,
  as_of         date,                      -- the date the source says the figure describes
  quote         text,                      -- exact supporting text for web claims
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by   text,
  reviewed_at   timestamptz,
  collected_by  text not null,             -- 'routine:market-weekly' or 'import:dbpr'
  created_at    timestamptz not null default now(),
  check (value_numeric is not null or value_text is not null),
  -- A web claim needs its exact quote.
  check (source_name not in ('web','company website','press release') or quote is not null)
);
create unique index market_facts_dedupe on market_facts (subject, metric, coalesce(region,''), coalesce(period,''), source_url);
alter table market_facts enable row level security;
```

## File map

| File | Responsibility |
|---|---|
| `supabase/migrations/0004_market_facts.sql` | table above |
| `src/lib/market/schema.ts` | zod schema mirroring the DB rules, for the importer and the review page |
| `src/lib/market/dbpr.ts` | pure: parse a DBPR condo CSV into per-county counts |
| `src/lib/market/sunbiz.ts` | pure: parse Sunbiz fixed-width records; match association names; count by county |
| `src/app/api/market/import-dbpr/route.ts` | admin upload of the DBPR CSVs; writes `approved` facts with `collected_by='import:dbpr'` |
| `src/app/(dashboard)/admin/market/page.tsx` | pending queue (approve or reject, with source link and quote) and approved facts by subject |
| `src/lib/intelligence/competitive.ts` (modify) | add approved market facts beside EMG's fee-per-door bands, each with source and date |
| `docs/routines/market-weekly.md` | the routine prompt, kept in git so changes are reviewed |

---

### Task 1: Migration and zod schema

- [ ] **Step 1:** Write `0004_market_facts.sql` exactly as above and apply it to project `pwbksvynffxuvvlefprm`.
- [ ] **Step 2: Constraint test.** Through the Supabase MCP `execute_sql`, run these inserts. Each must fail:

```sql
insert into market_facts (subject, subject_type, metric, value_numeric, source_name, source_url, retrieved_at, collected_by)
values ('X','competitor','m',1,'Semrush','http://insecure.example', now(), 't');      -- not https
insert into market_facts (subject, subject_type, metric, value_numeric, source_name, source_url, retrieved_at, collected_by)
values ('X','competitor','m',1,'','https://example.com', now(), 't');                -- empty source name
insert into market_facts (subject, subject_type, metric, value_text, source_name, source_url, retrieved_at, collected_by)
values ('X','competitor','communities_claimed','500','company website','https://example.com', now(), 't'); -- web claim without quote
```

Expected: three check-constraint errors. Record them in the PR.

- [ ] **Step 3: Write the failing zod test** (`src/lib/market/__tests__/schema.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { marketFactSchema } from '../schema'

const ok = {
  subject: 'FirstService Residential', subject_type: 'competitor', metric: 'organic_traffic_monthly',
  value_numeric: 12345, unit: 'visits', region: 'US', period: '2026-09',
  source_name: 'Semrush', source_url: 'https://www.semrush.com/', retrieved_at: '2026-10-08T12:00:00Z',
  collected_by: 'routine:market-weekly',
}

describe('marketFactSchema', () => {
  it('accepts a sourced fact', () => expect(marketFactSchema.safeParse(ok).success).toBe(true))
  it('rejects a fact with no source URL', () =>
    expect(marketFactSchema.safeParse({ ...ok, source_url: undefined }).success).toBe(false))
  it('rejects a web claim without its quote', () =>
    expect(marketFactSchema.safeParse({ ...ok, source_name: 'company website', value_numeric: undefined, value_text: '500 communities' }).success).toBe(false))
  it('rejects a fact with no value', () =>
    expect(marketFactSchema.safeParse({ ...ok, value_numeric: undefined }).success).toBe(false))
})
```

- [ ] **Step 4: Run it and watch it fail.** `npx vitest run src/lib/market` → FAIL.
- [ ] **Step 5: Implement** (`src/lib/market/schema.ts`)

```ts
import { z } from 'zod'

const WEB_SOURCES = new Set(['web', 'company website', 'press release'])

export const marketFactSchema = z
  .object({
    subject: z.string().min(1),
    subject_type: z.enum(['competitor', 'platform', 'market', 'region']),
    metric: z.string().min(1),
    value_numeric: z.number().finite().optional(),
    value_text: z.string().min(1).optional(),
    unit: z.string().optional(),
    region: z.string().optional(),
    period: z.string().optional(),
    source_name: z.string().min(1),
    source_url: z.string().url().startsWith('https://'),
    retrieved_at: z.iso.datetime(),
    as_of: z.iso.date().optional(),
    quote: z.string().min(1).optional(),
    collected_by: z.string().min(1),
  })
  .strict()
  .refine((f) => f.value_numeric !== undefined || f.value_text !== undefined, { message: 'A fact needs a value.' })
  .refine((f) => !WEB_SOURCES.has(f.source_name) || f.quote !== undefined, { message: 'Web claims need the exact quote.' })

export type MarketFact = z.infer<typeof marketFactSchema>
```

- [ ] **Step 6: Run it and watch it pass.** → PASS.
- [ ] **Step 7: Commit:** `git commit -m "feat(market): market_facts with source enforced in the database"`

### Task 2: DBPR condo importer

- [ ] **Step 1:** Download one regional file from `https://www2.myfloridalicense.com/condos-timeshares-mobile-homes/public-records/` and read its real header row. Write the parser test against a 3-row fixture copied from that real header. The rows must be made-up values (no real association contacts in the repo).
- [ ] **Step 2:** Implement `parseDbprCondoCsv(text): { county: string; associations: number }[]`, keyed on the real county column name found in Step 1.
- [ ] **Step 3:** The route accepts the six files. It writes one `approved` fact per county: metric `condo_associations_registered`, `source_name='FL DBPR'`, the public-records page URL, the page's stated update date as `as_of`, and `collected_by='import:dbpr'`.
- [ ] **Step 4:** Only counts are stored. The contact and mailing columns in these files are not imported. Any prospecting from them is a separate decision for JR, subject to marketing and solicitation rules.
- [ ] **Step 5:** Run typecheck, tests, lint, and build. Then commit.

### Task 3: Sunbiz HOA counts (after Task 2)

- [ ] **Step 1:** Read the Sunbiz data-download field layout from `dos.fl.gov/sunbiz/other-services/data-downloads/` and record the field positions in `src/lib/market/sunbiz.ts`, with the page URL and retrieval date in a comment.
- [ ] **Step 2:** Count active Florida nonprofit corporations whose names match association patterns (`HOMEOWNERS ASSOCIATION`, `HOMEOWNERS' ASSOCIATION`, `PROPERTY OWNERS ASSOCIATION`, `COMMUNITY ASSOCIATION`, `CONDOMINIUM ASSOCIATION`, `MASTER ASSOCIATION`) by principal-address county. Store these as `hoa_like_entities_by_name` with `unit='entities'`. The metric name says "by name" because a name match is an estimate of association count, not a census.
- [ ] **Step 3:** Run the tests, then commit.

### Task 4: Weekly routine

- [ ] **Step 1:** Write `docs/routines/market-weekly.md`:

```markdown
Weekly market intelligence for Empire Ops (Riance LLC). Read-only research.

For each subject (FirstService Residential, Castle Group, Leland Management, Associa,
RealManage; platforms CINC Systems and Vantaca):
1. Semrush: domain overview for the subject's main domain, US database. Record
   organic traffic and keywords for the latest month.
2. Similarweb: monthly visits for the same domain and month.
3. Firecrawl: search the subject's own site and press releases from the last 7 days
   for Florida-specific claims (communities or doors managed in Florida, new Florida
   offices, acquisitions, product launches). Record a claim only with its exact quote.

Write each figure as one row in market_facts with status 'pending',
collected_by 'routine:market-weekly', the source name, the https URL you used,
retrieved_at now, and as_of if the source states it.
Never write a figure you did not read from a source in this run. If a source has
nothing, write nothing for it. "Not found" is a fine result.
Do not estimate fees, revenue, or door counts.
Finish with a short summary of what was added, posted to the Empire Ops Discord
channel, with no figures that are not in market_facts.
```

- [ ] **Step 2:** JR creates the routine (weekly, a fresh session per run) with only the Semrush, Similarweb, Firecrawl, Supabase, and Discord connectors this needs. Writing to `market_facts` goes through the Supabase connector, so no app secret is placed in a routine prompt.
- [ ] **Step 3:** First run is supervised. JR reviews the pending queue in `/admin/market`. Spot-check 5 facts by opening their URLs; any mismatch means fixing the prompt before the next run.
- [ ] **Step 4:** Commit the prompt file.

### Task 5: Review page and use in the competitive agent

- [ ] **Step 1: The `/admin/market` pending queue.**
  - Each fact shows its subject, metric, value, a source link, the quote, and its retrieved and as-of dates, with Approve and Reject buttons.
  - Approving stores `reviewed_by` and `reviewed_at`.
  - Facts that are approved but more than 90 days old show as "older than 90 days".
- [ ] **Step 2:** In `src/lib/intelligence/competitive.ts`, add "Market context (sourced)" beside EMG's fee-per-door bands. It shows only approved facts, each printed with "Source, as of date". The agent's existing "EMG data only" label changes to "EMG data plus N sourced market facts".
- [ ] **Step 3:** Run typecheck, tests, lint, and build. Then commit.

## Done when

- [ ] The database refuses an unsourced fact (Task 1 Step 2 is recorded).
- [ ] DBPR counts are loaded for all six regional files, as counts only.
- [ ] One supervised weekly run has completed, with spot-checks recorded.
- [ ] Every market figure on any page shows its source and date.
