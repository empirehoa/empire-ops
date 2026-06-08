# Vera Platform — Employee Simplicity Audit

**Date:** 2026-04-08
**Perspective:** New Empire Management Group employee, first week, minimal training
**Platform stats:** 457 total dashboard pages, 271 association sub-pages, 48 association modules

---

## 1. Click Count Analysis: Common Tasks

### Post a Payment: 4 clicks
1. Click "Associations" in sidebar
2. Click the specific association
3. Click "Financials" > "Payments" in sub-nav (counts as 1 via sub-nav link)
4. Fill form and click "Submit"

**Notes:** Reasonably efficient. The PaymentForm is on a single page with property selector. No unnecessary intermediate screens.

### Create a Violation: 4 clicks
1. Click "Associations" in sidebar
2. Click the specific association
3. Click "Violations" in sub-nav, then "New" button (2 clicks)
4. Fill form (property, type, severity, description) and click "Submit"

**Notes:** Good. Form pre-loads property list and violation types. Photo upload available inline.

### Generate a Work Order: 4 clicks
1. Click "Associations" in sidebar
2. Click the specific association
3. Click "Work Orders" in sub-nav, then "New" button (2 clicks)
4. Fill form and click "Submit"

**Notes:** Good. Similar pattern to violations.

### Look Up a Homeowner Balance: 3-4 clicks
**Path A (via Owner Ledger):** Associations > [association] > Financials > Owner Ledger > search/filter
**Path B (via Command Palette):** Cmd+K > type owner name > click result > view balance on profile

**Notes:** Cmd+K search is the fastest path but requires knowing the shortcut. No prominent "search" button visible in the main UI for new users unfamiliar with keyboard shortcuts.

### Send a Broadcast Email: 5 clicks
1. Navigate to Communications > Bulk (or via sidebar "Text Blasting")
2. Select channel (Email)
3. Select recipients (filter by association, contact type)
4. Compose message (or select template)
5. Preview and click "Send"

**Notes:** Well-designed step wizard (recipients > message > preview > send). However, the entry point naming is confusing -- "Text Blasting" in the sidebar sounds SMS-only but actually handles email, SMS, WhatsApp, and letters.

### Quick Action (Dashboard): 2 clicks
The dashboard has a `CAMQuickActions` widget with 6 buttons: New Violation, New Work Order, New Action Item, Send Notice, Schedule Meeting, Ask VeraI. These open dialogs directly from the dashboard.

**Notes:** This is the best path for power users. However, the quick action dialogs are "stubs" for some actions (violation, work order, meeting) -- they show a dialog but may not have full form functionality inline, requiring navigation to the full form anyway.

---

## 2. What's Confusing?

### 2a. Similar-Sounding Menu Items

| Confusing Pair | What They Actually Are |
|---------------|----------------------|
| **"Text Blasting"** vs **"Communications"** | Text Blasting = bulk sends (sidebar). Communications = per-association message threads (sub-nav). Confusing because Text Blasting also does email, not just texts. |
| **"Inbox"** (sidebar) vs **"Inbox"** (association sub-nav) | Sidebar Inbox = global cross-community inbox. Sub-nav Inbox = association-specific email inbox. Same name, different scope. |
| **"Action Items"** (sidebar) vs **"Action Items"** (association sub-nav) | Sidebar = global action items. Sub-nav = association-scoped. Same name, different scope. |
| **"Escalations"** (sidebar) vs **"Collections"** (sub-nav) | Escalations = alert chains. Collections = financial delinquency. Related but different. |
| **"Finance Hub"** (sidebar) vs **"Financials"** (association sub-nav) | Finance Hub = company-wide financial dashboard. Financials = per-association accounting. Different scope, similar name. |
| **"Communications"** vs **"Messaging"** (both in association sub-nav) | Communications = formal notices and threads. Messaging = presumably informal/chat. Both exist as separate sub-nav items. |
| **"Certificates"** vs **"Estoppels"** | Certificates = insurance/compliance certificates. Estoppels = resale certificates. "Certificate" is overloaded. |
| **"Compliance"** vs **"Compliance Map"** | Compliance = deadline tracking. Compliance Map = visual community compliance overview. Adjacent items in sub-nav. |

### 2b. Pages That Look Similar But Do Different Things

- **Violations list page** and **ARC (Architectural Review) list page** have similar table layouts with status badges, but violations are CC&R enforcement while ARC is modification requests. A new employee could mistake one for the other.
- **Owner Ledger** and **Charges** are both in the Financials sub-nav and show similar tabular data about money owed. Owner Ledger is per-owner view; Charges is the raw charges table.
- **Board** (sidebar) and **Board Certifications** (association compliance sub-nav) are unrelated -- Board shows governance views while Board Certifications tracks director education requirements.

### 2c. Overwhelming Sub-Navigation

The association sub-nav has **48 items** across 5 groups (Core: 10, Operations: 13, Compliance: 10, Finance: 10, Programs: 7). A new employee seeing all 48 tabs will be overwhelmed. No progressive disclosure or role-based filtering on the sub-nav (unlike the sidebar which filters by role).

---

## 3. Terminology Inconsistencies

### The "Owner" Identity Crisis

The platform uses multiple terms for the same concept interchangeably:

| Term | Where Used | Count |
|------|-----------|-------|
| **"Owner"** | Sub-nav labels, owner-ledger, owner-onboarding, statement-generator | Primary term in code |
| **"Homeowner"** | 98 occurrences across 30+ files: analytics, scoring, notifications, rule descriptions | Used in user-facing text and AI contexts |
| **"Contact"** | Database schema (`contacts` table), API routes, onboarding service | Technical/internal term |
| **"Resident"** | 1 occurrence in en.ts locale file ("resident-impact work") | Rare |

**Impact:** When a new employee hears "look up the homeowner," they search for "homeowner" in the UI. But the sub-nav says "Owners" and the search indexes "contacts." The command palette searches for "contacts" internally but displays results with owner names.

**Recommendation:** Standardize on "Owner" in all UI labels. Reserve "Contact" for the data model layer only. Remove "Homeowner" from user-facing strings (keep it only in AI chatbot context where natural language is expected).

### Other Terminology Issues

| Inconsistency | Where |
|--------------|-------|
| **"Association"** vs **"Community"** | Sidebar says "Associations," quick links says "My Communities," lifecycle says "Community." Both refer to the same entity. |
| **"Work Order"** vs **"Maintenance Request"** | Sub-nav and forms say "Work Order." The new WO form says "maintenance or repair request" in its subtitle. Portal might say "Maintenance Request." |
| **"Action Item"** vs **"Task"** | Sidebar and sub-nav say "Action Items." Workflow templates call them "tasks" (`action_create_task`). Quick actions say "task or follow-up action item." |
| **"CAM"** vs **"Manager"** vs **"Property Manager"** | Code uses "manager" for the role. Industry term is "CAM" (Community Association Manager). Some UI says "Property Manager." |
| **"Assessment"** vs **"Dues"** vs **"Fee"** | Formal term is "assessment." Owners say "dues." Late fees are "fees." All appear in different contexts. |

---

## 4. Keyboard Shortcuts

### Currently Implemented

| Shortcut | Action | Location |
|----------|--------|----------|
| **Cmd+K** | Global search (command palette) | `command-palette.tsx` — searches associations, contacts, work orders, violations, vendors |
| **Cmd+J** | Community switcher | `community-switcher.tsx` — quick-switch between associations |
| **Escape** | Close dialogs/panels | Standard behavior via Radix UI primitives |
| **Arrow keys** | Navigate command palette results | Built into command palette |

### Missing Shortcuts (Opportunities)

| Suggested Shortcut | Action | Justification |
|-------------------|--------|---------------|
| **Cmd+N** | New (context-aware: violation, WO, payment depending on current page) | Most common action from any page |
| **Cmd+/** | Show all keyboard shortcuts | Standard help pattern |
| **Cmd+E** | Quick expense/payment entry | Accountants' most frequent action |
| **Cmd+Shift+V** | New violation (global) | Top 3 most frequent CAM action |
| **Cmd+Shift+W** | New work order (global) | Top 3 most frequent CAM action |
| **Cmd+Shift+A** | New action item (global) | Top 3 most frequent CAM action |
| **Cmd+.** | Ask VeraI (open AI chat panel) | Emerging power-user need |

---

## 5. Onboarding & Training Aids

### What Exists

| Aid | Status | Notes |
|-----|--------|-------|
| **Tooltips** | PARTIAL — Only on quick-action buttons and some sidebar items (via `description` field) | Not on form fields, not on financial concepts |
| **Role-based quick links** | YES — `QuickLinks` component shows 4 relevant links per role (accountant, manager, staff, inspector, director, board_member) | Good starting point for new users |
| **Next-Best-Action widget** | YES — `NbaWidget` shows prioritized daily tasks (invoice approvals, violation escalations, meeting packets, delinquency items) | Excellent for reducing decision fatigue |
| **CAM Quick Actions** | YES — 6-button floating action panel on dashboard | Good for common tasks |
| **Breadcrumbs** | YES — `SEGMENT_LABELS` provides human-readable labels for 80+ route segments | Helps with orientation |
| **Language toggle** | YES — English/Spanish i18n via locale cookie | Good for Empire's FL workforce |
| **Accessibility panel** | YES — In sidebar footer | Compliance requirement met |

### What's Missing

| Missing Aid | Impact | Effort |
|------------|--------|--------|
| **Interactive onboarding tour** | New employees have no guided walkthrough. First login dumps them on the dashboard with 457 pages available. | MEDIUM — Could use react-joyride or similar |
| **Contextual help text on forms** | Financial forms (payment posting, assessment generation, journal entries) have no inline help. New accountants must be trained externally. | LOW — Add `description` props to form fields |
| **"What is this?" info icons** | Compliance deadlines (FS 718/719/720), financial terms (AR aging buckets, GL accounts), and violation severity levels have no explanations. | LOW — Add info popovers |
| **Keyboard shortcut reference sheet** | Only Cmd+K and Cmd+J exist. No way to discover them except trial and error. | LOW — Add Cmd+/ shortcut overlay |
| **Empty state guidance** | When a new association has no violations, work orders, or financials, the empty pages show generic "no data" messages instead of "Here's how to get started." | LOW — Add CTA-rich empty states |
| **Role-specific dashboard** | All roles see the same dashboard layout. An accountant doesn't need the violation widget; an inspector doesn't need the finance hub link. | MEDIUM — Dashboard already has role-based quick links; extend to full layout |
| **Search tutorial** | Cmd+K command palette supports 5 entity types but new users don't know. First-use hint would help. | LOW |
| **Video tutorials / knowledge base** | No embedded training content. Knowledge base page exists (`/knowledge-base`) but appears to be for community documents, not platform training. | HIGH — Content creation needed |

---

## 6. Specific Improvement Recommendations

### Quick Wins (< 1 day each)

1. **Rename "Text Blasting" to "Broadcast"** in navigation-config.ts — it handles email, SMS, WhatsApp, and letters, not just text.

2. **Add role-based filtering to association sub-nav** — An inspector doesn't need Finance (10 items), Programs (7 items), or half of Operations. Filter `associationSubNavGroups` by user role like the sidebar already does.

3. **Add form field descriptions** — Every financial form should have a `<p className="text-xs text-muted-foreground">` explaining what the field does.

4. **Add Cmd+/ keyboard shortcut overlay** — A modal listing all available shortcuts.

5. **Standardize terminology** — Global find-and-replace "homeowner" -> "owner" in all user-facing strings (keep in AI/NLP contexts).

### Medium Effort (1-3 days each)

6. **Disambiguate overlapping names** — Rename association-level "Inbox" to "Community Inbox", sidebar "Inbox" to "My Inbox", association-level "Action Items" to "Community Tasks."

7. **Add onboarding tour** — 8-step guided tour on first login: Dashboard, Associations, Search (Cmd+K), Switcher (Cmd+J), Quick Actions, VeraI, Notifications, Settings.

8. **Smart empty states** — Replace "No violations found" with "No violations yet. Click 'New Violation' to report a CC&R issue, or run a community inspection to bulk-create violations."

9. **Reduce sub-nav overwhelm** — Collapse the 48-item association sub-nav into an expandable accordion with 5 groups defaulting to collapsed. Show only "Core" group expanded by default.

---

## 7. Overall Usability Score

| Dimension | Score (1-10) | Notes |
|-----------|-------------|-------|
| **Task efficiency** | 7/10 | 3-5 clicks for most tasks. Quick actions help. |
| **Navigation clarity** | 5/10 | 48-item sub-nav overwhelm, duplicate names, terminology gaps |
| **New user friendliness** | 4/10 | No tour, no contextual help, no empty state guidance |
| **Keyboard productivity** | 3/10 | Only 2 shortcuts (Cmd+K, Cmd+J). No global new/create shortcut. |
| **Terminology consistency** | 5/10 | Owner/homeowner/contact confusion. Association/community split. |
| **Role appropriateness** | 7/10 | Sidebar filters by role. Sub-nav and dashboard don't. |
| **AI assistance** | 8/10 | VeraI playground, writing assistant, conversations, NBA widget. Excellent. |

**Overall: 5.6/10** — The platform is feature-complete but needs usability polish for the 63-employee team to be self-sufficient without heavy training.
