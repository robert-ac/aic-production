// deno-lint-ignore-file no-import-prefix no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;

type Lead = {
  id: number;
  created_at: string;
  name: string | null;
  organization: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  company_website: string | null;
  inquiry_type: string | null;
  company_size: string | null;
  message: string | null;
  source_page: string | null;
};

type ResearchSource = { title: string; url: string; supports: string };

type LeadResearch = {
  matched_company: string;
  company_website: string;
  industry: string;
  headquarters: string;
  employee_range: string;
  founded_year: string;
  funding_stage: string;
  company_summary: string;
  products_services: string[];
  target_customers: string;
  recent_signals: Array<
    { title: string; summary: string; url: string; date: string }
  >;
  person_name: string;
  person_title: string;
  person_summary: string;
  public_profile_url: string;
  match_basis: string;
  recommended_service: string;
  fit_score: number;
  sales_angle: string;
  next_action: string;
  confidence: number;
  needs_review: boolean;
  review_reason: string;
  sources: ResearchSource[];
};

const OPENAI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "matched_company",
    "company_website",
    "industry",
    "headquarters",
    "employee_range",
    "founded_year",
    "funding_stage",
    "company_summary",
    "products_services",
    "target_customers",
    "recent_signals",
    "person_name",
    "person_title",
    "person_summary",
    "public_profile_url",
    "match_basis",
    "recommended_service",
    "fit_score",
    "sales_angle",
    "next_action",
    "confidence",
    "needs_review",
    "review_reason",
    "sources",
  ],
  properties: {
    matched_company: { type: "string" },
    company_website: { type: "string" },
    industry: { type: "string" },
    headquarters: { type: "string" },
    employee_range: { type: "string" },
    founded_year: { type: "string" },
    funding_stage: { type: "string" },
    company_summary: { type: "string" },
    products_services: { type: "array", items: { type: "string" } },
    target_customers: { type: "string" },
    recent_signals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "summary", "url", "date"],
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          url: { type: "string" },
          date: { type: "string" },
        },
      },
    },
    person_name: { type: "string" },
    person_title: { type: "string" },
    person_summary: { type: "string" },
    public_profile_url: { type: "string" },
    match_basis: { type: "string" },
    recommended_service: { type: "string" },
    fit_score: { type: "integer", minimum: 0, maximum: 100 },
    sales_angle: { type: "string" },
    next_action: { type: "string" },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    needs_review: { type: "boolean" },
    review_reason: { type: "string" },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "url", "supports"],
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          supports: { type: "string" },
        },
      },
    },
  },
} as const;

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "yahoo.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "mail.com",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

function getSupabaseSecret() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (legacy) return legacy;

  const encoded = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();
  if (encoded) {
    const keys = JSON.parse(encoded) as Record<string, string>;
    if (keys.default) return keys.default;
    const first = Object.values(keys)[0];
    if (first) return first;
  }
  throw new Error("Missing Supabase server secret key");
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function emailDomain(email: string | null) {
  const domain = safeString(email).toLowerCase().split("@")[1] || "";
  return domain && !GENERIC_EMAIL_DOMAINS.has(domain) ? domain : "";
}

function websiteDomain(website: string) {
  if (!website) return "";
  try {
    const normalized = /^https?:\/\//i.test(website)
      ? website
      : `https://${website}`;
    return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  } catch (_) {
    return "";
  }
}

function buildResearchPrompt(lead: Lead) {
  const submittedWebsite = safeString(lead.company_website);
  const workDomain = emailDomain(lead.email);
  return `Research this inbound AIC lead using current, publicly available business and professional information.

SUBMITTED FACTS
- Contact name: ${safeString(lead.name) || "Not provided"}
- Organization: ${safeString(lead.organization) || "Not provided"}
- Submitted job title: ${safeString(lead.job_title) || "Not provided"}
- Submitted company website: ${submittedWebsite || "Not provided"}
- Work email domain: ${workDomain || "Not available or generic"}
- Submitted company size: ${safeString(lead.company_size) || "Not provided"}
- Inquiry type: ${safeString(lead.inquiry_type) || "Not provided"}
- Stated need: ${safeString(lead.message) || "Not provided"}

AIC OFFERINGS
- Founders Lab: founder community, mentorship and venture-building pathway.
- AI Adoption: executive AI, workforce training and practical adoption support.
- Applied Research: prototypes, pilots, validation and deployment support.
- Accelerator: selective startup acceleration and investor readiness.
- ALEBEX AI: agentic voice and workflow automation.

RULES
1. Resolve the company identity before summarizing it. Prefer the submitted website, a non-generic email domain and the company's official website.
2. If the organization name is ambiguous or the contact cannot be matched confidently, set needs_review=true and explain why. Never merge similarly named companies.
3. Use only public business and professional information. Do not infer or report sensitive personal traits, private contact details, family information or anything unrelated to the inquiry.
4. Separate submitted facts from researched facts. Do not present an unsupported claim as fact.
5. Prefer primary sources. Include a URL for every material claim. Use an empty string or empty array when reliable information is unavailable.
6. Fit score means fit with the listed AIC offerings, not the person's value or creditworthiness.
7. Write concise sales research for a human account executive. Do not draft spam or make guarantees.`;
}

function extractOutputText(response: JsonRecord) {
  const direct = response.output_text;
  if (typeof direct === "string" && direct.trim()) return direct;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output as JsonRecord[]) {
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const content of item.content as JsonRecord[]) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  throw new Error("OpenAI response did not contain output text");
}

function extractApiSources(response: JsonRecord): ResearchSource[] {
  const found: ResearchSource[] = [];
  const output = Array.isArray(response.output) ? response.output : [];

  for (const item of output as JsonRecord[]) {
    if (item.type === "web_search_call") {
      const action = item.action as JsonRecord | undefined;
      const sources = Array.isArray(action?.sources) ? action?.sources : [];
      for (const source of sources as JsonRecord[]) {
        const url = safeString(source.url);
        if (url) {
          found.push({
            title: safeString(source.title),
            url,
            supports: "Web research source",
          });
        }
      }
    }
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const content of item.content as JsonRecord[]) {
        const annotations = Array.isArray(content.annotations)
          ? content.annotations
          : [];
        for (const annotation of annotations as JsonRecord[]) {
          if (annotation.type !== "url_citation") continue;
          const url = safeString(annotation.url);
          if (url) {
            found.push({
              title: safeString(annotation.title),
              url,
              supports: "Cited in research summary",
            });
          }
        }
      }
    }
  }
  return found;
}

function mergeSources(primary: ResearchSource[], apiSources: ResearchSource[]) {
  const normalizeUrl = (value: string) =>
    value.replace(/\/$/, "").toLowerCase();
  const reportedByUrl = new Map(
    primary
      .filter((source) => safeString(source.url))
      .map((source) => [normalizeUrl(source.url), source]),
  );
  const byUrl = new Map<string, ResearchSource>();

  // Only persist URLs returned by the API's web-search source list or citation
  // annotations. This prevents a model-authored but unverified URL from being
  // presented to the sales team as evidence.
  for (const source of apiSources) {
    const url = safeString(source.url);
    const key = normalizeUrl(url);
    if (!url || byUrl.has(key)) continue;
    const reported = reportedByUrl.get(key);
    byUrl.set(key, {
      title: safeString(reported?.title) || safeString(source.title),
      url,
      supports: safeString(reported?.supports) || safeString(source.supports),
    });
  }
  return [...byUrl.values()].slice(0, 20);
}

async function researchLead(lead: Lead) {
  const apiKey = requiredEnv("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-5.5";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      safety_identifier: `aic-lead-${lead.id}`,
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      max_tool_calls: 8,
      // Reasoning tokens share this budget with the complete research JSON.
      max_output_tokens: 8000,
      ...(/^gpt-5(?:[.-]|$)/.test(model)
        ? { reasoning: { effort: "low" } }
        : {}),
      input: buildResearchPrompt(lead),
      text: {
        format: {
          type: "json_schema",
          name: "aic_lead_sales_research",
          strict: true,
          schema: OPENAI_SCHEMA,
        },
      },
    }),
  });

  const payload = await response.json() as JsonRecord;
  if (!response.ok) {
    const apiError = payload.error as JsonRecord | undefined;
    throw new Error(
      `OpenAI ${response.status}: ${
        safeString(apiError?.message) || "request failed"
      }`,
    );
  }

  if (payload.status !== "completed") {
    const details = payload.incomplete_details as JsonRecord | undefined;
    throw new Error(
      `OpenAI response ${safeString(payload.status) || "unfinished"}: ${
        safeString(details?.reason) || "research did not finish"
      }`,
    );
  }

  const research = JSON.parse(extractOutputText(payload)) as LeadResearch;
  research.sources = mergeSources(
    research.sources || [],
    extractApiSources(payload),
  );
  if (research.sources.length === 0) {
    research.needs_review = true;
    research.confidence = Math.min(Number(research.confidence) || 0, 45);
    research.review_reason = [
      safeString(research.review_reason),
      "No verified web-search citations were returned.",
    ].filter(Boolean).join(" ");
  }
  return {
    research,
    responseId: safeString(payload.id),
    model: safeString(payload.model) || model,
  };
}

function retryTime(attempts: number) {
  const minutes = Math.min(60, 5 * Math.pow(2, Math.max(0, attempts - 1)));
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function sourcesForSheet(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((source) => safeString((source as JsonRecord).url))
    .filter(Boolean)
    .join("\n");
}

function sheetRow(row: JsonRecord) {
  return {
    lead_id: row.lead_id,
    created_at: row.created_at,
    contact_name: row.name,
    organization: row.organization,
    submitted_job_title: row.job_title,
    email: row.email,
    phone: row.phone,
    inquiry_type: row.inquiry_type,
    submitted_need: row.submitted_need,
    research_status: row.research_status,
    matched_company: row.matched_company,
    researched_website: row.researched_website,
    industry: row.industry,
    headquarters: row.headquarters,
    employee_range: row.employee_range,
    company_summary: row.company_summary,
    researched_person_title: row.researched_person_title,
    person_summary: row.person_summary,
    fit_score: row.fit_score,
    recommended_service: row.recommended_service,
    sales_angle: row.sales_angle,
    next_action: row.next_action,
    confidence: row.confidence,
    review_reason: row.review_reason,
    sources: sourcesForSheet(row.sources),
    researched_at: row.researched_at,
  };
}

// This project does not commit generated Supabase Database types. Keep the
// admin client dynamic here; table/RPC contracts are defined by the migration.
async function syncDashboardRow(supabase: any, leadId: number) {
  const endpoint = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_URL")?.trim();
  const secret = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_SECRET")?.trim();
  if (!endpoint || !secret) return { configured: false, synced: false };

  const { data: row, error } = await supabase
    .from("sales_leads_dashboard")
    .select("*")
    .eq("lead_id", leadId)
    .single();
  if (error) throw error;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, row: sheetRow(row as JsonRecord) }),
  });
  const result = await response.json().catch(() => ({})) as JsonRecord;
  if (!response.ok || result.ok !== true) {
    throw new Error(`Google Sheet sync failed: ${response.status}`);
  }

  await supabase
    .from("lead_enrichments")
    .update({ google_sheet_synced_at: new Date().toISOString() })
    .eq("lead_id", leadId);
  return { configured: true, synced: true };
}

async function processLead(
  supabase: any,
  leadId: number,
  force = false,
) {
  await supabase
    .from("lead_enrichments")
    .upsert({ lead_id: leadId, status: "pending" }, {
      onConflict: "lead_id",
      ignoreDuplicates: true,
    });

  const { data: claimedRows, error: claimError } = await supabase.rpc(
    "claim_lead_enrichment",
    {
      p_lead_id: leadId,
      p_force: force,
    },
  );
  if (claimError) throw claimError;
  const claimed = Array.isArray(claimedRows)
    ? claimedRows[0] as JsonRecord | undefined
    : claimedRows as JsonRecord | null;
  if (!claimed) {
    return {
      leadId,
      skipped: true,
      reason: "Already processing, completed, or retry limit reached",
    };
  }

  const attempts = Number(claimed.attempts || 1);
  try {
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(
        "id,created_at,name,organization,job_title,email,phone,company_website,inquiry_type,company_size,message,source_page",
      )
      .eq("id", leadId)
      .single();
    if (leadError) throw leadError;

    const { research, responseId, model } = await researchLead(lead as Lead);
    const confidence = Math.max(
      0,
      Math.min(100, Number(research.confidence) || 0),
    );
    const fitScore = Math.max(
      0,
      Math.min(100, Number(research.fit_score) || 0),
    );
    const finalStatus = research.needs_review || confidence < 60
      ? "needs_review"
      : "completed";
    const researchedDomain = websiteDomain(research.company_website);
    const submittedDomain =
      websiteDomain(safeString((lead as Lead).company_website)) ||
      emailDomain((lead as Lead).email);

    const update = {
      status: finalStatus,
      locked_at: null,
      next_retry_at: null,
      researched_at: new Date().toISOString(),
      matched_company: safeString(research.matched_company),
      matched_domain: researchedDomain || submittedDomain,
      company_website: safeString(research.company_website),
      company_summary: safeString(research.company_summary),
      industry: safeString(research.industry),
      headquarters: safeString(research.headquarters),
      employee_range: safeString(research.employee_range),
      founded_year: safeString(research.founded_year),
      funding_stage: safeString(research.funding_stage),
      products_services: research.products_services || [],
      target_customers: safeString(research.target_customers),
      recent_signals: research.recent_signals || [],
      person_name: safeString(research.person_name),
      person_title: safeString(research.person_title),
      person_summary: safeString(research.person_summary),
      public_profile_url: safeString(research.public_profile_url),
      match_basis: safeString(research.match_basis),
      fit_score: fitScore,
      recommended_service: safeString(research.recommended_service),
      sales_angle: safeString(research.sales_angle),
      next_action: safeString(research.next_action),
      confidence,
      review_reason: safeString(research.review_reason),
      sources: research.sources || [],
      model,
      openai_response_id: responseId,
      raw_result: research,
      last_error: null,
      google_sheet_synced_at: null,
    };

    const { error: updateError } = await supabase
      .from("lead_enrichments")
      .update(update)
      .eq("lead_id", leadId);
    if (updateError) throw updateError;

    let sheet = { configured: false, synced: false };
    try {
      sheet = await syncDashboardRow(supabase, leadId);
    } catch (sheetError) {
      console.error("Sheet sync deferred", leadId, sheetError);
    }

    return { leadId, status: finalStatus, confidence, sheet };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase
      .from("lead_enrichments")
      .update({
        status: "failed",
        locked_at: null,
        last_error: message.slice(0, 2000),
        next_retry_at: attempts < 3 ? retryTime(attempts) : null,
      })
      .eq("lead_id", leadId);
    throw error;
  }
}

async function runRetryBatch(supabase: any) {
  const now = new Date().toISOString();
  const { data: jobs, error } = await supabase
    .from("lead_enrichments")
    .select("lead_id")
    .in("status", ["pending", "failed"])
    .lt("attempts", 3)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order("created_at", { ascending: true })
    .limit(3);
  if (error) throw error;

  const researchResults = await Promise.allSettled(
    (jobs || []).map((job: { lead_id: number }) =>
      processLead(supabase, Number(job.lead_id))
    ),
  );

  const { data: unsynced } = await supabase
    .from("lead_enrichments")
    .select("lead_id")
    .in("status", ["completed", "needs_review"])
    .is("google_sheet_synced_at", null)
    .order("researched_at", { ascending: true })
    .limit(10);

  const sheetResults = [];
  for (const row of unsynced || []) {
    try {
      sheetResults.push(await syncDashboardRow(supabase, Number(row.lead_id)));
    } catch (error) {
      console.error("Sheet retry failed", row.lead_id, error);
    }
  }

  return {
    research: researchResults.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : { error: String(result.reason) }
    ),
    sheet: sheetResults,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const expectedSecret = requiredEnv("LEAD_RESEARCH_WEBHOOK_SECRET");
    if (request.headers.get("x-aic-webhook-secret") !== expectedSecret) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase: any = createClient(
      requiredEnv("SUPABASE_URL"),
      getSupabaseSecret(),
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const payload = await request.json() as JsonRecord;

    if (payload.mode === "retry") {
      return json({ ok: true, ...(await runRetryBatch(supabase)) });
    }

    const record = payload.record as JsonRecord | undefined;
    const leadId = Number(payload.lead_id ?? record?.id);
    if (!Number.isSafeInteger(leadId) || leadId <= 0) {
      return json({
        error:
          "A positive lead_id or Supabase INSERT webhook record is required",
      }, 400);
    }

    const result = await processLead(supabase, leadId, payload.force === true);
    return json({ ok: true, result });
  } catch (error) {
    console.error(error);
    return json({
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
