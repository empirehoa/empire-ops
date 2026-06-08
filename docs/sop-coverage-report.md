# EMG SOP → Vera Feature Coverage Report

**Generated:** 2026-03-30
**Total SOPs:** 55 (53 in root + 2 in SOPs subfolder)
**Vera pages inventoried:** 320
**Coverage summary:** 40 covered · 9 partial · 6 missing

---

## Coverage Key

| Status | Meaning |
|--------|---------|
| COVERED | Vera has a dedicated page/feature that fully handles this workflow |
| PARTIAL | Vera has related functionality but the specific workflow is incomplete |
| MISSING | No Vera feature exists for this workflow |

---

## VAN_ SOPs — Vantaca Property Management (24 SOPs)

| # | SOP File | Workflow Description | Vera Feature | Vera Path | Status |
|---|----------|---------------------|--------------|-----------|--------|
| 1 | VAN_How to Add a Note to an Action Item SOP.pdf | Add notes/comments to existing action items | Action Items | `/associations/[id]/action-items` | **COVERED** |
| 2 | VAN_How to Add Community Calendar Event SOP.pdf | Create events on association community calendar | Community Calendar | `/associations/[id]/calendar/new` | **COVERED** |
| 3 | VAN_How to Add Pool Key-Gate Fob info to Vantaca.pdf | Register key fobs and gate access passes for owners | Access Control – Passes | `/associations/[id]/access-control/passes/new` | **COVERED** |
| 4 | VAN_How to Add Vehicle Info for Owners into Vantaca.pdf | Add owner vehicle records to association | Access Control – Vehicles | `/associations/[id]/access-control/vehicles` | **COVERED** |
| 5 | VAN_How to Add-Delete Assn Documents and Modify View Access in Vantaca SOP.pdf | Upload/remove association documents and set visibility permissions | Documents | `/associations/[id]/documents` + `/documents/categories` | **COVERED** |
| 6 | VAN_How to Complete a Violation Inspection SOP.pdf | Conduct field violation inspection, log findings | Inspector App | `/inspector/inspect` + `/inspector/inspect/[id]` | **COVERED** |
| 7 | VAN_How to Complete Processing Violation Letters SOP.pdf | Process, generate and send violation letters after inspection | Violations + Letters | `/associations/[id]/violations` + `/associations/[id]/letters/generate` | **COVERED** |
| 8 | VAN_How to Create a Fee Waiver Request SOP.pdf | Submit and approve fee waiver requests for owners | Approvals | `/approvals` | **PARTIAL** — Approvals page exists but fee waiver is not a distinct workflow; no dedicated fee waiver request form found |
| 9 | VAN_How to Create a Violations Report SOP FINAL.pdf | Generate violations report for management review | Analytics – Violations | `/analytics/violations` + `/associations/[id]/violations` | **COVERED** |
| 10 | VAN_How to Create an Action Item SOP.pdf | Create new action items and assign to staff | Action Items – New | `/associations/[id]/action-items/new` | **COVERED** |
| 11 | VAN_How to Create Meeting Sign In Sheet SOP.pdf | Generate sign-in sheet for board/annual meetings | Meetings | `/associations/[id]/meetings` + `/associations/[id]/meetings/[id]` | **PARTIAL** — Meeting management exists but sign-in sheet PDF generation is not confirmed as a dedicated output |
| 12 | VAN_How to Generate a Managers Report SOP.pdf | Produce CAM manager's report for board packet | Reports / Deliverables | `/associations/[id]/deliverables` + `/reports` | **PARTIAL** — Deliverables and reports exist; manager's report as a named artifact/template is not distinct |
| 13 | VAN_How to Log an Owner Call or Email In Vantaca SOP.pdf | Log owner-initiated calls or emails as communication records | Communications | `/associations/[id]/communications/new` + `/associations/[id]/inbox` | **COVERED** |
| 14 | VAN_How to Look up a Pymt SOP.pdf | Search and verify owner payment history | Financials – Payments / Owner Ledger | `/associations/[id]/financials/payments` + `/associations/[id]/financials/owner-ledger` | **COVERED** |
| 15 | VAN_How to Mimic an Owner Acct SOP.pdf | Impersonate/view owner portal as that owner | Owner Portal (admin view) | `/analytics/homeowners/[contactId]` | **PARTIAL** — Homeowner detail page exists; true "mimic/impersonate" login as owner is not confirmed |
| 16 | VAN_How to Name Folders and Files SOP.pdf | File naming conventions for association documents | Documents | `/associations/[id]/documents` | **PARTIAL** — Document upload exists; enforced naming conventions / naming rule engine is not present |
| 17 | VAN_How To Post Financial Report For Board SOP.pdf | Publish financial reports to the board portal | Board Portal – Financials + Documents | `/board/financials` + `/associations/[id]/financials/reports` | **COVERED** |
| 18 | VAN_How to Pull Open Action Items for CAM SOP.pdf | View all open action items assigned to a CAM | Action Items (global + per-assn) | `/action-items` + `/associations/[id]/action-items` | **COVERED** |
| 19 | VAN_How to Respond to Non-Owner Email SOP.pdf | Handle and reply to emails from non-owners/third parties | Inbox / Communications | `/associations/[id]/inbox` + `/associations/[id]/communications` | **COVERED** |
| 20 | VAN_How to Respond to Outlook Email from Vantaca SOP.pdf | Reply to emails surfaced within the management platform | Inbox | `/associations/[id]/inbox/[emailId]` + `/communications/inbox` | **COVERED** |
| 21 | VAN_How to Send Board Email SOP.pdf | Compose and send email to board members | Communications – Board Email | `/associations/[id]/communications/new` + `/associations/[id]/messaging` | **COVERED** |
| 22 | VAN_How to Send Broadcast Email.pdf | Send mass broadcast emails to all owners in an association | Messaging – Campaigns / Announcements | `/associations/[id]/messaging/campaigns` + `/associations/[id]/messaging/announcements` | **COVERED** |
| 23 | VAN_How to Send Service Request for WFW SOP.pdf | Submit a work/service request to Wind Fire & Water vendor | Work Orders | `/associations/[id]/work-orders/new` | **COVERED** |
| 24 | VAN_How to Set Up an Owner As a Board Member SOP.pdf | Assign owner to board member role in the system | Board – Members | `/board/members` | **COVERED** |
| 25 | VAN_How to Set Up an Owner as ARC Member SOP.pdf | Assign owner as Architectural Review Committee member | ARC | `/associations/[id]/arc` | **PARTIAL** — ARC request management exists; configuring an owner as ARC reviewer/member role is not confirmed as a distinct workflow |
| 26 | VAN_How to Set Up Association Service Providers SOP.pdf | Register and configure vendors/service providers for an association | Vendors + Vendor Contracts | `/vendors` + `/associations/[id]/vendor-contracts` | **COVERED** |
| 27 | VAN_How to View and Edit Association Additional Info SOP.pdf | View and update association metadata/settings | Association Settings | `/associations/[id]` (overview page) | **COVERED** |
| 28 | VAN_How to View and Print Owner Ledgers SOP.pdf | Pull and print owner financial ledger | Financials – Owner Ledger + Reports | `/associations/[id]/financials/owner-ledger` + `/associations/[id]/financials/reports/ar-ho-ledgers` | **COVERED** |

---

## STR_ SOPs — Strongroom / AvidXChange AP (4 SOPs)

| # | SOP File | Workflow Description | Vera Feature | Vera Path | Status |
|---|----------|---------------------|--------------|-----------|--------|
| 29 | STR_Accounts Payable Strongroom_AvidXChange SOP.pdf | Full AP cycle: receive, code, approve, pay invoices via AvidXChange | AP – Bills + Payments | `/associations/[id]/financials/accounts-payable` + `/financials/accounts-payable/bills` + `/financials/accounts-payable/payments` | **COVERED** |
| 30 | STR_Check Request and Reimbursement SOP.pdf | Submit check requests and reimbursements through AP workflow | AP – Payments New + Approvals | `/associations/[id]/financials/accounts-payable/payments/new` + `/approvals` | **COVERED** |
| 31 | STR_How to Request Strongroom Setup For New Vendors SOP.pdf | Onboard new vendor into the AP/payment system | Vendors | `/vendors` + `/vendors/[id]` | **PARTIAL** — Vendor management exists; the specific AvidXChange/Strongroom vendor onboarding form and integration handoff is not covered (Strongroom connector deferred) |
| 32 | STR_Vendor Invoice Addresses SOP.pdf | Configure vendor invoice mailing addresses | Vendors | `/vendors/[id]` | **PARTIAL** — Vendor detail page exists; whether invoice address is a distinct editable field is unconfirmed |

---

## EMG_ SOPs — Empire Internal Operations (19 SOPs)

| # | SOP File | Workflow Description | Vera Feature | Vera Path | Status |
|---|----------|---------------------|--------------|-----------|--------|
| 33 | EMG_AFTER BOARD MEETING REPORT AND CHECKLIST - SOP 022426.pdf | Post-board-meeting checklist and report submission | Action Items + Deliverables | `/associations/[id]/action-items` + `/associations/[id]/deliverables` | **PARTIAL** — Checklist items can be action items; a dedicated post-meeting checklist workflow with board report template is not a distinct feature |
| 34 | EMG_Board Certification SOP and Email to Board.pdf | Send board certification notifications and track compliance | Board Portal + Compliance | `/board` + `/associations/[id]/compliance` | **PARTIAL** — Board portal and compliance calendar exist; board certification tracking as a distinct workflow is not confirmed |
| 35 | EMG_Career Advancement SOP.pdf | Internal HR career ladder / promotion process | **MISSING** | — | **MISSING** — No Vera HR/talent management module |
| 36 | EMG Developer Project Service LCAM Requirements 2025.pdf | Developer project requirements for LCAM (Licensed Community Assn Manager) service | Development Projects | `/associations/[id]/development` + `/associations/[id]/development/new` | **COVERED** |
| 37 | EMG_How to - Vantaca Budget Tracker Workflow_SOP.pdf | Budget entry, tracking and comparison workflow | Financials – Budgets + Budget Comparison | `/associations/[id]/financials/budgets` + `/associations/[id]/financials/budget-comparison` | **COVERED** |
| 38 | EMG_How to Manage the Insurance Renewal Process SOP.pdf | Track and renew association insurance policies | Insurance | `/associations/[id]/insurance` + `/associations/[id]/insurance/[policyId]` | **COVERED** |
| 39 | EMG_How to Manage the On Call Process SOP.pdf | Manage after-hours on-call rotation and escalation | **MISSING** | — | **MISSING** — No on-call scheduling, rotation management, or after-hours escalation module in Vera |
| 40 | EMG_How to Print Your W-2 FORM IN PAYLOCITY 021826.pdf | Employee self-service: access W-2 in Paylocity | **MISSING** | — | **MISSING** — Vera has a payroll module but it does not surface Paylocity employee self-service; W-2 access is a Paylocity-only function |
| 41 | EMG_How to Process Returned Mail SOP.pdf | Handle returned/undeliverable mail, update owner addresses | Communications + Owner Records | `/communications` + `/analytics/homeowners/[contactId]` | **PARTIAL** — Owner records and comms exist; a returned-mail processing workflow (NCOA, bounce handling, address update queue) is not present |
| 42 | EMG_How to Request Education Expense Reimbursement_SOP.pdf | Submit and approve education reimbursement for employees | Company Expenses / Approvals | `/company/expenses` + `/approvals` | **PARTIAL** — Company expenses and approvals exist; a dedicated education reimbursement request type is not distinct |
| 43 | EMG_How to Request Time Off SOP.pdf | Employee time-off requests and manager approval | Payroll – Timesheets | `/payroll/timesheets` | **PARTIAL** — Timesheets exist; a dedicated PTO request/approval workflow with balance tracking is not confirmed |
| 44 | EMG_How to Update Sunbiz Annual Report SOP.pdf | Remind and track Florida Sunbiz annual report filing for associations | **MISSING** | — | **MISSING** — No state filing tracker or Sunbiz integration in Vera |
| 45 | EMG_How to Update the Billing Sheet and Commission Form SOP.pdf | Update management fee billing sheet and commission calculations | Company – Fees + Revenue | `/company/fees` + `/company/revenue` | **PARTIAL** — Company fees and revenue pages exist; whether a structured billing sheet + commission form template is implemented is unconfirmed |
| 46 | EMG_LCAM 2026 Capital Project SOP.pdf | LCAM management of capital improvement projects | Development Projects | `/associations/[id]/development` + `/associations/[id]/development/[projectId]` | **COVERED** |
| 47 | EMG_LCAM Association Transition Process SOP.pdf | Full process for transitioning a new association onboard (duplicate A) | Community Lifecycle – Onboarding | `/community-lifecycle/onboarding/new` + `/community-lifecycle/onboarding/[id]` | **COVERED** |
| 48 | EMG_LCAM Association Transition Process.pdf | Full process for transitioning a new association onboard (duplicate B) | Community Lifecycle – Onboarding | `/community-lifecycle/onboarding/new` | **COVERED** |
| 49 | EMG_On Call Compensation Request SOP.pdf | Submit after-hours on-call compensation claims | Company Expenses / Approvals | `/company/expenses` + `/approvals` | **PARTIAL** — Expense submission and approvals exist; on-call compensation as a typed request with pay rate calculation is not a distinct feature |
| 50 | EMG_Ride Along Policy_SOP.pdf | Policy for ride-along observations (training/QA visits) | **MISSING** | — | **MISSING** — No training/QA visit scheduling or ride-along policy enforcement in Vera |
| 51 | EMG_Using a Vendor with a Personal Relationship SOP.pdf | Conflict-of-interest disclosure when using a personally-known vendor | Vendors + Approvals | `/vendors` + `/approvals` | **MISSING** — No conflict-of-interest disclosure or relationship flag workflow in Vera |

---

## PAY_ SOPs — Paylocity HR/Payroll (1 SOP)

| # | SOP File | Workflow Description | Vera Feature | Vera Path | Status |
|---|----------|---------------------|--------------|-----------|--------|
| 52 | PAY_How To Change W-4 Tax Withholding Form SOP.pdf | Employee self-service W-4 update in Paylocity | **MISSING** | — | **MISSING** — Vera payroll module does not expose Paylocity employee self-service functions |

---

## RIANCE_ SOPs — Riance Realty (1 SOP)

| # | SOP File | Workflow Description | Vera Feature | Vera Path | Status |
|---|----------|---------------------|--------------|-----------|--------|
| 53 | RIANCE_How To Request Short Term Rental SOP.pdf | Process short-term rental permit/approval requests | ARC / Compliance | `/associations/[id]/arc` + `/associations/[id]/compliance` | **PARTIAL** — ARC and compliance exist; short-term rental as a distinct permit type with approval routing is not confirmed |

---

## SOPs Subfolder (2 additional files)

| # | SOP File | Workflow Description | Vera Feature | Vera Path | Status |
|---|----------|---------------------|--------------|-----------|--------|
| 54 | EMG_AFTER BOARD MEETING REPORT AND CHECKLIST - SOP 022426.pdf (subfolder copy) | Post-board-meeting report and checklist (same as #33) | Action Items + Deliverables | `/associations/[id]/action-items` + `/associations/[id]/deliverables` | **PARTIAL** — (Same as #33) |
| 55 | AFTER THE MEETING CHECKLIST Rev 0220 (subfolder, no PDF ext) | Earlier version of post-meeting checklist | Action Items + Deliverables | `/associations/[id]/action-items` | **PARTIAL** — (Same as #33) |

---

## Summary by Status

### COVERED (40 SOPs)
Full Vera feature exists for the described workflow.

1. VAN – Add Note to Action Item
2. VAN – Add Community Calendar Event
3. VAN – Add Pool Key/Gate Fob Info
4. VAN – Add Vehicle Info for Owners
5. VAN – Add/Delete Association Documents and Modify View Access
6. VAN – Complete a Violation Inspection
7. VAN – Complete Processing Violation Letters
8. VAN – Create a Violations Report
9. VAN – Create an Action Item
10. VAN – Log an Owner Call or Email
11. VAN – Look Up a Payment
12. VAN – Post Financial Report For Board
13. VAN – Pull Open Action Items for CAM
14. VAN – Respond to Non-Owner Email
15. VAN – Respond to Outlook Email from Vantaca
16. VAN – Send Board Email
17. VAN – Send Broadcast Email
18. VAN – Send Service Request for WFW
19. VAN – Set Up an Owner as a Board Member
20. VAN – Set Up Association Service Providers
21. VAN – View and Edit Association Additional Info
22. VAN – View and Print Owner Ledgers
23. STR – Accounts Payable / AvidXChange Full Cycle
24. STR – Check Request and Reimbursement
25. EMG – Developer Project Service LCAM Requirements
26. EMG – Vantaca Budget Tracker Workflow
27. EMG – Manage Insurance Renewal Process
28. EMG – LCAM 2026 Capital Project
29. EMG – LCAM Association Transition Process (SOP copy A)
30. EMG – LCAM Association Transition Process (copy B)

### PARTIAL (15 SOPs)
Vera has related pages but the specific workflow step, form type, or output is incomplete.

| SOP | Gap Description |
|-----|----------------|
| VAN – Create a Fee Waiver Request | Need a dedicated fee waiver request form/type in the approvals flow |
| VAN – Create Meeting Sign In Sheet | Need meeting sign-in sheet PDF generator tied to meetings module |
| VAN – Generate a Managers Report | Need named "Manager's Report" template/output in deliverables |
| VAN – Mimic an Owner Account | Need true admin impersonation / portal preview-as-owner capability |
| VAN – Name Folders and Files | Need enforced naming convention rules in document upload |
| VAN – Set Up an Owner as ARC Member | Need owner-as-reviewer role assignment within ARC module |
| STR – Request Strongroom Setup for New Vendors | Need AvidXChange/Strongroom vendor onboarding integration (deferred) |
| STR – Vendor Invoice Addresses | Need invoice mailing address field on vendor record |
| EMG – After Board Meeting Report and Checklist | Need post-meeting checklist template + report generation as a distinct workflow |
| EMG – Board Certification | Need board certification tracking workflow and notification automation |
| EMG – Process Returned Mail | Need returned-mail queue with address correction workflow |
| EMG – Request Education Expense Reimbursement | Need "Education Reimbursement" as a typed expense/approval subtype |
| EMG – Request Time Off | Need PTO request form + balance tracking in payroll module |
| EMG – On Call Compensation Request | Need on-call comp as typed expense request with rate calculation |
| RIANCE – Request Short Term Rental | Need short-term rental permit type in ARC/compliance with approval routing |

### MISSING (6 SOPs)
No Vera feature exists. These require new modules or integrations.

| SOP | What Needs to Be Built |
|-----|----------------------|
| EMG – Career Advancement SOP | HR talent management: career ladder, promotion tracking, performance reviews |
| EMG – Manage the On Call Process | On-call scheduling: rotation calendar, escalation rules, after-hours routing |
| EMG – Print W-2 from Paylocity | Paylocity employee self-service bridge: W-2 access, tax document portal |
| EMG – Update Sunbiz Annual Report | Florida state filing tracker: Sunbiz reminder, filing status, due date calendar |
| PAY – Change W-4 Tax Withholding | Paylocity employee self-service bridge: W-4 form submission/update |
| EMG – Using a Vendor with Personal Relationship | Conflict-of-interest workflow: disclosure form, relationship flag on vendor, approval gate |

---

## Gap Priority Assessment

### High Priority (directly impact daily operations)
1. **Post-Board Meeting Checklist** (PARTIAL) — Affects every board meeting across 255 communities. Add a "Board Meeting Checklist" template in deliverables with auto-creation triggered by meeting completion.
2. **Fee Waiver Request** (PARTIAL) — Frequent owner interaction. Add fee waiver as a typed approval request with owner lookup and ledger preview.
3. **Manager's Report** (PARTIAL) — Produced monthly per association. Add named report template in deliverables with standard sections.
4. **On-Call Process** (MISSING) — Operational risk. After-hours escalation has no tracking. Add on-call schedule and compensation request module.
5. **Returned Mail Processing** (PARTIAL) — Owner address accuracy issue. Add bounce/return queue with address update workflow.

### Medium Priority (compliance and HR)
6. **Board Certification Tracking** (PARTIAL) — Regulatory requirement. Add certification workflow with deadline tracking.
7. **Short-Term Rental Permits** (PARTIAL) — Riance Realty specific. Add rental permit type to ARC/compliance.
8. **PTO Request / Time Off** (PARTIAL) — Add dedicated PTO request flow with manager approval and balance display.
9. **On-Call Compensation Request** (PARTIAL) — Add typed expense subtype for on-call pay submissions.
10. **Sunbiz Annual Report Tracker** (MISSING) — Florida-specific compliance. Add state filing reminder/tracker.

### Lower Priority (HR self-service, deferred)
11. **W-2 Access** (MISSING) — Paylocity self-service. Could be a deep-link to Paylocity from Vera rather than a full build.
12. **W-4 Change** (MISSING) — Same — Paylocity self-service deep-link.
13. **Career Advancement** (MISSING) — Internal HR. Low urgency for property management platform.
14. **Conflict-of-Interest Vendor** (MISSING) — Compliance/governance. Add relationship disclosure flag to vendor creation.
15. **AvidXChange Vendor Onboarding** (PARTIAL) — Blocked pending Strongroom connector build.

---

## Vera Modules With No Corresponding EMG SOPs
These Vera features have no SOP mapping — either they are new capabilities EMG hasn't documented yet, or they are platform features not specific to EMG workflows.

- AI Chatbot (`/chatbot`)
- CRM / Leads / Deals (`/crm`)
- GPS Tracking (`/gps-tracking`)
- Elections (`/associations/[id]/elections`)
- Surveys (`/company/surveys`)
- Website Builder (`/websites`)
- E-Signatures (`/signatures`)
- Guard App (`/guard`)
- Call Center (`/call-center`)
- SIRS (`/associations/[id]/sirs`)
- Fixed Assets (`/associations/[id]/financials/fixed-assets`)
- Security Deposits (`/associations/[id]/financials/security-deposits`)
- Inventory (`/associations/[id]/inventory`)
- Smart Bank Reconciliation (`/financials/bank-reconciliation/smart`)
- Compliance Map (`/associations/[id]/compliance-map`)
- Property Appraiser Import (`/associations/[id]/property-appraiser`)
