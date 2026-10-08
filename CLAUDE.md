# Empire Ops

Standalone operations-intelligence app for Riance LLC (Empire Management Group, Riance Realty,
Wind Fire & Water, FixIQ). Owner: JR Riestra. Fully independent of the Vera SaaS project
(Vera is run separately by Amanda's team on Azure): no shared code, database, or auth.

Stack: Next.js 16 (App Router, `src/proxy.ts` instead of middleware), TypeScript, Supabase
(own project), Tailwind v4, recharts, Vitest. Read `docs/ARCHITECTURE.md` before changing data
flow, and `node_modules/next/dist/docs/` before using unfamiliar Next 16 APIs.

## Rules
- Single organization: no tenant_id. All DB access is server-side via `createAdminClient()`;
  every table has RLS on with no policies.
- Admin pages call `requireAdminPage()`, admin APIs call `requireAdminApi()`,
  scheduled endpoints call `verifyAutomationSecret()`.
- Never fabricate numbers. If a source isn't connected, the UI and reports say so.
- Vantaca dummy-data gate: portfolio figures always exclude `communities.is_test`.
- Treat outputs as drafts for the responsible manager, CPA, or attorney; no legal or
  accounting advice; collections correspondence goes to counsel.
- Before a PR: `npm run typecheck && npm test && npm run build`.

## Brand
Navy #1C244B, Blue #1C74AC (actions), Coral #F98761 (attention only). Poppins for page
titles, Roboto for everything else. Tokens live in `src/app/globals.css`.

## Design stack (use on every page, report or artifact)
- **Brand:** the Empire Management Design System artifact (navy #1C244B, blue #1C74AC, coral as accent only, teal #2AA6A0; Poppins 300–500 for headings, Roboto for body, JetBrains Mono for money and percentages; navy-tinted shadows; sentence case; no emoji).
- **Metrics pages:** build them on Claude's Dashboard artifact type with live Supabase queries, so every number opens its source query. No serif numbers on dashboards.
- **Pages and tools:** plain artifacts in the design system. Motion uses GSAP (pinned version from cdnjs) and Lenis smooth scroll, only for a stated reason (hierarchy, sequence, feedback, state change), transform and opacity only, and none under prefers-reduced-motion. React Bits patterns (CountUp, SplitText, list stagger) are rebuilt in GSAP; React is not loaded for them.
- **Skills:** impeccable (shape, operate, craft floor) for product UI; taste-skill for landing pages and marketing pages only; anti-ui-slop finish gate: render desktop and phone in light and dark, fix, render again before calling it done; web-design-guidelines for the accessibility pass.
