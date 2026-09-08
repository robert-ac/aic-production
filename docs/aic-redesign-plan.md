# AIC Ecosystem Redesign — Plan

Branch: `feat/aic-ecosystem-redesign` · Base: `a7da9d7` (main)
Goal: reposition AIC from "corporate AI training company" → "AI innovation ecosystem"
(founders + talent + research + companies + capital), organized around four pillars:
**Founders Lab · Learn · Lab · Accelerator**. No "Industry & Impact" section yet.

---

## 1. Current sitemap (audit, 27 pages + 3 event posts)

| URL | Role today | SEO notes |
|---|---|---|
| index.html | Home — training/adoption-led hero | canonical, Org+LocalBusiness+FAQ JSON-LD |
| divisions.html | 4 divisions overview | canonical |
| applied-research.html | Innovation Lab | canonical |
| ai-workforce-sme-adoption.html | Workforce Training (training.html redirects here) | canonical, Course schema |
| incubation.html | Venture Studio ("in the build" + Coming soon) | canonical |
| data-centre.html | Compute Lab (Coming soon) | canonical |
| training.html | redirect stub → ai-workforce-sme-adoption | keep as redirect |
| ai-readiness.html | Free consultation + Diagnostic + lead form | canonical, Service schema, converts |
| for-smes.html | Centre for AI Skills & Business Adoption | canonical, 5 JSON-LD blocks |
| funding.html | Grants/funding guidance | canonical |
| alebex-ai.html | ALEBEX AI product | canonical, SoftwareApplication |
| canada-ai-strategy.html | AI strategy & funding resource | canonical |
| results.html | Case studies/numbers | canonical |
| innovation-night.html | Innovation Nights feed | canonical |
| news.html | News & insights | canonical |
| about-aic.html | About / team | canonical |
| five-pillars.html | Scroll experience (5 pillars) | no canonical |
| partners.html, faq.html, contact.html, privacy.html, programs.html | support pages | canonical |
| events/*.html ×3 | posts | canonical |
| 404.html, button-styles.html | infra / style sandbox | button-styles should not be linked |

Components: `nav.js` (injected mega-menu, single source of truth), `footer.js`
(injected CTA+footer on inside pages), `site.css` (home), `page.css` (inside pages),
`colors_and_type.css` (tokens). Lead capture: `leads.js` → Supabase + email fallback.

**Out of Box: zero content exists in the repo** → build section with safe
placeholder copy; report what facts are needed. **No sitemap.xml / robots.txt.**

## 2. Proposed sitemap

New pages (additive — nothing deleted):

| New URL | Pillar | Content |
|---|---|---|
| founders-lab.html | Founders Lab | community + 3-level startup funnel (Membership → Acceleration → Growth/US capital) |
| learn.html | Learn | Executive AI · Corporate Training · Workforce Upskilling · Developer→AI Engineer · AIC Institute |
| lab.html | Lab | Applied Research · Pilots & Validation · 5-layer AI infrastructure (Compute→Models→Agents→Harness→Governance) |
| accelerator.html | Accelerator | 4-stage program (Ideation → Early Startup → Accelerate → Growth) + Featured Ventures (Out of Box, ALEBEX) |
| sitemap.xml, robots.txt | SEO | new |

## 3. Old → new mapping

| Current | Action | Where it lives in new IA |
|---|---|---|
| index.html | REWRITE | ecosystem homepage (11-section structure) |
| nav (nav.js menu) | REWRITE | Founders Lab / Learn / Lab / Accelerator / About + "Join AIC" CTA |
| ai-workforce-sme-adoption | KEEP url | linked under Learn (Corporate Training / Upskilling) |
| ai-readiness | KEEP url | conversion page; linked from Learn + org CTA section (SEO + lead form intact) |
| for-smes | KEEP url | linked under Learn |
| funding | KEEP url | linked under Learn |
| applied-research | KEEP url | linked under Lab (Applied Research) |
| data-centre | KEEP url | linked under Lab (AI Infrastructure) |
| incubation | KEEP url | superseded narratively by Founders Lab/Accelerator; keep for SEO, cross-link to accelerator |
| divisions | KEEP url | legacy overview; nav no longer features it as top item (About > How AIC Works keeps five-pillars) |
| alebex-ai | KEEP url | repositioned "Built at AIC"; keeps own product page |
| innovation-night | KEEP url | under Founders Lab dropdown + About; homepage section reframed as ecosystem/community |
| five-pillars | KEEP url | About > How AIC Works |
| about-aic, faq, contact, partners, news, results, privacy, events/* | KEEP | secondary nav / footer |
| training.html | KEEP | existing redirect stub untouched |
| button-styles.html | KEEP (unlinked) | style sandbox, never linked |

No URLs removed ⇒ no redirects required. All existing JSON-LD stays valid.

## 4. Component plan

- `assets/css/eco.css` (NEW, shared): ecosystem flow strip (CONNECT→…→SCALE),
  pillar cards, Founders Lab funnel visual, featured-venture block, get-involved grid.
  Additive file ⇒ zero risk to page.css/site.css consumers, easy rollback.
- `nav.js`: replace `menu` array only (rendering engine untouched). CTA relabel
  "Join AIC" → founders-lab.html#join (org consult CTA remains inside Learn pages).
- `footer.js`: update quick links to include pillars.
- Homepage keeps: stage video/scroll scrub, doors pattern (retargeted to 4 audiences),
  isopanel engine image, ALEBEX orb (moved under "Built at AIC"), Innovation Nights
  card, FAQ (AEO schema), Visit, finalcard.

## 5. Homepage structure (11 sections)

1. Hero — ecosystem positioning + Explore AIC / Join the Ecosystem
2. Who are you? — 4 audience doors (Founder / Organization / Researcher-Builder / Community)
3. How AIC Works — CONNECT→LEARN→BUILD→VALIDATE→ACCELERATE→SCALE + engine diagram
4. Four pillars — Founders Lab / Learn / Lab / Accelerator cards
5. Founders Lab funnel — Open Membership ↓ Acceleration ↓ Growth & U.S. Capital Access
6. Featured venture — OUT OF BOX (IDEA→BUILD→VALIDATE→LAUNCH; placeholder-safe copy)
7. Built at AIC — ALEBEX AI (orb retained as proof of execution)
8. For organizations — training/adoption/pilots retained strengths + consult CTA
9. Innovation Nights — community/ecosystem framing
10. Visit AIC
11. Get Involved — founder / company / researcher / investor / mentor / community
(+ compact FAQ retained for AEO before Visit)

## 6. Content rules honoured

- No invented metrics, funding amounts, investor names, valuations, Out of Box data.
- Membership ≠ automatic investment; acceleration is explicitly selective.
- Growth stage wording: "AIC can support investor readiness and facilitate
  introductions through its broader North American ecosystem." No capital promises.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Homepage FAQPage schema drift after rewrite | FAQ block kept; schema matched to visible Q&A |
| nav.js menu drives EVERY page — a bug breaks sitewide nav | only the data array changes; engine untouched; manual QA across page types incl. /events/ subdir |
| New pillar pages thin at launch | structured, honest content from brief; expand in Phase 5 |
| Out of Box facts missing | placeholder-safe copy; flagged in report |
| Brand continuity | reuse existing tokens/typography/components; no visual reset |
| Old "divisions" mental model vs new pillars | divisions pages kept + cross-linked; About > How AIC Works preserves five-pillars experience |

## 8. Phases

1. ✅ Audit (this doc)
2. Nav + footer (IA)
3. Homepage rewrite
4. Pillar pages: founders-lab / learn / lab / accelerator
5. Supporting integration (Innovation Nights framing, ALEBEX, About links)
6. QA: 1440/1024/768/430/390 + keyboard/a11y + link check
