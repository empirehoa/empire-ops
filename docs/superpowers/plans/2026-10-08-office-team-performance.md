# Office and Team Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Help JR coach offices and managers by showing how each one's book of business is trending. Comparisons are like with like, over time, and admin-only.

**Architecture:** Weekly rollups are computed from `community_daily_snapshots` (Data Foundations v2) into `performance_weekly`. Each metric is normalized per 100 doors and compared within a peer group (offices of similar size; books of similar door count and community type). Views show trends first and peer position second, and never a rank-ordered list of people. Coaching notes are drafts that only admins see.

**Tech Stack:** Next.js server components, supabase-js, Vitest. Charts use the existing recharts, or @visx/xychart 4.0.0 if small multiples need it.

**Gate:**
- 8 or more weeks of daily snapshots.
- `/admin/offices` shows zero unassigned communities.
- JR has confirmed the guardrails below in writing (a commit to this file is enough).

---

## Guardrails (built into the design, not added later)

1. **Admin-only.** The routes call `requireAdminPage()`/`requireAdminApi()`, and a separate `PERFORMANCE_VIEWERS` allowlist (a subset of `ADMIN_EMAILS`) gates them. Nothing appears in Notion, Discord, or the daily email.
2. **Coaching, not ranking.**
   - No leaderboards, no "bottom 5", no sorting a people list by a score.
   - The default order is alphabetical.
   - Each person's view shows their own trend against their own past and a peer band (25th–75th percentile), not other named people.
3. **Like with like.**
   - Metrics are per 100 doors.
   - Peer groups use door count band and community type. Condo and HOA work differ, and Fla. Stat. ch. 718 and ch. 720 put different demands on them.
   - A comparison is shown only when its peer group has 4 or more members. Smaller groups show the trend alone.
4. **Context before judgment.** Every chart shows events that change the denominator: communities added or removed, and a manager's start date when known. A week with a portfolio change is marked, not smoothed away.
5. **Same rules for everyone.** One metric definition file is used for every office and person. Changing a definition changes it for all, and the change is recorded in git.
6. **Drafts only.** Claude-written coaching notes are labeled "Draft for JR's review" and stored, never sent. Any employment decision is JR's and HR's, not the app's.
7. **No protected-class data.** The app does not store or join age, race, sex, disability, or any other protected characteristic, and does not infer them.

## Metrics (all from data already stored)

| Metric | Definition | Direction |
|---|---|---|
| Aged items per 100 doors | `open_items_90_plus / doors * 100`, summed over the book | lower is better |
| Items open 30+ share | `open_items_30_plus / open_items` | lower is better |
| AR 90+ share | `sum(ar_90_plus) / sum(ar_total)` over the book, latest export | lower is better |
| AR 90+ trend | change in AR 90+ share over 4 weeks | falling is better |
| Throughput | items closed per week per 100 doors (from `action_items.closed_on`) | context only, not judged |
| Book size | doors and communities | context only |

Fee and revenue are not people metrics. They describe contracts, not performance.

## File map

| File | Responsibility |
|---|---|
| `supabase/migrations/0003_performance_weekly.sql` | `performance_weekly` (subject_type office or manager, subject_key, week_start, metrics jsonb, peer_group, community_count, door_count, changes jsonb), unique on (subject_type, subject_key, week_start) |
| `src/lib/performance/metrics.ts` | pure: metric definitions (the single source of truth) |
| `src/lib/performance/rollup.ts` | pure: week of snapshots to one row per subject |
| `src/lib/performance/peers.ts` | pure: peer groups and percentile bands, with the 4-member minimum |
| `src/app/api/automation/performance-weekly/route.ts` | Monday job: roll up the last full week |
| `src/app/(dashboard)/admin/performance/page.tsx` | offices index (alphabetical) with small-multiple trends |
| `src/app/(dashboard)/admin/performance/[subject]/page.tsx` | one office or manager: trends, peer band, context events, draft notes |

## Tasks (full TDD steps are written when the gate is met)

The pure functions below carry the guardrails, so they come first and are fully specified now.

### Task 1: Peer bands enforce the minimum group size

- [ ] **Step 1: Write the failing test** (`src/lib/performance/__tests__/peers.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { peerBand } from '../peers'

describe('peerBand', () => {
  it('returns no band for groups under 4, so no comparison is shown', () => {
    expect(peerBand([0.1, 0.2, 0.3])).toBeNull()
  })
  it('returns the 25th-75th percentile band', () => {
    expect(peerBand([0.1, 0.2, 0.3, 0.4, 0.5])).toEqual({ p25: 0.2, p50: 0.3, p75: 0.4, n: 5 })
  })
  it('ignores missing values when counting the group', () => {
    expect(peerBand([0.1, null, 0.3, null, 0.5])).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and watch it fail.** `npx vitest run src/lib/performance` → FAIL.
- [ ] **Step 3: Implement** (`src/lib/performance/peers.ts`)

```ts
export const MIN_PEERS = 4

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/** Peer band, or null when the group is too small to compare fairly. */
export function peerBand(values: Array<number | null>) {
  const v = values.filter((x): x is number => x != null && Number.isFinite(x)).sort((a, b) => a - b)
  if (v.length < MIN_PEERS) return null
  const r = (x: number) => Math.round(x * 1e6) / 1e6
  return { p25: r(quantile(v, 0.25)), p50: r(quantile(v, 0.5)), p75: r(quantile(v, 0.75)), n: v.length }
}
```

- [ ] **Step 4: Run it and watch it pass.** → PASS.
- [ ] **Step 5: Commit:** `git commit -m "feat(performance): peer bands with a minimum group size"`

### Task 2: No API returns a ranked list of people

- [ ] **Step 1:** Write a test that calls every `/api/admin/performance*` handler with seeded data and asserts:
  - manager lists come back sorted by name;
  - no response field is named `rank`, `position`, or `percentile_rank`.
- [ ] **Step 2:** Implement the handlers to pass the test. Order by `subject_key`.
- [ ] **Step 3: Commit.**

### Tasks 3–6 (spelled out in full when the gate is met)

3. Migration `0003` and types.
4. `metrics.ts` and `rollup.ts`, with tests for each metric in the table above, including the "denominator changed" week flag.
5. The Monday automation route, added to `AGENTS` in `src/lib/intelligence/agents.ts` with skip-when-no-history behavior.
6. Pages:
   - The index page: alphabetical small multiples, one per office, 12-week lines, peer band shaded.
   - The subject page: trends, context events, and a "Draft coaching notes" panel. Claude drafts these from the subject's own trend only, labeled as drafts, with "Save" to store them and no "Send".

## Done when

- [ ] JR has confirmed the guardrails, and they are enforced in code and tests (Tasks 1–2).
- [ ] Every chart shows its peer group size, or says why no comparison is shown.
- [ ] No route outside `/admin/performance` reads `performance_weekly`.
