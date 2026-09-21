/* Desktop nav dropdowns (>=1101px).
   A panel must stay open for as long as the pointer is anywhere over its item,
   the gap beneath the link, or the panel itself, and close on a short delay
   once the pointer has left all three. Regression cover for the shared
   hover-intent controller in assets/js/nav.js.

   Slow by nature (it waits out hover-intent delays), so it runs a
   representative page per template by default. PAGES=all sweeps every page. */
'use strict';

const H = require('./lib/harness.cjs');
const { chromium } = H.loadPlaywright();

const DEFAULT_PAGES = [
  'index.html',                             // home template (.nav__links)
  'about-aic.html',                         // subpage template (.pnav__tabs)
  'events/ces-2026-six-trends.html',        // events/, nav links are ../ prefixed
  'founders-lab.html',                      // a page that is itself a menu target
];

function pickPages() {
  const all = H.navPages();
  if (process.env.PAGES === 'all') return all;
  if (process.env.PAGES) return process.env.PAGES.split(',');
  return DEFAULT_PAGES.filter(p => all.includes(p));
}

async function run() {
  await H.requireServer();
  const pages = pickPages();
  const run = H.createRun('DESKTOP NAV DROPDOWNS  (' + pages.length + ' pages)');
  const browser = await chromium.launch();

  for (const pageName of pages) {
    run.setPage(pageName);
    const p = await H.openPage(browser, H.DESKTOP, pageName);

    const state = () => p.evaluate(() => [...document.querySelectorAll('.mm__item')].map(i => ({
      label: i.querySelector('.mm__top').textContent.trim(),
      vis: getComputedStyle(i.querySelector('.mm__panel')).display !== 'none',
      ariaBtn: i.querySelector('.mm-toggle').getAttribute('aria-expanded'),
      ariaLink: i.querySelector('.mm__top').getAttribute('aria-expanded'),
    })));
    const openLabels = async () => (await state()).filter(s => s.vis).map(s => s.label);
    const count = await p.locator('.mm__item').count();
    const box = (sel, n) => p.locator(sel).nth(n).boundingBox();
    const away = async () => { await p.mouse.move(700, 600); await p.waitForTimeout(450); };
    const hover = async (n) => {
      const b = await box('.mm__item .mm__top', n);
      await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      return b;
    };

    run.setGroup('hover opens exclusively');
    for (let n = 0; n < count; n++) {
      await away();
      await hover(n);
      await p.waitForTimeout(120);
      const open = await openLabels();
      const s = (await state())[n];
      run.check('item ' + n + ' (' + s.label + ') opens, nothing else', open.length === 1 && open[0] === s.label, JSON.stringify(open));
      run.check('item ' + n + ' aria-expanded on link and button', s.ariaLink === 'true' && s.ariaBtn === 'true', 'link=' + s.ariaLink + ' btn=' + s.ariaBtn);
    }

    run.setGroup('stays open while pointer rests');
    for (let n = 0; n + 1 < count; n++) {
      await away();
      await hover(n);
      await p.waitForTimeout(60);
      await hover(n + 1);          // quick hop; a sibling's stale timer used to shut this
      await p.waitForTimeout(600);
      const open = await openLabels();
      const s = (await state())[n + 1];
      run.check('hop ' + n + '->' + (n + 1) + ' leaves ' + s.label + ' open', open.length === 1 && open[0] === s.label, JSON.stringify(open));
    }

    run.setGroup('rapid chain');
    await away();
    const chainEnd = Math.min(3, count);
    for (let n = 0; n < chainEnd; n++) { await hover(n); await p.waitForTimeout(40); }
    await p.waitForTimeout(600);
    {
      const open = await openLabels();
      const s = (await state())[chainEnd - 1];
      run.check('only ' + s.label + ' survives the chain', open.length === 1 && open[0] === s.label, JSON.stringify(open));
    }

    run.setGroup('reaching the panel');
    for (let n = 0; n < count; n++) {
      await away();
      const a = await hover(n);
      await p.waitForTimeout(140);
      const startY = a.y + a.height;
      for (let dy = 1; dy <= 30; dy++) await p.mouse.move(a.x + a.width / 2, startY + dy);
      await p.waitForTimeout(450);
      run.check('item ' + n + ' survives a slow descent through the gap', (await openLabels()).length === 1);

      await away();
      await hover(n);
      await p.waitForTimeout(140);
      const pb = await box('.mm__panel', n);
      await p.mouse.move(pb.x + 12, pb.y + pb.height - 12);   // single jump, no interpolation
      await p.waitForTimeout(450);
      run.check('item ' + n + ' survives a fast diagonal flick', (await openLabels()).length === 1);
    }

    run.setGroup('closing');
    {
      await away();
      await hover(0);
      await p.waitForTimeout(140);
      run.check('open before leaving', (await openLabels()).length === 1);
      await p.mouse.move(700, 600);
      await p.waitForTimeout(100);
      const midway = (await openLabels()).length;
      await p.waitForTimeout(400);
      run.check('closed after leaving', (await openLabels()).length === 0);
      run.check('not shut instantly — the grace period is kept', midway === 1, 'open at 100ms: ' + midway);

      await away();
      const a = await hover(0);
      await p.waitForTimeout(140);
      await p.mouse.move(a.x + a.width / 2, a.y + a.height + 60);   // into the panel
      await p.waitForTimeout(80);
      await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);    // back to the link
      await p.waitForTimeout(500);
      run.check('out-and-back does not flicker', (await openLabels()).length === 1);
    }

    run.setGroup('self-heal');
    {
      await away();
      const a = await hover(0);
      await p.waitForTimeout(140);
      await p.evaluate(() => document.querySelectorAll('.mm__item').forEach(i => i.classList.remove('is-open')));
      run.check('forced shut from outside', (await openLabels()).length === 0);
      await p.mouse.move(a.x + a.width / 2 + 2, a.y + a.height / 2);
      await p.waitForTimeout(150);
      run.check('reopens on the next pointer move', (await openLabels()).length === 1);
    }

    run.setGroup('keyboard');
    {
      await away();
      await p.evaluate(() => document.querySelectorAll('.mm__top')[0].blur());
      await p.evaluate(() => document.querySelectorAll('.mm__top')[0].focus());
      await p.waitForTimeout(120);
      run.check('focus on the top link opens the panel', (await openLabels()).length === 1);
      await p.keyboard.press('Tab');
      await p.waitForTimeout(120);
      run.check('Tab moves into the panel',
        await p.evaluate(() => !!document.activeElement.closest('.mm__panel')));
      await p.keyboard.press('Escape');
      await p.waitForTimeout(150);
      run.check('Escape closes it', (await openLabels()).length === 0);
      run.check('Escape returns focus to the top link',
        await p.evaluate(() => document.activeElement.classList.contains('mm__top')));
      const s = (await state())[0];
      run.check('aria-expanded false after Escape', s.ariaLink === 'false' && s.ariaBtn === 'false');
      await p.keyboard.press('ArrowDown');
      await p.waitForTimeout(150);
      run.check('ArrowDown reopens and focuses the first panel link',
        (await openLabels()).length === 1 && await p.evaluate(() => !!document.activeElement.closest('.mm__panel')));
    }

    run.setGroup('escape then re-hover');
    {
      await away();
      const a = await hover(0);
      await p.waitForTimeout(140);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(150);
      run.check('Escape closes while hovered', (await openLabels()).length === 0);
      await p.mouse.move(a.x + a.width / 2 + 1, a.y + a.height / 2);
      await p.waitForTimeout(150);
      run.check('stays shut until the pointer leaves', (await openLabels()).length === 0);
      await away();
      await hover(0);
      await p.waitForTimeout(150);
      run.check('reopens after leaving and returning', (await openLabels()).length === 1);
    }

    await p.close();
  }

  await browser.close();
  process.exitCode = run.report() ? 1 : 0;
}

run();
