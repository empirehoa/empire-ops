# Vera — P0 Critical Features Implementation Plan

**Council recommendation: Build in this order to maximize code reuse**

## Phase 1: Financial Foundation (Days 1-9)

### 1. Fund Accounting (Days 1-4)
**MVP Scope:**
- Operating + Reserve fund separation
- GL account mapping per fund
- Fund transfers between operating/reserve
- Fund-level financial reports (income statement, balance sheet per fund)

**Tables needed:**
- `funds` (id, tenant_id, association_id, name, fund_type, gl_account_id)
- `fund_transfers` (id, from_fund_id, to_fund_id, amount, date, memo, created_by)
- Update `journal_entries` to include `fund_id` FK

**Skip for MVP:** Multiple special assessments, complex fund restrictions

### 2. Statement & Coupon Generation (Days 5-9)
**MVP Scope:**
- PDF statements: current balance, recent transactions, payment due date
- Email delivery via Resend
- Basic coupon book generation (12-month payment slips)
- Statement batch generation per association

**Tables needed:**
- `statement_batches` (id, tenant_id, association_id, statement_date, status, generated_count)
- `statement_items` (id, batch_id, owner_id, pdf_url, emailed_at, printed_at)

**Reuses:** PDFKit (already installed), Resend, owner_ledger view

## Phase 2: Payment Operations (Days 10-16)

### 3. Credit Memos (Days 10-12)
**MVP Scope:**
- Credit creation against existing AP invoices
- Auto-approve under configurable threshold
- Apply credits to future invoices
- Credit memo PDF generation

**Tables needed:**
- `ap_credit_memos` (id, tenant_id, vendor_id, association_id, amount, reason, status, applied_to_bill_id)

**Reuses:** AP bills infrastructure, journal entry creation pattern

### 4. Lockbox Processing (Days 13-16)
**MVP Scope:**
- Manual lockbox file upload (NACHA/CSV format)
- Auto-match by account number + amount
- Exception queue for unmatched payments
- Apply matched payments to owner ledger

**Tables needed:**
- `lockbox_batches` (id, tenant_id, file_name, upload_date, status, matched_count, exception_count)
- `lockbox_items` (id, batch_id, account_number, amount, check_number, matched_owner_id, status)

**Reuses:** Payment application logic from Stripe webhook, owner_ledger

## Phase 3: Property Operations (Days 17-21)

### 5. Ownership Transfer (Days 17-21)
**MVP Scope:**
- Transfer wizard: select property → enter new owner → prorate assessments
- Generate closing letter (PandaDoc)
- Final statement for seller, welcome packet for buyer
- Estoppel integration (already built)

**Tables needed:**
- `ownership_transfers` (id, tenant_id, association_id, property_id, seller_contact_id, buyer_contact_id, transfer_date, status, proration_amount)

**Reuses:** Estoppels module, PandaDoc, statement generation from Phase 1

---

## P1 Features (After P0, Days 22-35)

6. **Association Onboarding Wizard** (3 days) — Step-by-step setup: community info → GL chart → assessment schedule → board members → document upload
7. **New Owner Setup Action Items** (2 days) — Template-driven: welcome email, portal invite, key distribution, move-in inspection
8. **Print Queue** (3 days) — PDF batching, mail merge, physical mail tracking
9. **1098 Tax Form Generation** (2 days) — Annual interest statement, IRS-format PDF, batch generation
10. **Mobile Homeowner App** (4 days) — Capacitor build: payments, balance view, violation status, work orders, documents

---

## Shared Infrastructure

All P0 features share:
- `tenant_id` isolation (mandatory)
- `audit_events` logging via `log_audit_event()`
- PDF generation (PDFKit already installed)
- Email delivery (Resend)
- The existing RBAC permission system
- VeraI can provide AI assistance for each (draft transfer letters, analyze statements, etc.)
