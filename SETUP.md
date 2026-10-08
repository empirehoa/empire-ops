# Setting up Empire Ops

About 30 minutes, in this order. Each step says who does it and why.

## 1. Database (Supabase): already created
The project exists: **empire-ops**, ref `pwbksvynffxuvvlefprm`, region us-east-1,
URL `https://pwbksvynffxuvvlefprm.supabase.co`. Migration `0001_empire_ops_schema`
is applied. The old Vera project was paused (not deleted) on October 8, 2026.

What is left for you:
1. Settings > API: copy the anon key and the service role key for step 3.
   The service role key is a full-access secret: put it only in Vercel, never in chat or code.
2. Authentication > URL Configuration: set Site URL to your Vercel URL and add
   `https://<your-vercel-url>/auth/callback` to Redirect URLs.
3. Authentication > Providers > Email: leave magic links on. Sign-in is limited to
   the addresses in `ADMIN_EMAILS`.

## 2. Create the app (Vercel)
1. vercel.com > Add New > Project > import `empirehoa/empire-ops`. Framework is detected.
2. Do not deploy yet; add the environment variables first (step 3).

## 3. Environment variables (Vercel > Project > Settings > Environment Variables)
Use `.env.example` as the checklist. Minimum to start:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Step 1 (URL above; keys from Settings > API) |
| `ADMIN_EMAILS` | Your work email (and anyone else who should see the data) |
| `AUTOMATION_SECRET`, `CRON_SECRET`, `TOKEN_ENCRYPTION_KEY` | Run `openssl rand -base64 32` three times, one value each. Without `CRON_SECRET` the daily run is refused. |
| `NEXT_PUBLIC_APP_URL` | The Vercel production URL |

Then deploy. Sign in at `/login` with an allowlisted email.

## 4. Connect HubSpot
1. HubSpot > Settings > Integrations > Private Apps > Create.
   Scopes: `crm.objects.deals.read`, `crm.objects.owners.read`.
2. Copy the token into `HUBSPOT_ACCESS_TOKEN` in Vercel and redeploy.
3. In Empire Ops: Integrations > HubSpot > Sync now.

## 5. Connect QuickBooks (once per company file)
1. developer.intuit.com > Create an app > QuickBooks Online and Payments.
   Redirect URI: `https://<your-vercel-url>/api/integrations/quickbooks/callback`.
2. Set `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REDIRECT_URI`,
   `QUICKBOOKS_ENVIRONMENT=production` in Vercel; redeploy.
   (Production keys require completing Intuit's app assessment; sandbox works immediately.)
3. In Empire Ops: Integrations > Connect, once for each of the four companies,
   signing in to the matching QuickBooks company file each time.

## 6. Load Vantaca data
Until Vantaca API credentials exist, data comes from exports:
1. In Vantaca, export the association list, AR aging by association, and open action items
   (Export to Excel).
2. In Empire Ops: Imports > choose the kind > upload > confirm the column mapping > Import.
   Import the association list first; the other two match rows to it.
3. Communities > mark every test or practice association. They are excluded from all figures.

## 7. Turn on delivery (optional)
- `DISCORD_WEBHOOK_URL`: create a **new** webhook (the old one was exposed in routine prompts).
- `NOTION_API_KEY`, `NOTION_INTELLIGENCE_PAGE_ID`: daily reports into Notion.
- `SENTRY_DSN`: error monitoring.

The daily run fires at 06:00 UTC (`vercel.json`): it syncs every connected source, then runs
the six agents. Check Integrations for the last sync time of each source.
