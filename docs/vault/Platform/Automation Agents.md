---
tags:
  - platform
  - automation
  - cron
  - agents
aliases:
  - Agents
  - Automation
  - Cron Jobs
created: 2026-04-14
updated: 2026-04-14
---

# Automation Agents

> [!info] Vera runs 16 automation agents via Vercel cron (`/api/cron/run-all` at **06:00 UTC** daily). All agents post results to Discord and are protected by the `AUTOMATION_SECRET` header.

---

## Agent Architecture

```mermaid
graph TB
    CRON[Vercel Cron<br/>06:00 UTC Daily] --> RUNALL[/api/cron/run-all<br/>Orchestrator]

    subgraph Core["Core Operations (7)"]
        A1[Post Assessments]
        A2[Apply Late Fees]
        A3[Process Payment Plans]
        A4[Collection Escalation]
        A5[Escalate Violations]
        A6[Generate Meeting Packets]
        A7[Generate Recurring Work Orders]
    end

    subgraph Intel["Intelligence Agents (5)"]
        I1[Sales Intelligence]
        I2[Financial Health]
        I3[Client Retention]
        I4[Cross-Sell]
        I5[Competitive Intel]
    end

    subgraph Support["Support Agents (4)"]
        S1[Deliver Manager Reports]
        S2[Process Alerts]
        S3[Apply Late Fees v2]
        S4[Run-All Orchestrator]
    end

    RUNALL --> Core
    RUNALL --> Intel
    RUNALL --> Support

    Core --> DISCORD[Discord<br/>Alerts Channel]
    Intel --> DISCORD
    Support --> DISCORD

    style CRON fill:#1C244B,stroke:#1C74AC,color:#fff
    style DISCORD fill:#F98761,stroke:#1C244B,color:#fff
```

---

## Core Operations Agents

### 1. Post Assessments
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/post-assessments` |
| **Schedule** | Monthly (on each association's `billing_day`) |
| **What it does** | Auto-posts monthly assessment charges to owner ledgers |
| **Scope** | All active associations with configured assessment schedules |
| **Status** | LIVE |

### 2. Apply Late Fees
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/apply-late-fees` |
| **Schedule** | Daily |
| **What it does** | Applies late fees (flat, percentage, or daily) to overdue accounts |
| **Scope** | Owners past grace period with unpaid balances |
| **Status** | LIVE |

### 3. Process Payment Plans
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/payment-plans` |
| **Schedule** | Daily |
| **What it does** | Posts installment charges, marks late payments, auto-defaults non-performing plans |
| **Scope** | Active payment plans across all associations |
| **Status** | LIVE |

### 4. Collection Escalation
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/collection-escalation` |
| **Schedule** | Daily |
| **What it does** | Escalates delinquent accounts through collection stages (friendly reminder, demand letter, intent to lien, lien recording, foreclosure referral) |
| **Scope** | Accounts meeting escalation thresholds per association rules |
| **Status** | LIVE |

### 5. Escalate Violations
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/escalate-violations` |
| **Schedule** | Daily |
| **What it does** | Auto-advances violation status when response deadlines pass (courtesy -> 1st notice -> 2nd notice -> hearing -> fine) per FL statute timelines |
| **Scope** | Open violations past due date |
| **Status** | LIVE |

> [!tip] Violation escalation follows Florida statutory timelines: 14-day cure period, 14-day hearing notice, 5 business day decision notice, 30-day appeal window. These are hard-coded per FS 720.305.

### 6. Generate Meeting Packets
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/generate-meeting-packets` |
| **Schedule** | 14 days before scheduled board meetings |
| **What it does** | Auto-generates board meeting packets with agenda, financials, action items, violation summaries, and pending approvals |
| **Scope** | Meetings with `meeting_date` within 14 days |
| **Status** | LIVE |

### 7. Generate Recurring Work Orders
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/generate-recurring-work-orders` |
| **Schedule** | Daily |
| **What it does** | Creates work orders from recurring templates (pool maintenance, landscaping, elevator inspections, etc.) |
| **Scope** | Active recurring work order templates past their next trigger date |
| **Status** | LIVE |

---

## Intelligence Agents

### 8. Sales Intelligence
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/sales-intelligence` |
| **What it does** | Analyzes sales pipeline, detects stale leads, ranks lead quality, identifies conversion opportunities |
| **Outputs** | Pipeline health score, stale lead alerts, lead ranking updates |

### 9. Financial Health
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/financial-health` |
| **What it does** | Analyzes AR across all communities, calculates delinquency rates, detects budget variances, flags at-risk associations |
| **Outputs** | Portfolio health score, delinquency alerts, variance warnings |

### 10. Client Retention
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/client-retention` |
| **What it does** | Monitors community health scores and payment patterns for churn early warning signals |
| **Outputs** | Churn risk scores, retention intervention recommendations |

### 11. Cross-Sell
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/cross-sell` |
| **What it does** | Matches opportunities across [[Empire Management Group|EMG]], [[Wind Fire Water|WFW]], [[FixIQ]], and [[Riance Realty]] |
| **Outputs** | Cross-sell opportunity alerts, revenue estimates |

See [[Cross-Sell Matrix]] for the full opportunity map.

### 12. Competitive Intel
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/competitive-intel` |
| **What it does** | Benchmarks per-door fees against market, tracks competitor pricing and positioning |
| **Outputs** | Fee benchmark report, competitive alerts |

---

## Support Agents

### 13. Deliver Manager Reports
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/deliver-managers-reports` |
| **What it does** | Generates PDF reports and emails them to CAMs on their scheduled day |
| **Status** | LIVE |

### 14. Process Alerts
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/process-alerts` |
| **What it does** | Dequeues pending alerts and routes them to appropriate recipients |
| **Status** | LIVE |

### 15. Apply Late Fees v2
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/late-fees` |
| **What it does** | Enhanced late fee application with GL journal entry creation |
| **Status** | LIVE |

### 16. Run-All Orchestrator
| Field | Value |
|-------|-------|
| **Endpoint** | `/api/automation/run-all` |
| **What it does** | Orchestrates execution of agents #2, #5, and others in parallel |
| **Triggered by** | `/api/cron/run-all` at 06:00 UTC |
| **Status** | LIVE |

---

## Monitoring & Alerting

| Channel | Purpose |
|---------|---------|
| **Discord** | All agent results (success + failure) posted automatically |
| **Sentry** | Errors captured with full stack traces |
| **Health Endpoint** | `/api/health` for uptime monitoring |
| **Audit Log** | All automation actions recorded in `audit_events` |

> [!warning] All automation failures auto-post to Discord. If Discord is silent during the 06:00 UTC window, investigate whether the cron job fired. Check Vercel dashboard for cron execution logs.

---

## Security

- All automation endpoints require `AUTOMATION_SECRET` header
- Endpoints are not publicly accessible without the secret
- Each agent runs in its own request context with service-level permissions
- All state changes are logged to the audit trail

---

*Related: [[Daily Runbook]] · [[Architecture Overview]] · [[Incident Response]] · [[Cross-Sell Matrix]]*
