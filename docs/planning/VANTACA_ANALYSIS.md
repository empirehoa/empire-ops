# Vantaca Analysis - Complete Screens & Workflows

**Source:** Code analysis of vantaca_sync.py (browser automation)  
**Date:** March 7, 2026

---

## Login Screen

- **URL:** vantaca.net/Home
- **Fields:**
  - Company ID (e.g., "empire")
  - Username
  - Password
- **MFA:** Supported (browser automation handles it)

---

## Navigation System

Vantaca is a **Single Page Application (SPA)** using:
- JavaScript `SelectMenu()` calls for navigation
- Kendo UI grids for data display
- Pagination with page sizes up to 1000+

### Navigation Commands (from code)

| Command | Screen | Description |
|---------|--------|-------------|
| `SelectMenu('AssocList','Assoc')` | Communities | Association list |
| `SelectAction(2,0,0)` | Violations/Action Items | All action items grid |
| `SelectMenu('ARBillingView','System')` | AR Aging | Accounts receivable |
| `SelectMenu('HOListInfoView','Homeowner')` | Owners | Homeowner list |
| `SelectMenu('FinancialSummaryView','Assoc')` | Financial | Financial summary |
| `SelectMenu('CurrentStats','Graph')` | Stats | Current statistics |

---

## Screens Detail

### 1. Communities Screen

**Navigation:** `/Community`

**Data Fields:**
| Field | Description |
|-------|-------------|
| assoc_id | Internal ID |
| code | Community code |
| name | Full name |
| nickname | Short name |
| portfolios | Portfolio assignments |
| properties | # of units/properties |
| status | Active/inactive |
| model | HOA, COA, POA |
| county | County |
| city | City |
| state | State |

**Grid Features:**
- Kendo UI data grid
- Pagination (up to 1000 per page)
- Edit/Delete/Select actions

---

### 2. Violations / Action Items Screen

**Navigation:** `/Violations` (via SelectAction)

**Data Fields (dynamic - varies):**
- Action Item ID
- Community
- Unit
- Owner
- Rule/Type
- Description
- Status
- Date Reported
- Days Open
- Assigned To
- Priority

**Workflow:**
1. Create violation → Select community → Select unit → Choose rule → Add description
2. Assign to staff
3. Track status (Open → Pending → Resolved → Closed)
4. Escalate if unresolved

---

### 3. Work Orders Screen

**Navigation:** Same grid as violations, different filter

**Data Fields:**
- Work Order ID
- Category (Plumbing, Electrical, HVAC, Landscaping, etc.)
- Community
- Unit
- Description
- Status (Open, Assigned, In Progress, Completed)
- Vendor
- Priority
- Created Date
- Completed Date
- Estimated Cost
- Actual Cost

**Workflow:**
1. Create work order → Category → Description → Priority
2. Assign to vendor
3. Track progress
4. Mark complete → Record actual cost

---

### 4. AR Aging Screen

**Navigation:** `/Reports/ARAgingSummary`

**Data Fields:**
- Community
- Current (0-30 days)
- 31-60 days
- 61-90 days
- 91-120 days
- 120+ days
- Total due

**Workflow:**
1. View aging by community
2. Filter by date range
3. Drill down to individual owner balances
4. Send collection notices

---

### 5. Owners / Homeowners Screen

**Navigation:** `/Owners`

**Data Fields:**
- Owner ID
- Name
- Email
- Phone
- Address
- Community
- Unit
- Balance due
- Violation count
- Payment history

**Note:** 36,000+ owner records - large dataset!

---

### 6. Financial Summary Screen

**Navigation:** `/Reports/FinancialSummaryView`

**Data Fields:**
- Revenue
- Expenses
- Net Income
- Reserve Balance
- Budget vs Actual

---

### 7. Statistics / Dashboard

**Navigation:** `/Stats`

**Data Fields:**
- Total communities
- Total units
- Violation trends
- Work order metrics
- Collection rates

---

## Additional Screens (From Product Page)

| Screen | Description |
|--------|-------------|
| Board Packets | Board meeting documents |
| Budgets | Annual budget management |
| ARC | Architectural Review Committee |
| Assessments | Fee collection |
| Late Fees | Penalty automation |
| Security Deposits | Deposit tracking |
| Vendor Management | Vendor database |
| Work Order Templates | Reusable templates |
| Email Templates | Communication templates |
| Mass Communications | Bulk email/SMS |
| Owner Portal | Self-service for owners |
| Mobile App | iOS/Android |

---

## Vantaca UI Elements

### Grid System
- Kendo UI grids
- Column sorting
- Filtering
- Pagination (10, 25, 50, 100, 1000)
- Export options

### Forms
- Modal dialogs for create/edit
- Dropdown selects
- Date pickers
- File uploads

### Actions
- Edit (pencil icon)
- Delete (trash icon)
- Select (checkbox)
- Custom action buttons

---

## Integration Points

| Integration | Purpose |
|-------------|---------|
| Bank Feeds | Transaction import |
| Payment Processing | Online payments |
| Email | Notifications |
| API | Data export (limited) |

---

## What's Missing / Pain Points

| Issue | Impact |
|-------|--------|
| No public API | Can't integrate easily |
| Old UI (Kendo) | Not modern |
| Slow | Large datasets |
| Expensive | $2K+/month |
| No AI automation | Manual work |

---

## PropertyOS - What to Build

### Must Have (Match Vantaca)

| Module | Priority | Complexity |
|--------|----------|------------|
| Communities | P1 | Medium |
| Units | P1 | Medium |
| Owners | P1 | Medium |
| Violations | P1 | Medium |
| Work Orders | P1 | Medium |
| AR Aging | P1 | Easy |
| Invoicing | P1 | Medium |
| Payments | P1 | Medium |
| Chart of Accounts | P1 | Medium |
| General Ledger | P1 | Hard |

### Should Have

| Module | Priority |
|--------|----------|
| Vendors | P2 |
| Bills (AP) | P2 |
| Bank Reconciliation | P2 |
| Budgets | P2 |
| Reports (P&L, BS) | P2 |

### Nice to Have

| Module | Priority |
|--------|----------|
| Owner Portal | P3 |
| Board Portal | P3 |
| Mobile App | P3 |
| Mass Communications | P3 |
| ARC | P3 |

### Competitive Advantage

| Module | Priority |
|--------|----------|
| AI Invoice Processing | P2 |
| Smart Reconciliation | P2 |
| Chat Assistant | P3 |
| Predictive Maintenance | P3 |

---

*Document created: March 7, 2026*
