---
tags:
  - operations
  - runbook
  - daily
  - monitoring
aliases:
  - Runbook
  - Daily Ops
  - Morning Checklist
created: 2026-04-14
updated: 2026-04-14
---

# Daily Runbook

> [!info] This is the daily operations checklist for the Vera platform. The [[Automation Agents|automation agents]] run at 06:00 UTC (02:00 ET / 01:00 CT). By the time the team starts work, all overnight jobs should have completed.

---

## Morning Checklist (08:00 ET)

### 1. Check Discord Alerts

- [ ] Open the Discord alerts channel
- [ ] Verify all 16 agents reported results (success or counts)
- [ ] Flag any **failure** messages for immediate investigation
- [ ] Note any unusual counts (e.g., zero assessments posted, spike in late fees)

> [!warning] If Discord is **silent** (no messages during the 02:00 ET window), the cron job may not have fired. Check the Vercel dashboard immediately.

### 2. Review Sentry Errors

- [ ] Check Sentry dashboard for new errors since yesterday
- [ ] Prioritize: P0 (data loss/corruption) > P1 (broken workflow) > P2 (UI issue)
- [ ] Assign any new errors to the engineering team

### 3. Check Health Endpoint

- [ ] Verify `/api/health` returns 200
- [ ] If down, follow [[Incident Response]] procedures

### 4. Review Financial Agents

- [ ] **Post Assessments** — Check Discord for count of assessments posted
- [ ] **Late Fees** — Review late fee count and total amount
- [ ] **Payment Plans** — Check for any auto-defaulted plans (needs CAM review)
- [ ] **Collection Escalation** — Review escalated accounts (may need attorney notification)

### 5. Review Operational Agents

- [ ] **Violation Escalation** — Check escalated violations (CAMs should follow up)
- [ ] **Meeting Packets** — Verify packets generated for upcoming meetings (14-day window)
- [ ] **Recurring Work Orders** — Confirm work orders created for scheduled maintenance

### 6. Review Intelligence Agents

- [ ] **Financial Health** — Note any communities with flagged delinquency rates
- [ ] **Client Retention** — Review any churn risk alerts
- [ ] **Sales Intelligence** — Check for stale leads needing attention
- [ ] **Cross-Sell** — Forward opportunities to appropriate sister companies
- [ ] **Competitive Intel** — Note any pricing benchmark changes

---

## Cron Schedule

| Time (UTC) | Time (ET) | Job | Description |
|------------|-----------|-----|-------------|
| 06:00 | 02:00 | `/api/cron/run-all` | Master orchestrator — triggers all agents |

### Agent Execution Order

The `run-all` orchestrator executes agents in this order:
1. **Parallel batch 1**: Late fees, payment plans, manager reports
2. **Sequential**: Assessment posting (monthly, on billing day)
3. **Parallel batch 2**: Violation escalation, collection escalation
4. **Parallel batch 3**: Intelligence agents (sales, financial, retention, cross-sell, competitive)
5. **Cleanup**: Alert processing

---

## Weekly Tasks

### Monday
- [ ] Review weekend agent reports (Sat + Sun ran unmonitored)
- [ ] Check weekly financial health summary
- [ ] Review stale CRM leads from sales intelligence

### Wednesday
- [ ] Mid-week delinquency check
- [ ] Review upcoming board meetings (next 14 days)
- [ ] Check vendor COI expirations

### Friday
- [ ] Week-end financial summary
- [ ] Review client retention scores
- [ ] Prepare weekend monitoring plan (who's on call)

---

## Monthly Tasks

### 1st Business Day
- [ ] Verify all associations' assessments posted correctly
- [ ] Review previous month's late fee totals
- [ ] Check collection escalation pipeline status

### 15th (or nearest business day)
- [ ] Mid-month AR aging review
- [ ] Budget variance check for flagged communities
- [ ] Cross-sell opportunity pipeline review

### Last Business Day
- [ ] Month-end financial close preparation
- [ ] Verify bank reconciliation status for all accounts
- [ ] Review automation agent performance metrics

---

## Key Contacts

| Role | Responsibility | Escalation |
|------|---------------|------------|
| **On-Call Engineer** | Platform issues, agent failures | Sentry + Discord |
| **Accounting Lead** | Financial agent anomalies | Email + phone |
| **Director of Operations** | CAM workflow issues | Slack/Teams |
| **CEO (JR Riestra)** | Critical incidents, data breaches | Phone (immediate) |

---

*Related: [[Automation Agents]] · [[Incident Response]] · [[Portfolio Financial Health]] · [[Security]]*
