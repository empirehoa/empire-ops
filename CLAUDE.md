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
