---
tags:
  - platform
  - api
  - endpoints
  - engineering
aliases:
  - API
  - Endpoints
  - Routes
created: 2026-04-14
updated: 2026-04-14
---

# API Routes

> [!info] Vera exposes 60+ API route categories via Next.js 16 App Router. All routes are authenticated, tenant-isolated, rate-limited, and validated with Zod schemas.

---

## Route Categories

### Financial & Accounting

| Route | Description |
|-------|-------------|
| `/api/accounting/*` | Full GL accounting — AP reports, payment batches, NACHA/check generation, 1099s, fixed assets, owner statements |
| `/api/banking/*` | Plaid bank linking, reconciliation, BAI2 file processing |
| `/api/stripe/*` | Payment processing, subscriptions, webhooks |
| `/api/statements/*` | Owner statements and coupon generation |
| `/api/special-assessments/*` | Special assessment billing and tracking |
| `/api/liens/*` | Lien recording and management |
| `/api/invoice-queue/*` | AP invoice intake and processing queue |
| `/api/pos/*` | Point-of-sale for amenity payments |

### Community Management

| Route | Description |
|-------|-------------|
| `/api/associations/*` | Core community operations — settings, lots, financials, access control, marina, golf, compliance |
| `/api/properties/*` | Property/unit management |
| `/api/lots/*` | Lot-level operations and imports |
| `/api/compliance/*` | Florida statutory compliance, calendars |
| `/api/certificates/*` | Estoppel and resale certificates |
| `/api/estoppels/*` | Estoppel request processing |
| `/api/community-vehicles/*` | Community vehicle tracking |
| `/api/meter-readings/*` | Utility sub-metering |
| `/api/inventory/*` | Community inventory management |

### People & Communications

| Route | Description |
|-------|-------------|
| `/api/contacts/*` | Contact management (owners, vendors, board) |
| `/api/communications/*` | Email/SMS campaigns, templates |
| `/api/text-blasts/*` | Bulk SMS notifications via Twilio |
| `/api/notifications/*` | In-app notification system |
| `/api/push/*` | Mobile push notifications (Capacitor) |
| `/api/chatbot/*` | AI-powered homeowner chatbot |

### Operations & Workflow

| Route | Description |
|-------|-------------|
| `/api/action-items/*` | Task management and assignment |
| `/api/maintenance/*` | Work orders and maintenance requests |
| `/api/maintenance-services/*` | Service catalog management |
| `/api/inspections/*` | Property inspections with photo upload |
| `/api/workflows/*` | Workflow engine and templates |
| `/api/vendor-contracts/*` | Vendor contract management |
| `/api/vendors/*` | Vendor directory and COI tracking |
| `/api/tags/*` | Tagging system for categorization |
| `/api/print-queue/*` | Physical mail print and send queue |

### Governance & Legal

| Route | Description |
|-------|-------------|
| `/api/board/*` | Board meetings, agendas, packets, votes |
| `/api/ballots/*` | Election ballot management |
| `/api/elections/*` | Community elections and voting |
| `/api/arc/*` | Architectural Review Committee applications |
| `/api/signatures/*` | Document signatures (PandaDoc) |

### AI & Intelligence

| Route | Description |
|-------|-------------|
| `/api/ai/*` | Core AI features — contract analysis, invoice extraction, anomaly detection, reconciliation |
| `/api/ai/verai/*` | VeRAI AI assistant — 14 specialized endpoints (financial summary, legal summary, meeting minutes, mediation, etc.) |
| `/api/analytics/*` | Search analytics and reporting |
| `/api/reports/*` | Custom report generation |

### Automation & Cron

| Route | Description |
|-------|-------------|
| `/api/automation/*` | 16 automation agents (see [[Automation Agents]]) |
| `/api/cron/run-all` | Daily orchestrator (06:00 UTC) |

### Administration

| Route | Description |
|-------|-------------|
| `/api/admin/*` | User management, audit logs, careers, ride-alongs |
| `/api/auth/*` | Authentication flows |
| `/api/settings/*` | System configuration |
| `/api/system/*` | System health and utilities |
| `/api/health/*` | Health check endpoint |
| `/api/search/*` | Global search |
| `/api/migration/*` | Data migration tools |

### External Integrations

| Route | Description |
|-------|-------------|
| `/api/integrations/*` | QuickBooks, Plaid, Apify, provider webhooks |
| `/api/sync/*` | Data sync (Paylocity) |
| `/api/webhooks/*` | Inbound webhook handlers (Stripe, etc.) |

### Portals

| Route | Description |
|-------|-------------|
| `/api/portal/*` | Homeowner/board/vendor portal APIs |
| `/api/intake/*` | New community intake wizard |
| `/api/websites/*` | Community website CMS |
| `/api/calendar/*` | Community calendar events |
| `/api/activities/*` | Community activities and registrations |

### CRM & Sales

| Route | Description |
|-------|-------------|
| `/api/crm/*` | Sales pipeline, lead management |
| `/api/dashboard/*` | Dashboard widget data |
| `/api/performance/*` | Performance metrics |

### HR & Payroll

| Route | Description |
|-------|-------------|
| `/api/payroll/*` | Payroll data and reporting |

---

## API Patterns

### Standard Route Structure

```typescript
// src/app/api/{domain}/{resource}/route.ts
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ /* ... */ })

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenantId = user?.user_metadata?.tenant_id

  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('tenant_id', tenantId)  // ALWAYS include tenant filter

  return NextResponse.json(data)
}
```

### Common Patterns

| Pattern | Description |
|---------|-------------|
| **Zod validation** | All inputs validated before processing |
| **Tenant isolation** | `.eq('tenant_id', tenantId)` on every query |
| **Error handling** | Structured error responses with status codes |
| **Rate limiting** | Applied via `withRateLimit()` wrapper |
| **Audit logging** | Sensitive operations logged to `audit_events` |
| **RBAC** | Role-based access checked before data operations |

---

## Notable Endpoint Depth

### Associations (deepest nesting)

The `/api/associations/[associationId]/` route tree is the most extensive, with sub-routes for:
- `access-control/` — Gate systems, visitor management
- `approval-thresholds/` — Multi-level approval rules
- `arc/committee/` — ARC member management
- `assessments/` — Assessment history
- `board-certifications/` — FL board certification tracking
- `collections/` — Escalation rules, logs, manual runs
- `compliance/` — Calendar (`.ics` export)
- `financials/` — AR aging, audit, forecast, reports (Excel + PDF)
- `golf/` — Memberships, tee times, check-in
- `journal-entries/` — GL journal entries
- `lots/` — Unit management, import, occupancy
- `marina/` — Slip management, pumpout logs

---

*Related: [[Architecture Overview]] · [[Automation Agents]] · [[Database Schema]] · [[Security]]*
