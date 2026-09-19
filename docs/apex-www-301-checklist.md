# Apex → www redirect checklist (301)

**Owner:** Allen Zhou / Robert (Vercel project + DNS)  
**Scope:** Production domain settings only — **do not** change this via website repo deploy.  
**Canonical host (site-wide):** `https://www.alexic.ca`  
**Date prepared:** 2026-09-19 (PT)

## Why

Live apex currently answers with a **temporary** redirect:

- `https://alexic.ca/` → **HTTP 307** → `https://www.alexic.ca/`

Search engines treat **301** as permanent host consolidation. Leaving a **307** risks split signals between apex and www even after on-page canonicals/sitemap/JSON-LD/llms all point at www (this SEO/GEO pass).

## Goal

1. Apex (`alexic.ca` and `http://alexic.ca`) permanently redirects to **www** with **301**.
2. Path and query string are preserved (e.g. `/learn.html?x=1` → same on www).
3. www itself does **not** redirect in a loop.
4. Google Search Console is verified/used on the **www** property (Allen clicks GSC himself).

## Vercel steps (exact)

1. Open the Vercel project that serves **alexic.ca** / **www.alexic.ca**.
2. Go to **Settings → Domains**.
3. Confirm both domains are listed:
   - `www.alexic.ca` — primary / production host
   - `alexic.ca` — redirect target = `www.alexic.ca`
4. For **`alexic.ca`**, set redirect to **`www.alexic.ca`**.
5. Ensure the redirect type is **301 Permanent** (not 307/308 Temporary, not “Rewrite”).
   - In the Domains UI this is usually: apex domain → “Redirect to www” / primary domain with permanent redirect.
   - If using `vercel.json` redirects instead of Domains UI, prefer Domains UI for apex↔www so DNS/SSL stay managed by Vercel; only document here — **do not** invent a conflicting `vercel.json` redirect in this PR unless Lead asks.
6. Save and wait for SSL/domain status = **Valid**.
7. Do **not** change nameservers or DNS records beyond what Vercel already requires for these two hostnames.

## Verify with curl (run after Vercel save)

```bash
# Expect: HTTP/2 301 (or HTTP/1.1 301) and Location: https://www.alexic.ca/
curl -sSI https://alexic.ca/ | head -20

# Expect: same status + Location preserving path
curl -sSI https://alexic.ca/learn.html | head -20

# Expect: 200 (or soft 200 from CDN) — not another hop back to apex
curl -sSI https://www.alexic.ca/ | head -20

# Optional: confirm no temporary codes remain
curl -sSI http://alexic.ca/ | head -20
```

Pass criteria:

| Check | Pass |
|-------|------|
| Apex HTTPS status | **301** (not 307/302) |
| `Location` host | `www.alexic.ca` |
| Path preserved | yes |
| www homepage | **200**, no redirect to apex |

## Google Search Console notes (Allen does the clicks)

Allen owns GSC actions; this repo only notes what to do:

1. Prefer the **URL-prefix** or **Domain** property that covers **`https://www.alexic.ca`**.
2. If an apex-only property exists, keep it temporarily to watch decline, but treat **www** as the reporting source of truth after the 301 is live.
3. After deploy of this SEO pass **and** the 301:
   - Submit `https://www.alexic.ca/sitemap.xml`
   - Use **URL Inspection** on homepage + five nav hubs
   - Request indexing if needed
4. Watch **Page indexing** / **Canonical** reports for residual `alexic.ca` (non-www) URLs over the following weeks.

## Out of scope for website PR

- Merging to `main`
- Changing Vercel env vars, project name, or team billing
- Editing DNS at the registrar beyond Vercel’s documented domain attach flow
- Touching Search Console via API/automation

## Done when

- [ ] Vercel Domains shows apex → www as **301**
- [ ] `curl -sSI https://alexic.ca/` shows **301** + `Location: https://www.alexic.ca/`
- [ ] Allen confirmed GSC www property + sitemap submit (manual)
