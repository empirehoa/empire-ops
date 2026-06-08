# Project Vera — Empire Management Group
## Production-Grade Platform Architecture & Implementation Blueprint

> **Classification:** Internal Engineering Reference
> **Version:** 1.0 — 2026-03-31
> **Prepared for:** Empire Management Group Engineering & Product Leadership
> **Scope:** Full platform redesign — 255 communities, 28,391 doors, 9 offices, 63 employees

---

## 1. EXECUTIVE PRODUCT INTERPRETATION

Empire Management Group is building Project Vera as its internal operating system — the single platform where CAMs, directors, accounting, board members, homeowners, vendors, and executives work. It is not a customer-facing SaaS product. It is not a CRM. It is the operational backbone of a $7.7M property management business managing 255 communities across Florida.

**What this replaces or supersedes:**
| System | Current Role | Vera Direction |
|--------|-------------|----------------|
| Vantaca | Community operations, violations, AR | Full migration into Vera — Vantaca becomes read-only then retired |
| VantacaIQ | Analytics, action items, benchmarks | Rebuilt natively in Vera analytics + action items engine |
| QuickBooks Online | Empire master company P&L | Reference import only — Vera handles per-community accounting |
| Luware Nimbus | Call center reporting | Replicated in Vera call center module; Luware feeds data via API |
| Paylocity | Payroll/HR | Phase 4 — Vera handles workforce reporting now, payroll later |
| Visitt.io | Work orders, inspections, COI | Feature parity built natively in Vera |
| HubSpot | CRM, pipeline | Full import; Vera CRM replaces or supplements |
| CondoCerts | Closing certifications | Vera document/closing module replaces |

**What Vera is NOT:**
- Not a generic SaaS platform sold to other companies
- Not dependent on third-party accounting systems for community-level data
- Not a brochure or marketing site
- Not a lightweight MVP — this is enterprise internal tooling

**Design posture:** Every screen should answer "what do I need to do right now?" not "here is data." Vera is action-oriented, not informational.

---

## 2. PRODUCT PRINCIPLES

1. **Action over information.** Every dashboard, every module, every widget should surface what requires action first. Data that requires no action is secondary.

2. **Role-aware from the foundation.** There is no "default view." Every user sees only what their role, portfolio, community assignment, and permission scope allows. Hardcode nothing.

3. **Everything is auditable.** Every create, update, status change, approval decision, login, export, and AI-generated action must be logged with who, what, when, and from where.

4. **Shared services over feature silos.** Workflow engine, notifications, search, approvals, audit log, and analytics are platform-level services — not one-off features in individual modules.

5. **Microsoft-first identity.** Internal users authenticate via Azure Entra ID (Azure AD). External users (board members, homeowners, vendors) authenticate via email/password with optional SSO.

6. **Self-contained accounting.** Vera owns the community-level general ledger. No external accounting dependency for community finances.

7. **AI as a layer, not a product.** AI-generated drafts, suggestions, and anomaly detection augment human decisions — they do not replace them. All AI actions must be reviewable.

8. **No placeholder data in production.** Every module must connect to real data or show an empty state. Fake records are disqualifying.

9. **Empire brand, always.** The platform is Empire Management Group's product. "Vera" is the internal project name. External-facing surfaces show Empire branding.

10. **Progressive disclosure.** Show the right amount of complexity for each role. A homeowner and a director should never see the same interface.

---

## 3. TARGET USER TYPES AND PERMISSION MODEL

### 3.1 User Type Definitions

| Code | Role | Description | Primary Surface |
|------|------|-------------|-----------------|
| `super_admin` | Platform Admin | Full access, system config, all tenants | Admin panel |
| `executive` | Executive (CEO/VP) | Portfolio-wide read + oversight, no operational edit | Executive dashboard |
| `director` | Regional Director | Multi-office portfolio oversight, team management | Director dashboard |
| `manager` | CAM / Property Manager | Assigned communities, full operational access | Manager dashboard |
| `accounting` | Accounting Staff | Financial modules, AP/AR, ledger, reports | Accounting dashboard |
| `hr` | HR/Payroll | Workforce, payroll, time tracking | HR dashboard |
| `call_center` | Call Center Rep | Inbox, calls, action item creation | Call center dashboard |
| `board_member` | Board Member | Community-scoped: meetings, approvals, financials, docs | Board portal |
| `committee_member` | Committee Member | Community-scoped: specific committee areas only | Committee portal |
| `homeowner` | Homeowner | Unit-scoped: balance, work orders, ARC, violations | Homeowner portal |
| `vendor` | Vendor | Assigned work orders, invoices, COI management | Vendor portal |
| `attorney` | Association Attorney | Documents, violations, collections, legal items | Attorney view |

### 3.2 Permission Dimensions

Permissions are evaluated along **four axes** simultaneously:

```
PERMISSION = role × portfolio × community × entity_scope
```

- **Role axis:** What types of actions the user can perform (create, read, update, delete, approve, report)
- **Portfolio axis:** Which portfolios/offices the user has access to
- **Community axis:** Which specific associations the user can see
- **Entity axis:** Which specific records within a community (their unit, their assigned work orders, etc.)

### 3.3 Permission Matrix (Core Operations)

| Action | super_admin | executive | director | manager | accounting | call_center | board_member | homeowner |
|--------|------------|-----------|----------|---------|------------|-------------|--------------|-----------|
| View all communities | ✓ | ✓ | Portfolio | Assigned | ✓ | — | Own | — |
| Edit community settings | ✓ | — | — | Assigned | — | — | — | — |
| Create violations | ✓ | — | ✓ | Assigned | — | — | — | — |
| Approve violations | ✓ | — | ✓ | Assigned | — | — | Board role | — |
| View financials | ✓ | ✓ | Portfolio | Assigned | ✓ | — | Own community | Own balance |
| Post journal entries | ✓ | — | — | — | ✓ | — | — | — |
| Create work orders | ✓ | — | ✓ | ✓ | — | ✓ | — | Own unit |
| Approve work orders | ✓ | — | ✓ | Assigned | — | — | — | — |
| Create approvals | ✓ | — | ✓ | ✓ | ✓ | ✓ | Board role | — |
| Act on approvals | ✓ | — | ✓ (portfolio) | Assigned | Acctg scope | — | Board scope | — |
| View inbox | ✓ | — | Team | Own + team | Own | Own | Own | — |
| View analytics | ✓ | ✓ | Portfolio | Assigned | Financial | — | Own community | — |
| Manage vendors | ✓ | — | ✓ | Assigned | ✓ | — | — | — |
| Export data | ✓ | ✓ | Portfolio | Assigned | ✓ | — | — | — |

### 3.4 Entity-Scoped Access Rules

- A manager assigned to communities A, B, C cannot see data for community D
- A board member of community A cannot see community B — even if both are under the same management company
- A homeowner at unit 101 cannot see unit 102's balance
- A committee member with ARC committee rights can see ARC submissions but not financial records
- A director can "impersonate view" (read-only) any of their direct reports' views for oversight

### 3.5 Delegated Access

- Any user can delegate their approval authority to another user for a defined period (vacation coverage)
- Delegation is logged, time-bounded, and revocable
- Delegated actions appear in the audit log as "acted by X on behalf of Y"

### 3.6 Committee Member Sub-Permissions

Committee members receive a scoped role with:
- `committee_type`: ARC | Budget | Social | Landscape | Safety | Rules | Other
- Access restricted to the specific committee's items
- Can view committee-relevant documents and meeting materials
- Cannot access financial ledger, violations (unless violations committee), or staff records

---

## 4. REQUIRED GLOBAL PLATFORM ARCHITECTURE

### 4.1 Architectural Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                    │
│  Next.js 15 App Router  |  React 18  |  Tailwind v4  |  PWA     │
├─────────────────────────────────────────────────────────────────┤
│  API LAYER                                                       │
│  Next.js API Routes  |  Server Actions  |  tRPC (recommended)   │
├──────────────┬──────────────────┬───────────────────────────────┤
│  PLATFORM    │  BUSINESS        │  INTEGRATION                  │
│  SERVICES    │  SERVICES        │  ADAPTERS                     │
│              │                  │                               │
│  Auth        │  Workflow Engine │  Microsoft 365 (Graph API)    │
│  Permissions │  Approvals       │  Azure Entra ID (SSO)         │
│  Search      │  Notifications   │  Luware Nimbus (Call Center)  │
│  Audit Log   │  SLA/Escalation  │  Plaid (Banking)              │
│  File Store  │  AI Layer        │  Stripe (Payments)            │
│  Events Bus  │  Reporting       │  Twilio (SMS)                 │
│              │  Import/ETL      │  Resend (Email)               │
├──────────────┴──────────────────┴───────────────────────────────┤
│  DATA LAYER                                                      │
│  Supabase (PostgreSQL) → Azure Database for PostgreSQL (path)   │
│  Azure Blob Storage (files/documents)                           │
│  Azure AI Search (full-text search index)                       │
│  Redis (sessions, rate limiting, queues)                        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Multi-Tenant Hierarchy

```
Tenant (Empire Management Group)
  └── Office (Maitland, Kissimmee, Clermont, Tampa, Jacksonville, etc.)
        └── Portfolio (collection of communities per manager/director)
              └── Association (HOA, COA, CDD)
                    └── Property/Unit
                          └── Owner/Occupant
```

Every database query includes `tenant_id`. Association-level queries also include RLS policies. Portfolio and office-level queries are computed from user role assignment.

### 4.3 Shared Platform Services (Build These First)

These are not features — they are infrastructure that all features depend on:

1. **Auth Service** — Azure Entra ID for internal, email/password + OAuth for external
2. **Permission Service** — Role × portfolio × community × entity evaluation engine
3. **Workflow Engine** — State machine for approvals, action items, violations, work orders
4. **Notification Service** — In-app, email, SMS, push — triggered by workflow events
5. **Audit Log Service** — Immutable append-only event log, queryable
6. **Search Service** — Multi-entity federated search with permission trimming
7. **File/Document Service** — Upload, storage, versioning, access control (Azure Blob)
8. **Event Bus** — Internal pub/sub for cross-module triggers (e.g., approval creates action item)
9. **AI Service** — Claude API wrapper with context injection and response logging
10. **Reporting Engine** — Shared data aggregation layer that powers dashboards and exports

### 4.4 Information Architecture (Navigation Hierarchy)

**Recommended navigation — all roles see their relevant subset:**

```
PRIMARY NAV (always visible):
  [Empire Logo]  [Global Search]  [Notifications Bell]  [User Menu]

SIDEBAR (role-filtered):
  1. Dashboard          (role-specific home)
  2. Inbox              (M365 connected, team queues)
  3. Action Items       (personal + team queue)
  4. Approvals          (pending actions)
  5. Communities        (association workspace)
     ├── Overview
     ├── Homeowners
     ├── Properties
     ├── Financials
     ├── Violations
     ├── Work Orders
     ├── ARC
     ├── Communications
     ├── Board
     ├── Documents
     └── Settings
  6. Call Center        (call activity + queues)
  7. CRM                (leads, pipeline, contracts)
  8. Vendors            (vendor directory + COI)
  9. Analytics          (role-aware KPI center)
 10. Calendar           (personal + team + community)
 11. Maps               (portfolio + staff + vendor geography)
 12. Reports            (financial + operational reports)
 13. HR / Workforce     (director+ only)
 14. Settings           (admin/manager configurable)
```

---

## 5. CORE MODULE-BY-MODULE REQUIREMENTS

### MODULE A: APPROVALS ENGINE

**Status: REBUILD FROM SCRATCH**

#### Business Objective
Replace the non-functional approvals stub with a true multi-step approval engine that governs high-stakes decisions across all modules. Approvals are the primary control mechanism for financial expenditures, vendor selection, ARC decisions, board resolutions, HR actions, and contract changes.

#### Data Model

```typescript
Approval {
  id: uuid
  tenant_id: uuid
  approval_type: ApprovalType  // see enum below
  title: string
  description: text
  requester_id: uuid → users
  assigned_to_id: uuid → users  // current reviewer
  community_id: uuid? → associations
  related_entity_type: string  // 'work_order' | 'vendor' | 'arc_request' | 'invoice' | etc.
  related_entity_id: uuid
  amount: decimal?  // for financial approvals
  due_date: date
  review_by_date: date  // SLA deadline
  status: ApprovalStatus
  current_step: int
  total_steps: int
  priority: 'low' | 'normal' | 'high' | 'urgent'
  metadata: jsonb  // flexible payload per type
  created_at: timestamptz
  updated_at: timestamptz
}

ApprovalType enum:
  arc_request | vendor_invoice | work_order | contract | budget_amendment |
  special_assessment | collections_action | board_resolution | staff_action |
  expense_over_limit | homeowner_exception | document_publication | rule_change

ApprovalStatus enum:
  pending | under_review | approved | denied | returned | escalated |
  expired | auto_approved | auto_denied | delegated | cancelled

ApprovalStep {
  id: uuid
  approval_id: uuid
  step_number: int
  step_name: string
  approver_role: string  // or specific user_id
  approver_id: uuid?
  status: 'pending' | 'approved' | 'denied' | 'skipped'
  acted_at: timestamptz?
  notes: text?
  is_required: bool
  condition: jsonb?  // conditional logic for auto-skip
}

ApprovalComment {
  id, approval_id, user_id, body, created_at, attachments[]
}

ApprovalRule {
  id, tenant_id, approval_type, condition: jsonb,
  auto_action: 'approve' | 'deny' | 'escalate',
  threshold_amount: decimal?,  // e.g., auto-approve invoices under $500
  step_chain: jsonb  // defines the approval chain
}
```

#### Functional Requirements

- Every approval item has a full detail view with: summary, attachments, linked records, step chain progress, comment thread, SLA timer, audit history
- Actions available: Approve, Deny, Return for Revision, Forward, Escalate, Comment, Reassign
- Multi-step chains: ARC requests → Manager review → Board vote; Invoices over $5K → Manager → Director → Accounting
- Auto-approval rules: invoices under configurable threshold, routine vendor renewals, items with no response within SLA window
- Auto-denial rules: expired ARC requests, items failing compliance checks
- SLA timers: visual countdown on each item, email alert at 50% and 90% of deadline
- Escalation: if unacted at deadline, escalate to supervisor role automatically
- Delegation: user can delegate approval authority to another user for a date range
- Committee approvals: ARC submissions route to ARC committee members as a group; first N approvals wins

#### Dashboard Integration
- Approvals requiring action surface as primary call-to-action cards on every relevant role dashboard
- Director/executive view shows approval backlog volume by type and age
- Accounting view shows financial approvals by amount band

#### Acceptance Criteria
- [ ] An ARC submission triggers a 3-step approval chain (manager → board chair → board vote) automatically
- [ ] An invoice over $5,000 requires director approval before payment
- [ ] An overdue approval (past review_by_date) triggers escalation notification to supervisor
- [ ] Auto-approve fires correctly for invoices under $500 from approved vendors
- [ ] Full audit trail on every approval showing all state changes with timestamp and actor
- [ ] A delegated approval shows "John Smith acting for Jane Doe" in the audit log

---

### MODULE B: ACTION ITEMS ENGINE

**Status: REBUILD FROM SCRATCH**

#### Business Objective
Replace the broken action items stub with a real task/workflow module that serves as the operational to-do list for all internal users. Action items are the primary mechanism by which work gets assigned, tracked, and completed.

#### Data Model

```typescript
ActionItem {
  id: uuid
  tenant_id: uuid
  title: string
  description: text
  type: ActionItemType
  owner_id: uuid → users  // responsible party
  assigner_id: uuid → users  // who created/assigned it
  team_id: uuid?  // team-based routing
  community_id: uuid?
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled' | 'escalated'
  due_date: date
  reminder_date: date?
  completed_at: timestamptz?
  related_entity_type: string?
  related_entity_id: uuid?
  parent_id: uuid?  // sub-tasks
  is_recurring: bool
  recurrence_rule: jsonb?  // rrule-compatible
  source: 'manual' | 'inbox' | 'call' | 'approval' | 'workflow' | 'analytics' | 'calendar' | 'dashboard'
  tags: text[]
  metadata: jsonb
}

ActionItemType enum:
  follow_up | homeowner_call | vendor_coordination | board_communication |
  financial_review | violation_follow_up | work_order_follow_up | compliance_check |
  document_preparation | meeting_prep | onboarding_task | inspection | contract_deliverable |
  collections_step | escalation | internal_task
```

#### Functional Requirements

- Create action items from: inbox (one-click from email), call log, approval workflow, analytics exception, calendar, homeowner profile, dashboard widget
- Sub-tasks: any action item can have child tasks; parent shows completion % based on children
- Team routing: action items can be assigned to a team queue rather than individual (first-accept model or round-robin)
- Recurring tasks: weekly, monthly, annual tasks for contractual deliverables and compliance
- Cross-module linking: every action item shows the full context of its source (e.g., linked email, linked homeowner, linked violation)
- Reminders: configurable reminder schedule, delivered via notification service
- SLA escalation: overdue items auto-escalate to supervisor based on configurable rules
- Contractual deliverables: a special category of recurring action items tied to management contract terms — these are the primary operational KPIs for managers

#### Key Insight: Contractual Deliverables
Management contracts with communities define what Empire must deliver (monthly board packets, annual audits, weekly inspections, etc.). These must be modeled as recurring action items with SLA compliance tracking. A director's primary dashboard metric is: what % of contractual deliverables are on time?

---

### MODULE C: INBOX MODULE

**Status: BUILD NEW — integrates with existing communications tables**

#### Business Objective
Give every internal user a unified inbox that connects their Microsoft 365 email to Vera's operational context. A CAM should be able to receive an email, see the homeowner's full record alongside it, draft an AI-assisted response grounded in community documents, and create a follow-up action item — all without leaving Vera.

#### Architecture

```
Microsoft 365 Graph API
  └── OAuth per user (or shared service account per team)
        └── Inbox Sync Service (webhook subscription to Graph API)
              └── Vera inbox_messages table
                    ├── Thread linking (homeowner/vendor/community)
                    ├── AI draft generation (context injection)
                    └── Action item creation
```

#### Data Model

```typescript
InboxMessage {
  id: uuid
  tenant_id: uuid
  user_id: uuid  // Vera user who owns this inbox
  external_id: string  // Graph API message ID
  provider: 'microsoft_365' | 'gmail'
  thread_id: string
  subject: string
  from_email: string
  from_name: string
  to_emails: string[]
  body_preview: text
  body_html: text
  received_at: timestamptz
  is_read: bool
  is_flagged: bool
  category: MessageCategory?
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'?
  linked_entity_type: string?  // 'homeowner' | 'vendor' | 'community' | etc.
  linked_entity_id: uuid?
  team_inbox_id: uuid?
  status: 'unread' | 'read' | 'responded' | 'forwarded' | 'archived' | 'linked'
  response_due_at: timestamptz?  // SLA deadline
  action_item_id: uuid?
  attachments: jsonb[]
}

TeamInbox {
  id, tenant_id, name, description,
  shared_mailbox_address: string,  // e.g., violations@empirehoa.com
  community_id: uuid?,  // if community-specific
  members: uuid[],  // Vera user IDs with access
  routing_rules: jsonb  // auto-routing conditions
}
```

#### Functional Requirements

- Connect personal Microsoft 365 mailbox via OAuth (one-time per user)
- Connect shared team mailboxes (violations@, billing@, etc.) per team
- Side-by-side context panel: when viewing any email, show linked homeowner record, community record, or vendor record alongside
- AI draft: single click generates a response using community governing docs, templates, and prior communication history as context
- Suggested responses: based on email category, show template options grounded in documents
- Link email to record: link any email thread to homeowner, vendor, community, work order, approval, or action item
- Create action item from email: one-click creates an action item pre-populated with email context
- Team routing: forward to team inbox with one click; team member picks it up from queue
- SLA timer: configure response SLA by message category; visual countdown
- Sentiment detection: flag urgent/negative emails for priority handling
- Board connectivity: board members may use Gmail or Office 365; Vera supports both via OAuth

---

### MODULE D: CALL CENTER MODULE

**Status: BUILD NEW**

#### Business Objective
Give Empire's call center team and management a full view of call activity, queue performance, homeowner/vendor contact history, and action tracking — all connected to Vera records. Data sourced from Luware Nimbus via API; Vera provides the operational layer.

#### Architecture Decision
**Recommendation: Abstract over Luware Nimbus.** Do not attempt to replace the telephony infrastructure. Instead:
- Pull call activity data from Luware Nimbus API into Vera's `call_records` table (daily/hourly sync)
- Vera provides the operational intelligence layer: linking calls to records, creating action items, reporting
- Long-term path: migrate to Azure Communication Services if Luware contract expires

#### Data Model

```typescript
CallRecord {
  id: uuid
  tenant_id: uuid
  external_call_id: string  // Luware call ID
  direction: 'inbound' | 'outbound'
  caller_phone: string
  caller_name: string?
  agent_id: uuid?  // Vera user
  queue_name: string?
  office: string?
  started_at: timestamptz
  answered_at: timestamptz?
  ended_at: timestamptz?
  duration_seconds: int
  outcome: 'answered' | 'abandoned' | 'transferred' | 'voicemail' | 'missed'
  disposition: string?  // agent-selected outcome
  linked_entity_type: string?
  linked_entity_id: uuid?
  action_item_id: uuid?
  notes: text?
  recording_url: string?
}

CallQueue {
  id, tenant_id, name, external_queue_id,
  community_ids: uuid[],  // communities this queue serves
  agent_ids: uuid[],
  sla_seconds: int,  // answer-by target
}
```

#### Functional Requirements

- Real-time (or near-real-time) call activity board showing active calls per queue
- Caller identification: when a known homeowner/vendor calls, their record surfaces immediately
- Post-call workflow: agent selects disposition, links record, optionally creates action item
- Team performance dashboard: calls handled, avg handle time, abandonment rate, SLA compliance per agent/queue/office
- Trend reporting: call volume by community, issue type, time of day, week-over-week
- Manager oversight: supervisor view showing live queue depth and agent status
- Reporting parity with Luware Nimbus: replicate all KPIs available in Nimbus natively in Vera

---

### MODULE E: ANALYTICS MODULE

**Status: REBUILD FROM SCRATCH**

#### Architecture
Analytics is a **shared reporting service**, not a page. It powers:
- Role-specific dashboards (pre-assembled widgets)
- The dedicated Analytics section (deep-dive views)
- Scheduled email reports
- Alert triggers (when KPI breaches threshold)

#### Data Model
Analytics is computed from all operational tables. Key computed views:

```sql
-- Materialized views (refresh hourly)
mv_operational_kpis    -- per community: open WOs, violations, delinquency %
mv_financial_kpis      -- per community: revenue, AR, balance
mv_action_item_kpis    -- per user: open items, overdue, completion rate
mv_approval_kpis       -- per community: pending approvals, avg resolution time
mv_call_kpis           -- per queue/agent: volume, SLA, abandonment
mv_sla_compliance      -- contractual deliverable completion rates
```

#### KPI Domains

| Domain | Key Metrics | Available To |
|--------|-------------|--------------|
| **Operations** | Open WOs, avg completion days, overdue %, repeat issues | Manager+ |
| **Violations** | Open count, avg age, resolution rate, by category | Manager+ |
| **Financial** | AR aging, delinquency %, collections rate, budget variance | Accounting, Manager+ |
| **Call Center** | Call volume, avg handle time, abandonment, SLA % | Call Center, Director+ |
| **Approvals** | Pending count, avg resolution days, overdue %, by type | Director+ |
| **Action Items** | Open count, overdue %, by owner, by team | Manager+ |
| **Contractual** | Deliverable completion %, by community, by manager | Director+ |
| **Portfolio** | Cross-community rollup of all above | Director, Executive |

#### Functional Requirements

- All analytics are role-scoped: a manager sees only their communities, a director sees their portfolio
- Drill-down from any aggregate metric to the underlying records
- Date range selectors on all views (last 30/60/90 days, this month, YTD, custom)
- Export to CSV/Excel for any table
- Scheduled email reports: configure daily/weekly/monthly summaries per user role
- Alert rules: "notify me when delinquency rate exceeds 5% for any community"
- Comparison views: this community vs. portfolio average, this month vs. last month

---

### MODULE F: COMPANY / OPERATIONS AREA

**Status: PARTIALLY BUILT — significant gaps**

#### Contractual Deliverables (Priority: HIGH)

This is the most important operational control mechanism. Every management contract defines what Empire must deliver. Those deliverables must be modeled in Vera as:

```typescript
ContractDeliverable {
  id, tenant_id, community_id, contract_id,
  title, description, category,
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'annual' | 'weekly',
  due_day: int?,  // day of month/week
  responsible_role: string,  // CAM | accounting | director | etc.
  assigned_to_id: uuid?,
  status: 'on_track' | 'at_risk' | 'overdue' | 'completed' | 'waived',
  last_completed_at: timestamptz?,
  next_due_at: date,
  action_item_id: uuid?  // linked auto-generated action item
}
```

The manager's primary dashboard must show: "Of your 23 contractual deliverables due this month, 18 are complete, 3 are at risk, 2 are overdue."

#### Team Oversight Rules

- Directors see all managers in their portfolio
- Directors can "view as" any of their direct reports (read-only impersonation)
- Directors see a rollup dashboard of all their managers' action items, deliverable completion, and open approvals
- Executives see the director-level rollup across all offices

#### Currently Broken Sections (Recommend Rebuild)

| Section | Status | Action |
|---------|--------|--------|
| Company overview | Broken/empty | Rebuild with live KPI cards |
| Team directory | Stub | Wire to user_profiles, HR module |
| Office management | Missing | Build from scratch |
| Contract management | Partially wired | Refactor — connect to deliverables |
| Integrations hub | Stub | Build integration status dashboard |
| Billing/invoicing | Missing | Build — management fee invoicing |

---

### MODULE G: DATA IMPORT

**Status: PARTIAL — expand significantly**

#### Import Entity Matrix

| Entity | Format | Validation | Staging | Rollback |
|--------|--------|-----------|---------|----------|
| Associations | CSV, JSON | Required fields, duplicate check | `staging_associations` | Delete by import_id |
| Homeowners/Contacts | CSV, JSON | Email format, duplicate by email+community | `staging_contacts` | Delete by import_id |
| Properties/Units | CSV | unit_number unique per association | `staging_properties` | Delete by import_id |
| Owner Balances | CSV | Amount format, account existence | `staging_balances` | Delete by import_id |
| Chart of Accounts | CSV, QBO export | Account number unique per association | `staging_accounts` | Delete by import_id |
| Budget | CSV | Account existence, fiscal year | `staging_budgets` | Delete by import_id |
| Assessments | CSV | Owner existence, amount | `staging_assessments` | Delete by import_id |
| Violations | CSV, Vantaca JSON | Property existence | `staging_violations` | Delete by import_id |
| Vendors | CSV | Name required | `staging_vendors` | Delete by import_id |
| Contracts | CSV | Community existence | `staging_contracts` | Delete by import_id |
| Call History | Luware CSV | Date format | `staging_calls` | Delete by import_id |
| Leads (HubSpot) | JSON | — | `staging_leads` | Delete by import_id |
| AR Aging | Vantaca JSON | Association existence | `staging_ar` | Delete by import_id |

#### Import Flow

```
Upload File → Parse → Validate → Preview (show errors/warnings) →
User Confirms → Insert to Staging → Background Job → Insert to Live →
Reconciliation Report → Commit or Rollback
```

#### Reconciliation Workflow
After bulk import, a reconciliation screen shows:
- Records inserted
- Records skipped (duplicates)
- Records with errors (and why)
- Summary totals (e.g., "total AR balance imported: $1,247,832")
- "Rollback this import" button for 30 days post-import

---

### MODULE H: PERMISSIONS / ACCESS MODEL
*See Section 3 — fully specified above.*

---

### MODULE I: DASHBOARD

#### Architecture: Widget-Based, Role-Assembled

Dashboards are not static pages. They are composed from a widget registry at runtime, based on user role. Widget registry:

```typescript
Widget {
  id: string
  name: string
  component: React.ComponentType
  allowed_roles: Role[]
  data_source: string  // analytics service endpoint
  default_config: jsonb
  is_pinnable: bool
}
```

#### Per-Role Dashboard Design

**Executive Dashboard:**
- Portfolio-level KPIs (revenue, collections, open violations, open WOs)
- Office performance comparison
- YTD vs. budget financial summary
- Pipeline snapshot (CRM)
- Staff workload heatmap

**Director Dashboard:**
- Manager performance rollup (deliverables, open items, approval backlog)
- Portfolio financial KPIs
- Escalation queue (items escalated to director level)
- Community health scores
- Call center queue overview

**Manager/CAM Dashboard:**
- Contractual deliverables (PRIMARY CALL TO ACTION — top of page)
- Open approvals requiring my action
- My open action items (overdue first)
- Community snapshot: violations, WOs, delinquency %
- Inbox preview (unread + flagged)
- Upcoming deadlines

**Accounting Dashboard:**
- AP approval queue
- AR aging summary
- Posted vs. unposted journal entries
- Bank reconciliation status
- Month-end close checklist

**Call Center Dashboard:**
- Live queue status
- My calls today (handled, missed, avg time)
- Action items created from calls
- Queue SLA performance

**Board Member Dashboard:**
- Pending approvals (board-level)
- Upcoming meeting agenda
- Community financials snapshot
- Open violations summary
- ARC pending items
- Community announcements

**Homeowner Dashboard:**
- Current balance and next due date
- Open work orders
- Active violations
- Upcoming community events
- ARC submission status
- Documents (recent)

---

### MODULE J: CALENDAR

**Status: EXISTS — needs wiring**

#### Calendar Types

| Type | Who Sees It | What Populates It |
|------|-------------|-------------------|
| Personal | Self only | Created by user |
| Team | Team members | Team-owned items |
| Community | Staff + board + homeowners (filtered) | Community events, meetings, inspections |
| Portfolio | Director+ | Multi-community view |
| Deliverables | Manager+ | Contractual due dates |
| Board/Meeting | Board + staff | Meeting dates, agendas |

#### Integration Requirements
- Action items with due dates appear on calendar automatically
- Contractual deliverables appear as calendar events
- Board meetings sync to board member personal calendars (via Graph API / Google Calendar API)
- Inspection schedules surface as calendar items
- Community events visible to homeowners

---

### MODULE K: CRM

**Status: PARTIAL — wire HubSpot import, build lifecycle**

#### Community Lifecycle States

```
Lead → Qualified → Proposal Sent → Negotiating → Contract Signed →
Onboarding → Active → At Risk → Churned
```

#### Data Model Additions

```typescript
Deal {
  id, tenant_id, name, stage, amount, monthly_value,
  close_date, probability, assigned_to_id,
  community_type: CommunityType,
  unit_count: int, county, city, state,
  hubspot_id: string?,
  contract_id: uuid?,
  notes: text
}

CommunityType: HOA | COA | CDD | facilities | commercial | lifestyle | on_site | marina | golf | other
```

#### Quote Calculator Expansion

Current community types must be expanded to: HOA, COA, CDD, Facilities, Commercial, Lifestyle, On-Site, Marina, Golf, Other

Quote must support:
- Base management fee (per unit or flat)
- Service tier multipliers
- One-time setup fees
- Discount rules (multi-community, referral, duration)
- Optional add-ons (financial only, full service, on-site staff)
- Presentation generation (PDF proposal)
- Direct contract preparation
- Version history (so you can see what was quoted vs. what was signed)

---

### MODULE L-Q: REMAINING MODULES (Summary)

**Vendors (M) — REBUILD FROM SCRATCH:**
- Real vendor records from data import (Vantaca vendor data)
- Search + filter by type, territory, community, performance rating
- COI tracking with expiry alerts and automated renewal outreach
- Work order history, contact history, documents, performance metrics
- No placeholder data

**Global Search (N):**
- Fixed top bar, always visible, keyboard shortcut (Cmd+K)
- Searches: homeowners, units, communities, tasks, approvals, emails, vendors, contracts, board members, documents, CRM records, employees
- Results are permission-trimmed (user only sees what they can access)
- Quick actions from search results (e.g., create action item, send message)
- Recent searches, saved searches

**Payroll / Workforce (O) — Phase 4:**
- Phase 1-3: workforce reporting (headcount, roles, office assignment)
- Phase 4: time tracking and basic payroll reporting
- Long-term: Paylocity replacement — recommend deferring until Phase 4 due to compliance risk
- On-site staff time tracking: simpler, lower-risk starting point

**Maps (P) — rename + expand:**
- Rename "GPS Tracking" to "Maps"
- Filters: office, portfolio, manager, vendor type
- CRM overlay: show which communities each office manages, prospect locations
- Staff field verification: show on-site staff at their assigned location during inspection
- Privacy controls: staff location only active during work hours, opt-in, visible to managers only

**UI/UX/Navigation (Q):**
- Empire Management Group branding: colors, logo, typography
- Light and dark mode (system default + manual toggle)
- Fix all broken/wired-to-nothing tabs before any new features
- Global search fixed to top bar
- Inbox promoted to position 2 in nav
- Action-oriented layout: calls-to-action surface prominently everywhere

---

## 6. CROSS-MODULE DATA MODEL

### 6.1 Core Entity Relationships

```
tenants
  └── offices
  └── users (user_profiles: role, office, portfolio)
  └── associations
        └── properties
        └── contacts (homeowners, board members)
        └── occupancies (contact ↔ property link)
        └── accounts (chart of accounts)
        └── journal_entries
        └── charges (assessments, fees)
        └── violations
        └── work_orders
        └── arc_submissions
        └── documents
        └── meetings
        └── amenities
        └── contracts
        └── contract_deliverables
  └── vendors
        └── vendor_contacts
        └── vendor_cois
        └── vendor_reviews
  └── action_items
  └── approvals
  └── inbox_messages
  └── call_records
  └── leads (CRM)
  └── deals (CRM)
  └── audit_log
```

### 6.2 Universal Link Pattern

Every record in the system that can be linked to another record uses a polymorphic reference:

```sql
linked_entity_type VARCHAR,  -- 'homeowner' | 'violation' | 'work_order' | etc.
linked_entity_id   UUID
```

This is used by: action items, approvals, inbox messages, call records, calendar events, documents, comments, audit logs.

### 6.3 Audit Log Schema

```typescript
AuditLog {
  id: uuid
  tenant_id: uuid
  actor_id: uuid  // who performed action
  delegated_by_id: uuid?  // if acting on behalf of someone
  action: string  // 'created' | 'updated' | 'deleted' | 'approved' | etc.
  entity_type: string
  entity_id: uuid
  old_value: jsonb?
  new_value: jsonb?
  ip_address: string
  user_agent: string
  session_id: string
  created_at: timestamptz
}
```

---

## 7. WORKFLOW ENGINE / SLA / ESCALATION DESIGN

### 7.1 Architecture

The workflow engine is a **state machine service** that governs state transitions for all stateful entities: approvals, action items, violations, work orders, ARC submissions, and collections.

```typescript
WorkflowDefinition {
  id: string  // e.g., 'arc_approval_standard'
  name: string
  entity_type: string
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  sla_rules: SLARuleSet
  escalation_rules: EscalationRuleSet
  notification_rules: NotificationRuleSet
}

WorkflowState {
  name: string
  label: string
  is_terminal: bool
  allowed_roles: Role[]  // who can act on this state
}

WorkflowTransition {
  from_state: string
  to_state: string
  action: string  // 'approve' | 'deny' | 'return' | 'escalate'
  required_role: Role?
  condition: jsonb?  // conditional logic
  side_effects: SideEffect[]  // notifications, action item creation, etc.
}

SLARule {
  state: string
  max_hours: int
  warning_at_percent: number  // e.g., 0.75 = warn at 75% of time used
  on_breach: 'escalate' | 'auto_transition' | 'notify'
  escalate_to_role: Role?
}
```

### 7.2 SLA Configuration (Default Values)

| Entity Type | State | SLA |
|-------------|-------|-----|
| ARC Request | Under Review | 30 days |
| Work Order | Open | 3 days (emergency: 4 hours) |
| Approval (financial) | Pending | 2 business days |
| Approval (ARC) | Pending | 30 days |
| Inbox message | Unresponded | 24 hours (configurable) |
| Violation notice | Issued | 14 days grace |
| Action item | Any | Per due_date |
| Call center | In queue | 60 seconds |

### 7.3 Escalation Rules (Default)

- **Level 1:** SLA at 75% → Notification to assigned user
- **Level 2:** SLA at 100% → Notification to assigned user + supervisor
- **Level 3:** SLA at 125% → Auto-escalate to supervisor, flag on dashboard
- **Level 4:** SLA at 150% → Escalate to director, appear in executive dashboard exception report

---

## 8. DASHBOARD AND ROLE-BASED UX DESIGN

### 8.1 Layout System

```
┌────────────────────────────────────────────────────────────┐
│  TOP BAR: [Logo] [Global Search ________] [🔔] [👤]       │
├──────────┬─────────────────────────────────────────────────┤
│          │  PAGE HEADER + BREADCRUMB                       │
│  SIDEBAR │  ─────────────────────────────────────────────  │
│  (fixed, │  CONTENT AREA                                   │
│  role-   │  ┌──────────────┐  ┌──────────────────────────┐ │
│  filtered│  │ PRIORITY     │  │ SECONDARY CONTENT        │ │
│          │  │ WIDGETS      │  │ (data tables, charts)    │ │
│          │  │ (CTA cards)  │  │                          │ │
│          │  └──────────────┘  └──────────────────────────┘ │
└──────────┴─────────────────────────────────────────────────┘
```

### 8.2 Design System Requirements

- **Brand:** Empire Management Group logo, colors, typography
- **Theme:** Light default, dark mode toggle (persists per user preference)
- **Font:** Inter (current) or custom — confirm with Empire brand guidelines
- **Color system:** Define semantic tokens: brand-primary, brand-secondary, surface, muted, destructive, warning, success
- **Component library:** shadcn/ui (keep existing) + custom Empire components
- **Motion:** Subtle transitions only — this is operational tooling, not a marketing site

### 8.3 Mobile Responsiveness

- All dashboards must work on tablet (field managers use iPads)
- Inspection and work order completion must work on mobile
- Homeowner portal must be mobile-first
- Internal staff tools can be desktop-primary with responsive fallback

---

## 9. AI / AUTOMATION LAYER

### 9.1 AI Use Cases by Module

| Module | AI Capability | Model | Context Injected |
|--------|--------------|-------|------------------|
| Inbox | Draft email response | Claude | Email thread + community docs + templates |
| Inbox | Categorize & prioritize | Claude | Email content |
| Inbox | Suggested responses | Claude | Email + governing docs |
| Violations | Generate violation notice | Claude | Violation type + CC&Rs + prior notices |
| Work Orders | Categorize incoming requests | Claude | Request text + community asset list |
| Analytics | Surface anomalies | Claude | KPI deviations |
| ARC | Evaluate against guidelines | Claude | Submission + architectural guidelines |
| COI Agent | Validate certificate | Claude | COI document + contract requirements |
| Documents | Summarize governing docs | Claude | Document content |
| Call Center | Disposition suggestions | Claude | Call notes |
| Collections | Draft demand letters | Claude | Account history + policy |

### 9.2 AI Service Architecture

```typescript
AIRequest {
  feature: string  // 'inbox_draft' | 'violation_notice' | etc.
  prompt: string
  context: AIContext[]  // injected documents/records
  user_id: uuid  // for audit log
  community_id: uuid?
}

AIContext {
  type: 'document' | 'email' | 'record' | 'template'
  id: string
  content: string
  relevance_score: number
}

AIResponse {
  content: string
  model: string
  tokens_used: int
  latency_ms: int
  cached: bool
}
```

All AI requests and responses are logged to `ai_request_log` with full context for audit and cost tracking.

### 9.3 Model Recommendation

- **Claude Sonnet 4.6** — Primary model for all drafting and analysis
- **Claude Haiku 4.5** — Classification, categorization, quick routing tasks
- **Azure OpenAI** — If Microsoft ecosystem compliance requires (Azure data residency)

---

## 10. INTEGRATIONS ARCHITECTURE

### 10.1 Integration Adapter Pattern

Each integration follows the same interface:

```typescript
interface IntegrationAdapter {
  provider: string
  authenticate(): Promise<void>
  pull(entityType: string, since?: Date): Promise<Record[]>
  push(entityType: string, records: Record[]): Promise<SyncResult>
  onWebhook(payload: unknown): Promise<void>
  getSyncStatus(): Promise<SyncStatus>
}
```

### 10.2 Integration Registry

| Integration | Direction | Frequency | Entities | Status |
|-------------|-----------|-----------|----------|--------|
| Microsoft 365 Graph API | Pull | Real-time (webhook) | Emails, calendar, identity | Build |
| Azure Entra ID | Pull | On-login | User identity, SSO | Build |
| Vantaca API | Pull → Import | One-time + delta | Communities, owners, violations, AR | Build |
| QuickBooks Online | Pull → Import | One-time reference | Chart of accounts, P&L reference | Done (import only) |
| Plaid | Pull | Daily | Bank transactions | Built |
| Stripe | Push/Pull | On-demand | Payments, subscriptions | Built |
| Twilio | Push | On-demand | SMS notifications | Built |
| Resend | Push | On-demand | Email notifications | Built |
| Luware Nimbus | Pull | Hourly | Call records, queue stats | Build |
| HubSpot | Pull → Import | One-time + webhook | Deals, contacts, companies | Build |
| Visitt.io | None | — | Feature parity only | N/A |

### 10.3 Microsoft 365 Integration Detail

```
Scopes required:
  Mail.Read, Mail.Send, Mail.ReadWrite (for inbox sync)
  Calendars.ReadWrite (for calendar integration)
  User.Read (for identity)
  Team.ReadBasic.All (if using Teams channels)

Authentication: OAuth 2.0 PKCE per user,
  OR application-level service account per shared mailbox

Webhooks: Microsoft Graph change notifications for new mail events
  POST /subscriptions → notificationUrl: /api/webhooks/msgraph
```

---

## 11. REPORTING AND ANALYTICS ARCHITECTURE

### 11.1 Report Categories

**Operational Reports:**
- Open Work Orders by Status, Community, Assignee
- Violation Activity (new, resolved, overdue) by Period
- Action Item Completion Rate by Manager
- Contractual Deliverable Compliance by Community

**Financial Reports:**
- Balance Sheet by Association
- Income Statement (P&L) by Association
- AR Aging Summary (30/60/90/120+)
- Budget vs. Actual Variance
- Cash Flow Projection
- Delinquency Rate Trend

**Management Reports:**
- Manager Performance Dashboard
- Community Health Score
- Portfolio Summary (director/executive)

**Call Center Reports:**
- Daily/Weekly Call Volume by Queue
- Agent Performance Metrics
- Abandonment Rate Trend
- Issue Category Distribution

### 11.2 Delivery Mechanisms

- **Interactive:** In-app, real-time
- **Scheduled:** Email delivery (daily/weekly/monthly, configurable per user)
- **Export:** PDF (print-optimized), Excel, CSV
- **API:** `/api/reports/[type]` for integration with other systems

---

## 12. SEARCH ARCHITECTURE

### 12.1 Search Service Design

**Recommended approach:** Supabase full-text search (immediate) → Azure AI Search (scale path)

**Immediate implementation (Supabase):**
```sql
-- Search index on each major entity
CREATE INDEX idx_contacts_search ON contacts
  USING GIN(to_tsvector('english', first_name || ' ' || last_name || ' ' || coalesce(email,'')));

CREATE INDEX idx_communities_search ON associations
  USING GIN(to_tsvector('english', name || ' ' || coalesce(nickname,'') || ' ' || coalesce(city,'')));
```

**Search API:**
```typescript
// POST /api/search
{
  query: string,
  domains: SearchDomain[],  // which entity types to search
  limit: number,
  filters: Record<string, unknown>  // community_id, date range, etc.
}

// Response
{
  results: {
    domain: string,
    items: SearchResult[],
    total: number
  }[],
  query_time_ms: number
}
```

### 12.2 Permission Trimming

Every search result is filtered by the calling user's permission scope before returning. The search backend never returns records the user is not authorized to see.

### 12.3 Quick Actions

From any search result, the user can trigger contextual quick actions:
- Homeowner: View Record, Send Message, Create Action Item, View Balance
- Community: Open Dashboard, View Violations, View Financials
- Work Order: View, Update Status, Assign
- Vendor: View Record, Create Action Item, Check COI Status

---

## 13. DATA IMPORT / MIGRATION ARCHITECTURE

### 13.1 Vantaca Migration (Immediate Priority)

**Source data available in `~/.openclaw/data/`:**
- `vantaca_communities.json` — 318 communities
- `vantaca_violations.json` — 8,730 violations
- `vantaca_ar.json` — 4,217 AR aging records
- `vantaca_owners.json` — 3 records (partial pull — full export needed)
- `vantacaiq_action_items.json` — Action items
- `vantacaiq_collections.json` — Collections data

**Migration Script (to build):** `scripts/migrate-vantaca.ts`

```typescript
// Migration sequence
1. migrate_communities()      // associations + external_id mapping
2. migrate_owners()           // contacts + external_id mapping
3. migrate_properties()       // properties linked to associations
4. migrate_violations()       // violations + violation_history
5. migrate_ar_aging()         // ar_aging_snapshots
6. migrate_action_items()     // action_items from VantacaIQ
```

**Key mapping rules for violations (Vantaca columns are shifted):**
- `follow_up` → violation type
- `due_date` → current step name
- `account` → association name
- Column mapping must be verified against full data export

### 13.2 HubSpot Migration (Immediate Priority)

**Source:** `~/.openclaw/data/hubspot_deals.json` (77 deals)
**Target:** `leads` + `deals` tables in Vera

Already partially built in `src/lib/services/crm/lead-import.ts` — needs to be triggered via UI.

### 13.3 Staging Table Architecture

All imports go through staging tables before promotion:

```sql
-- Pattern for every entity
CREATE TABLE staging_{entity} (
  id UUID DEFAULT gen_random_uuid(),
  import_batch_id UUID,
  tenant_id UUID,
  raw_data JSONB,
  mapped_data JSONB,
  validation_status TEXT,  -- 'pending' | 'valid' | 'error' | 'skipped'
  validation_errors JSONB,
  imported_at TIMESTAMPTZ,
  promoted_at TIMESTAMPTZ,
  rollback_at TIMESTAMPTZ
);
```

---

## 14. SECURITY / COMPLIANCE / AUDIT REQUIREMENTS

### 14.1 Authentication

- Internal users: Azure Entra ID SSO (SAML 2.0 / OIDC)
- External users (board, homeowners, vendors): Email/password + optional OAuth
- MFA required for: all internal users, board members accessing financials
- Session timeout: 8 hours idle for internal, 2 hours for external

### 14.2 Data Security

- All PII encrypted at rest (Supabase / Azure PostgreSQL transparent encryption)
- All API calls over HTTPS/TLS 1.3
- Supabase RLS policies enforce tenant isolation at the database level
- No cross-tenant data leakage possible via API (tenant_id enforced on every query)
- File uploads scanned for malware before storage
- Signed URLs for document access (expiry: 15 minutes)

### 14.3 Compliance Requirements

- **FERPA/HIPAA:** Not applicable (HOA data, not health/education)
- **Florida statutes (Chapter 720/718):** HOA records must be available to homeowners; Vera must support document access requests
- **Data retention:** Financial records: 7 years minimum; communications: 3 years; audit logs: permanent
- **GDPR/CCPA:** Florida HOAs may have California members; implement data deletion requests

### 14.4 Audit Requirements

Every action that modifies data must generate an audit log entry. Audit logs are:
- Immutable (append-only)
- Indexed for query by entity, actor, date range
- Exportable (compliance reporting)
- Retained permanently

---

## 15. SUGGESTED TECHNICAL STACK ON AZURE

### 15.1 Immediate Stack (Currently Built — Keep)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 15 (App Router) | Keep — 250 pages built |
| Styling | Tailwind v4 + shadcn/ui | Keep |
| Database | Supabase (PostgreSQL) | Keep for now |
| Auth | Supabase Auth | Extend with Azure Entra ID |
| File Storage | Supabase Storage | Migrate to Azure Blob Storage |
| Email | Resend | Keep |
| SMS | Twilio | Keep |
| Payments | Stripe | Keep |
| AI | Claude API (Anthropic) | Keep |

### 15.2 Azure Extensions (Add)

| Capability | Azure Service | Priority |
|------------|--------------|----------|
| Internal SSO | Azure Entra ID (B2B) | High |
| Document storage (scale) | Azure Blob Storage | Medium |
| Search (scale) | Azure AI Search | Medium |
| AI (compliance) | Azure OpenAI | Low (fallback) |
| Monitoring | Azure Application Insights | Medium |
| Email (scale) | Azure Communication Services | Low |
| CDN | Azure CDN | Low |

### 15.3 Migration Path (Supabase → Azure PostgreSQL)

Supabase is hosted PostgreSQL. When/if Azure compliance requires on-Azure hosting:
1. Export Supabase schema and data
2. Provision Azure Database for PostgreSQL Flexible Server
3. Migrate — minimal code changes (same connection string pattern)
4. Replace Supabase Auth with Azure Entra ID + custom auth layer

**Recommendation:** Do not migrate until Supabase presents a compliance or performance blocker. Supabase is fine for current scale (255 communities, 30K+ owners).

---

## 16. DELIVERY ROADMAP BY PHASE

### Phase 0: Architecture/Foundation (Weeks 1-3)

**Goal:** Solid foundation that all other phases build on.

- [ ] Azure Entra ID SSO integration for internal users
- [ ] Unified permission service (role × portfolio × community × entity)
- [ ] Workflow engine core (state machine, SLA timers)
- [ ] Notification service (in-app + email + SMS unified)
- [ ] Audit log service (append-only, all modules hook into it)
- [ ] Global search shell (Cmd+K, Supabase FTS, permission trimming)
- [ ] Empire branding + light/dark mode
- [ ] Navigation redesign (inbox to position 2, global search top bar)
- [ ] Fix all broken/non-functional stubs from current codebase
- [ ] Vantaca data migration (communities + violations + AR)

### Phase 1: Critical Operations (Weeks 4-8)

**Goal:** Replace daily-driver tools — what staff uses every single day.

- [ ] Approvals engine (rebuild from scratch)
- [ ] Action items engine (rebuild from scratch)
- [ ] Inbox with Microsoft 365 integration
- [ ] Contractual deliverables module
- [ ] Manager/Director/Executive dashboards (role-specific)
- [ ] Analytics rebuild (operational KPIs)
- [ ] Vendor module rebuild (real data, COI tracking)
- [ ] HubSpot CRM import + CRM wiring
- [ ] Call center module (Luware Nimbus integration)
- [ ] Data import tooling (staging, validation, rollback)

### Phase 2: Communication & Workflow Intelligence (Weeks 9-14)

**Goal:** AI-powered efficiency and cross-module workflow.

- [ ] AI inbox drafting (context-injected responses)
- [ ] AI violation notice generation
- [ ] AI work order categorization
- [ ] COI compliance agent
- [ ] SLA escalation automation
- [ ] Cross-module event bus (inbox → action item, approval → notification, etc.)
- [ ] Scheduled report email delivery
- [ ] Board portal completion (elections, voting, resolutions)
- [ ] Committee member portal
- [ ] Calendar full integration (Graph API sync, deliverables, inspections)

### Phase 3: Analytics & Optimization (Weeks 15-20)

**Goal:** Management visibility and operational optimization.

- [ ] Portfolio-level analytics (director/executive views)
- [ ] Benchmarking (community vs. portfolio average)
- [ ] Predictive analytics (delinquency risk, asset failure)
- [ ] Maps module (portfolio geography, staff verification, CRM overlay)
- [ ] Advanced search (Azure AI Search upgrade)
- [ ] Financial reports completion (all report types)
- [ ] Collections automation (demand letters, escalation ladder)
- [ ] Reserve study integration
- [ ] Performance scorecards (manager, community, vendor)

### Phase 4: Advanced Modules (Weeks 21+)

**Goal:** Complete platform independence from third-party tools.

- [ ] Payroll/workforce reporting (Paylocity replacement start)
- [ ] Time tracking for on-site staff
- [ ] Management fee invoicing (billing out to communities)
- [ ] Advanced CRM (automated outreach, nurture sequences)
- [ ] Mobile apps (React Native — iOS + Android)
- [ ] Visitt.io feature parity complete (CMMS, offline inspections)
- [ ] Azure Blob Storage migration (from Supabase Storage)
- [ ] Document e-signing integration
- [ ] Public community website builder

---

## 17. PRIORITY ORDER

### Must Build First (Unlocks Everything Else)
1. **Permission service** — Nothing works correctly without this
2. **Workflow engine** — Approvals, action items, violations all depend on it
3. **Audit log service** — Required for compliance; should be baked in from day one
4. **Notification service** — Every workflow generates notifications
5. **Vantaca data migration** — Real data in the system makes everything testable

### Build Second (Core Operations)
6. **Approvals engine**
7. **Action items engine**
8. **Inbox + Microsoft 365**
9. **Role-specific dashboards**
10. **Vendor rebuild**

### Build Third (Intelligence Layer)
11. **Analytics rebuild**
12. **AI inbox drafting**
13. **Call center module**
14. **Global search**

### Build Later (After Core is Stable)
15. **Mobile apps**
16. **Payroll**
17. **Advanced maps**
18. **Community website builder**

---

## 18. ACCEPTANCE CRITERIA BY MODULE

### Approvals
- [ ] ARC submission triggers multi-step chain: manager → board → vote
- [ ] Invoice >$5K requires director approval
- [ ] Overdue approval auto-escalates to supervisor
- [ ] Delegation works and appears correctly in audit log
- [ ] Auto-approve fires for invoices <$500 from approved vendors
- [ ] Approval history shows all state changes with actor and timestamp

### Action Items
- [ ] Action item created from inbox with one click, pre-populated with email context
- [ ] Recurring contractual deliverables generate on schedule
- [ ] Overdue items escalate to supervisor automatically
- [ ] Sub-tasks show parent completion %
- [ ] Team routing: item assigned to team queue, first-accept model works

### Inbox
- [ ] Microsoft 365 mailbox connected via OAuth in < 5 clicks
- [ ] Email from known homeowner shows their full record in side panel
- [ ] AI-drafted response grounded in community documents generates in < 5 seconds
- [ ] Action item creation from email pre-populates with subject, sender, linked record
- [ ] Team inbox routing works: forward to team, member picks it up

### Analytics
- [ ] Manager views only their assigned communities
- [ ] Director sees portfolio-wide rollup
- [ ] All KPIs drill down to underlying records
- [ ] Delinquency rate alert fires when threshold exceeded
- [ ] Scheduled email report delivers on schedule with correct data

### Vendor Module
- [ ] Zero placeholder records — all records from real data
- [ ] COI expiry triggers alert 60 days before expiration
- [ ] Vendor linked to communities and work orders
- [ ] Performance score calculated from work order history

### Search
- [ ] Global search accessible from anywhere via Cmd+K
- [ ] Results scoped to user's permission set (manager can't search other portfolios)
- [ ] Quick action "Create Action Item" from homeowner search result works
- [ ] Search latency < 300ms for < 10 result items

---

## 19. RISKS / DEPENDENCIES / OPEN QUESTIONS

### Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Vantaca violations data has shifted columns | High | Data mapping validated before migration; dry-run with 10 records first |
| Microsoft 365 OAuth integration complexity | Medium | Use MSAL.js library; test with Empire's M365 tenant early |
| Vantaca owners data only has 3 records in connector | High | Full owner export needed from Vantaca directly |
| Payroll replacement scope too large for Phase 4 | Medium | Scope to workforce reporting + time tracking first; payroll processing later |
| QBO data not needed per-community | Resolved | QBO = master company reference only; Vera owns community accounting |
| Luware Nimbus API access | Medium | Confirm API availability and rate limits with Luware |

### Open Questions

1. **Azure Entra ID tenant:** Does Empire have an existing Azure AD / Entra ID tenant for Microsoft 365? This determines SSO implementation path.
2. **Vantaca full owner export:** The connector only pulled 3 owner records. Is a full owner data export available (CSV from Vantaca admin)?
3. **Empire brand assets:** Logo files, color palette, typography — needed for Phase 0 branding work.
4. **Luware API:** Does the Luware Nimbus contract include API access for reporting?
5. **Community types for quote calculator:** Confirm "marina" and "golf" are active community types Empire manages.
6. **Committee types:** What specific committee types need portal access? (ARC, Budget, Social, Landscape, Safety, Rules, other?)
7. **Document retention policy:** What is Empire's policy on email/communication retention?
8. **On-site staff:** How many on-site staff members need time tracking? Are they in Paylocity today?

---

## 20. RECOMMENDED NEXT ACTIONS FOR ENGINEERING

**This week (immediate):**
1. Fix login error (associations `unstable_cache` — already done in this session)
2. Run Vantaca communities migration script (communities data is clean — 318 records)
3. Run HubSpot deals import (77 deals, importer is built)
4. Confirm Azure Entra ID tenant with JR — needed for Phase 0 SSO

**Next two weeks:**
5. Build workflow engine core (state machine, SLA timers)
6. Build approval engine (schema + API routes + basic UI)
7. Build action items engine (schema + API routes + basic UI)
8. Rebuild vendor module with real data
9. Begin Microsoft 365 Graph API integration (inbox sync)

**Architecture decisions to make now:**
- Confirm Azure as the long-term infrastructure direction and begin Entra ID setup
- Decide whether to keep Supabase long-term or plan Azure PostgreSQL migration
- Define Empire brand tokens (colors, logo) so all UI work aligns from the start

---

## 21. STRUCTURED BACKLOG (EPICS, FEATURES, USER STORIES)

```json
{
  "epics": [
    {
      "id": "EP-001",
      "title": "Platform Foundation",
      "phase": 0,
      "features": [
        {
          "id": "F-001",
          "title": "Azure Entra ID SSO",
          "stories": [
            "As an internal Empire employee, I can log in with my Empire Microsoft 365 account",
            "As a new hire, my account is automatically provisioned from Azure AD",
            "As IT, I can revoke access immediately when an employee leaves"
          ]
        },
        {
          "id": "F-002",
          "title": "Permission Service",
          "stories": [
            "As a manager, I can only see communities assigned to me",
            "As a director, I can see all communities in my portfolio",
            "As a homeowner, I can only see my own unit's data"
          ]
        },
        {
          "id": "F-003",
          "title": "Workflow Engine",
          "stories": [
            "As a developer, I can define a state machine for any entity type",
            "As a manager, I receive an alert when an approval SLA is at 75%",
            "As a director, overdue approvals auto-escalate to me"
          ]
        },
        {
          "id": "F-004",
          "title": "Empire Branding + Light/Dark Mode",
          "stories": [
            "As a user, I see Empire Management Group branding throughout",
            "As a user, I can switch between light and dark mode",
            "As a user, my mode preference is saved across sessions"
          ]
        },
        {
          "id": "F-005",
          "title": "Global Search",
          "stories": [
            "As any user, I can press Cmd+K to open global search from anywhere",
            "As a manager, search results only show my assigned communities",
            "As a user, I can create an action item directly from a search result"
          ]
        }
      ]
    },
    {
      "id": "EP-002",
      "title": "Approvals Engine",
      "phase": 1,
      "features": [
        {
          "id": "F-010",
          "title": "Approval Creation and Routing",
          "stories": [
            "As a manager, I can create an approval request for any entity",
            "As the system, I auto-route approvals based on type and amount",
            "As an approver, I receive a notification when an item requires my action"
          ]
        },
        {
          "id": "F-011",
          "title": "Multi-Step Approval Chains",
          "stories": [
            "As an admin, I can define a multi-step approval chain for ARC requests",
            "As a board chair, I see ARC items routed to me after manager review",
            "As the system, I track which step is active and who must act"
          ]
        },
        {
          "id": "F-012",
          "title": "Auto-Approval Rules",
          "stories": [
            "As an admin, I can configure auto-approve for invoices under $500",
            "As an admin, I can configure auto-deny for expired ARC requests",
            "As a manager, I can see when auto-approval fired and why"
          ]
        }
      ]
    },
    {
      "id": "EP-003",
      "title": "Action Items Engine",
      "phase": 1,
      "features": [
        {
          "id": "F-020",
          "title": "Action Item CRUD + Assignment",
          "stories": [
            "As any user, I can create an action item and assign it to myself or a colleague",
            "As a manager, I can assign action items to my team",
            "As a user, I see all my open action items on my dashboard"
          ]
        },
        {
          "id": "F-021",
          "title": "Contractual Deliverables",
          "stories": [
            "As an admin, I can define recurring deliverables from a management contract",
            "As a manager, I see my deliverable compliance rate on my dashboard",
            "As a director, I see all managers' deliverable compliance rates"
          ]
        }
      ]
    },
    {
      "id": "EP-004",
      "title": "Inbox Module",
      "phase": 1,
      "features": [
        {
          "id": "F-030",
          "title": "Microsoft 365 Connection",
          "stories": [
            "As a CAM, I can connect my Empire Microsoft 365 mailbox to Vera",
            "As a team lead, I can connect a shared team mailbox",
            "As the system, I sync new emails via Graph API webhooks in real time"
          ]
        },
        {
          "id": "F-031",
          "title": "Contextual Record Linking",
          "stories": [
            "As a CAM, when I open an email from a homeowner, I see their full record",
            "As a user, I can link any email to a homeowner, work order, or approval",
            "As a user, I can create an action item from any email with one click"
          ]
        },
        {
          "id": "F-032",
          "title": "AI Draft Response",
          "stories": [
            "As a CAM, I can click 'Draft Response' and receive an AI-generated reply",
            "As a user, the AI draft uses my community's governing documents as context",
            "As a user, I can edit the draft before sending"
          ]
        }
      ]
    },
    {
      "id": "EP-005",
      "title": "Analytics Rebuild",
      "phase": 1,
      "features": [
        {
          "id": "F-040",
          "title": "Role-Aware KPI Dashboards",
          "stories": [
            "As a manager, I see operational KPIs for my assigned communities",
            "As a director, I see portfolio rollup KPIs",
            "As an executive, I see company-wide KPIs"
          ]
        },
        {
          "id": "F-041",
          "title": "Scheduled Email Reports",
          "stories": [
            "As a director, I receive a weekly portfolio summary email every Monday",
            "As a manager, I receive daily delinquency alerts when threshold exceeded",
            "As any user, I can configure my own report schedule"
          ]
        }
      ]
    },
    {
      "id": "EP-006",
      "title": "Vendor Module Rebuild",
      "phase": 1,
      "features": [
        {
          "id": "F-050",
          "title": "Vendor Directory with Real Data",
          "stories": [
            "As a manager, I can search vendors by type, territory, and community",
            "As a manager, I see vendor performance scores based on work order history",
            "As accounting, I see all vendors with active COIs"
          ]
        }
      ]
    },
    {
      "id": "EP-007",
      "title": "Call Center Module",
      "phase": 1,
      "features": [
        {
          "id": "F-060",
          "title": "Call Activity Reporting",
          "stories": [
            "As a call center rep, I can log call outcomes in Vera",
            "As a manager, I see call volume and SLA stats for my queue",
            "As a director, I see call center performance across all offices"
          ]
        }
      ]
    },
    {
      "id": "EP-008",
      "title": "Data Migration",
      "phase": 0,
      "features": [
        {
          "id": "F-070",
          "title": "Vantaca Migration",
          "stories": [
            "As an admin, I can run the Vantaca migration script for communities",
            "As an admin, I can see a migration progress report",
            "As an admin, I can rollback a migration batch if errors are found"
          ]
        },
        {
          "id": "F-071",
          "title": "HubSpot CRM Import",
          "stories": [
            "As an admin, I can import all 77 HubSpot deals into Vera CRM",
            "As a sales rep, I see all deals in Vera's pipeline view"
          ]
        }
      ]
    }
  ]
}
```

---

## 22. BUILD ORDER FOR CLAUDE CODE

This is the exact implementation sequence for a coding agent. Each item is a discrete, shippable unit that does not depend on anything below it in the list (except where noted).

### TIER 0: INFRASTRUCTURE (Do First — Everything Depends On This)

```
0.1  Database: Add missing tables for workflow engine
     → workflow_definitions, workflow_states, workflow_transitions
     → sla_rules, escalation_rules
     → audit_log (consolidated, replaces scattered audit tables)
     → notification_queue
     → search_index_config

0.2  Permission service: src/lib/services/permissions.ts
     → evaluatePermission(userId, action, entityType, entityId)
     → getUserScope(userId) → returns { portfolioIds, communityIds, entityScope }
     → Middleware: inject permissions into every API route

0.3  Workflow engine: src/lib/services/workflow-engine.ts
     → WorkflowEngine class: transition(), getAvailableActions(), checkSLA()
     → SLA timer: background job checks sla_deadlines table hourly
     → Escalation: fires notification + changes assignee on SLA breach

0.4  Audit log service: src/lib/services/audit.ts
     → log(actor, action, entity, oldVal, newVal) — called from every mutation
     → Middleware: auto-log all POST/PUT/DELETE API routes

0.5  Notification service: src/lib/services/notifications/unified.ts
     → Unified send() function: routes to in-app, email (Resend), SMS (Twilio)
     → Triggered by workflow engine events
     → In-app notifications: notifications table + real-time Supabase subscription

0.6  Empire branding: src/lib/design/empire-tokens.ts
     → Define CSS variables for Empire brand colors
     → Light and dark mode token sets
     → Apply to globals.css and layout.tsx
```

### TIER 1: SHARED UI INFRASTRUCTURE

```
1.1  Navigation redesign
     → Move Inbox to position 2 in sidebar
     → Global search bar (Cmd+K) in top bar
     → Notification bell wired to unified notification service
     → Light/dark mode toggle in user menu

1.2  Global search: src/app/api/search/route.ts + src/components/search/
     → Multi-entity Supabase FTS
     → Permission trimming
     → Quick actions panel
     → Keyboard navigation (Cmd+K open, arrow keys, enter)

1.3  Dashboard widget system: src/lib/widgets/registry.ts
     → Widget interface + registry
     → Role-based widget assignment
     → Dashboard layout engine (grid, drag-to-rearrange)

1.4  Role-specific dashboards (use widget registry)
     → Executive dashboard
     → Director dashboard
     → Manager/CAM dashboard
     → Accounting dashboard
     → Board member dashboard
     → Homeowner dashboard (already partially built)
```

### TIER 2: APPROVALS ENGINE

```
2.1  Schema: supabase/migrations/083_approvals_engine.sql
     → approvals, approval_steps, approval_comments, approval_rules tables
     → RLS policies
     → Indexes

2.2  Workflow definitions: seed approval workflows
     → arc_approval_standard (3-step: manager → board chair → board vote)
     → invoice_approval_standard (2-step: manager → director if >$5K)
     → board_resolution (board member vote)

2.3  API routes: src/app/api/approvals/
     → GET /approvals (list, filtered by role/status)
     → POST /approvals (create)
     → PUT /approvals/[id]/transition (approve/deny/return/escalate)
     → POST /approvals/[id]/comment
     → PUT /approvals/[id]/delegate

2.4  UI: src/app/(dashboard)/approvals/
     → List view with status tabs and SLA indicators
     → Detail view with full context, comment thread, step chain
     → Action buttons: Approve, Deny, Return, Escalate, Comment, Forward
     → Dashboard widget: "Pending Approvals" card

2.5  Approval rules admin: settings page for configuring auto-approval thresholds
```

### TIER 3: ACTION ITEMS ENGINE

```
3.1  Schema: supabase/migrations/084_action_items_rebuild.sql
     → action_items table (full rebuild with all new fields)
     → action_item_comments, action_item_attachments
     → contractual_deliverables table
     → RLS policies

3.2  API routes: src/app/api/action-items/
     → CRUD + bulk assign + recurring generation
     → Contractual deliverable endpoints

3.3  UI: src/app/(dashboard)/action-items/
     → My items view (personal queue)
     → Team view (for managers/directors)
     → Contractual deliverables view
     → Dashboard widget: "My Action Items" + "Overdue" badge

3.4  Creation triggers
     → "Create Action Item" from: inbox, call log, approval, analytics, homeowner profile
     → Each trigger pre-populates relevant context
```

### TIER 4: INBOX MODULE

```
4.1  Microsoft 365 OAuth: src/lib/integrations/msgraph/auth.ts
     → MSAL.js integration
     → Token storage per user
     → Refresh token handling

4.2  Graph API sync: src/lib/integrations/msgraph/inbox-sync.ts
     → Webhook subscription to new mail events
     → Pull and store inbox_messages
     → Thread management

4.3  Schema: supabase/migrations/085_inbox.sql
     → inbox_messages, team_inboxes tables

4.4  API routes: src/app/api/inbox/
     → Message list, detail, link, create action item, draft response

4.5  AI draft: src/lib/services/ai/inbox-drafter.ts
     → Context injection: fetch community docs, prior threads, templates
     → Claude API call with system prompt
     → Response logging

4.6  UI: src/app/(dashboard)/inbox/
     → Split-pane: message list + detail + context panel
     → AI draft button
     → Link to record sidebar
     → Team inbox tabs
```

### TIER 5: CALL CENTER MODULE

```
5.1  Schema: supabase/migrations/086_call_center.sql
     → call_records, call_queues tables

5.2  Luware Nimbus adapter: src/lib/integrations/luware/sync.ts
     → Pull call records via Luware API
     → Hourly sync job

5.3  API routes: src/app/api/call-center/

5.4  UI: src/app/(dashboard)/call-center/
     → Live queue dashboard
     → Agent performance view
     → Post-call workflow (disposition + action item creation)
     → Historical reporting
```

### TIER 6: ANALYTICS REBUILD

```
6.1  Materialized views: supabase/migrations/087_analytics_views.sql
     → mv_operational_kpis, mv_financial_kpis, mv_action_item_kpis
     → mv_approval_kpis, mv_call_kpis, mv_sla_compliance

6.2  Analytics API: src/app/api/analytics/
     → Role-scoped KPI endpoints
     → Drill-down endpoints
     → Export endpoints

6.3  Scheduled reports: src/lib/services/reports/scheduler.ts
     → Cron-based report generation
     → Email delivery via Resend

6.4  UI: src/app/(dashboard)/analytics/ (full rebuild)
     → Role-aware dashboard
     → Drill-down tables
     → Date range selectors
     → Alert configuration
```

### TIER 7: DATA MIGRATIONS

```
7.1  Vantaca migration script: scripts/migrate-vantaca.ts
     → Communities (318 records) → associations
     → Violations (8,730 records, handle column shift) → violations
     → AR aging (4,217 records) → ar_aging_snapshots
     → Owners (need full export) → contacts

7.2  HubSpot import: trigger existing lead-import.ts for 77 deals
     → UI trigger in CRM section
     → Import result display

7.3  Staging tables: supabase/migrations/088_staging_tables.sql
     → staging_* tables for all entity types
     → Import batch tracking

7.4  Data import UI upgrade: src/app/(dashboard)/settings/data-import/
     → Add all missing entity types
     → Preview + validation step
     → Rollback functionality
```

### TIER 8: VENDOR MODULE REBUILD

```
8.1  Schema additions: supabase/migrations/089_vendors_rebuild.sql
     → Extend vendors table with missing fields
     → vendor_territories, vendor_community_links

8.2  Vendor data import: pull from Vantaca vendor data

8.3  UI: src/app/(dashboard)/vendors/ (rebuild)
     → Real search + filters (no placeholders)
     → Vendor detail with all tabs working
     → COI status + expiry alerts
     → Performance scores from work order history
```

### TIER 9: CRM COMPLETION

```
9.1  Community lifecycle states + transitions
9.2  Quote calculator: expanded community types + presentation generation
9.3  Contract preparation flow
9.4  Deal → onboarding handoff workflow
9.5  HubSpot sync (ongoing, not just import)
```

### TIER 10: MAPS + WORKFORCE + ADVANCED

```
10.1  Maps rename + filters + CRM overlay
10.2  Staff field verification (location + inspection)
10.3  Workforce reporting dashboard
10.4  Time tracking (on-site staff)
10.5  Mobile app (React Native — iOS + Android)
10.6  Paylocity replacement (Phase 4)
```

---

*End of Product Architecture Document v1.0*
*Next update: After Phase 0 completion — update with lessons learned and revised Phase 1 scope.*
