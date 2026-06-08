import { useState } from "react";

const SECTIONS = [
  { id: "db", label: "Database migrations" },
  { id: "laravel", label: "Laravel structure" },
  { id: "api", label: "API build order" },
  { id: "sprints", label: "Sprint plan" },
  { id: "critical", label: "Critical path" },
  { id: "risks", label: "Risks" },
];

const pill = (color, text) => {
  const colors = {
    purple: { bg: "#EEEDFE", border: "#AFA9EC", text: "#3C3489" },
    teal:   { bg: "#E1F5EE", border: "#5DCAA5", text: "#085041" },
    amber:  { bg: "#FAEEDA", border: "#EF9F27", text: "#633806" },
    red:    { bg: "#FCEBEB", border: "#F09595", text: "#791F1F" },
    gray:   { bg: "#F1EFE8", border: "#B4B2A9", text: "#444441" },
    green:  { bg: "#EAF3DE", border: "#97C459", text: "#27500A" },
    coral:  { bg: "#FAECE7", border: "#F0997B", text: "#712B13" },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 99,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: 11, fontWeight: 500, lineHeight: "18px", whiteSpace: "nowrap",
    }}>{text}</span>
  );
};

const Code = ({ children }) => (
  <code style={{
    fontFamily: "var(--font-mono, monospace)", fontSize: 12,
    background: "var(--color-background-secondary)", padding: "1px 5px",
    borderRadius: 4, color: "var(--color-text-secondary)",
  }}>{children}</code>
);

const Block = ({ children }) => (
  <pre style={{
    fontFamily: "var(--font-mono, monospace)", fontSize: 12,
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 8, padding: "12px 16px", margin: "8px 0",
    overflowX: "auto", lineHeight: 1.6,
    color: "var(--color-text-secondary)",
    whiteSpace: "pre",
  }}>{children}</pre>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 12px",
      color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border-tertiary)",
      paddingBottom: 8 }}>{title}</h3>
    {children}
  </div>
);

const Row = ({ label, children, top }) => (
  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12,
    padding: "8px 0", borderBottom: "1px solid var(--color-border-tertiary)",
    alignItems: top ? "start" : "center" }}>
    <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 500 }}>{label}</span>
    <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>{children}</div>
  </div>
);

const Note = ({ type = "info", children }) => {
  const styles = {
    info:    { bg: "var(--color-background-info)",    border: "var(--color-border-info)",    text: "var(--color-text-info)" },
    warning: { bg: "var(--color-background-warning)", border: "var(--color-border-warning)", text: "var(--color-text-warning)" },
    danger:  { bg: "var(--color-background-danger)",  border: "var(--color-border-danger)",  text: "var(--color-text-danger)" },
    success: { bg: "var(--color-background-success)", border: "var(--color-border-success)", text: "var(--color-text-success)" },
  };
  const s = styles[type];
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
      padding: "10px 14px", margin: "8px 0", fontSize: 13, color: s.text, lineHeight: 1.6,
    }}>{children}</div>
  );
};

const SprintCard = ({ sprint, title, goal, tables, apis, services, jobs, events, dod, color }) => {
  const [open, setOpen] = useState(false);
  const cols = { purple: "#534AB7", teal: "#0F6E56", amber: "#854F0B", coral: "#993C1D" };
  const bgs  = { purple: "#EEEDFE", teal: "#E1F5EE", amber: "#FAEEDA", coral: "#FAECE7" };
  return (
    <div style={{
      border: "1px solid var(--color-border-tertiary)", borderRadius: 10,
      marginBottom: 12, overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          cursor: "pointer", background: "var(--color-background-secondary)",
          userSelect: "none",
        }}
      >
        <span style={{
          minWidth: 72, textAlign: "center", padding: "3px 10px", borderRadius: 99,
          background: bgs[color], color: cols[color], fontWeight: 500, fontSize: 12,
        }}>{sprint}</span>
        <span style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)", flex: 1 }}>{title}</span>
        <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "16px", display: "grid", gap: 14 }}>
          <Note type="info"><strong>Sprint goal:</strong> {goal}</Note>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {tables?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tables</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{tables.map(t => <Code key={t}>{t}</Code>)}</div>
              </div>
            )}
            {apis?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>API endpoints</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{apis.map(a => <Code key={a}>{a}</Code>)}</div>
              </div>
            )}
            {services?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Services / classes</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{services.map(s => <Code key={s}>{s}</Code>)}</div>
              </div>
            )}
            {(jobs?.length > 0 || events?.length > 0) && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Jobs / events</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {[...(jobs||[]), ...(events||[])].map(j => <Code key={j}>{j}</Code>)}
                </div>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Definition of done</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: "var(--color-text-primary)" }}>
              {dod.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const RiskCard = ({ severity, area, risk, mitigation }) => {
  const sevColor = severity === "high" ? "red" : severity === "medium" ? "amber" : "gray";
  return (
    <div style={{
      border: "1px solid var(--color-border-tertiary)", borderRadius: 8,
      padding: "12px 16px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {pill(sevColor, severity.toUpperCase())}
        {pill("gray", area)}
        <span style={{ fontWeight: 500, fontSize: 13, color: "var(--color-text-primary)" }}>{risk}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--color-text-primary)" }}>Mitigation:</strong> {mitigation}
      </div>
    </div>
  );
};

export default function App() {
  const [active, setActive] = useState("db");

  return (
    <div style={{ fontFamily: "var(--font-sans, sans-serif)", maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
          Vera Financial Core v2.0
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)" }}>
          Development execution plan — 7 sprints · 14 weeks · production-ready financial platform
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{
            padding: "6px 14px", borderRadius: 99, border: "1px solid",
            borderColor: active === s.id ? "#534AB7" : "var(--color-border-secondary)",
            background: active === s.id ? "#EEEDFE" : "var(--color-background-secondary)",
            color: active === s.id ? "#3C3489" : "var(--color-text-secondary)",
            fontSize: 13, fontWeight: active === s.id ? 500 : 400, cursor: "pointer",
          }}>{s.label}</button>
        ))}
      </div>

      {active === "db" && (
        <div>
          <Section title="Migration order — phase 1 (foundation)">
            <Note type="warning">Run migrations in exact order. Each migration file must be committed separately. Never batch unrelated tables into one migration file.</Note>
            <Block>{`-- Wave 1: tenant + config root (no FKs)
001_create_tenants.php
002_create_associations.php
003_create_gl_groups.php
004_create_users.php                    -- auth stub, FK target

-- Wave 2: accounting scaffolding
005_create_financial_periods.php        -- no overlap constraint yet (added wave 4)
006_create_financial_period_transitions.php
007_create_gl_accounts.php
008_create_gl_account_yearly_rollup.php

-- Wave 3: ledger core
009_create_gl_entries.php               -- includes idempotency_key UNIQUE
010_create_gl_entry_lines.php           -- unpartitioned first (partitioning wave 5)

-- Wave 4: constraints + RLS (separate migration file per table)
011_add_period_overlap_exclusion.php    -- GIST constraint on financial_periods
012_enable_rls_associations.php
013_enable_rls_financial_periods.php
014_enable_rls_gl_accounts.php
015_enable_rls_gl_entries.php
016_enable_rls_gl_entry_lines.php

-- Wave 5: banking
017_create_bank_accounts.php
018_create_bank_register_entries.php
019_enable_rls_bank_accounts.php
020_enable_rls_bank_register_entries.php

-- Wave 6: vendors + AP
021_create_vendors.php
022_create_vendor_documents.php         -- includes W9 fields
023_create_invoices.php
024_create_invoice_approval_steps.php
025_create_payments.php
026_enable_rls_vendors.php
027_enable_rls_invoices.php
028_enable_rls_payments.php

-- Wave 7: transactions
029_create_deposits.php
030_create_transfers.php

-- Wave 8: reconciliation
031_create_reconciliation_sessions.php
032_create_reconciliation_items.php
033_create_bank_statement_imports.php
034_create_imported_bank_transactions.php

-- Wave 9: events + reporting
035_create_audit_logs.php               -- append-only RLS immediately
036_create_event_outbox.php             -- includes schema_version, dead_lettered_at
037_create_notifications.php
038_create_ledger_period_snapshots.php

-- Wave 10: indexes (always last, separate file per table)
039_indexes_gl_entry_lines.php
040_indexes_bank_register_entries.php
041_indexes_invoices.php
042_indexes_gl_entries.php
043_indexes_vendors.php`}</Block>
          </Section>

          <Section title="RLS implementation — exact SQL pattern">
            <Note type="info">Every RLS migration follows this exact pattern. Never deviate — consistency lets the TenantIsolationTest suite validate all tables mechanically.</Note>
            <Block>{`-- Template: 015_enable_rls_gl_entries.php

ALTER TABLE gl_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_entries FORCE ROW LEVEL SECURITY;  -- applies to table owner too

CREATE POLICY tenant_select ON gl_entries FOR SELECT
  USING (
    association_id = current_setting('app.current_association_id', true)::uuid
    AND tenant_id  = current_setting('app.current_tenant_id', true)::uuid
  );

CREATE POLICY tenant_insert ON gl_entries FOR INSERT
  WITH CHECK (
    association_id = current_setting('app.current_association_id', true)::uuid
    AND tenant_id  = current_setting('app.current_tenant_id', true)::uuid
  );

CREATE POLICY tenant_update ON gl_entries FOR UPDATE
  USING (
    association_id = current_setting('app.current_association_id', true)::uuid
  );

-- audit_logs only: no UPDATE or DELETE policy (append-only)
CREATE POLICY audit_no_update ON audit_logs FOR UPDATE USING (false);
CREATE POLICY audit_no_delete ON audit_logs FOR DELETE USING (false);`}</Block>
            <Note type="warning">The <Code>true</Code> second argument on <Code>current_setting</Code> makes it return NULL instead of throwing when the variable is not set. This means a connection without tenant context returns zero rows — not an error, not all rows. Test this explicitly in your isolation suite.</Note>
          </Section>

          <Section title="Partitioning rollout — gl_entry_lines">
            <Note type="info">Do NOT partition on day 1. Build the application against an unpartitioned table first. Add partitioning in Sprint 6 before reconciliation goes in — that's the last major write path before reporting.</Note>
            <Block>{`-- Sprint 6 migration: convert gl_entry_lines to partitioned

-- Step 1: rename existing table
ALTER TABLE gl_entry_lines RENAME TO gl_entry_lines_old;

-- Step 2: create partitioned table (identical columns)
CREATE TABLE gl_entry_lines (
  id              UUID DEFAULT gen_random_uuid(),
  gl_entry_id     UUID NOT NULL,
  gl_account_id   UUID NOT NULL,
  association_id  UUID NOT NULL,
  tenant_id       UUID NOT NULL,
  line_description TEXT,
  debit           NUMERIC(19,4) NOT NULL DEFAULT 0,
  credit          NUMERIC(19,4) NOT NULL DEFAULT 0,
  source_type     VARCHAR(64),
  source_id       UUID,
  posting_date    DATE NOT NULL,  -- ADD THIS FIELD if not already present
  PRIMARY KEY (id, posting_date)
) PARTITION BY RANGE (posting_date);

-- Step 3: create partitions (2 years back + 1 year forward at minimum)
-- Script this — don't do it by hand
SELECT create_monthly_partitions('gl_entry_lines', '2024-01-01', '2027-12-31');

-- Step 4: backfill (do this in batches during low-traffic window)
INSERT INTO gl_entry_lines SELECT * FROM gl_entry_lines_old;

-- Step 5: swap and validate
-- Step 6: drop gl_entry_lines_old after 1 week

-- Partition creation function (add to a scheduled job — runs monthly)
CREATE OR REPLACE FUNCTION create_monthly_partitions(
  tbl TEXT, from_date DATE, to_date DATE
) RETURNS void AS $$
DECLARE d DATE := date_trunc('month', from_date);
BEGIN
  WHILE d < to_date LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
      tbl || '_' || to_char(d, 'YYYY_MM'), tbl, d, d + INTERVAL '1 month'
    );
    d := d + INTERVAL '1 month';
  END LOOP;
END $$ LANGUAGE plpgsql;`}</Block>
          </Section>

          <Section title="Index strategy per phase">
            <Row label="Sprint 1–2" top>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <Code>gl_accounts(association_id, account_number)</Code>
                <Code>gl_accounts(association_id, account_type)</Code>
                <Code>financial_periods(association_id, status)</Code>
                <Code>gl_entries(association_id, financial_period_id)</Code>
                <Code>gl_entries(association_id, idempotency_key) UNIQUE</Code>
                <Code>gl_entry_lines(gl_entry_id)</Code>
                <Code>gl_entry_lines(association_id, gl_account_id, posting_date)</Code>
              </div>
            </Row>
            <Row label="Sprint 3–4" top>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <Code>bank_register_entries(bank_account_id, transaction_date DESC)</Code>
                <Code>bank_register_entries(bank_account_id, reconciled) WHERE voided_at IS NULL</Code>
                <Code>invoices(association_id, status, due_date)</Code>
                <Code>invoices(vendor_id, status)</Code>
                <Code>invoice_approval_steps(invoice_id, step_order)</Code>
              </div>
            </Row>
            <Row label="Sprint 5–7" top>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <Code>invoices(association_id, due_date) WHERE status IN ('submitted','pending_approval')</Code>
                <Code>event_outbox(status, available_at) WHERE status = 'pending'</Code>
                <Code>event_outbox(dead_lettered_at) WHERE dead_lettered_at IS NOT NULL</Code>
                <Code>audit_logs(association_id, entity_type, entity_id)</Code>
                <Code>payments(invoice_id)</Code>
                <Code>reconciliation_items(reconciliation_session_id)</Code>
              </div>
            </Row>
          </Section>
        </div>
      )}

      {active === "laravel" && (
        <div>
          <Section title="Folder structure">
            <Block>{`app/
├── Console/
│   └── Commands/
│       ├── CreateMonthlyPartitions.php     -- scheduled monthly
│       └── ReplayDeadLetterEvents.php
│
├── Domain/                                 -- pure domain logic, no Laravel deps
│   ├── Accounting/
│   │   ├── DTOs/
│   │   │   ├── GlEntryDTO.php
│   │   │   └── GlEntryLineDTO.php
│   │   ├── Enums/
│   │   │   ├── CorrectionType.php         -- original|reversal|correcting_entry|void
│   │   │   ├── PeriodStatus.php           -- draft|open|closed|reopened
│   │   │   └── GlEntryStatus.php
│   │   └── ValueObjects/
│   │       └── Money.php                  -- immutable, 4 decimal places, no float
│   ├── Vendor/
│   │   └── Enums/
│   │       └── TinMatchStatus.php
│   └── Events/                            -- domain event value objects (not Laravel events)
│       ├── GlEntryPosted.php
│       ├── InvoicePaid.php
│       ├── PaymentVoided.php
│       └── ...
│
├── Http/
│   ├── Controllers/Api/V1/
│   │   ├── GlAccountController.php
│   │   ├── GlEntryController.php
│   │   ├── BankAccountController.php
│   │   ├── BankRegisterController.php
│   │   ├── InvoiceController.php
│   │   ├── PaymentController.php
│   │   ├── DepositController.php
│   │   ├── TransferController.php
│   │   ├── VendorController.php
│   │   ├── ReconciliationController.php
│   │   ├── FinancialPeriodController.php
│   │   ├── ReportController.php
│   │   └── NotificationController.php
│   ├── Middleware/
│   │   ├── SetTenantContext.php            -- sets PostgreSQL session vars
│   │   ├── EnforceAssociationScope.php
│   │   └── RequireStepUpAuth.php           -- for high-risk actions
│   └── Requests/Api/V1/
│       ├── PostGlEntryRequest.php
│       ├── CreateInvoiceRequest.php
│       └── ...                             -- one FormRequest per write endpoint
│
├── Models/
│   ├── Concerns/
│   │   └── BelongsToAssociation.php       -- adds AssociationScope global scope
│   ├── GlEntry.php
│   ├── GlEntryLine.php
│   ├── Invoice.php
│   └── ...
│
├── Services/
│   ├── Accounting/
│   │   ├── JournalEntryService.php
│   │   ├── AccountingEntryFactory.php     -- pure, no DB writes
│   │   ├── ChartOfAccountsService.php
│   │   └── PeriodCloseService.php
│   ├── Banking/
│   │   ├── BankRegisterService.php
│   │   ├── BankBalanceProjector.php
│   │   ├── DepositService.php
│   │   └── TransferService.php
│   ├── Reconciliation/
│   │   └── ReconciliationService.php
│   ├── Vendors/
│   │   ├── VendorComplianceService.php
│   │   └── InvoiceWorkflowService.php
│   ├── Reporting/
│   │   ├── ReportSnapshotService.php
│   │   └── FinancialReportingService.php
│   └── Events/
│       └── OutboxPublisher.php
│
├── Jobs/
│   ├── Accounting/
│   │   └── TransactionPostingJob.php      -- queued, idempotent
│   ├── Banking/
│   │   └── StatementImportJob.php
│   ├── Reporting/
│   │   └── BuildPeriodSnapshotJob.php
│   ├── Outbox/
│   │   └── ProcessOutboxBatchJob.php      -- SELECT FOR UPDATE SKIP LOCKED
│   └── Compliance/
│       └── VendorComplianceCheckJob.php   -- nightly
│
├── Observers/                             -- Eloquent model observers for audit logging
│   ├── GlEntryObserver.php
│   ├── InvoiceObserver.php
│   └── ...
│
└── Policies/                              -- Laravel Gate policies per model
    ├── GlEntryPolicy.php
    └── InvoicePolicy.php`}</Block>
          </Section>

          <Section title="SetTenantContext middleware — exact implementation">
            <Note type="danger">This is the most critical piece of infrastructure in the entire system. Get it wrong and RLS doesn't fire, which means tenant isolation doesn't exist. Write an integration test for this on day 1.</Note>
            <Block>{`// app/Http/Middleware/SetTenantContext.php

class SetTenantContext {
  public function handle(Request $request, Closure $next): Response {
    $user = $request->user();
    if (!$user) return $next($request);

    $associationId = $request->route('associationId')
      ?? $request->header('X-Association-Id');

    // Validate this user can access this association
    abort_unless(
      $user->associations()->where('id', $associationId)->exists(),
      403, 'Association access denied'
    );

    // Set PostgreSQL session variables for RLS
    DB::statement("SELECT set_config('app.current_tenant_id', ?, true)", [$user->tenant_id]);
    DB::statement("SELECT set_config('app.current_association_id', ?, true)", [$associationId]);

    // Also store in app context for Eloquent global scopes
    TenantContext::set($user->tenant_id, $associationId);

    return $next($request);
  }
}`}</Block>
          </Section>

          <Section title="AccountingEntryFactory — pure mapping, fully testable">
            <Block>{`// app/Services/Accounting/AccountingEntryFactory.php
// NO constructor injection of DB/repositories. Pure input → output.

class AccountingEntryFactory {
  public function fromInvoicePaid(Invoice $invoice, Payment $payment): GlEntryDTO {
    // Debit: AP account (liability decreases)
    // Credit: Cash account (asset decreases)
    $idempotencyKey = $this->deriveKey('invoice_paid', $invoice->id, $payment->id);

    return new GlEntryDTO(
      associationId:   $invoice->association_id,
      tenantId:        $invoice->tenant_id,
      financialPeriodId: $this->resolvePeriod($invoice->association_id, $payment->payment_date),
      entryType:       'payment',
      sourceType:      'payment',
      sourceId:        $payment->id,
      entryDate:       $payment->payment_date,
      postingDate:     $payment->payment_date,
      description:     "Payment #{$payment->payment_number} — {$invoice->vendor->vendor_name}",
      correctionType:  CorrectionType::Original,
      idempotencyKey:  $idempotencyKey,
      lines: [
        new GlEntryLineDTO(
          glAccountId:     $invoice->gl_account_id,  // AP / expense account
          debit:           $payment->amount,
          credit:          Money::zero(),
          lineDescription: "Invoice #{$invoice->invoice_number}",
        ),
        new GlEntryLineDTO(
          glAccountId:     $payment->bankAccount->gl_account_id,  // cash
          debit:           Money::zero(),
          credit:          $payment->amount,
          lineDescription: "Payment #{$payment->payment_number}",
        ),
      ]
    );
  }

  private function deriveKey(string $eventType, string ...$ids): string {
    return hash('sha256', $eventType . ':' . implode(':', $ids));
  }
}`}</Block>
          </Section>

          <Section title="TransactionPostingJob — idempotent GL write">
            <Block>{`// app/Jobs/Accounting/TransactionPostingJob.php

class TransactionPostingJob implements ShouldQueue {
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public int $tries = 5;
  public int $backoff = 30;  // seconds

  public function __construct(private readonly GlEntryDTO $dto) {}

  public function handle(OutboxPublisher $publisher): void {
    DB::transaction(function () use ($publisher) {
      // Idempotency: ON CONFLICT DO NOTHING, then check if row was inserted
      $entryId = DB::selectOne("
        INSERT INTO gl_entries
          (id, association_id, tenant_id, financial_period_id, entry_type,
           source_type, source_id, entry_date, posting_date, description,
           status, correction_type, idempotency_key, total_debit, total_credit,
           posted_at, posted_by)
        VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?, ?, ?, NOW(), ?)
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id, (xmax = 0) AS inserted
      ", [...$this->dto->toBindings()])?->id;

      if (!$entryId) return;  // already exists — safe no-op

      // Insert lines
      GlEntryLine::insert(
        collect($this->dto->lines)->map(fn($l) => [
          ...$l->toArray(),
          'gl_entry_id'   => $entryId,
          'association_id' => $this->dto->associationId,
          'tenant_id'     => $this->dto->tenantId,
          'posting_date'  => $this->dto->postingDate,
        ])->all()
      );

      // Write outbox event — same transaction
      $publisher->write('gl.entry.posted', [
        'gl_entry_id'    => $entryId,
        'association_id' => $this->dto->associationId,
        'source_type'    => $this->dto->sourceType,
        'source_id'      => $this->dto->sourceId,
        'schema_version' => 1,
      ], $this->dto->tenantId, $this->dto->associationId);
    });
  }
}`}</Block>
          </Section>

          <Section title="Outbox processor — SELECT FOR UPDATE SKIP LOCKED">
            <Block>{`// app/Jobs/Outbox/ProcessOutboxBatchJob.php
// Runs every 5 seconds via Laravel scheduler. Multiple workers safe.

class ProcessOutboxBatchJob implements ShouldQueue {
  public function handle(EventDispatcherService $dispatcher): void {
    DB::transaction(function () use ($dispatcher) {
      $events = DB::select("
        SELECT * FROM event_outbox
        WHERE status = 'pending'
          AND available_at <= NOW()
          AND dead_lettered_at IS NULL
        ORDER BY available_at
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      ");

      foreach ($events as $event) {
        try {
          $dispatcher->dispatch($event);
          DB::statement(
            "UPDATE event_outbox SET status='processed', processed_at=NOW() WHERE id=?",
            [$event->id]
          );
        } catch (\Throwable $e) {
          $retryCount = $event->retry_count + 1;
          $isDead = $retryCount >= 5;
          DB::statement("
            UPDATE event_outbox SET
              retry_count    = ?,
              available_at   = NOW() + (? * INTERVAL '30 seconds'),
              dead_lettered_at = ?,
              dead_letter_reason = ?,
              error_message  = ?
            WHERE id = ?
          ", [
            $retryCount,
            $retryCount,                          -- exponential backoff
            $isDead ? now() : null,
            $isDead ? $e->getMessage() : null,
            $e->getMessage(),
            $event->id,
          ]);
          if ($isDead) {
            // Fire alert — do NOT throw, let other events in batch proceed
            DeadLetterAlert::fire($event, $e);
          }
        }
      }
    });
  }
}`}</Block>
          </Section>
        </div>
      )}

      {active === "api" && (
        <div>
          <Section title="Build order with dependency chain">
            <Note type="info">Build in this exact sequence. Each group depends on the previous being stable and tested.</Note>

            {[
              {
                phase: "Phase 1 — infrastructure (no business logic yet)",
                color: "gray",
                items: [
                  { order: 1, method: "GET", path: "/api/v1/health", note: "Verifies DB connection, Redis, tenant context var setting. First endpoint every dev tests." },
                  { order: 2, method: "GET", path: "/api/v1/associations/{id}/gl-groups", note: "Read-only seed data. Tests that RLS and tenant middleware work end-to-end." },
                  { order: 3, method: "GET", path: "/api/v1/associations/{id}/financial-periods", note: "Validate overlap exclusion constraint is working before any writes." },
                  { order: 4, method: "POST", path: "/api/v1/associations/{id}/financial-periods/{id}/open", note: "First write endpoint. Tests period state machine enforcement." },
                ],
              },
              {
                phase: "Phase 2 — chart of accounts",
                color: "purple",
                items: [
                  { order: 5, method: "GET",  path: "/api/v1/associations/{id}/gl-accounts", note: "Requires: gl-groups." },
                  { order: 6, method: "POST", path: "/api/v1/associations/{id}/gl-accounts", note: "Validate: account_number uniqueness per association, valid gl_group_id." },
                  { order: 7, method: "PUT",  path: "/api/v1/gl-accounts/{id}", note: "Validate: cannot change account_type if transaction history exists." },
                  { order: 8, method: "POST", path: "/api/v1/gl-accounts/{id}/deactivate", note: "Validate: no open GL entries on this account." },
                ],
              },
              {
                phase: "Phase 3 — general ledger",
                color: "purple",
                items: [
                  { order: 9,  method: "POST", path: "/api/v1/associations/{id}/gl-entries", note: "Draft only. Validates structure, not balance." },
                  { order: 10, method: "GET",  path: "/api/v1/associations/{id}/gl-entries", note: "REQUIRES mandatory filter param enforcement — reject 422 if no period_id/account_id/date range." },
                  { order: 11, method: "GET",  path: "/api/v1/gl-entries/{id}", note: "Includes lines, audit trail link." },
                  { order: 12, method: "POST", path: "/api/v1/gl-entries/{id}/post", note: "Validates balance. Dispatches TransactionPostingJob. Returns 202 Accepted." },
                  { order: 13, method: "POST", path: "/api/v1/gl-entries/{id}/reverse", note: "Requires reversal_date in body. Posts to reversal_date's period." },
                  { order: 14, method: "GET",  path: "/api/v1/associations/{id}/reports/trial-balance", note: "Reads from ledger_period_snapshots for closed periods, from live GL for open." },
                ],
              },
              {
                phase: "Phase 4 — banking",
                color: "teal",
                items: [
                  { order: 15, method: "POST", path: "/api/v1/associations/{id}/bank-accounts", note: "Requires: valid gl_account_id that is a cash account type." },
                  { order: 16, method: "GET",  path: "/api/v1/bank-accounts/{id}/register", note: "REQUIRES date range or reconciliation_id filter." },
                  { order: 17, method: "POST", path: "/api/v1/bank-accounts/{id}/manual-entry", note: "Dispatches TransactionPostingJob. Updates BankBalanceProjector." },
                  { order: 18, method: "POST", path: "/api/v1/bank-register-entries/{id}/void", note: "Cannot void reconciled entries. Cannot void in closed period." },
                ],
              },
              {
                phase: "Phase 5 — vendors + AP",
                color: "teal",
                items: [
                  { order: 19, method: "POST", path: "/api/v1/associations/{id}/vendors", note: "Validate: vendor_scope, required compliance fields." },
                  { order: 20, method: "POST", path: "/api/v1/vendors/{id}/documents", note: "Uploads to blob storage, creates vendor_document record." },
                  { order: 21, method: "POST", path: "/api/v1/associations/{id}/invoices", note: "Validates vendor is not on hold, COI status, builds approval chain." },
                  { order: 22, method: "POST", path: "/api/v1/invoices/{id}/submit", note: "Triggers approval workflow." },
                  { order: 23, method: "POST", path: "/api/v1/invoices/{id}/approve-step", note: "Validates role, advances step_order." },
                  { order: 24, method: "POST", path: "/api/v1/invoices/{id}/reject-step", note: "Unlocks invoice for editing." },
                  { order: 25, method: "POST", path: "/api/v1/invoices/{id}/payments", note: "Requires fully-approved status. Dispatches TransactionPostingJob." },
                ],
              },
              {
                phase: "Phase 6 — reconciliation",
                color: "amber",
                items: [
                  { order: 26, method: "POST", path: "/api/v1/bank-accounts/{id}/reconciliations", note: "Creates session. Statement import is async." },
                  { order: 27, method: "POST", path: "/api/v1/reconciliations/{id}/import-statement", note: "Returns job_id. Client polls /jobs/{id}/status." },
                  { order: 28, method: "GET",  path: "/api/v1/jobs/{id}/status", note: "Generic job status endpoint. Required before import endpoint is usable." },
                  { order: 29, method: "POST", path: "/api/v1/reconciliations/{id}/auto-match", note: "Runs matching algorithm against imported_bank_transactions." },
                  { order: 30, method: "POST", path: "/api/v1/reconciliations/{id}/match", note: "Manual match. Validates amounts agree." },
                  { order: 31, method: "POST", path: "/api/v1/reconciliations/{id}/complete", note: "Validates difference = 0. Locks all matched register entries." },
                ],
              },
              {
                phase: "Phase 7 — period close + reports",
                color: "amber",
                items: [
                  { order: 32, method: "POST", path: "/api/v1/associations/{id}/financial-periods/{id}/close", note: "Dispatches BuildPeriodSnapshotJob. Returns 202." },
                  { order: 33, method: "POST", path: "/api/v1/associations/{id}/financial-periods/{id}/reopen", note: "Requires finance_admin + step-up auth." },
                  { order: 34, method: "GET",  path: "/api/v1/associations/{id}/reports/balance-sheet", note: "Reads snapshot for closed periods." },
                  { order: 35, method: "GET",  path: "/api/v1/associations/{id}/reports/income-statement", note: "Reads snapshot for closed periods." },
                  { order: 36, method: "POST", path: "/api/v1/associations/{id}/financial-periods/{id}/year-end-close", note: "Elevated permission. Writes gl_account_yearly_rollup." },
                ],
              },
            ].map(group => (
              <div key={group.phase} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>{group.phase}</div>
                {group.items.map(item => (
                  <div key={item.order} style={{
                    display: "grid", gridTemplateColumns: "28px 64px 1fr",
                    gap: 10, padding: "6px 0",
                    borderBottom: "1px solid var(--color-border-tertiary)",
                    alignItems: "start",
                  }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", paddingTop: 2 }}>#{item.order}</span>
                    {pill(item.method === "GET" ? "teal" : item.method === "POST" ? "purple" : "amber", item.method)}
                    <div>
                      <Code>{item.path}</Code>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: 8 }}>{item.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </Section>

          <Section title="Validation patterns — apply consistently">
            <Block>{`// Every write endpoint uses a FormRequest. Never validate in controller.

// Pattern 1: period lock check (reuse across all financial writes)
trait ValidatesOpenPeriod {
  protected function validatePeriodIsOpen(string $associationId, Carbon $date): void {
    $period = FinancialPeriod::forDate($associationId, $date);
    abort_if(!$period, 422, 'No financial period found for date ' . $date->toDateString());
    abort_if($period->status !== PeriodStatus::Open, 422,
      "Financial period '{$period->period_name}' is {$period->status->value}. Cannot post."
    );
  }
}

// Pattern 2: mandatory filter enforcement (GL list endpoint)
class ListGlEntriesRequest extends FormRequest {
  public function rules(): array {
    return [
      'period_id'  => ['sometimes', 'uuid', 'exists:financial_periods,id'],
      'account_id' => ['sometimes', 'uuid', 'exists:gl_accounts,id'],
      'date_from'  => ['sometimes', 'date', 'required_with:date_to'],
      'date_to'    => ['sometimes', 'date', 'required_with:date_from', 'after_or_equal:date_from'],
      'cursor'     => ['sometimes', 'string'],
      'limit'      => ['sometimes', 'integer', 'min:1', 'max:200'],
    ];
  }
  public function withValidator($validator): void {
    $validator->after(function ($v) {
      if (!$this->period_id && !$this->account_id && !$this->date_from) {
        $v->errors()->add('filter', 'At least one filter is required: period_id, account_id, or date_from+date_to');
      }
    });
  }
}

// Pattern 3: money amounts — always use strings in API, never float
// Request: "amount": "1250.00"  (string)
// Stored: NUMERIC(19,4)
// Never: "amount": 1250.00  (float — precision loss risk)
'amount' => ['required', 'string', 'regex:/^\\d+\\.\\d{2}$/']`}</Block>
          </Section>
        </div>
      )}

      {active === "sprints" && (
        <div>
          <Note type="info">7 sprints × 2 weeks = 14 weeks to production-ready MVP. Assumes 2 backend engineers. Click each sprint to expand.</Note>
          <Note type="warning">Backend and frontend sprints are offset by 1 sprint intentionally — backend builds the API, frontend consumes it the following sprint. Never let them share a sprint boundary on the same feature.</Note>
          <div style={{ marginTop: 16 }}>
            {[
              {
                sprint: "Sprint 1", color: "purple",
                title: "Foundation — tenant isolation + chart of accounts",
                goal: "The hardest, least visible sprint. Nothing works until this is right. Every subsequent sprint depends on correct tenant context propagation and period overlap enforcement.",
                tables: ["tenants","associations","gl_groups","users","financial_periods","financial_period_transitions","gl_accounts","gl_account_yearly_rollup","audit_logs"],
                apis: ["GET /health","GET /gl-groups","GET /financial-periods","POST /financial-periods/{id}/open","GET /gl-accounts","POST /gl-accounts","PUT /gl-accounts/{id}","POST /gl-accounts/{id}/deactivate"],
                services: ["SetTenantContext","AssociationScope","TenantContext","ChartOfAccountsService","PeriodCloseService (open only)","AuditService"],
                jobs: [],
                events: [],
                dod: [
                  "TenantIsolationTest suite passes: cross-tenant read returns zero rows, not an error",
                  "current_setting RLS policy fires on every financial table",
                  "Period overlap exclusion constraint rejects overlapping date ranges",
                  "GL account deactivation blocked when transaction history exists",
                  "All endpoints return 403 without valid tenant context",
                  "Audit log entry written for every gl_account write",
                ],
              },
              {
                sprint: "Sprint 2", color: "purple",
                title: "General ledger — post, reverse, trial balance",
                goal: "The accounting core. A fully working double-entry ledger with idempotent posting, period lock enforcement, and trial balance report from live GL.",
                tables: ["gl_entries","gl_entry_lines","event_outbox","ledger_period_snapshots"],
                apis: ["POST /gl-entries","GET /gl-entries (with mandatory filter)","GET /gl-entries/{id}","POST /gl-entries/{id}/post","POST /gl-entries/{id}/reverse","GET /reports/trial-balance"],
                services: ["JournalEntryService","AccountingEntryFactory","TransactionPostingJob","OutboxPublisher"],
                jobs: ["TransactionPostingJob","ProcessOutboxBatchJob (skeleton)"],
                events: ["gl.entry.created","gl.entry.posted","gl.entry.reversed"],
                dod: [
                  "Unbalanced entry (debit ≠ credit) returns 422 with field-level error",
                  "Duplicate posting attempt (same idempotency_key) returns existing entry, not a 500",
                  "Post to closed period returns 422 with period name in message",
                  "Reversal creates offsetting entry in the correct period for reversal_date",
                  "Trial balance sums to zero (assets = liabilities + equity)",
                  "ProcessOutboxBatchJob processes batch without row contention under concurrent workers",
                ],
              },
              {
                sprint: "Sprint 3", color: "teal",
                title: "Banking — accounts, register, balance projector",
                goal: "Bank accounts linked to GL cash accounts. Register entries created by all source types. BankBalanceProjector is the sole owner of cached_book_balance.",
                tables: ["bank_accounts","bank_register_entries"],
                apis: ["GET /bank-accounts","POST /bank-accounts","GET /bank-accounts/{id}/register","POST /bank-accounts/{id}/manual-entry","POST /bank-register-entries/{id}/void"],
                services: ["BankRegisterService","BankBalanceProjector","DepositService","TransferService"],
                jobs: ["BankBalanceProjector (event listener)"],
                events: ["bank_register.entry.created","bank_register.entry.voided"],
                dod: [
                  "Bank account creation fails if gl_account_id is not a cash-type account",
                  "Void blocked on reconciled entries",
                  "Void blocked in closed period",
                  "cached_book_balance matches sum of bank_register_entries for the account",
                  "No service other than BankBalanceProjector has a DB write to cached_book_balance (grep test)",
                  "Manual entry creates both register entry and GL entry atomically",
                ],
              },
              {
                sprint: "Sprint 4", color: "teal",
                title: "Vendors + AP workflow — invoices, approvals, payments",
                goal: "Full AP lifecycle: vendor → invoice → approval chain → payment → GL entries. Vendor hold and COI checks gate invoice creation.",
                tables: ["vendors","vendor_documents","invoices","invoice_approval_steps","payments"],
                apis: ["GET /vendors","POST /vendors","GET /vendors/{id}","POST /vendors/{id}/hold","POST /vendors/{id}/unhold","POST /vendors/{id}/documents","POST /invoices","POST /invoices/{id}/submit","POST /invoices/{id}/approve-step","POST /invoices/{id}/reject-step","POST /invoices/{id}/payments","POST /invoices/{id}/void"],
                services: ["InvoiceWorkflowService","VendorComplianceService","AccountingEntryFactory.fromInvoicePaid"],
                jobs: ["TransactionPostingJob (payment path)","VendorComplianceCheckJob (skeleton)"],
                events: ["invoice.created","invoice.submitted","invoice.approved","invoice.paid","invoice.voided","payment.created","payment.voided","vendor.hold.placed"],
                dod: [
                  "Invoice creation blocked when vendor is on hold",
                  "Invoice creation produces warning (not block) when COI expired, per association config",
                  "Approved invoice locked — PUT /invoices/{id} returns 422",
                  "Payment dispatches TransactionPostingJob and creates register entry",
                  "Void creates offsetting GL entry (does not delete original)",
                  "Approval step validates role — wrong role returns 403",
                  "Full AP lifecycle test: create → submit → approve all steps → pay → verify GL balance",
                ],
              },
              {
                sprint: "Sprint 5", color: "teal",
                title: "Deposits, transfers, period close + snapshots",
                goal: "Complete the transaction set. Period close triggers snapshot build. Reports read from snapshots for closed periods.",
                tables: ["deposits","transfers","ledger_period_snapshots (write path)"],
                apis: ["GET /deposits","POST /deposits","POST /deposits/{id}/post","POST /deposits/{id}/void","GET /transfers","POST /transfers","POST /transfers/{id}/post","POST /transfers/{id}/void","POST /financial-periods/{id}/close","POST /financial-periods/{id}/reopen","GET /reports/balance-sheet","GET /reports/income-statement"],
                services: ["DepositService","TransferService","PeriodCloseService (close/reopen)","ReportSnapshotService","FinancialReportingService (snapshot reads)"],
                jobs: ["BuildPeriodSnapshotJob"],
                events: ["deposit.posted","transfer.posted","financial_period.closed","financial_period.reopened","system.report_snapshot.completed"],
                dod: [
                  "Period close dispatches BuildPeriodSnapshotJob, returns 202",
                  "Balance sheet reads from snapshot — verified by disabling OLTP queries in test and asserting report still returns",
                  "Reopen marks snapshot stale, re-close builds new snapshot",
                  "Transfer creates two register entries and one balancing GL entry atomically",
                  "Reopen blocked without finance_admin role",
                  "Year-end close endpoint reachable (returns 501 Not Implemented placeholder)",
                ],
              },
              {
                sprint: "Sprint 6", color: "amber",
                title: "Reconciliation + statement import",
                goal: "Full bank reconciliation workflow including async statement import, auto-match, manual match, and completion lock.",
                tables: ["reconciliation_sessions","reconciliation_items","bank_statement_imports","imported_bank_transactions","gl_entry_lines partitioning migration"],
                apis: ["POST /bank-accounts/{id}/reconciliations","GET /reconciliations/{id}","POST /reconciliations/{id}/import-statement","GET /jobs/{id}/status","POST /reconciliations/{id}/auto-match","POST /reconciliations/{id}/match","POST /reconciliations/{id}/unmatch","POST /reconciliations/{id}/complete"],
                services: ["ReconciliationService","StatementImportJob"],
                jobs: ["StatementImportJob (async, OFX + CSV)"],
                events: ["reconciliation.completed","reconciliation.item.matched","reconciliation.item.unmatched","statement_import.completed"],
                dod: [
                  "Statement import is async — POST returns job_id within 200ms regardless of file size",
                  "GET /jobs/{id}/status reflects real import progress",
                  "Auto-match correctly matches by amount + date within 3-day window",
                  "Complete blocked when difference ≠ 0",
                  "Complete locks all matched register entries (reconciled=true)",
                  "gl_entry_lines partitioning migration runs without data loss (validated by row count before/after)",
                  "Unreconcile blocked in closed period",
                ],
              },
              {
                sprint: "Sprint 7", color: "amber",
                title: "Year-end close, remaining reports, notifications, dead-letter ops",
                goal: "Everything needed to go live: year-end close, full report set, notifications, 1099 summary, dead-letter management, and the vendor compliance nightly job.",
                tables: ["notifications","gl_account_yearly_rollup (write path)"],
                apis: ["POST /financial-periods/{id}/year-end-close","GET /reports/gl-history","GET /reports/bank-register","GET /reports/bank-reconciliation","GET /reports/invoices","GET /reports/vendors","GET /reports/income-statement-by-month","GET /vendors/{id}/1099-summary","GET /me/notifications","POST /me/notifications/read-all","GET /system/dead-letter-events","POST /system/dead-letter-events/{id}/replay"],
                services: ["PeriodCloseService.runYearEndClose","VendorComplianceService (full)","FinancialReportingService (remaining reports)"],
                jobs: ["VendorComplianceCheckJob (nightly, full)","ProcessOutboxBatchJob (dead-letter handling)"],
                events: ["vendor.coi.expiring","vendor.coi.expired","vendor.w9.received","financial_period.year_end_close_completed","system.event.dead_lettered"],
                dod: [
                  "Year-end close requires finance_admin + step-up auth (MFA re-prompt)",
                  "Year-end close writes gl_account_yearly_rollup for every income/expense account",
                  "Retained earnings transfer entry is a valid posted GL entry with correction_type=original",
                  "Dead-letter event triggers alert within 60 seconds of retry_count reaching 5",
                  "Replay endpoint re-queues dead-letter event and resets retry_count to 0",
                  "1099 summary aggregates payment amounts correctly by calendar year",
                  "Nightly compliance job marks COI as expiring_soon (30-day window) and fires events",
                  "All report endpoints return sub-200ms for closed periods (snapshot reads)",
                  "Full end-to-end test: fiscal year open → transactions → close → year-end → next year open",
                ],
              },
            ].map(s => <SprintCard key={s.sprint} {...s} />)}
          </div>
        </div>
      )}

      {active === "critical" && (
        <div>
          <Note type="danger">These five things must exist and be correct before any other sprint is meaningful. If any of them is wrong, you will rebuild large parts of the system.</Note>

          <Section title="1 — Tenant context middleware + RLS (day 1–3)">
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
              Build <Code>SetTenantContext</Code> middleware and RLS policies on day 1. Write the <Code>TenantIsolationTest</Code> suite on day 2. Run it on every CI push from that point forward. Every other service, job, and migration depends on this being correct.
            </p>
            <Note type="warning">The most common failure mode: the middleware runs but the PostgreSQL session variable is set on a different connection than the query runs on (connection pool reuse). Test this explicitly by running 1000 concurrent requests and checking for cross-tenant rows in the response logs.</Note>
          </Section>

          <Section title="2 — Money.php value object (day 1)">
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
              Before any service writes a dollar amount, create an immutable <Code>Money</Code> value object that wraps <Code>bcmath</Code> operations and stores values as strings internally. All arithmetic (<Code>add</Code>, <Code>subtract</Code>, <Code>equals</Code>) uses <Code>bccomp</Code>/<Code>bcadd</Code> with 4 decimal places. Never use PHP floats for money — ever.
            </p>
            <Block>{`final class Money {
  private function __construct(private readonly string $amount) {
    if (!preg_match('/^-?\\d+\\.\\d{4}$/', $amount)) {
      throw new InvalidArgumentException("Invalid money: $amount");
    }
  }
  public static function of(string|int $amount): self {
    return new self(number_format((float)$amount, 4, '.', ''));
  }
  public static function zero(): self { return new self('0.0000'); }
  public function add(Money $other): self { return new self(bcadd($this->amount, $other->amount, 4)); }
  public function equals(Money $other): bool { return bccomp($this->amount, $other->amount, 4) === 0; }
  public function toStorage(): string { return $this->amount; }
}`}</Block>
          </Section>

          <Section title="3 — AccountingEntryFactory tests (before any job runs)">
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
              The factory is pure and has no DB dependencies — write exhaustive unit tests for every source type before <Code>TransactionPostingJob</Code> is built. Test that debits equal credits, that the correct accounts are used, and that idempotency keys are deterministic (same input always produces same key). These tests are your accounting correctness proof.
            </p>
          </Section>

          <Section title="4 — TransactionPostingJob idempotency (before any payment flows)">
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
              Run this test before wiring any event-driven payment flows: dispatch the same job twice with identical input. Assert exactly one <Code>gl_entry</Code> row exists. Assert the second dispatch returns the existing row's ID without error. This must pass before Sprint 4 begins.
            </p>
          </Section>

          <Section title="5 — Financial period state machine (before first close)">
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
              Before Sprint 5 starts, write a test that attempts every invalid state transition (e.g. <Code>draft → closed</Code>, <Code>open → reopened</Code>) and asserts they all return 422. Then write a test that attempts to post a GL entry to a closed period and asserts 422. These two tests protect the entire ledger's integrity going forward.
            </p>
          </Section>
        </div>
      )}

      {active === "risks" && (
        <div>
          <Note type="info">These are the places where real dev teams lose days or weeks. Flag them in your Sprint 1 kickoff. Assign ownership before the sprint starts.</Note>
          {[
            {
              severity: "high", area: "Infrastructure",
              risk: "PostgreSQL session vars and connection pool reuse",
              mitigation: "Use SET LOCAL (transaction-scoped) not SET SESSION. In Laravel, call set_config inside a DB::transaction or use the 'true' (transaction-local) flag in set_config. Write a concurrent load test on day 2 that fires 500 requests and checks for cross-tenant data bleed in responses.",
            },
            {
              severity: "high", area: "Accounting",
              risk: "Float arithmetic in money calculations",
              mitigation: "Enforce Money.php value object via custom PHPStan rule that disallows float literals in any file under app/Services or app/Jobs. Add to CI. One float slip in a payment calculation compounds over thousands of transactions.",
            },
            {
              severity: "high", area: "Migrations",
              risk: "gl_entry_lines partitioning migration on a live table",
              mitigation: "Do not run the partitioning migration during business hours. Script the backfill in 10,000-row batches with a 100ms sleep between batches. Test the full migration on a production-size data clone first. Have a rollback plan: the renamed gl_entry_lines_old table stays in place for 7 days.",
            },
            {
              severity: "high", area: "Concurrency",
              risk: "Bank balance double-update race condition",
              mitigation: "BankBalanceProjector must use SELECT ... FOR UPDATE on bank_accounts when recalculating. Use Redis SET NX for distributed locking on the recalculate path. Test with 50 concurrent deposits to the same bank account and assert the final balance matches the sum.",
            },
            {
              severity: "high", area: "Events",
              risk: "Outbox worker processes event but dies before marking processed",
              mitigation: "The SELECT FOR UPDATE SKIP LOCKED batch is inside a transaction. If the worker dies mid-batch, the transaction rolls back and all rows revert to pending. The next worker picks them up. Test this explicitly by killing the worker process mid-batch and verifying no events are lost or duplicated.",
            },
            {
              severity: "medium", area: "API",
              risk: "GL list endpoint returns 50k rows and kills the app server",
              mitigation: "Add mandatory filter middleware that fires before the controller. Return 422 immediately if no qualifying filter is present. Add a query execution time observer — log a warning if any GL query exceeds 500ms. Add a hard query timeout of 5 seconds at the DB level.",
            },
            {
              severity: "medium", area: "Accounting",
              risk: "Reversal posted to wrong period because reversal_date logic is unclear",
              mitigation: "reversal_date is always required in the request body for reversals. Never default to today. The period lookup uses reversal_date, not the original entry's posting_date. Write an explicit test: reverse a December entry in January, assert the reversal lands in January's period.",
            },
            {
              severity: "medium", area: "Migrations",
              risk: "GIST overlap constraint fails to install because btree_gist extension is not enabled",
              mitigation: "Migration 011 must start with: CREATE EXTENSION IF NOT EXISTS btree_gist; This is not installed by default on RDS/Cloud SQL. Add it to your database provisioning script and verify it exists in all environments before Sprint 1 ends.",
            },
            {
              severity: "medium", area: "AP",
              risk: "Invoice approval chain built at wrong time — role changes after chain is built",
              mitigation: "Approval chain is built at submit time, not create time. If an approver's role changes after the chain is built, that step must be re-evaluated at act time (approve/reject). Validate role at the moment of the action, not when the chain was constructed.",
            },
            {
              severity: "medium", area: "Reporting",
              risk: "ReportSnapshotService runs during period close and takes 30+ seconds on large associations",
              mitigation: "Period close returns 202 immediately and dispatches BuildPeriodSnapshotJob to the queue. The close action itself only updates the period status. Reports for the period show a 'snapshot building' state until the job completes. Never make snapshot building synchronous.",
            },
            {
              severity: "medium", area: "Reconciliation",
              risk: "Statement import OFX/CSV parser fails on bank-specific format variations",
              mitigation: "Use a battle-tested OFX parser library, not hand-rolled. Build a StatementParserFactory that selects the parser by file extension and validates the output schema before any rows are inserted. Capture raw file to blob storage before parsing — you will need to re-parse.",
            },
            {
              severity: "low", area: "DevOps",
              risk: "Monthly partition creation job is never set up and partitions run out",
              mitigation: "Sprint 1 includes the CreateMonthlyPartitions artisan command. It runs on the 1st of every month via Laravel scheduler. Alert if it fails. Pre-create 12 months of future partitions on first deploy. A missing partition causes INSERT failures, not slow queries — it's a hard crash.",
            },
          ].map((r, i) => <RiskCard key={i} {...r} />)}
        </div>
      )}
    </div>
  );
}
