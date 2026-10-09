# Search readiness changes — October 9, 2026

## Scope

AI Adoption, Training, and Consultation business content is deferred at the owner's request. The main content, titles, descriptions, CTA wording, service schema, and pricing of `learn.html`, `ai-workforce-sme-adoption.html`, `for-smes.html`, `ai-readiness.html`, and `training.html` stay unchanged. URL normalization and shared navigation are technical updates only. No new pricing, membership terms, Accelerator eligibility, equity terms, customer results, or funding promises were added.

## Implemented

- Canonical, Open Graph, schema, sitemap, robots, and internal homepage URLs agree with the existing production host, `https://www.alexic.ca/`.
- Vercel config declares permanent apex-to-www, `/index.html`-to-`/`, and historical `/team.html`-to-`/about-aic.html` redirects. Verify the apex redirect after deployment: a redirect configured on the domain itself can take precedence over a repository rule.
- Sitemap omits the three already-noindex pages: `five-pillars.html`, `partners.html`, and `results.html`. Their indexing decisions remain intact.
- The style playground declares noindex and is crawlable so crawlers can read that directive. Internal docs, scripts, and tests receive a noindex HTTP header in Vercel.
- All 31 pages using the shared menu now ship its links in HTML. JavaScript enhances the existing menu rather than replacing it after load.
- Removed Alebex's zero-price software Offer; a demo does not establish free software pricing.
- Replaced Accelerator's expired September invitation with the current event directory.
- Founder FAQs and the legacy incubation entry point use Founders Lab; the old divisions link now leads to the current operating model.
- Founders Lab defines the community and location directly. Applied Research's five-layer illustration also has an HTML text equivalent, using its existing labels.
- Six event/editorial pages have Article metadata, matching visible organizational bylines, update dates, and breadcrumb metadata. Historical publication dates are used only where the existing page or Git publication history establishes them; no April publication date was invented.
- Corrected the broken team link and unconfirmed monthly frequency in `llms.txt`. Deferred service descriptions remain intact.

## Maintenance

After editing the menu in `assets/js/nav.js`, run:

```sh
node scripts/sync-navigation.cjs
node tests/search-readiness.cjs
```

The checker validates sitemap/indexing/canonical consistency, JSON-LD, local asset/page links, and menu synchronization. The existing Playwright suites cover desktop and mobile navigation.

## Account setup still needed

The site has no Search Console, Bing Webmaster Tools, or GA4 property supplied. Code changes cannot establish account ownership or create verified measurement without the relevant account access.

1. Add `alexic.ca` as a Google Search Console Domain property using its DNS verification token. Submit `https://www.alexic.ca/sitemap.xml` and inspect the homepage, Founders Lab, Alebex, and the hackathon recap.
2. Add the same site to Bing Webmaster Tools, either through its verified Search Console import or Bing's ownership verification. Submit the same sitemap.
3. Create a GA4 web data stream for the primary host. Supply its actual measurement ID before adding the tag. Check the site's privacy and consent treatment against the chosen analytics configuration before launch.
4. Define enterprise and community conversions separately. A click to Luma is an outbound click, not a completed registration. Record a form submission as a conversion only when the form actually succeeds; do not send names, email addresses, or free-text messages as analytics parameters.

## Deferred content work

- Resolve Consultation vs paid Diagnostic wording and its current zero-price Service Offer only after those offerings are finalized.
- Confirm learning pathways and training formats before expanding their HTML text.
- Confirm membership costs, opening/access arrangements, Accelerator intake, duration, selection, and equity terms before publishing them.
- Obtain named-client approval and measurement evidence before indexing results or adding numeric case-study claims.
- Use verified video transcripts and publication information before adding transcript/VideoObject enhancements.
- Assess performance with repeated measurements and real-user data. No Core Web Vitals improvement is claimed from this change.

## References

- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Vercel project configuration](https://vercel.com/docs/project-configuration)
