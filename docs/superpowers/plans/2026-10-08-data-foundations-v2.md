# Data Foundations v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every association a place (office, address, coordinates) and a history (one row per day), so the Neighborhood, the map, and the trend views have real data to draw.

**Architecture:** Add one migration (`0004`) with an `offices` table, location and audit columns on `communities`, and a `community_daily_snapshots` table. Geocoding uses the free US Census batch geocoder, run as a step in the daily sync. A pure snapshot builder computes each community's daily row from tables that already exist. Imports move to Supabase Storage signed uploads, so files up to 15 MB stop hitting Vercel's ~4.5 MB request limit.

**Tech Stack:** Next.js 16 route handlers, supabase-js (service role), Vitest, zod 4. No new runtime dependencies.

---

## Ground rules for this plan

- Every query runs server-side through `createAdminClient()` after `requireAdminApi()` or the automation secret. There is no `tenant_id`; this app serves one organization.
- `communities.is_test = true` rows are excluded from every snapshot total and every geocode batch.
- Money is `numeric(14,2)` in Postgres and `number` in TypeScript (dollars), matching `0001`.
- Run the checks after every task: `npm run typecheck && npx vitest run && npx eslint src`.
- Commit after every task, ending the message with the two attribution lines the repo uses.

## File map

| File | Responsibility |
|---|---|
| `supabase/migrations/0004_places_and_history.sql` | offices, community location and audit columns, daily snapshots, storage bucket |
| `src/lib/types/database.ts` | add `OfficeRow`, `CommunityDailySnapshotRow`, new `CommunityRow` columns |
| `src/lib/integrations/vantaca/kinds.ts` | add `street_address`, `zip`, `office` fields to the communities kind |
| `src/lib/integrations/vantaca/commit.ts` | resolve `office` text to `office_id`; reset geocode when the address changes |
| `src/lib/geo/census.ts` | pure: build the batch CSV, parse the response |
| `src/lib/geo/geocode-communities.ts` | load pending communities, call Census, write results |
| `src/app/api/geo/run/route.ts` | automation-secret endpoint for the geocode step |
| `src/app/api/sync/run-syncs.ts` | add the geocode and snapshot steps after the source syncs |
| `src/lib/history/snapshot.ts` | pure: compute one community's daily row |
| `src/lib/history/write-snapshots.ts` | load inputs, call the pure builder, upsert rows |
| `src/app/api/imports/communities/[id]/route.ts` | record who changed `is_test` and when |
| `src/app/api/imports/upload-url/route.ts` | issue a signed Storage upload URL |
| `src/lib/integrations/vantaca/upload.ts` | read the file from Storage instead of the request body |
| `src/app/(dashboard)/admin/imports/import-wizard.tsx` | upload to Storage, then call preview and commit with the path |
| `src/app/(dashboard)/admin/offices/page.tsx` | list offices, assign communities without one |

---

### Task 1: Migration 0004

**Files:**
- Create: `supabase/migrations/0004_places_and_history.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Places and history: offices, community locations, is_test audit,
-- one snapshot row per community per day, and private import storage.

create table offices (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  city        text,
  created_at  timestamptz not null default now()
);

alter table communities
  add column street_address     text,
  add column zip                text,
  add column state              text not null default 'FL',
  add column office_id          uuid references offices(id) on delete set null,
  add column lat                double precision,
  add column lng                double precision,
  add column geocode_status     text not null default 'pending'
    check (geocode_status in ('pending','matched','city_only','no_match','skipped')),
  add column geocode_match      text,
  add column geocoded_at        timestamptz,
  add column is_test_changed_by text,
  add column is_test_changed_at timestamptz;

create index communities_office_idx on communities (office_id);
create index communities_geocode_idx on communities (geocode_status) where geocode_status = 'pending';

-- One row per community per day. Values are copied, not referenced, so the
-- history survives later imports that change the source rows.
create table community_daily_snapshots (
  id                     uuid primary key default gen_random_uuid(),
  community_id           uuid not null references communities(id) on delete cascade,
  snapshot_date          date not null,
  doors                  integer,
  monthly_management_fee numeric(12,2),
  ar_as_of               date,
  ar_total               numeric(14,2),
  ar_90_plus             numeric(14,2),
  open_items             integer not null default 0,
  open_items_30_plus     integer not null default 0,
  open_items_90_plus     integer not null default 0,
  office_id              uuid references offices(id) on delete set null,
  manager_name           text,
  portfolio              text,
  created_at             timestamptz not null default now(),
  unique (community_id, snapshot_date)
);
create index community_daily_snapshots_date_idx on community_daily_snapshots (snapshot_date);

alter table offices                    enable row level security;
alter table community_daily_snapshots  enable row level security;

-- Private bucket for Vantaca import files. Only the service role reads it.
insert into storage.buckets (id, name, public, file_size_limit)
values ('imports', 'imports', false, 15728640)
on conflict (id) do nothing;
```

- [ ] **Step 2: Apply it**

Apply with the Supabase MCP `apply_migration` (name `places_and_history`, project `pwbksvynffxuvvlefprm`) or paste it into the SQL editor.
Expected: success. Then run the security advisor. Expected: only the "RLS enabled, no policy" INFO notice, now on 11 tables.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0004_places_and_history.sql
git commit -m "feat(db): offices, community locations, daily snapshots, imports bucket"
```

### Task 2: Types

**Files:**
- Modify: `src/lib/types/database.ts`

- [ ] **Step 1: Extend `CommunityRow` and add the new rows**

Add to `CommunityRow`, after `is_test: boolean`:

```ts
  street_address: string | null
  zip: string | null
  state: string
  office_id: string | null
  lat: number | null
  lng: number | null
  geocode_status: 'pending' | 'matched' | 'city_only' | 'no_match' | 'skipped'
  geocode_match: string | null
  geocoded_at: string | null
  is_test_changed_by: string | null
  is_test_changed_at: string | null
```

Add these exports beside the other row types:

```ts
export type OfficeRow = {
  id: string
  name: string
  city: string | null
  created_at: string
}

export type CommunityDailySnapshotRow = {
  id: string
  community_id: string
  snapshot_date: string
  doors: number | null
  monthly_management_fee: number | null
  ar_as_of: string | null
  ar_total: number | null
  ar_90_plus: number | null
  open_items: number
  open_items_30_plus: number
  open_items_90_plus: number
  office_id: string | null
  manager_name: string | null
  portfolio: string | null
  created_at: string
}
```

Add to `Database['public']['Tables']`:

```ts
      offices: Table<OfficeRow, 'name'>
      community_daily_snapshots: Table<
        CommunityDailySnapshotRow,
        'community_id' | 'snapshot_date',
        [
          Rel<'community_daily_snapshots_community_id_fkey', ['community_id'], 'communities'>,
          Rel<'community_daily_snapshots_office_id_fkey', ['office_id'], 'offices'>,
        ]
      >
```

And add `Rel<'communities_office_id_fkey', ['office_id'], 'offices'>` as the third type argument on `communities`.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS. If a test fixture builds a full `CommunityRow`, add the new fields with `null` / `'pending'` / `'FL'`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types/database.ts
git commit -m "feat(types): offices, snapshots, community location columns"
```

### Task 3: Import address and office from Vantaca

**Files:**
- Modify: `src/lib/integrations/vantaca/kinds.ts` (communities `fields`)
- Modify: `src/lib/integrations/vantaca/commit.ts`
- Test: `src/lib/integrations/vantaca/__tests__/kinds.test.ts`, `src/lib/integrations/vantaca/__tests__/commit.test.ts`

- [ ] **Step 1: Write the failing test** (append to `kinds.test.ts`; headers are made up, as the file's header comment says)

```ts
describe('communities address fields', () => {
  it('suggests street, zip and office columns', () => {
    const { mapping } = suggestMapping('communities', [
      'Association Code',
      'Association Name',
      'Address 1',
      'Zip Code',
      'Office',
    ])
    expect(mapping).toMatchObject({ street_address: 'Address 1', zip: 'Zip Code', office: 'Office' })
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/integrations/vantaca/__tests__/kinds.test.ts`
Expected: FAIL. The mapping has no `street_address`.

- [ ] **Step 3: Add the fields** (in `KINDS.communities.fields`, after `county`)

```ts
      {
        key: 'street_address',
        label: 'Street address',
        type: 'text',
        required: false,
        help: 'Used only to place the association on the map.',
        synonyms: ['address', 'address 1', 'address line 1', 'street', 'street address', 'property address', 'site address'],
      },
      { key: 'zip', label: 'ZIP', type: 'text', required: false, synonyms: ['zip', 'zip code', 'postal code', 'zipcode'] },
      {
        key: 'office',
        label: 'Office',
        type: 'text',
        required: false,
        help: 'The EMG office that manages it. New office names are added automatically.',
        synonyms: ['office', 'branch', 'region', 'office name', 'branch office'],
      },
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/lib/integrations/vantaca/__tests__/kinds.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing commit test** (append to `commit.test.ts`, using the file's existing mock helpers)

```ts
import { officeNamesFrom, addressChanged } from '../commit'

describe('office and address handling', () => {
  it('collects distinct trimmed office names, ignoring blanks', () => {
    expect(officeNamesFrom([{ office: ' Kissimmee ' }, { office: 'Kissimmee' }, { office: '' }, { office: null }, { office: 'Orlando' }]))
      .toEqual(['Kissimmee', 'Orlando'])
  })

  it('flags a re-geocode only when street, city or zip actually changes', () => {
    const before = { street_address: '1 Main St', city: 'Kissimmee', zip: '34741' }
    expect(addressChanged(before, { street_address: '1 Main St', city: 'Kissimmee', zip: '34741' })).toBe(false)
    expect(addressChanged(before, { street_address: '1 Main Street', city: 'Kissimmee', zip: '34741' })).toBe(true)
    expect(addressChanged(before, { city: 'Kissimmee' })).toBe(false) // unmapped columns leave values alone
  })
})
```

- [ ] **Step 6: Run it and watch it fail**

Run: `npx vitest run src/lib/integrations/vantaca/__tests__/commit.test.ts`
Expected: FAIL. `officeNamesFrom` is not exported.

- [ ] **Step 7: Implement in `commit.ts`**

```ts
type AddressParts = { street_address?: string | null; city?: string | null; zip?: string | null }

/** Distinct, trimmed, non-empty office names in file order. */
export function officeNamesFrom(rows: Array<{ office?: unknown }>): string[] {
  const seen = new Set<string>()
  for (const r of rows) {
    const name = typeof r.office === 'string' ? r.office.trim() : ''
    if (name) seen.add(name)
  }
  return [...seen]
}

/** True when a mapped address part differs. Parts the file does not map are ignored. */
export function addressChanged(before: AddressParts, incoming: AddressParts): boolean {
  return (['street_address', 'city', 'zip'] as const).some(
    (k) => k in incoming && (incoming[k] ?? null) !== (before[k] ?? null),
  )
}
```

In `commitImport` for kind `communities`, before the upsert:

```ts
const officeNames = officeNamesFrom(prepared.rows)
let officeIds = new Map<string, string>()
if (officeNames.length > 0) {
  const { data: offices, error: officeError } = await db
    .from('offices')
    .upsert(officeNames.map((name) => ({ name })), { onConflict: 'name' })
    .select('id, name')
  if (officeError) throw new ImportWriteError(`Could not save offices: ${officeError.message}`)
  officeIds = new Map(offices.map((o) => [o.name, o.id]))
}
```

When building each community row: replace `office` with `office_id: officeIds.get(String(row.office).trim()) ?? null` (only when `office` is mapped), and when `addressChanged(existing, row)` is true set `geocode_status: 'pending'`, `lat: null`, `lng: null`.

- [ ] **Step 8: Run the tests**

Run: `npx vitest run src/lib/integrations/vantaca`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/integrations/vantaca
git commit -m "feat(import): street, zip and office on communities; re-geocode on address change"
```

### Task 4: Census geocoder (pure)

The free US Census batch geocoder takes a CSV upload of up to 10,000 rows at
`https://geocoding.geo.census.gov/geocoder/locations/addressbatch` (form fields
`addressFile` and `benchmark=Public_AR_Current`). Each response row is:
`id, input address, Match|No_Match|Tie, Exact|Non_Exact, matched address, "lon,lat", tiger id, side`.
Task 5 Step 5 checks this format with one live call before anything is written.

**Files:**
- Create: `src/lib/geo/census.ts`
- Test: `src/lib/geo/__tests__/census.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildBatchCsv, parseBatchResponse } from '../census'

describe('buildBatchCsv', () => {
  it('quotes every field and escapes quotes', () => {
    expect(
      buildBatchCsv([{ id: 'a1', street: '10 "Palm" Way', city: 'Kissimmee', state: 'FL', zip: '34741' }]),
    ).toBe('"a1","10 ""Palm"" Way","Kissimmee","FL","34741"\n')
  })
})

describe('parseBatchResponse', () => {
  it('reads matches as lat/lng and keeps non-matches', () => {
    const body = [
      '"a1","10 PALM WAY, KISSIMMEE, FL, 34741","Match","Exact","10 PALM WAY, KISSIMMEE, FL, 34741","-81.407,28.292","123","L"',
      '"a2","1 NOWHERE, KISSIMMEE, FL, 34741","No_Match"',
      '"a3","5 OAK, ORLANDO, FL","Tie"',
    ].join('\n')
    expect(parseBatchResponse(body)).toEqual([
      { id: 'a1', status: 'matched', lat: 28.292, lng: -81.407, matched: '10 PALM WAY, KISSIMMEE, FL, 34741' },
      { id: 'a2', status: 'no_match', lat: null, lng: null, matched: null },
      { id: 'a3', status: 'no_match', lat: null, lng: null, matched: null },
    ])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/geo/__tests__/census.test.ts`
Expected: FAIL. The module does not exist.

- [ ] **Step 3: Implement**

```ts
/** US Census batch geocoder: request/response helpers. Pure: no network here. */

export const CENSUS_BATCH_URL = 'https://geocoding.geo.census.gov/geocoder/locations/addressbatch'
export const CENSUS_BATCH_LIMIT = 10_000

export type BatchAddress = { id: string; street: string; city: string; state: string; zip: string }
export type BatchResult = {
  id: string
  status: 'matched' | 'no_match'
  lat: number | null
  lng: number | null
  matched: string | null
}

const q = (v: string) => `"${v.replace(/"/g, '""')}"`

export function buildBatchCsv(rows: BatchAddress[]): string {
  return rows.map((r) => [r.id, r.street, r.city, r.state, r.zip].map(q).join(',') + '\n').join('')
}

/** Splits one CSV line, honoring quoted fields that contain commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

export function parseBatchResponse(body: string): BatchResult[] {
  return body
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((line) => {
      const [id, , match, , matched, coords] = splitCsvLine(line)
      const [lng, lat] = (coords ?? '').split(',').map(Number)
      if (match === 'Match' && Number.isFinite(lat) && Number.isFinite(lng)) {
        return { id, status: 'matched', lat, lng, matched: matched || null }
      }
      return { id, status: 'no_match', lat: null, lng: null, matched: null }
    })
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/lib/geo/__tests__/census.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo
git commit -m "feat(geo): Census batch geocoder request and response helpers"
```

### Task 5: Geocode communities

Communities without a street address still get a place: the city centroid,
marked `city_only` so the map draws them as approximate (a hollow marker), never
as a precise point.

**Files:**
- Create: `src/lib/geo/geocode-communities.ts`
- Create: `src/lib/geo/fl-city-centroids.ts` (generated, see Step 3)
- Create: `src/app/api/geo/run/route.ts`
- Test: `src/lib/geo/__tests__/geocode-communities.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { planGeocode } from '../geocode-communities'

describe('planGeocode', () => {
  const base = { is_test: false, state: 'FL', zip: null, street_address: null, city: null }

  it('sends street addresses to Census and city-only rows to the centroid table', () => {
    const plan = planGeocode([
      { ...base, id: 'a', street_address: '10 Palm Way', city: 'Kissimmee', zip: '34741' },
      { ...base, id: 'b', city: 'Orlando' },
      { ...base, id: 'c' },
      { ...base, id: 'd', is_test: true, street_address: '1 Test St', city: 'Kissimmee' },
    ])
    expect(plan.census.map((r) => r.id)).toEqual(['a'])
    expect(plan.cityOnly.map((r) => r.id)).toEqual(['b'])
    expect(plan.skipped.map((r) => r.id)).toEqual(['c', 'd'])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/geo/__tests__/geocode-communities.test.ts`
Expected: FAIL.

- [ ] **Step 3: Generate the city centroid table**

Source: US Census Gazetteer "Places" file for Florida (public domain), from
`https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html`.
Download the national places file, keep rows where `USPS == 'FL'`, and write
`src/lib/geo/fl-city-centroids.ts` as:

```ts
// Generated from the US Census Gazetteer places file (FL rows). Public domain.
// Key: lowercased place name without the "city"/"town"/"CDP" suffix.
export const FL_CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  // one entry per FL place, written by the script; do not edit by hand
}
```

Keep the generator script in `scripts/build-fl-centroids.mjs` (Node, no Python) and record the Gazetteer vintage year in the header comment.

- [ ] **Step 4: Implement**

```ts
import type { AdminClient } from '@/lib/supabase/admin'
import { buildBatchCsv, CENSUS_BATCH_LIMIT, CENSUS_BATCH_URL, parseBatchResponse } from './census'
import { FL_CITY_CENTROIDS } from './fl-city-centroids'

type Pending = {
  id: string
  is_test: boolean
  street_address: string | null
  city: string | null
  state: string
  zip: string | null
}

export function planGeocode(rows: Pending[]) {
  const census: Pending[] = []
  const cityOnly: Pending[] = []
  const skipped: Pending[] = []
  for (const r of rows) {
    if (r.is_test) skipped.push(r)
    else if (r.street_address && (r.city || r.zip)) census.push(r)
    else if (r.city) cityOnly.push(r)
    else skipped.push(r)
  }
  return { census, cityOnly, skipped }
}

export function cityCentroid(city: string) {
  return FL_CITY_CENTROIDS[city.trim().toLowerCase()] ?? null
}

export async function geocodePendingCommunities(db: AdminClient) {
  const { data, error } = await db
    .from('communities')
    .select('id, is_test, street_address, city, state, zip')
    .eq('geocode_status', 'pending')
    .limit(CENSUS_BATCH_LIMIT)
  if (error) throw new Error(`Could not load communities to geocode: ${error.message}`)

  const plan = planGeocode(data)
  const now = new Date().toISOString()
  const updates: Array<{ id: string; values: Record<string, unknown> }> = []

  if (plan.census.length > 0) {
    const form = new FormData()
    form.set('benchmark', 'Public_AR_Current')
    form.set(
      'addressFile',
      new Blob([
        buildBatchCsv(
          plan.census.map((r) => ({
            id: r.id,
            street: r.street_address ?? '',
            city: r.city ?? '',
            state: r.state,
            zip: r.zip ?? '',
          })),
        ),
      ], { type: 'text/csv' }),
      'addresses.csv',
    )
    const res = await fetch(CENSUS_BATCH_URL, { method: 'POST', body: form })
    if (!res.ok) throw new Error(`Census geocoder returned HTTP ${res.status}`)
    for (const r of parseBatchResponse(await res.text())) {
      if (r.status === 'matched') {
        updates.push({ id: r.id, values: { lat: r.lat, lng: r.lng, geocode_status: 'matched', geocode_match: r.matched, geocoded_at: now } })
      } else {
        // Fall back to the city centroid when Census cannot place the street.
        const row = plan.census.find((p) => p.id === r.id)
        const c = row?.city ? cityCentroid(row.city) : null
        updates.push({
          id: r.id,
          values: c
            ? { lat: c.lat, lng: c.lng, geocode_status: 'city_only', geocode_match: null, geocoded_at: now }
            : { lat: null, lng: null, geocode_status: 'no_match', geocode_match: null, geocoded_at: now },
        })
      }
    }
  }
  for (const r of plan.cityOnly) {
    const c = cityCentroid(r.city ?? '')
    updates.push({
      id: r.id,
      values: c
        ? { lat: c.lat, lng: c.lng, geocode_status: 'city_only', geocoded_at: now }
        : { geocode_status: 'no_match', geocoded_at: now },
    })
  }
  for (const r of plan.skipped) updates.push({ id: r.id, values: { geocode_status: 'skipped', geocoded_at: now } })

  for (const u of updates) {
    const { error: e } = await db.from('communities').update(u.values).eq('id', u.id)
    if (e) throw new Error(`Could not save geocode for ${u.id}: ${e.message}`)
  }
  const count = (s: string) => updates.filter((u) => u.values.geocode_status === s).length
  return { matched: count('matched'), cityOnly: count('city_only'), noMatch: count('no_match'), skipped: count('skipped') }
}
```

- [ ] **Step 5: Live format check** (one real call, before wiring it into the daily run)

```bash
printf '"t1","1 Courthouse Sq","Kissimmee","FL","34741"\n' > /tmp/one.csv
curl -sS -F addressFile=@/tmp/one.csv -F benchmark=Public_AR_Current \
  https://geocoding.geo.census.gov/geocoder/locations/addressbatch
```

Expected: one line whose sixth field is `"lon,lat"` (longitude first, about `-81.4,28.3`). If the column order differs, fix `parseBatchResponse` and its test first.

- [ ] **Step 6: Route** (`src/app/api/geo/run/route.ts`)

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { verifyAutomationSecret } from '@/lib/auth/automation-secret'
import { geocodePendingCommunities } from '@/lib/geo/geocode-communities'
import { finishSyncRun, startSyncRun } from '@/lib/runs'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminClient()
  const runId = await startSyncRun(db, 'geocode')
  try {
    const result = await geocodePendingCommunities(db)
    await finishSyncRun(db, runId, { ok: true, rows: result.matched + result.cityOnly, detail: result })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Geocoding failed'
    await finishSyncRun(db, runId, { ok: false, error: message })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npx vitest run src/lib/geo && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/geo src/app/api/geo scripts/build-fl-centroids.mjs
git commit -m "feat(geo): geocode communities via Census with city-centroid fallback"
```

### Task 6: Record who changed `is_test`

**Files:**
- Modify: `src/app/api/imports/communities/[id]/route.ts`
- Test: `src/app/api/imports/__tests__/routes.test.ts`

- [ ] **Step 1: Write the failing test** (add to the existing PATCH describe, using its mock client)

```ts
it('records who marked the community and when', async () => {
  const res = await PATCH(jsonRequest({ is_test: true }), { params: Promise.resolve({ id: COMMUNITY_ID }) })
  expect(res.status).toBe(200)
  const update = db.lastUpdate('communities')
  expect(update).toMatchObject({ is_test: true, is_test_changed_by: 'jrriestra@empirehoa.com' })
  expect(typeof update.is_test_changed_at).toBe('string')
})
```

(`db.lastUpdate` is the helper name in `src/lib/test-utils/mock-supabase.ts`; if it is named differently there, use that name.)

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/app/api/imports/__tests__/routes.test.ts`
Expected: FAIL. The update has only `is_test`.

- [ ] **Step 3: Implement** (replace the `.update(...)` call)

```ts
    .update({
      is_test: body.is_test,
      is_test_changed_by: admin.email,
      is_test_changed_at: new Date().toISOString(),
    })
```

In `/admin/communities`, show "Marked by {email} on {date}" under the test toggle when `is_test_changed_by` is set.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/app/api/imports`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/imports "src/app/(dashboard)/admin/communities"
git commit -m "feat(import): audit who marks a test association and when"
```

### Task 7: Daily snapshots

**Files:**
- Create: `src/lib/history/snapshot.ts`
- Create: `src/lib/history/write-snapshots.ts`
- Modify: `src/app/api/sync/run-syncs.ts`
- Test: `src/lib/history/__tests__/snapshot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildSnapshot } from '../snapshot'

const community = {
  id: 'c1', doors: 120, monthly_management_fee: 1800, office_id: 'o1', manager_name: 'A. Manager', portfolio: 'North',
}

describe('buildSnapshot', () => {
  it('copies the latest AR and counts open items by age', () => {
    const row = buildSnapshot({
      community,
      date: '2026-10-08',
      latestAr: { as_of: '2026-10-01', total: 5000, days_90_plus: 1200 },
      openItems: [
        { opened_on: '2026-10-01' }, // 7 days
        { opened_on: '2026-08-20' }, // 49 days
        { opened_on: '2026-06-01' }, // 129 days
        { opened_on: null },         // unknown age: counted as open only
      ],
    })
    expect(row).toEqual({
      community_id: 'c1', snapshot_date: '2026-10-08', doors: 120, monthly_management_fee: 1800,
      ar_as_of: '2026-10-01', ar_total: 5000, ar_90_plus: 1200,
      open_items: 4, open_items_30_plus: 2, open_items_90_plus: 1,
      office_id: 'o1', manager_name: 'A. Manager', portfolio: 'North',
    })
  })

  it('leaves AR empty, not zero, when there is no export', () => {
    const row = buildSnapshot({ community, date: '2026-10-08', latestAr: null, openItems: [] })
    expect(row.ar_total).toBeNull()
    expect(row.ar_90_plus).toBeNull()
    expect(row.ar_as_of).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/history/__tests__/snapshot.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `snapshot.ts`**

```ts
export type SnapshotInput = {
  community: {
    id: string
    doors: number | null
    monthly_management_fee: number | null
    office_id: string | null
    manager_name: string | null
    portfolio: string | null
  }
  date: string // YYYY-MM-DD
  latestAr: { as_of: string; total: number; days_90_plus: number } | null
  openItems: Array<{ opened_on: string | null }>
}

const DAY_MS = 86_400_000

function ageInDays(openedOn: string, date: string): number {
  return Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${openedOn}T00:00:00Z`)) / DAY_MS)
}

export function buildSnapshot({ community, date, latestAr, openItems }: SnapshotInput) {
  const ages = openItems.flatMap((i) => (i.opened_on ? [ageInDays(i.opened_on, date)] : []))
  return {
    community_id: community.id,
    snapshot_date: date,
    doors: community.doors,
    monthly_management_fee: community.monthly_management_fee,
    ar_as_of: latestAr?.as_of ?? null,
    ar_total: latestAr?.total ?? null,
    ar_90_plus: latestAr?.days_90_plus ?? null,
    open_items: openItems.length,
    open_items_30_plus: ages.filter((a) => a >= 30).length,
    open_items_90_plus: ages.filter((a) => a >= 90).length,
    office_id: community.office_id,
    manager_name: community.manager_name,
    portfolio: community.portfolio,
  }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/lib/history/__tests__/snapshot.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `write-snapshots.ts`**

```ts
import type { AdminClient } from '@/lib/supabase/admin'
import { buildSnapshot } from './snapshot'

/** Writes today's row for every non-test community. Safe to re-run: upserts by (community, date). */
export async function writeDailySnapshots(db: AdminClient, date = new Date().toISOString().slice(0, 10)) {
  const { data: communities, error: cErr } = await db
    .from('communities')
    .select('id, doors, monthly_management_fee, office_id, manager_name, portfolio')
    .eq('is_test', false)
  if (cErr) throw new Error(`Could not load communities: ${cErr.message}`)

  const { data: aging, error: aErr } = await db
    .from('ar_aging_snapshots')
    .select('community_id, as_of, total, days_90_plus')
    .lte('as_of', date)
    .order('as_of', { ascending: false })
  if (aErr) throw new Error(`Could not load AR aging: ${aErr.message}`)
  const latestAr = new Map<string, { as_of: string; total: number; days_90_plus: number }>()
  for (const a of aging) if (!latestAr.has(a.community_id)) latestAr.set(a.community_id, a)

  const { data: items, error: iErr } = await db
    .from('action_items')
    .select('community_id, opened_on')
    .is('closed_on', null)
  if (iErr) throw new Error(`Could not load action items: ${iErr.message}`)
  const openBy = new Map<string, Array<{ opened_on: string | null }>>()
  for (const i of items) {
    if (!i.community_id) continue
    const list = openBy.get(i.community_id) ?? []
    list.push({ opened_on: i.opened_on })
    openBy.set(i.community_id, list)
  }

  const rows = communities.map((community) =>
    buildSnapshot({ community, date, latestAr: latestAr.get(community.id) ?? null, openItems: openBy.get(community.id) ?? [] }),
  )
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db
      .from('community_daily_snapshots')
      .upsert(rows.slice(i, i + 500), { onConflict: 'community_id,snapshot_date' })
    if (error) throw new Error(`Could not save snapshots: ${error.message}`)
  }
  return { date, rows: rows.length }
}
```

The `ar_aging_snapshots` read grows with history. When it passes ~50,000 rows, replace it with a Postgres view using `distinct on (community_id) ... order by community_id, as_of desc`.

- [ ] **Step 6: Wire into the daily sync**

In `src/app/api/sync/run-syncs.ts`, after the HubSpot and QuickBooks steps finish (whatever their outcome), run in order:
1. `geocodePendingCommunities(db)` wrapped in `startSyncRun(db, 'geocode')` / `finishSyncRun`.
2. `writeDailySnapshots(db)` wrapped in `startSyncRun(db, 'snapshots')` / `finishSyncRun`.

A failure in either is recorded and reported in the response like the other sources; it does not stop the agents.

- [ ] **Step 7: Run all checks**

Run: `npm run typecheck && npx vitest run && npx eslint src`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/history src/app/api/sync
git commit -m "feat(history): daily community snapshots after each sync"
```

### Task 8: Imports through Supabase Storage

Vercel rejects request bodies over about 4.5 MB, but the importer accepts 15 MB.
The browser uploads the file directly to the private `imports` bucket with a
signed URL, then sends only the storage path to preview and commit.

**Files:**
- Create: `src/app/api/imports/upload-url/route.ts`
- Modify: `src/lib/integrations/vantaca/upload.ts`
- Modify: `src/app/api/imports/preview/route.ts`, `src/app/api/imports/commit/route.ts`
- Modify: `src/app/(dashboard)/admin/imports/import-wizard.tsx`
- Test: `src/lib/integrations/vantaca/__tests__/upload.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { importPathFor, isOwnImportPath } from '../upload'

describe('import storage paths', () => {
  it('builds a dated path under the kind, keeping only a safe file name', () => {
    expect(importPathFor('ar_aging', '../../AR Aging (Oct).xlsx', '2026-10-08T12:00:00.000Z', 'abc'))
      .toBe('ar_aging/2026-10-08/abc-AR_Aging_Oct_.xlsx')
  })

  it('accepts only paths this app issued', () => {
    expect(isOwnImportPath('ar_aging/2026-10-08/abc-file.xlsx')).toBe(true)
    expect(isOwnImportPath('../secrets.txt')).toBe(false)
    expect(isOwnImportPath('other/2026-10-08/abc-file.xlsx')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/integrations/vantaca/__tests__/upload.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the path helpers and the storage reader** (add to `upload.ts`)

```ts
import type { AdminClient } from '@/lib/supabase/admin'
import { IMPORT_KINDS } from './kinds'

export const IMPORT_BUCKET = 'imports'

export function importPathFor(kind: ImportKind, filename: string, nowIso: string, nonce: string): string {
  const base = filename.split(/[\\/]/).pop() ?? 'upload'
  const dot = base.lastIndexOf('.')
  const ext = dot > 0 ? base.slice(dot).toLowerCase() : ''
  const stem = (dot > 0 ? base.slice(0, dot) : base).replace(/[^A-Za-z0-9]+/g, '_').slice(0, 80)
  return `${kind}/${nowIso.slice(0, 10)}/${nonce}-${stem}${ext}`
}

const OWN_PATH = new RegExp(`^(${IMPORT_KINDS.join('|')})/\\d{4}-\\d{2}-\\d{2}/[A-Za-z0-9-]+-[A-Za-z0-9_]+\\.(xlsx|csv)$`)

export function isOwnImportPath(path: string): boolean {
  return OWN_PATH.test(path)
}

/** Reads an uploaded import file from Storage. The JSON body is { path, kind, ... }. */
export async function readStoredImport(db: AdminClient, path: string, kind: unknown): Promise<UploadOk | UploadError> {
  if (!isImportKind(kind)) return { ok: false, status: 400, error: 'Choose what the file contains: communities, AR aging, or action items.' }
  if (!isOwnImportPath(path) || !path.startsWith(`${kind}/`)) return { ok: false, status: 400, error: 'Upload the file again.' }
  const { data, error } = await db.storage.from(IMPORT_BUCKET).download(path)
  if (error || !data) return { ok: false, status: 404, error: 'The uploaded file was not found. Upload it again.' }
  if (data.size > MAX_UPLOAD_BYTES) return { ok: false, status: 413, error: TOO_LARGE }
  const file = new File([data], path.split('/').pop() ?? 'upload')
  return { ok: true, form: new FormData(), file, buffer: await data.arrayBuffer(), kind }
}
```

- [ ] **Step 4: Upload URL route** (`src/app/api/imports/upload-url/route.ts`)

```ts
import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/auth/admin'
import { IMPORT_KINDS } from '@/lib/integrations/vantaca/kinds'
import { IMPORT_BUCKET, importPathFor } from '@/lib/integrations/vantaca/upload'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const body = z.object({ kind: z.enum(IMPORT_KINDS), filename: z.string().min(1).max(255) }).strict()

/** POST { kind, filename } → { path, token } for supabase.storage.uploadToSignedUrl. */
export async function POST(request: Request) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Send { kind, filename }.' }, { status: 400 })
  if (!/\.(xlsx|csv)$/i.test(parsed.data.filename)) {
    return NextResponse.json({ error: 'Choose an .xlsx or .csv file.' }, { status: 400 })
  }
  const path = importPathFor(parsed.data.kind, parsed.data.filename, new Date().toISOString(), randomUUID().slice(0, 8))
  const { data, error } = await createAdminClient().storage.from(IMPORT_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: 'Could not start the upload.' }, { status: 500 })
  return NextResponse.json({ path: data.path, token: data.token })
}
```

- [ ] **Step 5: Switch preview and commit to JSON `{ path, kind, ... }`**

In both routes replace `readImportUpload(request)` with:

```ts
const json = await request.json().catch(() => null) as { path?: unknown; kind?: unknown } | null
const upload = await readStoredImport(createAdminClient(), String(json?.path ?? ''), json?.kind)
```

and read the other commit fields (mapping, as_of) from `json` instead of the form. Keep `readImportUpload` until the wizard switch below ships, then delete it and its tests.

- [ ] **Step 6: Switch the wizard**

In `import-wizard.tsx`, on file choose: `POST /api/imports/upload-url` → `createBrowserClient(url, anonKey).storage.from('imports').uploadToSignedUrl(path, token, file)` → keep `path` in state → send `{ path, kind }` to preview and `{ path, kind, mapping, as_of }` to commit. Show upload progress as a determinate state ("Uploading 4.2 MB"), not a spinner.

- [ ] **Step 7: Delete stored files after commit**

At the end of a successful commit: `await db.storage.from(IMPORT_BUCKET).remove([path])`. Imported rows are the record; the raw file holds homeowner-level data and should not linger. Failed or abandoned uploads: a weekly step in the daily run deletes objects older than 7 days under `imports/`.

- [ ] **Step 8: Run all checks and a 10 MB manual test**

Run: `npm run typecheck && npx vitest run && npx eslint src && npm run build`
Expected: PASS. Then on the Vercel preview, import a ~10 MB CSV. Expected: the preview shows headers; the commit succeeds; the object is gone from the bucket.

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat(import): upload through Supabase Storage to lift the 4.5 MB request limit"
```

### Task 9: Offices page

**Files:**
- Create: `src/app/(dashboard)/admin/offices/page.tsx`
- Create: `src/app/api/offices/route.ts` (POST create), `src/app/api/communities/[id]/office/route.ts` (PATCH assign)
- Modify: `src/app/(dashboard)/layout.tsx` (nav link)

- [ ] **Step 1: Routes** follow the `communities/[id]` PATCH pattern exactly: `requireAdminApi()`, zod `.strict()` body (`{ name: string(1..80), city?: string }` and `{ office_id: uuid | null }`), uuid-check the path id, 404 on no row.
- [ ] **Step 2: Page** is a server component calling `requireAdminPage()`: a table of offices with community count and door count (non-test only), then "Communities without an office" with a select per row. The count of unassigned communities is the page's first line, because Phase 4 cannot start until it reads zero.
- [ ] **Step 3: Checks:** `npm run typecheck && npx vitest run && npx eslint src && npm run build`. Expected: PASS.
- [ ] **Step 4: Commit:** `git commit -m "feat(offices): manage offices and assign communities"`

---

## Done when

- [ ] Migration `0004` applied; advisor clean apart from the intended notice.
- [ ] A Vantaca communities import with address and office columns sets `office_id` and queues geocoding.
- [ ] After one daily run: every non-test community is `matched`, `city_only`, or `no_match`, and none is `pending`.
- [ ] `community_daily_snapshots` has one row per non-test community for each day the run ran; re-running the same day changes no counts.
- [ ] A 10 MB import works on Vercel.
- [ ] `/admin/offices` shows zero unassigned communities (the Phase 4 gate).
