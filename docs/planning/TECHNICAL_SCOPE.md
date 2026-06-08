# Empire PropertyOS - Technical Scope & Requirements

**Version:** 1.0
**Date:** March 7, 2026
**Status:** Ready for Development

---

## 1. EXECUTIVE SUMMARY

**Purpose:** Build a comprehensive AI-powered property management platform to replace:
- Vantaca (operations management)
- HubSpot (CRM)
- CondoCerts (certificate tracking)

**Key Differentiators:**
- AI-native automation (no competitor has this)
- Modern UI (Stripe/Linear inspired)
- Full accounting with Plaid + Stripe
- 50% cheaper than current solution

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Backend** | Python/FastAPI | AI integration native, fast |
| **Database** | PostgreSQL | ACID compliant, robust |
| **ORM** | SQLAlchemy 2.0 | Type safety, async |
| **Frontend** | React + TypeScript | Modern, maintainable |
| **Styling** | Tailwind CSS | Fast development |
| **AI** | Ollama (local) + OpenAI | Hybrid privacy/cost |
| **Auth** | JWT + OAuth | Secure, social login |
| **Deployment** | Docker + Railway/Render | Easy scaling |

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Admin   │  │ Manager  │  │  Owner   │  │  Board   │       │
│  │ Dashboard│  │  Portal  │  │  Portal  │  │  Portal  │       │
│  │   (Web)  │  │  (Web)   │  │  (Web)   │  │  (Web)   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       └─────────────┴─────────────┴─────────────┘              │
│                           │                                      │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┼─────────────────────────────────────┐
│                    API GATEWAY                                   │
│                    (FastAPI + JWT Auth)                         │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   CORE API     │  │  ACCOUNTING   │  │    AI API     │
│   (Communities,│  │   (Stripe,   │  │   (Ollama,    │
│   Violations,  │  │   Plaid,     │  │   OpenAI,     │
│   Work Orders) │  │   Invoices)  │  │   Embeddings) │
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │    POSTGRESQL        │
                │   (Primary Data)      │
                └───────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │      REDIS           │
                │   (Caching, Queue)  │
                └───────────────────────┘
```

---

## 3. DATABASE SCHEMA

### 3.1 Core Entities

```python
# Communities
class Community:
    id: UUID
    name: str
    type: Enum(HOA, COA, POA, CAA)
    address: Address
    units: int
    year_built: int
    manager_id: UUID (FK User)
    settings: JSON
    created_at: datetime
    updated_at: datetime

# Units
class Unit:
    id: UUID
    community_id: UUID (FK)
    unit_number: str
    owner_id: UUID (FK Owner)
    sqft: int
    bedrooms: int
    bathrooms: float

# Owners
class Owner:
    id: UUID
    first_name: str
    last_name: str
    email: str
    phone: str
    mailing_address: Address
    accounts: List[Account]

# Accounts (for accounting)
class Account:
    id: UUID
    community_id: UUID (FK)
    account_number: str
    account_type: Enum(Asset, Liability, Equity, Revenue, Expense)
    balance: Decimal
    is_active: bool

# Transactions
class Transaction:
    id: UUID
    community_id: UUID (FK)
    account_id: UUID (FK)
    amount: Decimal
    date: date
    description: str
    category: str
    vendor_id: UUID (FK Vendor, nullable)
    source: Enum(PlaiStripe, Manual, Assessment, Payment)
    is_reconciled: bool

# Vendors
class Vendor:
    id: UUID
    name: str
    contact_name: str
    email: str
    phone: str
    address: Address
    tax_id: str
    bank_account: JSON (encrypted)
    categories: List[str]

# Invoices
class Invoice:
    id: UUID
    vendor_id: UUID (FK)
    community_id: UUID (FK)
    invoice_number: str
    amount: Decimal
    date_received: date
    due_date: date
    line_items: JSON
    status: Enum(Draft, Pending, Approved, Paid, Rejected)
    approved_by: UUID (FK User)

# Assessments
class Assessment:
    id: UUID
    community_id: UUID (FK)
    owner_id: UUID (FK)
    amount: Decimal
    due_date: date
    frequency: Enum(Monthly, Quarterly, Annual, One-time)
    type: Enum(Regular, Special, Initiation, Transfer)
    status: Enum(Pending, Paid, Overdue, Waived)

# Payments
class Payment:
    id: UUID
    owner_id: UUID (FK)
    assessment_id: UUID (FK)
    amount: Decimal
    date: date
    method: Enum(ACH, CreditCard, Check, Cash)
    stripe_payment_id: str
    status: Enum(Pending, Completed, Failed, Refunded)

# Violations
class Violation:
    id: UUID
    community_id: UUID (FK)
    unit_id: UUID (FK)
    rule_id: UUID (FK)
    description: str
    status: Enum(New, NoticeSent, Hearing, PendingLien, LienFiled, Resolved)
    photos: List[str]
    fine_amount: Decimal
    due_date: date
    resolved_date: date (nullable)

# Work Orders
class WorkOrder:
    id: UUID
    community_id: UUID (FK)
    unit_id: UUID (FK, nullable)
    category: str
    priority: Enum(Low, Medium, High, Emergency)
    description: str
    status: Enum(New, Assigned, InProgress, Completed, Cancelled)
    assigned_vendor_id: UUID (FK, nullable)
    estimated_cost: Decimal
    actual_cost: Decimal
    completed_date: date (nullable)

# Certificates (Insurance)
class Certificate:
    id: UUID
    community_id: UUID (FK)
    type: Enum(GeneralLiability, Property, WorkersComp, Flood)
    provider: str
    policy_number: str
    coverage_amount: Decimal
    premium: Decimal
    effective_date: date
    expiration_date: date
    status: Enum(Active, Expiring, Expired)
    document_url: str

# Users/Roles
class User:
    id: UUID
    email: str
    password_hash: str
    first_name: str
    last_name: str
    role: Enum(Admin, Manager, Owner, Board, Vendor)
    avatar_url: str
    created_at: datetime

# Leads (CRM)
class Lead:
    id: UUID
    source: str
    community_name: str
    contact_name: str
    email: str
    phone: str
    stage: Enum(New, Contacted, Qualified, Proposal, Won, Lost)
    assigned_to: UUID (FK User)
    notes: Text
    created_at: datetime
    converted_at: datetime (nullable)
```

---

## 4. MODULE REQUIREMENTS

### 4.1 Community Management

**Features:**
- [ ] CRUD operations for communities
- [ ] Bulk import from CSV/Excel
- [ ] Community settings (rules, fees, late policies)
- [ ] Document storage (governing documents, minutes)
- [ ] Amenity management
- [ ] Reporting (KPI dashboard)

**User Stories:**
- As an admin, I want to add a new community with all its details
- As a manager, I want to update community settings
- As a board member, I want to access governing documents

### 4.2 Violation Management

**Features:**
- [ ] Rule configuration per community
- [ ] Photo upload with AI detection
- [ ] Automated notice generation (email, mail)
- [ ] Timeline tracking (New → Notice → Hearing → Lien)
- [ ] Fine calculation per community rules
- [ ] Appeal workflow
- [ ] Reporting (by type, status, aging)

**Automation:**
- [ ] Auto-generate notice when photo uploaded
- [ ] Auto-calculate fines based on rules
- [ ] Auto-escalate after X days
- [ ] Auto-send to HOAMailers for certified mail

### 4.3 Work Order Management

**Features:**
- [ ] Request submission (owner, manager, board)
- [ ] Vendor assignment and routing
- [ ] Status tracking with updates
- [ ] Cost tracking (estimate vs actual)
- [ ] Photo/documentation
- [ ] Vendor SLA monitoring
- [ ] Satisfaction ratings

**Automation:**
- [ ] Auto-assign based on category
- [ ] Auto-notify vendor
- [ ] Auto-update status on completion
- [ ] Generate vendor bills

### 4.4 Accounting Module (CRITICAL)

#### Bank Reconciliation (Plaid)
- [ ] Plaid Link integration for bank connection
- [ ] Daily transaction sync
- [ ] Auto-matching algorithm
  - Exact match (amount + date + description)
  - Fuzzy match (amount + date range)
  - Assessment payment matching
  - Vendor invoice matching
- [ ] Exception queue for manual review
- [ ] Reconciliation reports
- [ ] Bank fee tracking

#### Invoice Processing
- [ ] Email inbox for vendor invoices
- [ ] AI extraction (OCR + LLM)
  - Vendor name
  - Invoice number
  - Date
  - Amount
  - Line items
  - GL coding suggestion
- [ ] Workflow: Receive → Extract → Review → Approve → Pay
- [ ] Batch processing
- [ ] Duplicate detection

#### Assessment Billing
- [ ] Fee schedule configuration
- [ ] Recurring assessments (monthly, quarterly)
- [ ] Special assessments
- [ ] Late fee calculation
- [ ] Interest calculation
- [ ] Payment plans

#### Payments (Stripe)
- [ ] Stripe integration (ACH + Credit Card)
- [ ] Auto-posting to accounts
- [ ] Payment receipts
- [ ] Refund processing
- [ ] Failed payment handling
- [ ] Payment reminders

#### Financial Reporting
- [ ] P&L per community
- [ ] Balance Sheet
- [ ] A/R Aging
- [ ] Budget vs Actual
- [ ] Reserve analysis
- [ ] Owner statements

### 4.5 Certificate Management (Replace CondoCerts)

**Features:**
- [ ] Certificate request workflow
- [ ] Expiration tracking
- [ ] Auto-renewal reminders
- [ ] Compliance reporting
- [ ] Document storage
- [ ] Provider management
- [ ] Coverage gap alerts

**Automation:**
- [ ] 90/60/30 day expiration alerts
- [ ] Auto-request renewal
- [ ] Post to board portal

### 4.6 Lead Management (Replace HubSpot)

**Features:**
- [ ] Lead capture forms
- [ ] Pipeline tracking (Kanban)
- [ ] Contact management
- [ ] Email sequences
- [ ] Task management
- [ ] Activity logging
- [ ] ROI tracking

**Automation:**
- [ ] Auto-score leads
- [ ] Auto-assign to sales
- [ ] Auto-trigger sequences
- [ ] Auto-follow-up reminders

---

## 5. INTEGRATIONS

### 5.1 Stripe Integration

```python
# Key Endpoints Needed
- POST /api/payments/create-intent  # Create payment
- POST /api/payments/webhook        # Handle Stripe webhooks
- GET  /api/payments/history        # Payment history
- POST /api/payments/refund         # Process refund

# Features
- ACH (bank transfer) - 0.8% fee
- Credit Card - 2.9% fee
- Apple Pay / Google Pay
- Payment plans
- Auto-retry failed payments
```

### 5.2 Plaid Integration

```python
# Key Endpoints Needed
- POST /api/plaid/link-token        # Create Link token
- POST /api/plaid/exchange-token    # Exchange public token
- GET  /api/plaid/accounts          # Get linked accounts
- GET  /api/plaid/transactions      # Get transactions
- POST /api/plaid/webhook           # Handle Plaid webhooks

# Features
- Multi-account support
- Daily transaction sync
- Balance monitoring
- Institution health checks
```

### 5.3 HOAMailers Integration

```python
# Key Features
- Send certified mail
- Track delivery status
- Bulk sending
- Template management

# Use Cases
- Violation notices
- Legal letters
- Board communications
- Owner statements
```

### 5.4 Microsoft 365 / Outlook Integration ⭐ NEW

```python
# Microsoft Graph API Integration
- Outlook inbox sync
- Email reading and parsing
- Email sending
- Calendar integration
- Task/To-do creation

# Key Features
- [ ] OAuth2 authentication with Azure AD
- [ ] Pull emails into system
- [ ] Convert emails to action items
- [ ] Send emails from system
- [ ] Calendar scheduling
- [ ] Task management
- [ ] Contact sync with O365

# Use Cases
- [ ] Receive vendor invoices via email → Auto-process
- [ ] Owner emails → Create violation/work order
- [ ] Board communications → From system
- [ ] Schedule showings/meetings → Calendar
- [ ] Task delegation → Outlook Tasks

# Setup (Azure AD)
1. Register app in Azure Portal
2. Add Mail.Read, Mail.Send, Calendar permissions
3. Admin consent
4. Store client_id, tenant_id, client_secret
```

### 5.5 Vantaca (Migration/Sync)

**Phase 1:** Continue using Vantaca
- [ ] Full data export capability
- [ ] Sync community data
- [ ] Sync owner data

**Phase 2:** Parallel operation
- [ ] Real-time sync for critical data
- [ ] Use Empire for new communities

**Phase 3:** Full migration
- [ ] Migrate all historical data
- [ ] Decommission Vantaca

---

## 6. AI FEATURES

### 6.1 Invoice Processing

```python
async def process_invoice(image_bytes) -> InvoiceData:
    """
    1. OCR to extract text
    2. LLM to parse fields
    3. Match to vendor
    4. Suggest GL code
    5. Flag anomalies
    """
```

### 6.2 Smart Reconciliation

```python
async def reconcile_transactions(bank_txns, system_txns):
    """
    1. Exact match (100% confidence)
    2. Fuzzy match (>80% confidence)
    3. Suggest matches (<80% confidence)
    4. Flag unmatched for review
    """
```

### 6.3 Violation Detection

```python
async def analyze_violation_photo(image_bytes) -> ViolationAnalysis:
    """
    1. Detect violation type from photo
    2. Extract license plate if vehicle
    3. Determine severity
    4. Suggest appropriate action
    """
```

### 6.4 Communication Generation

```python
async def generate_notice(violation, template) -> NoticeContent:
    """
    1. Gather violation details
    2. Apply community rules
    3. Generate personalized message
    4. Format for email/mail
    """
```

### 6.5 Chat Assistant

```python
async def chat_with_system(user_message, context) -> Response:
    """
    1. Embed user question
    2. Search knowledge base
    3. Generate contextual answer
    4. Include relevant data
    """
```

---

## 7. API SPECIFICATION

### 7.1 REST Endpoints

```
/api/v1
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   └── POST /forgot-password
│
├── /communities
│   ├── GET    / (list)
│   ├── POST   / (create)
│   ├── GET    /{id}
│   ├── PUT    /{id}
│   ├── DELETE /{id}
│   └── GET    /{id}/stats
│
├── /owners
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── PUT    /{id}
│   └── GET    /{id}/account
│
├── /violations
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── PUT    /{id}
│   ├── POST   /{id}/notice
│   └── POST   /{id}/escalate
│
├── /work-orders
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── PUT    /{id}
│   ├── POST   /{id}/assign
│   └── POST   /{id}/complete
│
├── /accounting
│   ├── /accounts
│   ├── /transactions
│   ├── /invoices
│   ├── /assessments
│   ├── /payments
│   ├── /reconciliation
│   └── /reports
│
├── /certificates
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── PUT    /{id}
│   └── GET    /expiring
│
├── /leads
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /{id}
│   ├── PUT    /{id}
│   └── POST    /{id}/stage
│
└── /integrations
    ├── /stripe
    ├── /plaid
    └── /hoamailers
```

### 7.2 Webhooks

```
Stripe:
- payment_intent.succeeded
- payment_intent.failed
- account.updated

Plaid:
- TRANSACTIONS_SYNC
- ITEM_ERROR
- HOLDINGS_SYNC
```

---

## 8. UI/UX REQUIREMENTS

### 8.1 Design System

**Color Palette:**
- Primary: #2563EB (Blue 600)
- Secondary: #64748B (Slate 500)
- Accent: #10B981 (Emerald 500)
- Error: #EF4444 (Red 500)
- Warning: #F59E0B (Amber 500)
- Background: #F8FAFC (Slate 50)
- Surface: #FFFFFF
- Text Primary: #1E293B (Slate 800)
- Text Secondary: #64748B (Slate 500)

**Typography:**
- Headings: Inter, Bold
- Body: Inter, Regular
- Monospace: JetBrains Mono (for numbers/codes)

**Spacing:**
- Base unit: 4px
- Common: 8, 12, 16, 24, 32, 48, 64px

**Border Radius:**
- Small: 4px
- Medium: 8px
- Large: 12px
- Full: 9999px (pills)

### 8.2 Page Layouts

**Admin Dashboard:**
- Sidebar navigation (collapsible)
- Top bar with search + notifications + profile
- Main content area with cards/tables
- Action panels on right (optional)

**Community View:**
- Tabbed interface
- Quick stats cards
- Data tables with filters
- Detail slides on click

**Owner Portal:**
- Simple, mobile-first
- Large touch targets
- Quick actions (Pay, Request, View)

### 8.3 Components

| Component | States | Notes |
|-----------|--------|-------|
| Button | default, hover, active, disabled, loading | Primary, Secondary, Danger |
| Input | default, focus, error, disabled | With validation |
| Select | default, open, disabled | Searchable |
| Table | default, loading, empty | Sortable, filterable |
| Card | default, hover | For dashboards |
| Modal | default, loading | Forms, confirmations |
| Toast | success, error, warning, info | Auto-dismiss |
| Badge | status colors | For tags, counts |

---

## 9. SECURITY REQUIREMENTS

### 9.1 Authentication

- [ ] JWT-based auth with refresh tokens
- [ ] Password hashing (bcrypt, cost 12)
- [ ] MFA support (TOTP)
- [ ] Session management
- [ ] Password policies

### 9.2 Authorization

- [ ] Role-based access control (RBAC)
- [ ] Community-level permissions
- [ ] Audit logging
- [ ] API rate limiting

### 9.3 Data Security

- [ ] Encryption at rest (PostgreSQL)
- [ ] Encryption in transit (TLS 1.3)
- [ ] Secret management (environment variables)
- [ ] PII handling (PCI-DSS for Stripe)
- [ ] Regular security audits

---

## 10. NON-FUNCTIONAL REQUIREMENTS

### 10.1 Performance

- [ ] Page load < 2 seconds
- [ ] API response < 500ms (p95)
- [ ] Support 500+ concurrent users
- [ ] Handle 10,000+ transactions/day

### 10.2 Reliability

- [ ] 99.9% uptime SLA
- [ ] Automated backups (daily)
- [ ] Disaster recovery plan
- [ ] Error monitoring (Sentry)

### 10.3 Scalability

- [ ] Horizontal scaling via containers
- [ ] Database read replicas
- [ ] CDN for static assets
- [ ] Caching layer (Redis)

---

## 11. DEVELOPMENT PHASES

### Phase 1: Foundation (Weeks 1-4)
- [ ] Project setup
- [ ] Database schema
- [ ] Auth system
- [ ] Basic CRUD APIs

### Phase 2: Core Operations (Weeks 5-8)
- [ ] Community management
- [ ] Owner portal
- [ ] Work orders
- [ ] Violations

### Phase 3: Accounting (Weeks 9-14)
- [ ] Plaid integration
- [ ] Bank reconciliation
- [ ] Invoice processing
- [ ] Assessment billing
- [ ] Stripe payments
- [ ] Financial reports

### Phase 4: AI Features (Weeks 15-18)
- [ ] Invoice OCR/AI
- [ ] Smart reconciliation
- [ ] Violation detection
- [ ] Chat assistant

### Phase 5: CRM & Certificates (Weeks 19-22)
- [ ] Lead management
- [ ] Email sequences
- [ ] Certificate tracking
- [ ] HOAMailers integration

### Phase 6: Migration (Weeks 23-26)
- [ ] Data migration from Vantaca
- [ ] HubSpot import
- [ ] CondoCerts migration
- [ ] Testing
- [ ] Go-live

---

## 12. ACCEPTANCE CRITERIA

### Must Have (MVP)
- [ ] Community CRUD
- [ ] Owner management
- [ ] Violation workflow
- [ ] Work orders
- [ ] Basic accounting
- [ ] Bank reconciliation (Plaid)
- [ ] Payments (Stripe)
- [ ] Owner portal
- [ ] Admin dashboard
- [ ] Mobile responsive

### Should Have
- [ ] AI invoice processing
- [ ] Certificate tracking
- [ ] Lead management
- [ ] Board portal
- [ ] Advanced reporting

### Nice to Have
- [ ] AI chat assistant
- [ ] Violation photo AI
- [ ] Predictive maintenance
- [ ] Market analytics

---

## 13. TEAM REQUIREMENTS

### Technical Team

| Role | Count | Responsibilities |
|------|-------|------------------|
| Lead Engineer | 1 | Architecture, AI, code review |
| Full-Stack Dev | 1 | Frontend + Backend |
| Frontend Dev | 1 | React + UI |

### Timeline

- **Start:** ASAP
- **MVP:** 3 months
- **Full:** 6 months

---

## 14. BUDGET

### Development Costs

| Item | Low | High |
|------|-----|------|
| Lead Engineer (6 mo) | $60,000 | $90,000 |
| Full-Stack Dev (6 mo) | $48,000 | $72,000 |
| Frontend Dev (3 mo) | $24,000 | $36,000 |
| **Total Labor** | **$132,000** | **$198,000** |

### Infrastructure (Annual)

| Item | Cost |
|------|------|
| Hosting (Render/Railway) | $6,000 |
| PostgreSQL (Cloud) | $3,600 |
| Stripe Fees (est.) | $3,600 |
| Plaid Fees (est.) | $1,200 |
| OpenAI API (est.) | $2,400 |
| **Total** | **$16,800** |

### One-Time

| Item | Cost |
|------|------|
| Domain, SSL | $500 |
| **Total** | **$500** |

### Grand Total

| Scenario | Cost |
|----------|------|
| Low | $149,300 |
| High | $215,300 |

---

## 15. RISKS

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-------------|
| Scope creep | High | High | Strict requirements, phased delivery |
| API rate limits | Medium | Medium | Caching, queue system |
| Data migration issues | Medium | High | Thorough testing, parallel run |
| Security vulnerabilities | Low | Critical | Regular audits, penetration testing |
| Team availability | Medium | High | Documentation, knowledge sharing |

---

*Document Version: 1.0*
*Last Updated: March 7, 2026*
*Next Review: Before Phase 1 start*
