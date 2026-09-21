# Navigation tests

Browser tests for the shared nav in [`assets/js/nav.js`](../assets/js/nav.js) and its
styles in [`assets/css/colors_and_type.css`](../assets/css/colors_and_type.css).

They live here rather than in the site root so the site itself stays
dependency-free — nothing under `assets/` needs a build step or `node_modules`.

## Setup

```bash
cd tests
npm install
npx playwright install chromium
```

## Running

The suites drive a real browser against a local static server, so start one first
from the repository root:

```bash
python -m http.server 8731 --bind 127.0.0.1
```

Then:

```bash
cd tests
npm test              # both suites
npm run test:desktop  # dropdowns at >=1101px
npm run test:mobile   # accordion at <=1100px
```

Point them somewhere else with `BASE_URL=http://localhost:3000 npm test`.

## What each suite covers

**`nav-mobile.cjs`** — the accordion below 1100px. An open `.mm__panel` has to sit
in normal flow so that it pushes the nav items under it down. The desktop rules
lay the panel out as an absolutely positioned flyout, and if any of that leaks
past the breakpoint the panel floats over the items below instead of displacing
them. Per page it checks structure, then each of the 5 panels for flow position,
container growth, non-overlap, displacement of later items, horizontal
containment and page overflow; then toggle interaction, keyboard operation,
the scrolling drawer, and a 320px narrow screen.

Runs across **every page that loads `nav.js`** — the list is read from disk, so a
new page is covered without editing the suite.

**`nav-desktop.cjs`** — the hover dropdowns at 1441px. A panel must stay open for
as long as the pointer is anywhere over its item, the gap beneath the link, or the
panel itself, and close on a short delay once the pointer has left all three.
Covers exclusive opening, resting after a quick hop between items (the shared
close-timer regression), rapid chains, slow descent through the gap, fast
diagonal flicks, the closing grace period, self-healing, and keyboard operation
(focus, Tab, Escape, ArrowDown) with the matching `aria-expanded` state.

This suite waits out real hover-intent delays, so it is slow. By default it runs
one representative page per template variant. Sweep everything with:

```bash
PAGES=all npm run test:desktop
PAGES=index.html,contact.html npm run test:desktop   # or an explicit list
```

## Reading the output

Each suite prints per-group tallies, then the total and any failures with the
measured values that produced them, e.g.

```
item 0: panel does not cover the next item  -> panel.bottom=354.6 next.top=156.4
```

The check total is `pages x checks-per-page`; the summary prints the page and
group counts it is made from.

## Notes

- Panels are `display:none` until opened, so the suites wait for `attached`
  rather than visibility.
- On mobile the open panel can cover the toggle of the item below it — that is
  the bug under test — so the mobile suite clicks the buttons directly instead of
  going through hit-testing.
- `index.html` is the only page on the `.nav__links` (home) template and loads
  `home-polish.css`; every other nav page uses `.pnav__tabs` and `refinement.css`.
  The suites run both.
