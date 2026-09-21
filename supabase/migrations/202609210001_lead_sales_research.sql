-- AIC lead sales-research pipeline
-- Raw form submissions stay in public.leads. AI-generated research is kept in
-- a separate table so submitted facts are never overwritten by enrichment.

begin;

alter table public.leads
  add column if not exists company_website text;

create table if not exists public.lead_enrichments (
  lead_id                    bigint primary key references public.leads(id) on delete cascade,
  status                     text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'needs_review', 'failed')),
  attempts                   integer not null default 0 check (attempts >= 0),
  locked_at                  timestamptz,
  next_retry_at              timestamptz,
  researched_at              timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  matched_company            text,
  matched_domain             text,
  company_website            text,
  company_summary            text,
  industry                   text,
  headquarters               text,
  employee_range             text,
  founded_year               text,
  funding_stage              text,
  products_services          jsonb not null default '[]'::jsonb,
  target_customers           text,
  recent_signals             jsonb not null default '[]'::jsonb,

  person_name                text,
  person_title               text,
  person_summary             text,
  public_profile_url         text,
  match_basis                text,

  fit_score                  integer check (fit_score between 0 and 100),
  recommended_service        text,
  sales_angle                text,
  next_action                text,
  confidence                 integer check (confidence between 0 and 100),
  review_reason              text,
  sources                    jsonb not null default '[]'::jsonb,

  model                      text,
  openai_response_id         text,
  raw_result                 jsonb,
  last_error                 text,
  google_sheet_synced_at     timestamptz
);

create index if not exists lead_enrichments_work_queue_idx
  on public.lead_enrichments (status, next_retry_at, created_at);

alter table public.lead_enrichments enable row level security;
revoke all on table public.lead_enrichments from anon, authenticated;
grant select, insert, update, delete on table public.lead_enrichments to service_role;

create or replace function public.touch_lead_enrichment_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lead_enrichments_touch_updated_at on public.lead_enrichments;
create trigger lead_enrichments_touch_updated_at
before update on public.lead_enrichments
for each row execute function public.touch_lead_enrichment_updated_at();

create or replace function public.create_lead_enrichment_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lead_enrichments (lead_id, status)
  values (new.id, 'pending')
  on conflict (lead_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_lead_enrichment_job() from public, anon, authenticated;

drop trigger if exists leads_create_enrichment_job on public.leads;
create trigger leads_create_enrichment_job
after insert on public.leads
for each row execute function public.create_lead_enrichment_job();

-- Atomically claim a lead so a database webhook and retry worker cannot enrich
-- the same row at the same time.
create or replace function public.claim_lead_enrichment(
  p_lead_id bigint,
  p_force boolean default false
)
returns setof public.lead_enrichments
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.lead_enrichments
  set
    status = 'processing',
    attempts = case when p_force then 1 else attempts + 1 end,
    locked_at = now(),
    next_retry_at = null,
    last_error = null
  where lead_id = p_lead_id
    and (
      p_force
      or (
        status in ('pending', 'failed')
        and attempts < 3
        and (next_retry_at is null or next_retry_at <= now())
      )
    )
  returning *;
end;
$$;

revoke all on function public.claim_lead_enrichment(bigint, boolean) from public, anon, authenticated;
grant execute on function public.claim_lead_enrichment(bigint, boolean) to service_role;

create or replace view public.sales_leads_dashboard
with (security_invoker = true)
as
select
  l.id as lead_id,
  l.created_at,
  l.name,
  l.organization,
  l.job_title,
  l.email,
  l.phone,
  l.company_website as submitted_website,
  l.inquiry_type,
  l.company_size as submitted_company_size,
  l.message as submitted_need,
  l.source_page,
  coalesce(e.status, 'not_requested') as research_status,
  e.matched_company,
  e.company_website as researched_website,
  e.industry,
  e.headquarters,
  e.employee_range,
  e.founded_year,
  e.funding_stage,
  e.company_summary,
  e.products_services,
  e.target_customers,
  e.recent_signals,
  e.person_title as researched_person_title,
  e.person_summary,
  e.public_profile_url,
  e.fit_score,
  e.recommended_service,
  e.sales_angle,
  e.next_action,
  e.confidence,
  e.review_reason,
  e.sources,
  e.researched_at,
  e.google_sheet_synced_at,
  e.last_error
from public.leads l
left join public.lead_enrichments e on e.lead_id = l.id;

revoke all on table public.sales_leads_dashboard from anon, authenticated;
grant select on table public.sales_leads_dashboard to service_role;

comment on table public.lead_enrichments is
  'AI-generated public company and professional research for a lead. Raw submitted facts remain in public.leads.';
comment on view public.sales_leads_dashboard is
  'Private sales view joining submitted lead data with AI research. Read from the Supabase dashboard or a trusted server only.';

commit;
