# VERA — Master Build Prompt

**Generated:** 2026-04-11
**Context:** Santa Method scored the platform 1-6/10 across 10 dimensions. This prompt addresses every gap.
**Sources:** LLM Council, Santa Method adversarial review, Perplexity research, UX audit, competitor analysis, Empire website research, BankUnited/HOAMailers integration specs, FL statutory blueprint

---

## THE FIVE CRITICAL FIXES (from Santa Method)

### FIX 1: DATA INTEGRITY — Make everything REAL
- Audit all Supabase tables: which have data, which are empty
- Build a proper Vantaca-to-Vera data migration that populates: charges, payments, ledger entries, violation history, work order history — not just owners and associations
- Ensure the dashboard shows REAL numbers from REAL data
- Every financial report must pull from actual ledger tables
- Statement generation must use real balance data

### FIX 2: AUTOMATION — Make it actually RUN
- Configure Vercel Cron Jobs for /api/automation/run-all (daily 6am ET)
- Or use Supabase pg_cron for database-level scheduling
- Test each automation end-to-end: late fees apply, violations escalate, notices send
- Add monitoring: if automation fails, alert via Discord webhook

### FIX 3: COMPLIANCE ENGINE — Make it ENFORCE, not decorate
- Every violation form must VALIDATE against FL statute requirements before submission
- Every generated notice must INCLUDE required statutory language
- The AI must CITE both the applicable statute AND the community's CC&R section
- Build a ComplianceValidator service that checks: required fields, required language, required timelines, required delivery methods
- Integrate with community documents: parse CC&Rs to extract fine schedules, architectural standards, use restrictions

### FIX 4: INTEGRATION — Make them WORK end-to-end
- Test Stripe: can a homeowner actually complete a payment?
- Test Twilio: can a manager actually send an SMS?
- Test email: does Resend actually deliver?
- Build integration test suite that verifies each flow
- Add proper error handling when integrations fail

### FIX 5: DOCUMENT INTELLIGENCE — Parse, understand, cite
- When community documents are uploaded, AI should EXTRACT: fine schedules, architectural standards, meeting rules, election procedures, assessment amounts
- Store extracted data in structured format per community
- When generating ANY communication, reference the specific CC&R section
- Build a "Community Knowledge Base" per association that VeraI can query

---

## COMPREHENSIVE FEATURE LIST

### A. Multi-Jurisdiction Compliance
- Federal: Fair Housing Act, ADA, Fair Debt Collection Practices Act
- Florida: FS 720 (HOA), FS 718 (Condo), FS 719 (Co-op), HB 913, SB 4D
- County/Municipality: local ordinances, building codes, zoning
- Community-specific: Declaration, Bylaws, Rules, Amendments
- Architecture: pluggable state modules (CA Davis-Stirling, TX Property Code, NY Real Property Law, etc.)
- Store jurisdiction hierarchy per association: federal → state → county → municipal → community

### B. Community Export Package
- One-click export of ENTIRE community when transitioning to another management company
- Package includes: governing documents, financial records (GL, ledger, statements), owner roster with contact info, violation history, work order history, vendor contracts, insurance policies, meeting minutes, bank statements, reserve study
- Format: ZIP file with organized folders + CSV data files + PDF reports
- Compliance: FS 720.303 records request requirements
- API: POST /api/associations/[id]/export — generates full package

### C. Document Intelligence Engine
- On upload: AI extracts key terms, fine schedules, deadlines, restrictions
- Stores structured data in community_document_extractions table
- VeraI can query: "What does Oakwood Manor's CC&R say about fence height?"
- Every generated letter references the specific section: "Per your community's Declaration, Article V, Section 5.2..."
- Violation notices cite both statute AND CC&R: "Per FS 720.305(2) and your community's CC&R Section 8.3..."

### D. Automation Schedule
- Daily 6am ET: assessments, late fees, collection escalation, violation escalation
- Daily 6am ET: compliance deadline checks, insurance expiry alerts
- Weekly Monday: managers report generation, board packet prep (14 days before meetings)
- Monthly 1st: statement generation, lockbox validation file export
- Quarterly: reserve fund analysis, budget variance alerts
- Annually: 1098 generation, election timeline creation, compliance deadlines for new fiscal year

### E. Reconciliation Engine
- Auto-import BAI2 files daily (from BankUnited SFTP)
- Auto-match transactions to ledger entries by amount + reference
- Exception queue for unmatched items
- Auto-apply lockbox payments by account number
- Plaid real-time balance verification
- End-of-month reconciliation report

### F. Customer Service Automation
- AI phone system classifies and routes calls (already built)
- Auto-respond to common inquiries: balance, payment status, violation status
- Escalation rules: if AI can't resolve in 2 exchanges, route to human
- SMS auto-replies for payment confirmations
- Email auto-categorization and routing to correct department

### G. Specialized Community Types
- Marina: slip management, vessel registration, pumpout schedules
- Golf: tee time booking, membership management, cart fleet
- Clubhouse: event booking, room reservations, F&B management
- Lifestyle: activity programming, fitness class scheduling, pool passes
- Age-restricted: age verification, occupancy compliance
- Gated: access control, visitor management, gate logs
- Each type has its own settings panel and dashboard widgets

### H. Manager Productivity
- Portfolio view: all 15 communities at a glance with health scores
- One-click context switch between communities (Cmd+J built)
- Auto-generated daily priority list based on deadlines + urgency
- Time tracking per community for billing
- Template library for common communications
- Bulk operations: send notices to 50 owners, approve 20 invoices

### I. Board & Homeowner Portals
- Board: simplified dashboard, financial summary, vote on resolutions, review documents
- Homeowner: pay balance, submit requests, check violations, community calendar
- Both: mobile-optimized, Spanish language toggle, push notifications
- Board packet delivery: auto-email 14 days before meetings
- E-voting for elections and amendments

### J. Reporting Suite
- All reports exportable as PDF and Excel
- Financial: income statement, balance sheet, trial balance, GL detail, budget vs actual
- AR: aging summary, delinquency report, collection status
- Operations: violation summary, work order status, inspection report
- Compliance: statutory deadline status, insurance expiry report
- Custom: drag-and-drop report builder with saved templates
- Scheduled: auto-email monthly reports to board members

---

## EXECUTION PRIORITY

### Sprint 1: DATA INTEGRITY (make it real)
- Migrate Vantaca charges/payments/ledger data
- Verify dashboard shows real numbers
- Test PDF reports with real data

### Sprint 2: COMPLIANCE ENFORCEMENT (make it enforce)
- ComplianceValidator service
- Statutory language injection in all generated documents
- Community document parsing + structured extraction

### Sprint 3: AUTOMATION (make it run)
- Configure cron schedules
- End-to-end test all automation flows
- Monitoring + alerting on failures

### Sprint 4: INTEGRATION TESTING (make it work)
- End-to-end test Stripe payments
- End-to-end test Twilio SMS/voice
- End-to-end test email delivery
- Webhook verification

### Sprint 5: COMMUNITY LIFECYCLE (intake to export)
- Community intake wizard (being built)
- Community export package
- Document intelligence engine
- Transition checklist

### Sprint 6: MULTI-JURISDICTION
- Federal compliance layer
- County/municipal ordinance tracking
- State module architecture for expansion
- Community document override rules

### Sprint 7: POLISH TO 10/10
- Fix all remaining UX dead ends
- Mobile optimization
- Search across all entity types
- Keyboard shortcuts for power users
- Onboarding tour for new employees
