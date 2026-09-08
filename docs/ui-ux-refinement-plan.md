# AIC UI / UX refinement plan

## Audit — 8 September 2026
The existing static HTML, CSS and JavaScript architecture and uncommitted ecosystem work are retained. The running server serves the supplied aic-production checkout. All 28 root routes were opened and captured before editing; event article routes are included in final coverage. No production deployment is authorized.

Problems: homepage background video dominates positioning and adds continuous rendering; overly bold centered hero; repeated rounded dark cards; old operating-model image conflicts with four-pillar journey; funnel loses selectivity on mobile; tiny navigation and labels; colored card gradients vary between pages; offscreen reveal content stays invisible; desktop dropdowns depend on hover; mobile parent links are intercepted; footer uses older language and relative links break in event subdirectories. June event is incorrectly upcoming.

## Design system
Institutional editorial direction: navy #0b2236, white #ffffff, cool pale #eef3f6, cobalt #185abd, text #142c3e, secondary #526474. Display: Georgia editorial serif, restrained Sora for navigation and section labels, system sans for body. Hero 44–84px, section 32–52px, card 24–30px, body 16–18px, regular labels 14px, secondary metadata 12–13px. Content width 1200px, reading width 65ch; 8px spacing unit, 64–112px section rhythm, 24–40px gutters. Corners 4–8px, thin rules, almost no shadows. Primary cobalt button / outlined secondary / text tertiary, 44px minimum controls.

## Components and priorities
1. Shared refinement stylesheet, typography, spacing, contrast, buttons, neutral card family.
2. Compact navigation with independent dropdown buttons, Escape and focus handling; editorial two-column hero with semantic ecosystem diagram.
3. Continuous six-stage numbered journey, vertical on mobile; remove obsolete image from homepage.
4. Four coordinated pillar links with geometric line icons.
5. Three-stage narrowing founder funnel; numbered stage and explicit qualification gates; inset progression on phones without narrow text columns.
6. Out of Box editorial feature using typographic venture identity (not a claimed official logo or fabricated product screenshot) and a launch timeline. Preserve business claims.
7. Learn pathways, Lab infrastructure stack, Accelerator stages, core page intros and local section navigation.
8. Secondary pages receive coherent shared styles; preserve special interactive building tour and design specimen.
9. Featured official September Innovation Night on home and events page; retain June as past event; cross-links to Founders Lab and Accelerator.
10. Responsive, keyboard, reduced-motion and performance checks.

## Assets
Use real event cover from https://luma.com/b90nqjol, verified September 22, 2026, 18:30–21:30 America/Vancouver at 570 Dunsmuir St, Vancouver BC V6B 1Y1. Local optimized 800px and 400px WebP, no cropping. Preserve existing photography. New visuals are semantic diagrams and small consistent stroke icons; no AI-generated raster needed. No new product claims or mock screenshots.

## Validation
Before/after screenshots in task outputs, all production routes visually sampled, static local link/anchor/image checks, JS syntax, responsive widths 1440/1280/1024/768/430/390, keyboard nav and mobile menu, event image loading/alt/registration URL, stale event search. Contact submission is not sent to avoid emailing real recipients. No deployment, commit or push.


## User correction — homepage preservation (authoritative)
The user explicitly requires the existing homepage style and scroll-driven 3D building video to remain. Restore the original centered Sora hero, cinematic video, glass surfaces, palette and ALEBEX 3D orb. The editorial refinement stylesheet applies only to inner pages. Homepage changes are limited to matching-style new event/flow components, accessible navigation, readable fallbacks and video scheduling improvements. Original video file and visual framing remain unchanged. Earlier proposals to remove the homepage video, replace its style, or reduce its font family set are superseded.
