# Vera Platform — Automation Opportunities Analysis

**Date:** 2026-04-08
**Scope:** Empire Management Group — 255 communities, 28,391 doors, 63 employees, 9 offices

---

## Current Automation Inventory (What Already Exists)

| # | Automation | Endpoint | Status |
|---|-----------|----------|--------|
| 1 | Monthly assessment auto-post | `/api/automation/post-assessments` | LIVE — runs on billing_day per association |
| 2 | Late fee application (v1) | `/api/automation/apply-late-fees` | LIVE — flat/percentage/daily fee types |
| 3 | Late fee application (v2) | `/api/automation/late-fees` | LIVE — with GL journal entries |
| 4 | Collection escalation | `/api/automation/collection-escalation` | LIVE — creates collection_actions_v2 records |
| 5 | Payment plan processing | `/api/automation/payment-plans` | LIVE — installment charges, late marking, auto-default |
| 6 | Manager's report delivery | `/api/automation/deliver-managers-reports` | LIVE — PDF + email on schedule day |
| 7 | Recurring work order generation | `/api/automation/generate-recurring-work-orders` | LIVE — via recurring-wo-engine |
| 8 | Alert queue processing | `/api/automation/process-alerts` | LIVE — dequeue + escalate alerts |
| 9 | Run-all orchestrator | `/api/automation/run-all` | LIVE — runs #2, #5, #6 in parallel |
| 10 | Communications automation engine | `lib/services/communications/automation-engine.ts` | LIVE — trigger-based messaging (8 event types) |
| 11 | Workflow visual builder | `lib/workflows/templates.ts` | TEMPLATES ONLY — 10 pre-built but needs activation |
| 12 | Rules engine framework | `lib/automation/rules-engine.ts` | FRAMEWORK — WHEN/THEN rules, not wired to cron |

---

## Gap Analysis: 12 Automation Opportunities

### 1. VIOLATION LIFECYCLE AUTO-ESCALATION

**Status:** PARTIALLY BUILT — Manual escalation exists in `ViolationEngineService.escalateViolation()` but no cron job triggers it automatically.

**What manual process it replaces:**
A property manager must remember to check each violation's deadline, manually click "escalate" to move it from courtesy notice -> 1st notice -> 2nd notice -> hearing notice -> fine.

**Frequency:** ~50-100 violations/week across 255 communities = 5-10 escalation decisions/day.

**Trigger:** Nightly cron checks all violations where `due_date < today` and `status` is not resolved/closed.

**Actions:**
1. Query violations where response deadline has passed
2. Call `ViolationEngineService.escalateViolation()` to advance status
3. Auto-generate the next notice letter (already built in the engine)
4. Post to event_outbox for downstream comms
5. Create audit history record

**Time saved per occurrence:** 5-10 minutes (looking up, deciding, clicking through). At 50/week = 4-8 hours/week.

**Effort:** LOW — The engine exists. Need one new `/api/automation/escalate-violations/route.ts` (~100 lines) and a cron trigger.

**Code changes needed:**
- New file: `src/app/api/automation/escalate-violations/route.ts`
- Wire the FL_RESPONSE_DAYS deadlines from `violation-engine.ts` into the query
- Add to `run-all` orchestrator

---

### 2. INSURANCE COI EXPIRATION ALERTING

**Status:** FRAMEWORK EXISTS — `vendor-management.ts` has `COIAlertSummary` type and `checkCOIExpiry()` method. The insurance integration client at `lib/integrations/insurance/client.ts` is a stub ("TODO: Replace stub implementations"). No automated cron runs these checks.

**What manual process it replaces:**
Staff manually reviews vendor insurance certificates in spreadsheets, calls vendors for renewals. Expired COIs mean uninsured vendors on property = massive liability.

**Frequency:** With ~500+ vendors across 255 communities, COIs expire continuously. Estimate 20-30 expiring per week.

**Trigger:** Weekly cron (Monday 8 AM).

**Actions:**
1. Query `vendor_insurance_certificates` where `expiration_date` is within 30/60/90 days or already expired
2. Group by urgency tier (expired / 30-day / 60-day / 90-day)
3. Auto-send email to vendor requesting renewal
4. Auto-send email to property manager flagging the risk
5. If expired > 14 days: auto-suspend vendor (set `vendor.status = 'suspended'`)
6. Create action item for CAM

**Time saved per occurrence:** 15-20 minutes per vendor follow-up. At 25/week = 6-8 hours/week.

**Effort:** MEDIUM — Service layer exists. Need cron route + email templates + vendor status update logic.

---

### 3. BOARD MEETING PACKET AUTO-GENERATION (14 Days Before)

**Status:** PARTIALLY BUILT — `MeetingPacketService` exists with `createPacket()` and `generatePDF()`. There is a manual generate endpoint at `/api/associations/[id]/meetings/[id]/generate-packet`. But NO cron job triggers it automatically 14 days before a meeting.

**What manual process it replaces:**
CAMs manually compile board packets from 5-7 sources (financials, violations summary, work order status, minutes, agenda, open action items) into a PDF. This takes 2-4 hours per community per month.

**Frequency:** 255 communities x ~1 board meeting/month = ~255 packets/month, ~60/week.

**Trigger:** Daily cron checks calendar_events where `event_date - 14 days = today` and `event_type = 'board_meeting'`.

**Actions:**
1. Find all upcoming board meetings in 14 days
2. Auto-create meeting packet with standard sections (agenda, financials, violations, WO, minutes, action items)
3. Generate PDF using existing `MeetingPacketService.generatePDF()`
4. Email packet to configured board distribution list
5. Set packet status to 'distributed'

**Time saved per occurrence:** 2-4 hours per packet. At 60/week = 120-240 hours/month (2-4 FTEs worth of work).

**Effort:** MEDIUM — Service layer built. Need cron route + calendar query + auto-population of sections.

**Code changes needed:**
- New file: `src/app/api/automation/generate-meeting-packets/route.ts`
- Query `calendar_events` for meetings 14 days away
- Call `MeetingPacketService.createPacket()` with auto-populated sections
- Call `generatePDF()` and email via Resend

---

### 4. COMPLIANCE DEADLINE AUTO-GENERATION ON FISCAL YEAR START

**Status:** PARTIALLY BUILT — `statutory-engine.ts` has `generateDeadlines()` and full FL statute references (FS 718/719/720). The `/api/associations/[id]/compliance/statutory/generate` endpoint exists but requires manual triggering.

**What manual process it replaces:**
At fiscal year start, each community needs 8-12 statutory compliance deadlines created (annual meeting, budget adoption, financial report, reserve disclosure, DBPR filing, corporate annual report, tax return). Currently done manually by admin staff.

**Frequency:** 255 communities with different fiscal year ends. ~20/month rotate to new fiscal year.

**Trigger:** Monthly cron (1st of month) checks associations whose `fiscal_year_end` month just ended.

**Actions:**
1. Find associations entering new fiscal year
2. Call `generateDeadlines()` from statutory-engine.ts
3. Auto-create compliance checklist items
4. Notify assigned CAM of new deadlines

**Time saved per occurrence:** 30-45 minutes per community. At 20/month = 10-15 hours/month.

**Effort:** LOW — Engine fully built. Just need a cron trigger route.

---

### 5. VENDOR COMPLIANCE AUTO-FLAGGING (W-9, License, COI)

**Status:** READ-ONLY AI ANALYSIS EXISTS — `/api/ai/verai/vendor-compliance` does analysis but takes no action. No automated flagging or suspension.

**What manual process it replaces:**
Admin staff manually track W-9 receipt dates, license expirations, and insurance gaps in spreadsheets. Vendors with expired documents continue working, creating audit and liability risk.

**Frequency:** ~500 vendors. W-9s don't expire but must be on file. Licenses expire annually. COIs expire per policy.

**Trigger:** Weekly cron.

**Actions:**
1. Query vendors missing W-9 (`w9_on_file = false`)
2. Query vendors with expired licenses (`license_expiry < today`)
3. Query vendors with expired COI (from insurance certificates)
4. Auto-send renewal request emails
5. Auto-flag vendor record with compliance status badge
6. After 30 days non-compliant: auto-suspend vendor
7. Create action items for manager

**Time saved per occurrence:** 10 minutes per vendor. At 30 flagged/week = 5 hours/week.

**Effort:** MEDIUM — Vendor management service has the queries. Need flag/suspend logic + email templates.

---

### 6. BANK RECONCILIATION AUTO-IMPORT (BAI2 Daily)

**Status:** PARSER BUILT, UPLOAD MANUAL — `lib/banking/bai2-parser.ts` is a complete BAI2 parser. Upload endpoints exist at `/api/banking/bai2/upload` and `/api/banking/bai2/imports`. AI-powered smart reconciliation exists at `lib/services/ai/smart-reconciliation.ts`. But NO automated daily import from bank SFTP/API.

**What manual process it replaces:**
Accountants manually download BAI2 files from bank portals daily, upload to Vera, then manually match transactions. For 255 communities with separate bank accounts = massive daily workload.

**Frequency:** Daily. ~255+ bank accounts.

**Trigger:** Daily cron (6 AM before business hours).

**Actions:**
1. Connect to bank SFTP/API to pull BAI2 files
2. Parse using existing bai2-parser.ts
3. Import transactions into bank_transactions table
4. Run AI smart reconciliation to auto-suggest matches
5. Auto-match transactions above 95% confidence threshold
6. Queue remaining for human review
7. Send summary email to accounting team

**Time saved per occurrence:** Currently 2-3 hours/day of accountant time downloading and uploading. Auto-matching saves another 2-3 hours.

**Effort:** HIGH — Need bank SFTP integration, per-bank credentials management, and auto-match confidence threshold logic.

---

### 7. OWNER ONBOARDING AUTO-TRIGGER

**Status:** PARTIALLY BUILT — `createOwnerOnboardingItems()` exists and creates 8 action items. The API route `/api/associations/[id]/owners/[ownerId]/onboard` works. Workflow template `tpl_new_owner_onboarding` is defined. But onboarding must be manually triggered by clicking a button.

**What manual process it replaces:**
When a new owner is added (via ownership transfer, property sale), a manager must remember to click "Onboard" to create the checklist. Often forgotten, leading to owners without portal access, missing keys, etc.

**Trigger:** Database trigger on `contacts` INSERT where `contact_type = 'owner'`, or on `ownership_transfers` completion.

**Actions:**
1. Auto-call `createOwnerOnboardingItems()`
2. Auto-send welcome email (from template)
3. Auto-create portal account
4. Schedule 30-day follow-up email
5. Notify assigned CAM

**Time saved per occurrence:** 15 minutes (remembering + clicking through + sending welcome). At ~50 new owners/month = 12 hours/month.

**Effort:** LOW — Everything built. Need a Supabase database trigger or post-insert webhook.

---

### 8. STATEMENT AUTO-DELIVERY ON ASSESSMENT POSTING

**Status:** Assessment posting is automated, but statement delivery is NOT tied to it. Statements must be manually generated and emailed.

**What manual process it replaces:**
After assessments post on the 1st (automated), staff must manually generate and email owner statements. For 28,391 doors, this is overwhelming.

**Trigger:** Fires immediately after assessment posting automation completes.

**Actions:**
1. After `post-assessments` runs, get list of affected properties
2. Generate statement PDFs using existing `statement-generator.ts`
3. Email to each owner with balance summary
4. Log delivery in communications table

**Time saved per occurrence:** Currently takes days to manually email statements. Auto-delivery saves 20+ hours/month of staff time.

**Effort:** MEDIUM — Statement generator exists. Need to chain it after assessment posting + bulk email via Resend.

---

### 9. DELINQUENCY DEMAND LETTER AUTO-GENERATION

**Status:** Collection escalation creates `collection_actions_v2` records but does NOT auto-generate demand letters. The violation engine generates letters, but collections does not.

**What manual process it replaces:**
When collection escalation reaches "demand_letter" stage, a manager must manually draft and send the letter. Florida statute requires specific language.

**Trigger:** When collection_actions_v2 record created with `action_type = 'demand_letter'`.

**Actions:**
1. Listen for new collection actions at demand_letter stage
2. Look up FL-compliant demand letter template
3. Merge owner name, address, balance, due date, statutory references
4. Generate PDF
5. Queue for mailing (print queue or email)
6. Update collection action with letter ID

**Time saved per occurrence:** 20-30 minutes per letter. At ~100/month = 30-50 hours/month.

**Effort:** MEDIUM — Letter generation exists for violations. Need to extend to collections.

---

### 10. WORK ORDER SLA BREACH AUTO-ESCALATION

**Status:** Recurring work orders are auto-generated. But when a vendor misses their SLA deadline on an existing work order, nothing happens automatically.

**What manual process it replaces:**
CAMs must manually check open work orders, identify SLA breaches, contact vendors, and escalate if needed.

**Trigger:** Daily cron checks work orders where `due_date < today` and `status` in ('open', 'assigned', 'in_progress').

**Actions:**
1. Identify overdue work orders
2. Auto-send reminder to assigned vendor
3. If >3 days overdue: auto-escalate to manager
4. If >7 days overdue: auto-reassign to backup vendor
5. Update vendor performance score
6. Create action item for manager

**Time saved per occurrence:** 10 minutes per overdue WO. At ~40/week = 6-7 hours/week.

**Effort:** MEDIUM — Work order engine exists. Need SLA tracking + escalation logic.

---

### 11. INSPECTION FOLLOW-UP AUTO-SCHEDULING

**Status:** NOT BUILT. Inspections exist as a module but have no automated follow-up workflow.

**What manual process it replaces:**
After a community inspection, the inspector identifies violations and must manually create individual violation records, schedule follow-ups, and notify owners.

**Trigger:** When inspection status changes to 'completed'.

**Actions:**
1. Parse inspection findings
2. Auto-create violation records for each finding
3. Schedule 14-day follow-up inspection
4. Notify property owners of findings
5. Create action items for CAM

**Time saved per occurrence:** 30-60 minutes per inspection. At ~50 inspections/week = 25-50 hours/week.

**Effort:** HIGH — Requires inspection-to-violation mapping logic.

---

### 12. ANNUAL MEETING NOTICE AUTO-DISTRIBUTION

**Status:** Workflow template `tpl_annual_meeting` exists as a visual template but is not activated. No cron triggers it.

**What manual process it replaces:**
FL statute requires specific notice timelines for annual meetings. Staff must manually track deadlines and send notices at 14 days, 7 days, and proxy forms.

**Trigger:** Calendar event for annual meeting approaching (45/14/7 days).

**Actions:**
1. 45 days before: create agenda draft action item
2. 14 days before: send first notice to all owners (FL statute requirement)
3. 7 days before: send reminder + proxy forms
4. Day of: send final reminder
5. Post-meeting: auto-create minutes action item

**Time saved per occurrence:** 2-3 hours per annual meeting. At 255 communities/year = 500-750 hours/year.

**Effort:** MEDIUM — Workflow template exists. Need cron + email integration activation.

---

## Priority Matrix: Top 3 Automation Wins

| Rank | Opportunity | Weekly Hours Saved | Effort | Impact |
|------|-----------|-------------------|--------|--------|
| 1 | Board Meeting Packet Auto-Gen (#3) | 30-60 hrs/week | MEDIUM | Eliminates largest single time sink for CAMs |
| 2 | Violation Lifecycle Auto-Escalation (#1) | 4-8 hrs/week | LOW | Prevents compliance gaps, reduces legal risk |
| 3 | Owner Onboarding Auto-Trigger (#7) | 3 hrs/week | LOW | Eliminates forgotten onboarding, improves owner experience |

**Total addressable time savings across all 12 opportunities: ~100-180 hours/week (2.5-4.5 FTEs)**
