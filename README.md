# Alexander Innovation Centre (AIC) — Website

The official website for the **Alexander Innovation Centre (AIC)**, a BC-based applied-AI
platform connecting applied research, workforce & SME adoption, ALEBEX AI, venture incubation,
and trusted Canadian AI infrastructure under one roof.

A static, dependency-free site (plain HTML, CSS, and vanilla JS) — no build step required.

## Run locally

Serve the folder with any static server, for example:

```bash
python3 -m http.server 8731
# then open http://localhost:8731/
```

Opening `index.html` directly also works for most pages.

## Structure

Pages live at the repository root so production URLs match their canonical paths
(`https://alexic.ca/<page>.html`). Shared assets are grouped by type under `assets/`.

```
index.html                       Home (scroll-scrubbed video hero, operating model, ALEBEX orb)
divisions.html                   Core Areas overview
  applied-research.html          · Innovation Lab
  ai-workforce-sme-adoption.html · Workforce Academy
  incubation.html                · Venture Studio
  data-centre.html               · Compute Lab (Canadian AI infrastructure)
training.html                    Training catalogue
ai-readiness.html                AI Readiness Review
for-smes.html                    AI for SMEs & employers
alebex-ai.html                   ALEBEX AI flagship
canada-ai-strategy.html          Canada's AI strategy & funding
results.html                     Case studies & results
innovation-night.html            Innovation Nights feed
news.html                        News & insights
team.html                        About AIC / team
partners.html                    Partners & ecosystem
faq.html                         FAQ
contact.html                     Routed contact / inquiry form
privacy.html                     Privacy policy
programs.html                    Services index

events/                          Blog / event posts (shared nav via ../assets/js/nav.js)
  2026-04-30-ai-innovation-night-launch.html
  ces-2026-the-future-is-here.html · ces-2026-six-trends.html
  template.html                  Reusable post template
  April_30_2026/ · ces-2026/     Post images

assets/
  css/      colors_and_type · page (detail pages) · site (home)
  js/       nav · scroll (video scrub) · alebex-orb (Three.js) · rail · lightbox
  img/      all imagery + iso/ (process maps) · team/ · events/
  video/    aic-background.mp4 (scroll-driven hero video)

docs/                            Content-strategy reference (not part of the live site)
```

> `archive/` (legacy pages from a prior nav structure) is kept on disk for reference
> but git-ignored, so it is never shipped.

## Notes

- **Palette / type:** navy + white + cyan; Sora / Inter / JetBrains Mono.
- **Background video** is scrubbed by page scroll via `assets/scroll.js`.
- **ALEBEX orb** is a Three.js liquid sphere (`assets/alebex-orb.js`) with a CSS fallback,
  linking demos to <https://alebex.ai/>.
- External links: event registration on [Luma](https://luma.com/b90nqjol),
  updates on [LinkedIn](https://www.linkedin.com/company/alexinnovationc/posts/).

Alexander Innovation Centre · #101 - 570 Dunsmuir Street, Vancouver, BC V6B 1Y1 · <https://alexic.ca>
