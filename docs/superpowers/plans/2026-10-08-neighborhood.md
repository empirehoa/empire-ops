# The Neighborhood Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the whole portfolio as a small town where each house is one association. The town is always paired with a plain table and a real Florida map, and all three share one selection.

**Architecture:** Pure modules turn snapshot rows into a deterministic town layout and a per-house encoding (size, wear, light). The town is a react-three-fiber scene with instanced Kenney CC0 models. The map uses MapLibre with a deck.gl overlay, and the table is a plain server-rendered table. The URL (`?c=<community_id>`) holds the selection, so any view can be linked and all three stay in sync.

**Tech Stack:** @react-three/fiber 9.8.1, @react-three/drei 10.7.9, three 0.186.1, maplibre-gl 6.13.0, react-map-gl 8.1.3, deck.gl 9.4.0 (all checked against React 19.2 on 2026-10-08), and Kenney City Kit (Suburban), which is CC0.

**Gate:** Data Foundations v2 is done (offices assigned, communities geocoded, 7+ days of snapshots), and JR has confirmed the brief below.

---

## Design brief (impeccable "shape"; needs JR's confirmation)

These are the assumptions; each is marked so it can be corrected in one round.

**1. Job and audience.** JR, at a desk, at the start of the day, wants to know where in the portfolio to look first, in under a minute. *Assumed:* JR and allowlisted admins only. It is never shown to boards or homeowners. Office leads see it only if JR adds them.

**2. Outcome and proof.** The main task is to spot the 3–5 associations that need attention today and open the rows behind them. Success means each lit or worn house leads to the exact AR snapshot, action items (XN numbers), or agent finding that caused it, in two clicks. The town shows something a dashboard cannot: the shape of the whole business at once, with each office as a district and each manager's book as a street.

**3. Direction.** This is a whole surface inside an established world (the Empire brand: navy, blue, coral; Poppins and Roboto) in Operate mode. The town is a calm, low-poly, slightly overhead daylight scene, not a game. There is one authored moment: the camera eases to a house when it is selected. Everything else is still. Coral appears only on lights (alerts), never as decoration.

**4. Scope.** It is one route, `/admin/neighborhood`, with three linked views: town, map, and table. It is production fidelity and read-only: nothing in the town changes data. Anti-goals:
- No leaderboard or ranking of people.
- No animated idle loops.
- No fabricated house for an association with no data.
- No test associations.
- No blending of one association's money into another's.

**5. States and ranges.**
- Size: 1–400 associations (today about 255), 1–9 districts, and 1–1,500 doors per association.
- Empty: before the first import, the square shows only the civic buildings, each with its "connect me" note.
- Missing data: a house with no AR export or no door count is drawn as a pale outline ("no data"), never as a healthy house.
- Stale data: a source more than 26 hours old dims its civic building and shows the date.

**6. Interaction and layout.**
- Desktop: the town fills the main area, with a right drawer for the selected house (its numbers with sources and dates, plus links). Tabs switch between Town, Map, and Table.
- Phone: Table is the default tab, because the town is not usable at 360 px.
- Keyboard: Tab moves to the view; arrow keys step through houses in table order; Enter opens the drawer; Esc closes it.
- Hover shows the name and the one reason it is lit.

**7. Constraints and open decisions.**
- WCAG 2.2 AA. The table is the accessible equivalent of the town.
- `prefers-reduced-motion` turns off the camera ease.
- The town chunk loads only on this route.
- Kenney license file kept in the repo.

**Questions for JR (one round):**
1. **What turns a light on?** Proposed defaults, any one of:
   - AR 90+ is at least 15% of the association's AR.
   - 3 or more action items have been open 90+ days.
   - The association is in the retention agent's top 10 risks.

   These are starting thresholds, not industry standards. Change any you like.
2. **What is a street?** The manager's book of business, or the Vantaca portfolio? Using managers puts names on the map. That is fine for JR alone, but it becomes people data if office leads ever see it (see the Phase 4 guardrails).
3. **Opening view on desktop:** the town (proposed), or the map, with the town one tab away?

---

## Visual encoding (the contract between data and drawing)

| Visual | Data | Rule | Shown as text too |
|---|---|---|---|
| District | `offices` | one district per office, arranged around the civic square | district sign with office name |
| Street | manager or portfolio (Q2) | one street per group inside the district | street sign |
| House size | `doors` | four Kenney models by band: under 50, 50–149, 150–399, 400 and up | "120 doors" |
| Lot order | `vantaca_id` | stable, so houses never move day to day | none |
| Wear | max of AR 90+ share and share of open items 90+ days | 0–1, shown in 3 steps: fresh, worn (≥0.15), run-down (≥0.35); walls desaturate, and the lawn grows at run-down | "AR 90+: 22% of $48,210 (as of Oct 1)" |
| Light | any alert rule (Q1) | warm coral window glow | the rule that fired, in plain words |
| Outline house | doors or AR missing | pale, untextured | "No AR export yet" |
| Town hall | Vantaca imports | sign shows the last import date per kind | same |
| Bank | QuickBooks sync | sign shows the last sync per company | same |
| Sales office | HubSpot sync | sign shows the last sync and open deal count | same |

Wear and light never rely on color alone: wear changes the model (props and lawn), and light adds glow plus a small roof marker visible at any zoom.

## File map

| File | Responsibility |
|---|---|
| `src/lib/neighborhood/encode.ts` | pure: snapshot to `HouseSpec` (size band, wear, alerts, missing) |
| `src/lib/neighborhood/layout.ts` | pure: houses to positions (districts, streets, lots) |
| `src/lib/neighborhood/load.ts` | server: read communities, offices, latest snapshots, agent findings, sync runs |
| `src/app/(dashboard)/admin/neighborhood/page.tsx` | server page: load, encode, lay out, pass plain JSON to client views |
| `src/app/(dashboard)/admin/neighborhood/selection.ts` | `useSelection()` reading and writing `?c=` |
| `src/app/(dashboard)/admin/neighborhood/town/town-view.tsx` | client: `<Canvas>`, camera, lights, instanced houses, civic buildings |
| `src/app/(dashboard)/admin/neighborhood/town/houses.tsx` | instanced house meshes per model band |
| `src/app/(dashboard)/admin/neighborhood/town/civic.tsx` | town hall, bank, sales office with sync signs |
| `src/app/(dashboard)/admin/neighborhood/map/map-view.tsx` | client: MapLibre plus deck.gl `ScatterplotLayer` |
| `src/app/(dashboard)/admin/neighborhood/table-view.tsx` | sortable table, the accessible equivalent |
| `src/app/(dashboard)/admin/neighborhood/house-drawer.tsx` | selected house details with sources and dates |
| `public/models/kenney-suburban/` | the GLB files used, plus `License.txt` |

---

### Task 1: Encoding (pure)

**Files:**
- Create: `src/lib/neighborhood/encode.ts`
- Test: `src/lib/neighborhood/__tests__/encode.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES, encodeHouse, sizeBand, wearLevel } from '../encode'

const snap = {
  community_id: 'c1', name: 'Palm Grove HOA', vantaca_id: 'PG01', doors: 120,
  office_id: 'o1', street_key: 'A. Manager',
  ar_total: 10_000, ar_90_plus: 2_000, ar_as_of: '2026-10-01',
  open_items: 10, open_items_90_plus: 1,
}

describe('sizeBand', () => {
  it('bands doors into four models', () => {
    expect([1, 49, 50, 149, 150, 399, 400, 1500].map(sizeBand)).toEqual([0, 0, 1, 1, 2, 2, 3, 3])
  })
})

describe('wearLevel', () => {
  it('maps the score to fresh, worn, run-down', () => {
    expect([0, 0.149, 0.15, 0.349, 0.35, 1].map(wearLevel)).toEqual(['fresh', 'fresh', 'worn', 'worn', 'run_down', 'run_down'])
  })
})

describe('encodeHouse', () => {
  it('uses the larger of AR 90+ share and aged-item share for wear', () => {
    const h = encodeHouse(snap, { retentionTop: new Set() }, DEFAULT_RULES)
    expect(h.wearScore).toBeCloseTo(0.2)
    expect(h.wear).toBe('worn')
    expect(h.alerts).toEqual(['AR 90+ is 20% of AR (as of 2026-10-01)'])
    expect(h.lit).toBe(true)
  })

  it('marks missing data instead of drawing a healthy house', () => {
    const h = encodeHouse({ ...snap, doors: null, ar_total: null, ar_90_plus: null, ar_as_of: null }, { retentionTop: new Set() }, DEFAULT_RULES)
    expect(h.missing).toEqual(['doors', 'ar'])
    expect(h.wear).toBe('unknown')
  })

  it('lights a retention top-10 house even when wear is fresh', () => {
    const h = encodeHouse({ ...snap, ar_90_plus: 0, open_items_90_plus: 0 }, { retentionTop: new Set(['c1']) }, DEFAULT_RULES)
    expect(h.wear).toBe('fresh')
    expect(h.alerts).toEqual(['In the retention agent\'s top 10 risks'])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/neighborhood/__tests__/encode.test.ts`
Expected: FAIL. The module does not exist.

- [ ] **Step 3: Implement**

```ts
/** Snapshot to house encoding. Pure. Thresholds are JR's choices, not standards. */

export type HouseInput = {
  community_id: string
  name: string
  vantaca_id: string
  doors: number | null
  office_id: string | null
  street_key: string | null
  ar_total: number | null
  ar_90_plus: number | null
  ar_as_of: string | null
  open_items: number
  open_items_90_plus: number
}

export type Rules = { arShare: number; agedItems: number; retentionTopN: number }
export const DEFAULT_RULES: Rules = { arShare: 0.15, agedItems: 3, retentionTopN: 10 }

export type Wear = 'fresh' | 'worn' | 'run_down' | 'unknown'
export type HouseSpec = HouseInput & {
  band: 0 | 1 | 2 | 3
  wearScore: number | null
  wear: Wear
  alerts: string[]
  lit: boolean
  missing: Array<'doors' | 'ar'>
}

export function sizeBand(doors: number): 0 | 1 | 2 | 3 {
  if (doors < 50) return 0
  if (doors < 150) return 1
  if (doors < 400) return 2
  return 3
}

export function wearLevel(score: number): Exclude<Wear, 'unknown'> {
  if (score >= 0.35) return 'run_down'
  if (score >= 0.15) return 'worn'
  return 'fresh'
}

const pct = (x: number) => `${Math.round(x * 100)}%`

export function encodeHouse(h: HouseInput, ctx: { retentionTop: Set<string> }, rules: Rules): HouseSpec {
  const missing: HouseSpec['missing'] = []
  if (h.doors == null) missing.push('doors')
  const hasAr = h.ar_total != null && h.ar_90_plus != null
  if (!hasAr) missing.push('ar')

  const arShare = hasAr && h.ar_total! > 0 ? h.ar_90_plus! / h.ar_total! : hasAr ? 0 : null
  const itemShare = h.open_items > 0 ? h.open_items_90_plus / h.open_items : 0
  const wearScore = arShare == null ? null : Math.max(arShare, itemShare)

  const alerts: string[] = []
  if (arShare != null && arShare >= rules.arShare) alerts.push(`AR 90+ is ${pct(arShare)} of AR (as of ${h.ar_as_of})`)
  if (h.open_items_90_plus >= rules.agedItems) alerts.push(`${h.open_items_90_plus} action items open 90+ days`)
  if (ctx.retentionTop.has(h.community_id)) alerts.push(`In the retention agent's top ${rules.retentionTopN} risks`)

  return {
    ...h,
    band: sizeBand(h.doors ?? 0),
    wearScore,
    wear: wearScore == null ? 'unknown' : wearLevel(wearScore),
    alerts,
    lit: alerts.length > 0,
    missing,
  }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/lib/neighborhood/__tests__/encode.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/neighborhood
git commit -m "feat(neighborhood): house encoding from daily snapshots"
```

### Task 2: Layout (pure, deterministic)

**Files:**
- Create: `src/lib/neighborhood/layout.ts`
- Test: `src/lib/neighborhood/__tests__/layout.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { layoutTown } from '../layout'

const h = (id: string, office: string | null, street: string | null) => ({
  community_id: id, vantaca_id: id, office_id: office, street_key: street,
})

describe('layoutTown', () => {
  const houses = [h('B2', 'o1', 'Ann'), h('A1', 'o1', 'Ann'), h('C3', 'o1', 'Bo'), h('D4', 'o2', 'Cy'), h('E5', null, null)]
  const offices = [{ id: 'o1', name: 'Kissimmee' }, { id: 'o2', name: 'Orlando' }]

  it('places every house exactly once', () => {
    const t = layoutTown(houses, offices)
    expect(t.lots.map((l) => l.community_id).sort()).toEqual(['A1', 'B2', 'C3', 'D4', 'E5'])
  })

  it('orders lots by Vantaca ID so houses do not move between days', () => {
    const t = layoutTown(houses, offices)
    const ann = t.lots.filter((l) => l.street === 'Ann')
    expect(ann.map((l) => l.community_id)).toEqual(['A1', 'B2'])
    expect(layoutTown([...houses].reverse(), offices)).toEqual(t)
  })

  it('puts communities without an office in an "Unassigned" district', () => {
    const t = layoutTown(houses, offices)
    expect(t.districts.map((d) => d.name)).toEqual(['Kissimmee', 'Orlando', 'Unassigned'])
    expect(t.lots.find((l) => l.community_id === 'E5')?.district).toBe('Unassigned')
  })

  it('keeps districts from overlapping', () => {
    const t = layoutTown(houses, offices)
    for (const a of t.districts) for (const b of t.districts) {
      if (a === b) continue
      const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.z + a.d <= b.z || b.z + b.d <= a.z
      expect(apart).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/neighborhood/__tests__/layout.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
/**
 * Town layout. Pure and deterministic: the same input always gives the same
 * positions, whatever the input order, so houses never move day to day.
 *
 * Districts sit on a grid around a central civic square (cell 0,0 is the square).
 * Inside a district, each street is a row; lots run along it.
 */

type HouseRef = { community_id: string; vantaca_id: string; office_id: string | null; street_key: string | null }
type Office = { id: string; name: string }

export const LOT = 4          // world units per lot along a street
export const STREET_GAP = 6   // world units between street rows
export const DISTRICT_GAP = 10
const UNASSIGNED = 'Unassigned'

export type Lot = { community_id: string; district: string; street: string; x: number; z: number }
export type District = { name: string; x: number; z: number; w: number; d: number }

const byText = (a: string, b: string) => a.localeCompare(b, 'en')

/** Ring order around the square: (1,0), (1,1), (0,1), (-1,1), (-1,0), ... */
function ringCells(n: number): Array<[number, number]> {
  const cells: Array<[number, number]> = []
  for (let r = 1; cells.length < n; r++) {
    for (let i = -r; i <= r && cells.length < n; i++) cells.push([r, i])
    for (let i = r - 1; i >= -r && cells.length < n; i--) cells.push([i, r])
    for (let i = r - 1; i >= -r && cells.length < n; i--) cells.push([-r, i])
    for (let i = -r + 1; i < r && cells.length < n; i++) cells.push([i, -r])
  }
  return cells
}

export function layoutTown(houses: HouseRef[], offices: Office[]) {
  const officeName = new Map(offices.map((o) => [o.id, o.name]))
  const groups = new Map<string, Map<string, HouseRef[]>>()
  for (const h of houses) {
    const district = (h.office_id && officeName.get(h.office_id)) || UNASSIGNED
    const street = h.street_key?.trim() || 'Unassigned street'
    const streets = groups.get(district) ?? new Map<string, HouseRef[]>()
    streets.set(street, [...(streets.get(street) ?? []), h])
    groups.set(district, streets)
  }

  const districtNames = [...groups.keys()].sort((a, b) =>
    a === UNASSIGNED ? 1 : b === UNASSIGNED ? -1 : byText(a, b),
  )
  const sizes = districtNames.map((name) => {
    const streets = groups.get(name)!
    const longest = Math.max(...[...streets.values()].map((s) => s.length))
    return { name, w: longest * LOT, d: streets.size * STREET_GAP }
  })
  const cell = Math.max(...sizes.map((s) => Math.max(s.w, s.d))) + DISTRICT_GAP
  const cells = ringCells(districtNames.length)

  const districts: District[] = []
  const lots: Lot[] = []
  sizes.forEach((s, i) => {
    const [cx, cz] = cells[i]
    const x = cx * cell - s.w / 2
    const z = cz * cell - s.d / 2
    districts.push({ name: s.name, x, z, w: s.w, d: s.d })
    const streets = groups.get(s.name)!
    ;[...streets.keys()].sort(byText).forEach((street, row) => {
      streets.get(street)!
        .slice()
        .sort((a, b) => byText(a.vantaca_id, b.vantaca_id))
        .forEach((h, col) => {
          lots.push({ community_id: h.community_id, district: s.name, street, x: x + col * LOT + LOT / 2, z: z + row * STREET_GAP + STREET_GAP / 2 })
        })
    })
  })
  lots.sort((a, b) => byText(a.community_id, b.community_id))
  return { districts, lots, square: { x: -cell / 2 + DISTRICT_GAP / 2, z: -cell / 2 + DISTRICT_GAP / 2, size: cell - DISTRICT_GAP } }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/lib/neighborhood/__tests__/layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/neighborhood
git commit -m "feat(neighborhood): deterministic district/street/lot layout"
```

### Task 3: Loader and page with the table view (works without 3D)

**Files:**
- Create: `src/lib/neighborhood/load.ts`
- Create: `src/app/(dashboard)/admin/neighborhood/page.tsx`, `table-view.tsx`, `selection.ts`, `house-drawer.tsx`
- Modify: `src/app/(dashboard)/layout.tsx` (nav link "Neighborhood")

- [ ] **Step 1: Loader.** `loadNeighborhood(db)` returns `{ houses: HouseInput[], offices, retentionTop: string[], syncs, asOf }`:
  - Communities come from `communities` where `is_test = false`.
  - Each community gets its latest `community_daily_snapshots` row.
  - `street_key` is `manager_name` or `portfolio`, per Q2.
  - `retentionTop` is the first N `community_id`s in the latest succeeded `client-retention` `agent_runs.findings`.
  - `syncs` is `latestSyncs(db)` from `src/lib/runs.ts`.

  Test it with `src/lib/test-utils/mock-supabase.ts`. The test asserts that test associations are absent and that a community with no snapshot still appears, with nulls.
- [ ] **Step 2: Selection hook** (`selection.ts`)

```ts
'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

/** The selected community lives in ?c= so every view (and a pasted link) agrees. */
export function useSelection(): [string | null, (id: string | null) => void] {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const selected = params.get('c')
  const select = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params)
      if (id) next.set('c', id)
      else next.delete('c')
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [params, pathname, router],
  )
  return [selected, select]
}
```

- [ ] **Step 3: Table view.**
  - Columns: Association, Office, Street, Doors, AR 90+ (share and $), Items 90+, Why it's lit, Data as of.
  - Default sort: lit first, then wear score descending.
  - Rows are buttons that select. The selected row has `aria-selected` and scrolls into view.
  - Numbers use tabular numerals.
  - Missing values read "No data", never 0.
- [ ] **Step 4: Drawer.**
  - Shows the name, office, street, and doors.
  - AR buckets carry their `as_of` date. The alert reasons are listed in full.
  - Links: "Open action items" goes to `/admin/communities?c=` (filtered list), and "AR history" goes to a sparkline-free small table of the last 8 weekly snapshot values.
  - Footer: "Draft view for internal review. Collections questions go to counsel."
- [ ] **Step 5: Page.** A server component calls `requireAdminPage()`, then loads, encodes, and lays out. It renders Tabs (Town, Map, Table) with Table as the only tab wired in this task. A Suspense boundary wraps the client views.
- [ ] **Step 6: Checks:** `npm run typecheck && npx vitest run && npx eslint src && npm run build`. Expected: PASS.
- [ ] **Step 7: Commit:** `git commit -m "feat(neighborhood): page, loader, table view, shared selection"`

### Task 4: Kenney assets

- [ ] **Step 1:** Download City Kit (Suburban) from `https://kenney.nl/assets/city-kit-suburban`. Confirm that `License.txt` says CC0, and copy it to `public/models/kenney-suburban/License.txt`.
- [ ] **Step 2:** Choose:
  - 4 house models of rising size for bands 0–3
  - 1 tree
  - 1 tall-grass or bush prop for run-down lawns
  - 3 larger buildings for the civic square: town hall (Vantaca), bank (QuickBooks), sales office (HubSpot)

  Copy only these GLB files. Record the chosen file names in `src/app/(dashboard)/admin/neighborhood/town/models.ts`:

```ts
// Kenney City Kit (Suburban), CC0. Files under public/models/kenney-suburban/.
export const HOUSE_MODELS = [
  '/models/kenney-suburban/<band-0 file>.glb',
  '/models/kenney-suburban/<band-1 file>.glb',
  '/models/kenney-suburban/<band-2 file>.glb',
  '/models/kenney-suburban/<band-3 file>.glb',
] as const
export const PROP_TREE = '/models/kenney-suburban/<tree file>.glb'
export const PROP_OVERGROWN = '/models/kenney-suburban/<grass file>.glb'
export const CIVIC = {
  townHall: '/models/kenney-suburban/<file>.glb',
  bank: '/models/kenney-suburban/<file>.glb',
  salesOffice: '/models/kenney-suburban/<file>.glb',
} as const
```

  Replace each `<…>` with the real file name chosen in this step. The task is not done while any placeholder remains.
- [ ] **Step 3:** Run `npx gltf-transform optimize` on each file (dev-only, run with `npx`). Target under 60 KB per model. Commit the optimized files.
- [ ] **Step 4: Commit:** `git commit -m "chore(neighborhood): Kenney City Kit Suburban models (CC0)"`

### Task 5: Town view

**Files:**
- Create: `town/town-view.tsx`, `town/houses.tsx`, `town/civic.tsx`
- Modify: `package.json` (`@react-three/fiber@9.8.1 @react-three/drei@10.7.9 three@0.186.1`, plus `@types/three` as a dev dependency)

- [ ] **Step 1: Install:** `npm install @react-three/fiber@9.8.1 @react-three/drei@10.7.9 three@0.186.1 && npm install -D @types/three`.
- [ ] **Step 2: Load the scene only on this route:** in `page.tsx` use `const TownView = dynamic(() => import('./town/town-view'), { ssr: false, loading: () => <TownSkeleton /> })`. The skeleton is a flat navy-tinted ground plane image of the right aspect, not a spinner.
- [ ] **Step 3: Canvas setup:**
  - `<Canvas frameloop="demand" dpr={[1, 2]} camera={{ position: [60, 70, 60], fov: 35 }}>`.
  - One hemisphere light and one directional light (soft shadows only if a frame stays under 16 ms on a mid laptop).
  - `<MapControls>` from drei, with polar angle clamped between 25° and 65° so the user never ends up under the ground.
  - The ground uses the background token in light theme and the card token in dark.
- [ ] **Step 4: Houses:**
  - Group the `HouseSpec`s by band, and draw each band as one drei `<Instances>` (via `useGLTF` and the model's merged geometry).
  - Wear: per-instance color lerps the wall tint toward a warm grey. Fresh is 0, worn is 0.35, run-down is 0.7.
  - Run-down houses also get an `PROP_OVERGROWN` instance.
  - Lit houses get an emissive coral window material and a small coral roof marker (a flat disc, visible from above).
  - Missing-data houses use a pale, flat, untextured material at 50% opacity.
  - Pointer events: `onPointerOver` sets a hover label (drei `<Html>`) with the name and the first alert; `onClick` calls `select(id)`.
- [ ] **Step 5: Civic square:** three buildings, each with a drei `<Text>` sign: "Vantaca: imported Oct 7", "QuickBooks: synced Oct 8, 6:02", "HubSpot: synced Oct 8, 6:01, 41 open deals". A source more than 26 hours old dims its building to 60% and adds "(stale)" to the sign. Clicking a building opens `/admin/integrations`.
- [ ] **Step 6: Camera moment:** when the selection changes, ease the camera target to the lot over 600 ms with exponential ease-out. Under `prefers-reduced-motion: reduce`, jump instead. This is the only animation in the town.
- [ ] **Step 7: Keyboard:** the canvas wrapper is `tabIndex={0}` with `role="application"` and `aria-label="Portfolio town. Use arrow keys to move between associations; Enter for details."` Arrow keys step through houses in the table's sort order. A visually hidden live region announces "Palm Grove HOA, 120 doors, lit: AR 90+ is 20% of AR".
- [ ] **Step 8: Performance budget:**
  - Town chunk (three + r3f + drei used parts) under 350 KB gzipped. Check it with `npx next build` output.
  - A demand-rendered idle frame costs nothing.
  - Interaction holds 60 fps at 400 houses.
  - Record the measured numbers in the PR.
- [ ] **Step 9: Checks:** `npm run typecheck && npx vitest run && npx eslint src && npm run build`. Expected: PASS.
- [ ] **Step 10: Commit:** `git commit -m "feat(neighborhood): 3D town with instanced Kenney houses and civic square"`

### Task 6: Map view

- [ ] **Step 1: Install:** `npm install maplibre-gl@6.13.0 react-map-gl@8.1.3 @deck.gl/core@9.4.0 @deck.gl/layers@9.4.0 @deck.gl/mapbox@9.4.0`.
- [ ] **Step 2: Basemap:** use a no-key vector style. The proposed one is OpenFreeMap "positron" (`https://tiles.openfreemap.org/styles/positron`). Before shipping, read its terms of use and record them in `docs/ARCHITECTURE.md`. Show the required OpenStreetMap attribution. The initial view fits Florida's bounds (about lng −87.6 to −80.0, lat 24.5 to 31.0).
- [ ] **Step 3: Points:** a deck.gl `ScatterplotLayer` through `MapboxOverlay` (`interleaved: true`).
  - Radius scales with sqrt(doors).
  - Fill is navy for unlit and coral for lit.
  - `city_only` points draw hollow, with "Approximate location (city)" in the tooltip.
  - `no_match` points are not drawn. The view instead lists "N associations could not be placed" with a link to `/admin/communities`.
  - Clicking a point calls `select(id)`. The selected point gets a 2 px ring.
- [ ] **Step 4:** Load it with `dynamic(..., { ssr: false })`, the same as the town.
- [ ] **Step 5: Checks:** typecheck, test, lint, and build all pass.
- [ ] **Step 6: Commit:** `git commit -m "feat(neighborhood): Florida map with geocoded associations"`

### Task 7: Review passes (skills)

- [ ] **Step 1: impeccable `critique`, then `polish`** on `/admin/neighborhood`, against the brief above and the craft floor. Do not add eyebrows, hero-metric tiles, colored side borders, or decorative dots.
- [ ] **Step 2: Vercel web-design-guidelines review.** Fix focus rings, the tabular numerals, `color-scheme`, and selection colors.
- [ ] **Step 3: Animation review** (emilkowalski guidance). There should be one moment (the camera ease), it must be interruptible, and reduced motion must be respected.
- [ ] **Step 4: Accessibility Auditor agent:** keyboard-only pass, then a screen reader pass on the table and the town's live region.
- [ ] **Step 5: Playwright smoke test** (`e2e/neighborhood.spec.ts`):
  - Load the page with seeded data.
  - Select a row in Table.
  - Switch to Map: the same `?c=` is present, and its point has the selected ring.
  - Switch to Town: the drawer shows the same association.
- [ ] **Step 6: Commit:** `git commit -m "polish(neighborhood): review fixes"`

---

## Done when

- [ ] Every non-test association appears exactly once in the town, the table, and (unless `no_match`) the map.
- [ ] Each lit house shows the rule that lit it, and the drawer links to the rows behind it.
- [ ] Missing data looks missing, and stale sources look stale.
- [ ] Selecting in any view selects in all three; a pasted `?c=` link opens on that house.
- [ ] Keyboard-only and reduced-motion passes are recorded; the performance budget is met and recorded.
