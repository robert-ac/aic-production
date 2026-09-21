/* Mobile nav accordion (<=1100px).
   An open .mm__panel must sit in normal flow so it pushes the nav items below
   it down. The desktop rules style it as an absolutely positioned flyout; if
   any of that leaks past the breakpoint the panel floats over the items below
   instead of displacing them. */
'use strict';

const H = require('./lib/harness.cjs');
const { chromium } = H.loadPlaywright();

const TOL = 1.5;  // px; sub-pixel layout rounding

/* Geometry of the menu with `openIndex` expanded (-1 = all closed). */
async function measure(p, openIndex) {
  return p.evaluate((idx) => {
    const items = [...document.querySelectorAll('.mm__item')];
    items.forEach(i => i.classList.remove('is-open'));
    if (idx >= 0) items[idx].classList.add('is-open');
    const bar = document.querySelector('.mm');
    const r = el => { const b = el.getBoundingClientRect(); return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), left: +b.left.toFixed(1), right: +b.right.toFixed(1), h: +b.height.toFixed(1), w: +b.width.toFixed(1) }; };
    const panel = idx >= 0 ? items[idx].querySelector('.mm__panel') : null;
    const cs = panel ? getComputedStyle(panel) : null;
    return {
      barHeight: +bar.getBoundingClientRect().height.toFixed(1),
      barRect: r(bar),
      items: items.map(r),
      panel: panel ? r(panel) : null,
      panelStyle: cs ? {
        position: cs.position, top: cs.top, left: cs.left, right: cs.right,
        minWidth: cs.minWidth, transform: cs.transform, zIndex: cs.zIndex,
        display: cs.display,
      } : null,
      docScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  }, openIndex);
}

async function openDrawer(p) {
  const t = p.locator('.navmenu-toggle').first();
  if (await t.count()) {
    const expanded = await t.getAttribute('aria-expanded');
    if (expanded !== 'true') await t.click();
    await p.waitForTimeout(150);
  }
}

/* The accordion panel can cover the toggle of the item below it, which is the
   very bug under test, so drive the buttons directly rather than by hit-test. */
async function clickToggle(p, i) {
  await p.evaluate(n => document.querySelectorAll('.mm-toggle')[n].click(), i);
  await p.waitForTimeout(150);
}

async function run() {
  await H.requireServer();
  const pages = H.navPages();
  const run = H.createRun('MOBILE NAV ACCORDION  (' + pages.length + ' pages)');
  const browser = await chromium.launch();
  const geometry = [];

  for (const pageName of pages) {
    run.setPage(pageName);
    const p = await H.openPage(browser, H.MOBILE, pageName);
    await openDrawer(p);

    const closed = await measure(p, -1);
    const count = closed.items.length;

    run.setGroup('structure');
    run.check('drawer exposes the menu', closed.barHeight > 0, 'barHeight=' + closed.barHeight);
    run.check('all panels start closed', await p.evaluate(() =>
      [...document.querySelectorAll('.mm__panel')].every(x => getComputedStyle(x).display === 'none')));
    run.check('no horizontal page overflow when closed',
      closed.docScrollWidth <= closed.viewportWidth + TOL,
      closed.docScrollWidth + ' > ' + closed.viewportWidth);

    for (let i = 0; i < count; i++) {
      run.setGroup('panel ' + i + ' in flow');
      const open = await measure(p, i);
      const label = 'item ' + i;

      run.check(label + ': panel is in normal flow', open.panelStyle.position === 'static',
        'position=' + open.panelStyle.position);

      run.check(label + ': nav container grew by the panel height',
        open.barHeight >= closed.barHeight + open.panel.h - TOL,
        'bar ' + closed.barHeight + ' -> ' + open.barHeight + ', panel h=' + open.panel.h);

      if (i + 1 < count) {
        run.check(label + ': panel does not cover the next item',
          open.panel.bottom <= open.items[i + 1].top + TOL,
          'panel.bottom=' + open.panel.bottom + ' next.top=' + open.items[i + 1].top);
        run.check(label + ': following items pushed down',
          open.items[i + 1].top >= closed.items[i + 1].top + open.panel.h - TOL,
          'next.top ' + closed.items[i + 1].top + ' -> ' + open.items[i + 1].top);
      } else {
        run.check(label + ': last panel sits below its own item',
          open.panel.top >= open.items[i].top - TOL,
          'panel.top=' + open.panel.top + ' item.top=' + open.items[i].top);
        run.check(label + ': last panel extends the bar',
          open.barRect.bottom >= open.panel.bottom - TOL,
          'bar.bottom=' + open.barRect.bottom + ' panel.bottom=' + open.panel.bottom);
      }

      run.check(label + ': panel stays inside the nav horizontally',
        open.panel.left >= open.barRect.left - TOL && open.panel.right <= open.barRect.right + TOL,
        'panel[' + open.panel.left + ',' + open.panel.right + '] bar[' + open.barRect.left + ',' + open.barRect.right + ']');

      run.check(label + ': no horizontal page overflow while open',
        open.docScrollWidth <= open.viewportWidth + TOL,
        open.docScrollWidth + ' > ' + open.viewportWidth);

      if (pageName === 'index.html' || pageName === 'about-aic.html') {
        geometry.push({
          page: pageName, item: i,
          position: open.panelStyle.position,
          barClosed: closed.barHeight, barOpen: open.barHeight,
          panelBottom: open.panel.bottom,
          nextItemTop: i + 1 < count ? open.items[i + 1].top : null,
          overlapPx: i + 1 < count ? +(open.panel.bottom - open.items[i + 1].top).toFixed(1) : null,
        });
      }
    }

    /* Restore real (non-scripted) state before the interaction scenarios. */
    await p.evaluate(() => document.querySelectorAll('.mm__item').forEach(i => i.classList.remove('is-open')));

    run.setGroup('toggle interaction');
    await clickToggle(p, 0);
    let open0 = await p.evaluate(() => [...document.querySelectorAll('.mm__item')].map(i => i.classList.contains('is-open')));
    run.check('toggle opens its own panel', open0[0] === true && open0.filter(Boolean).length === 1, JSON.stringify(open0));
    await clickToggle(p, 2);
    let open2 = await p.evaluate(() => [...document.querySelectorAll('.mm__item')].map(i => i.classList.contains('is-open')));
    run.check('switching moves the open panel', open2[2] === true && open2.filter(Boolean).length === 1, JSON.stringify(open2));
    const afterSwitch = await p.evaluate(() => {
      const items = [...document.querySelectorAll('.mm__item')];
      const panel = items[2].querySelector('.mm__panel');
      return { pb: panel.getBoundingClientRect().bottom, nt: items[3].getBoundingClientRect().top };
    });
    run.check('after switching the panel still displaces the next item',
      afterSwitch.pb <= afterSwitch.nt + TOL, 'panel.bottom=' + afterSwitch.pb.toFixed(1) + ' next.top=' + afterSwitch.nt.toFixed(1));
    await clickToggle(p, 2);
    run.check('same toggle closes it again',
      await p.evaluate(() => [...document.querySelectorAll('.mm__item')].every(i => !i.classList.contains('is-open'))));
    const restored = await measure(p, -1);
    run.check('closing restores the original bar height',
      Math.abs(restored.barHeight - closed.barHeight) <= TOL,
      closed.barHeight + ' -> ' + restored.barHeight);

    run.setGroup('keyboard');
    await p.evaluate(() => document.querySelectorAll('.mm-toggle')[1].focus());
    await p.keyboard.press('Enter');
    await p.waitForTimeout(150);
    run.check('Enter on the toggle opens the panel',
      await p.evaluate(() => document.querySelectorAll('.mm__item')[1].classList.contains('is-open')));
    run.check('aria-expanded tracks the open state',
      await p.evaluate(() => document.querySelectorAll('.mm-toggle')[1].getAttribute('aria-expanded') === 'true'));
    const kbGeom = await p.evaluate(() => {
      const items = [...document.querySelectorAll('.mm__item')];
      return { pb: items[1].querySelector('.mm__panel').getBoundingClientRect().bottom, nt: items[2].getBoundingClientRect().top };
    });
    run.check('keyboard-opened panel also displaces the next item',
      kbGeom.pb <= kbGeom.nt + TOL, 'panel.bottom=' + kbGeom.pb.toFixed(1) + ' next.top=' + kbGeom.nt.toFixed(1));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(150);
    run.check('Escape closes the accordion',
      await p.evaluate(() => [...document.querySelectorAll('.mm__item')].every(i => !i.classList.contains('is-open'))));

    run.setGroup('scrolling drawer');
    /* Longest panel open: the drawer must be able to reach its last link. */
    const longest = await p.evaluate(() => {
      const items = [...document.querySelectorAll('.mm__item')];
      let best = 0, n = -1;
      items.forEach((it, i) => { const c = it.querySelectorAll('.mm__panel a').length; if (c > best) { best = c; n = i; } });
      return n;
    });
    await clickToggle(p, longest);
    const scrollInfo = await p.evaluate(() => {
      const drawer = document.querySelector('.nav__links, .pnav__tabs');
      drawer.scrollTop = drawer.scrollHeight;
      return { scrollTop: drawer.scrollTop, canScroll: drawer.scrollHeight > drawer.clientHeight, overflowY: getComputedStyle(drawer).overflowY };
    });
    run.check('drawer scrolls rather than clipping long content',
      scrollInfo.overflowY === 'auto' || scrollInfo.overflowY === 'scroll' || !scrollInfo.canScroll,
      JSON.stringify(scrollInfo));
    const lastLink = await p.evaluate((n) => {
      const links = document.querySelectorAll('.mm__item')[n].querySelectorAll('.mm__panel a');
      const b = links[links.length - 1].getBoundingClientRect();
      return { w: b.width, h: b.height };
    }, longest);
    run.check('last link of the longest panel is laid out',
      lastLink.w > 0 && lastLink.h > 0, JSON.stringify(lastLink));
    await p.evaluate(() => { document.querySelector('.nav__links, .pnav__tabs').scrollTop = 0; });
    await clickToggle(p, longest);

    await p.close();

    /* Narrow phone: the desktop min-width must not force a sideways scroll. */
    run.setGroup('narrow screen (320px)');
    const np = await H.openPage(browser, H.NARROW, pageName);
    await openDrawer(np);
    await clickToggle(np, 0);
    const narrow = await np.evaluate(() => {
      const items = [...document.querySelectorAll('.mm__item')];
      const panel = items[0].querySelector('.mm__panel');
      const pb = panel.getBoundingClientRect();
      return {
        docScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        panelRight: +pb.right.toFixed(1), panelWidth: +pb.width.toFixed(1),
        minWidth: getComputedStyle(panel).minWidth,
        panelBottom: +pb.bottom.toFixed(1),
        nextTop: +items[1].getBoundingClientRect().top.toFixed(1),
      };
    });
    run.check('no sideways scroll at 320px',
      narrow.docScrollWidth <= narrow.viewportWidth + TOL,
      'scrollWidth=' + narrow.docScrollWidth + ' viewport=' + narrow.viewportWidth + ' minWidth=' + narrow.minWidth);
    run.check('panel fits the viewport at 320px',
      narrow.panelRight <= narrow.viewportWidth + TOL,
      'panel.right=' + narrow.panelRight + ' viewport=' + narrow.viewportWidth);
    run.check('panel still displaces the next item at 320px',
      narrow.panelBottom <= narrow.nextTop + TOL,
      'panel.bottom=' + narrow.panelBottom + ' next.top=' + narrow.nextTop);
    await np.close();
  }

  await browser.close();

  if (process.env.GEOMETRY) {
    console.log('\nGEOMETRY SAMPLE');
    console.table(geometry);
  }
  const failed = run.report();
  process.exitCode = failed ? 1 : 0;
}

run();
