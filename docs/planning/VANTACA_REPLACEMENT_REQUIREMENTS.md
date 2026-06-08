# Vantaca Replacement - Requirements Document

**Goal:** Build a complete PropertyOS that replaces Vantaca  
**Current State:** Using browser automation (Playwright) to extract data from Vantaca  
**Target State:** Full-featured property management platform with native capabilities

---

## Vantaca Capabilities Analysis

### What Vantaca Does (From Research + Skill Documentation)

| Module | Features | Priority |
|--------|----------|----------|
| **Community Management** | Community list, unit counts, manager assignments, board packets, budgets, ARC | HIGH |
| **Violations** | Create, track, escalate, resolve violations by community/unit/owner | HIGH |
| **Work Orders** | Create, assign vendors, track status, completion, costs | HIGH |
| **Accounting** | AR aging (current, 30, 60, 90, 120+), AP, financial reporting | HIGH |
| **Owner Portal** | Owner info, contact details, balances, violation history, payments | HIGH |
| **Resident Support** | Email, chat, forms, phone - real-time responses | MEDIUM |
| **AI (HOAi)** | Auto responses, accounting automation, community management | MEDIUM |
| **Board Management** | Board packets, voting, meeting minutes | MEDIUM |

---

## Vantaca Data Structures (From Browser Automation)

### Communities
```json
{
  "id": "string",
  "name": "string",
  "type": "HOA|COA|POA",
  "units": "number",
  "manager": "string",
  "address": { "city", "state", "zip" }
}
```

### Violations
```json
{
  "id": "string",
  "community_id": "string",
  "unit_id": "string",
  "owner_name": "string",
  "rule": "string",
  "description": "string",
  "status": "open|pending|resolved|closed",
  "reported_date": "date",
  "days_open": "number"
}
```

### Work Orders
```json
{
  "id": "string",
  "community_id": "string",
  "unit_id": "string",
  "category": "plumbing|electrical|hvac|landscaping|general|emergency",
  "title": "string",
  "description": "string",
  "status": "open|assigned|in_progress|completed|cancelled",
  "vendor_id": "string",
  "priority": "low|medium|high|urgent",
  "created_date": "date",
  "completed_date": "date|null",
  "estimated_cost": "number|null",
  "actual_cost": "number|null"
}
```

### AR Aging (by Community)
```json
{
  "community_id": "string",
  "current": "number",
  "days_30": "number",
  "days_60": "number",
  "days_90": "number",
  "days_120_plus": "number",
  "total": "number"
}
```

### Owners
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "unit_id": "string",
  "community_id": "string",
  "balance": "number",
  "violation_count": "number"
}
```

---

## Empire PropertyOS - Requirements

### Phase 1: Core Replacement (Must Have)

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Community Management** | CRUD for communities, units, managers | Medium |
| **Violation Tracking** | Full lifecycle (create → escalate → resolve) | Medium |
| **Work Order Management** | Create, assign vendors, track, complete | Medium |
| **Owner Database** | Contact info, units owned, balances | Medium |
| **AR Aging** | Track receivables by age bucket | Easy |
| **User Auth** | Login, roles (admin, manager, owner, board) | Easy |

### Phase 2: Accounting (Should Have)

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Invoicing** | Generate owner assessments/fees | Medium |
| **Payments** | Record payments, apply to invoices | Medium |
| **AP** | Vendor bills, payments | Medium |
| **Financial Reports** | P&L, balance sheet by community | Hard |
| **Bank Sync** | Plaid integration for bank feeds | Medium |

### Phase 3: Communication (Nice to Have)

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Email Templates** | Violation notices, statements, board comms | Easy |
| **Mass Communications** | Email/SMS to all owners | Medium |
| **Owner Portal** | Self-service (view balance, submit requests) | Hard |
| **Board Portal** | Board packets, voting, minutes | Hard |

### Phase 4: AI Automation (Competitive Advantage)

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Invoice Processing** | AI OCR + data extraction | Medium |
| **Smart Reconciliation** | Auto-match payments to invoices | Medium |
| **Violation Auto-Escalate** | AI-driven escalation rules | Medium |
| **Chat Assistant** | NLP for owner inquiries | Hard |
| **Predictive Maintenance** | AI预测 work order needs | Hard |

---

## Technical Requirements

### Database Schema (PostgreSQL)

```
users
- id, email, password_hash, first_name, last_name, role, created_at

communities
- id, name, type, address, city, state, zip, units, manager_id, created_at

units
- id, community_id, unit_number, owner_id, sqft, bedrooms, bathrooms

owners
- id, user_id, name, email, phone, mailing_address

violations
- id, community_id, unit_id, rule, description, status, priority, created_at, resolved_at

work_orders
- id, community_id, unit_id, category, title, description, status, priority, vendor_id, created_at, completed_at, estimated_cost, actual_cost

invoices
- id, community_id, owner_id, amount, due_date, status, line_items (JSONB)

payments
- id, invoice_id, amount, payment_date, payment_method, reference

vendors
- id, name, email, phone, service_categories, address
```

### API Requirements

- RESTful API with OpenAPI/Swagger docs
- JWT authentication
- Role-based access control (RBAC)
- Rate limiting
- Audit logging

### Integrations

| Integration | Purpose | Priority |
|-------------|---------|----------|
| **QuickBooks** | Accounting sync | HIGH |
| **O365/Outlook** | Email, calendar, tasks | HIGH |
| **Stripe** | Online payments | MEDIUM |
| **Plaid** | Bank account verification | MEDIUM |
| **Twilio** | SMS notifications | MEDIUM |
| **HOAMailers** | Certified mail | LOW |

---

## Build vs Buy Analysis

| Component | Vantaca Cost | Build Cost | Notes |
|-----------|--------------|------------|-------|
| Core (violations, work orders, owners) | $2K/mo | $20K one-time | 10 month payback |
| Accounting | $1K/mo | $15K one-time | QBO integration |
| Owner Portal | $500/mo | $25K one-time | React app |
| AI Features | $500/mo (HOAi) | $10K one-time | Ollama + prompts |
| **Total** | **$4K/mo** | **$70K** | **17 month payback** |

---

## Migration Strategy

1. **Parallel Run** (Month 1-2): Run PropertyOS alongside Vantaca
2. **Data Sync**: Export Vantaca data → Import to PropertyOS
3. **Pilot Community**: Move 1 community to PropertyOS
4. **Full Migration**: Move all communities over time
5. **Decommission**: Cancel Vantaca subscription

---

## Next Steps

- [ ] Export current Vantaca data (using existing connector)
- [ ] Design detailed database schema
- [ ] Build core API (communities, violations, work orders)
- [ ] Add authentication
- [ ] Build React admin UI
- [ ] Integrate QuickBooks
- [ ] Integrate O365

---

*Document created: March 7, 2026*
