# ADR-007: Estoppels & Closing Certificates Module

**Status:** Accepted  
**Date:** 2026-04-06  
**Author:** Claude (on behalf of JR Riestra)

## Context

Florida Statute 720.30851 requires HOAs to provide estoppel certificates (closing/resale certificates) within **10 business days** of receipt. Empire manages 255 communities and receives a high volume of estoppel requests. Before this module, requests were tracked manually in spreadsheets with no deadline enforcement.

## Decision

### Data Model

- **`estoppel_requests`** — central table with full financial snapshot at time of request (balances, violations, fees — all stored in cents)
- **`estoppel_status_history`** — immutable status transition log
- **`add_business_days()`** — PostgreSQL function that calculates due date by skipping weekends (Sat/Sun); called at request creation
- **`estoppel_request_seq`** — sequence driving `EST-YYYY-NNNN` human-readable IDs

### Fee Schedule (FL FS 720.30851)

| Fee Component | Default | Notes |
|---|---|---|
| Base fee | $250.00 | `base_fee_cents = 25000` |
| Rush fee | $100.00 | Applied when `rush_requested = true` |
| Delinquency surcharge | $100.00 | Applied when balance > 0 |
| Total | Computed column | `base + rush + delinquency` (GENERATED ALWAYS AS STORED) |

### UI

- `/estoppels` — queue dashboard with deadline tracker, status filters, overdue alerts
- `/estoppels/new` — 3-step intake form (property info → requestor info → review)
- `/estoppels/[id]` — detail view: financial snapshot, status progression, delivery
- `/estoppels/[id]/pdf` — print-ready certificate view
- **`DeadlineTracker`** component — visual business-day countdown with red/amber/green coding

### AI Integration

- `/api/verai/estoppels/generate` — calls VeraI to draft the financial narrative text
- Output routes to `ai_action_queue` for staff review before delivery

## Consequences

- Financial amounts stored as integers (cents) to avoid floating-point rounding errors.
- The generated `total_fee_cents` column prevents the UI from computing incorrect totals.
- `contact_id` references the `contacts` table (not `owners` — Vera uses `contacts` as the unified person entity).

## Compliance Notes

- 10 business day window enforced at DB level via `due_date = add_business_days(received_at, 10)`
- The `IMMUTABLE` function qualifier allows use in index expressions if needed in the future
- Fee caps in FL FS 720.30851 (§720.30851(1)(a)) are reflected in defaults but can be overridden per association settings

## Tables Added

- `estoppel_requests` (migration 117)
- `estoppel_status_history` (migration 117)
