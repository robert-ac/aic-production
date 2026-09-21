# AI lead sales research

This pipeline enriches every new `public.leads` row with public company and
professional research. Submitted facts stay untouched in `public.leads`; AI
output is stored separately in `public.lead_enrichments` and exposed to project
administrators through `public.sales_leads_dashboard`.

## What ships in this repository

- `supabase/migrations/202609210001_lead_sales_research.sql`
  - adds the optional submitted company website
  - creates the private enrichment table, work-claim function and joined view
  - creates a pending enrichment job after every new lead insert
- `supabase/functions/enrich-lead/index.ts`
  - resolves the company from website, work-email domain and submitted details
  - calls the OpenAI Responses API with web search and a strict JSON schema
  - stores citations, confidence, fit, sales angle and recommended next action
  - marks ambiguous matches `needs_review`
  - retries failed jobs and optionally mirrors finished rows to Google Sheets
- `integrations/google-sheets/Code.gs`
  - optional Apps Script receiver that upserts rows by `lead_id`

## 1. Apply the migration

Link the Supabase CLI to the existing AIC project, then run:

```bash
supabase db push
```

Apply the database migration before publishing the updated contact form. The
form will send the new `company_website` field, so the column must exist first.

Existing leads are intentionally not queued automatically because researching
them can create unexpected API cost. To opt in selected historical leads:

```sql
insert into public.lead_enrichments (lead_id, status)
select id, 'pending'
from public.leads
where id in (101, 102, 103)
on conflict (lead_id) do update
set status = 'pending', attempts = 0, next_retry_at = null;
```

## 2. Set server-side secrets

Generate a long random webhook secret. Never put these values in website
JavaScript or commit them to Git.

```bash
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_KEY
supabase secrets set OPENAI_MODEL=gpt-5.5
supabase secrets set LEAD_RESEARCH_WEBHOOK_SECRET=YOUR_LONG_RANDOM_SECRET
```

`OPENAI_MODEL` is configurable so the model can be changed without editing or
redeploying the function.

## 3. Deploy the Edge Function

```bash
supabase functions deploy enrich-lead
```

JWT verification is enabled, matching the live Dashboard configuration.
Database webhook and Cron requests must include `Authorization: Bearer
YOUR_LEGACY_ANON_JWT` as well as the private `x-aic-webhook-secret` header.
The public legacy anon JWT only satisfies the gateway; the function independently
rejects requests without the private webhook secret. A newer `sb_publishable_`
key is not a JWT and cannot replace this gateway header.

## 4. Trigger research after a lead is inserted

In Supabase Dashboard:

1. Open **Database → Webhooks → Create webhook**.
2. Name it `enrich-new-lead`.
3. Table: `public.leads`; event: `INSERT`.
4. Method: `POST`.
5. URL: `https://PROJECT_REF.supabase.co/functions/v1/enrich-lead`.
6. Add header `x-aic-webhook-secret` with the same private secret.
7. Add `Authorization: Bearer YOUR_LEGACY_ANON_JWT` for the gateway.

The webhook payload already contains `record.id`; no request-body template is
needed.

## 5. Add retries

Create a Supabase Cron HTTP job every five minutes that posts this body to the
same function and supplies both headers described above:

```json
{"mode":"retry"}
```

Use a SQL Snippet Cron job with `net.http_post` and
`timeout_milliseconds := 120000` so research is not limited to the HTTP form's
five-second timeout. Keep the schedule at `*/5 * * * *`. Cron's SQL `Succeeded`
means the HTTP request was queued, not that research succeeded: verify the Edge
Function response and enrichment status as well.

Each run claims at most three research jobs. A failed lead is retried up to
three times with backoff. The same run also retries Google Sheet rows that were
researched successfully but not yet synced.

## 6. View the result in Supabase

Open **Database → Views → `sales_leads_dashboard`**. It contains the submitted
lead beside the company summary, person research, fit score, sales angle,
recommended next action, confidence, citations and processing status.

Important statuses:

- `completed`: confident match and finished research
- `needs_review`: ambiguous identity or confidence below 60
- `failed`: API or processing error; inspect `last_error`
- `pending` / `processing`: queued or running
- `not_requested`: historical lead with no enrichment row

## 7. Optional Google Sheet mirror

1. Create a Google Sheet.
2. Open **Extensions → Apps Script** and paste
   `integrations/google-sheets/Code.gs`.
3. In **Project Settings → Script properties**, add:
   - `SHEET_ID`: the ID from the Sheet URL
   - `WEBHOOK_SECRET`: a second long random secret
4. Deploy the Apps Script as a Web app that executes as you.
5. Copy its `/exec` URL and configure Supabase:

```bash
supabase secrets set GOOGLE_SHEETS_WEBHOOK_URL=YOUR_APPS_SCRIPT_EXEC_URL
supabase secrets set GOOGLE_SHEETS_WEBHOOK_SECRET=YOUR_GOOGLE_SHEET_SECRET
```

The Sheet is an operational mirror only. Supabase remains the system of record.
The Apps Script upserts by `lead_id`, so retries do not create duplicate rows.

## Manual test

After configuration, submit the website form or invoke a known lead manually:

```bash
curl -X POST "https://PROJECT_REF.supabase.co/functions/v1/enrich-lead" \
  -H "content-type: application/json" \
  -H "Authorization: Bearer YOUR_LEGACY_ANON_JWT" \
  -H "x-aic-webhook-secret: YOUR_LONG_RANDOM_SECRET" \
  -d '{"lead_id":123,"force":true}'
```

Then verify both `public.lead_enrichments` and
`public.sales_leads_dashboard`. Every material research claim should include a
source URL. The function never sends the submitted phone number or full email
address to the research model.

## Live AIC deployment — 21 September 2026

- [Google Sheet](https://docs.google.com/spreadsheets/d/1ta7KPzUXmiklByfQBuFsieAZHDUK_AN433GcxpWkw7U/edit)
  contains `Overview` and `Sales Intelligence`; sharing remains private.
- [Apps Script project](https://script.google.com/u/0/home/projects/1s7JBkYRf2D3RUc62rA4vXcCDp-Ncfj6Fxbhdb1qNZaj7DxSTJyXCgXDI/edit)
  is deployed as a web app. Its private shared secret protects POST requests;
  the spreadsheet itself does not need public sharing.
- Supabase project: `pfvipaltqmpurfxpojgs`; function: `enrich-lead`;
  INSERT webhook: `enrich-new-lead`; five-minute Cron: `retry-lead-research`.
- Both `GOOGLE_SHEETS_WEBHOOK_URL` and `GOOGLE_SHEETS_WEBHOOK_SECRET` are set in
  Supabase; receiver properties `SHEET_ID` and `WEBHOOK_SECRET` are set in Apps
  Script. No secret values are committed here.
- Synthetic lead **10**, `AIC PIPELINE TEST - no outreach`, was researched and
  synced on 21 September 2026. The function returned HTTP 200 with
  `sheet.configured: true` and `sheet.synced: true`; the native Sheet row was
  independently read back. `needs_review` is expected because the placeholder
  contact is not a real employee. Do not contact this test record.
- The first research attempt exhausted its output budget. The function now
  provides an 8,000-token budget, uses low reasoning effort for GPT-5 models,
  and rejects incomplete responses before parsing JSON.
- The Cron request originally lacked gateway authorization and returned 401.
  Its header was corrected without disabling JWT verification. The scheduled
  run at **20:25:01 UTC** returned **HTTP 200**, independently verified in Edge
  Function invocation logs.

For an operational check, submit a clearly labelled test through the website,
then inspect `Sales Intelligence`. Research typically takes about one to two
minutes but is not guaranteed; if absent, inspect `lead_enrichments.status` and
`last_error` in Supabase. Failed work is checked every five minutes (up to three
attempts). The Sheet mirrors only finished `completed` / `needs_review` results;
it does not display pending or failed jobs. Historical leads are not backfilled.

Offline response regression checks (Node.js 24+, no API calls):

```bash
node tests/lead-research-response.cjs
```
