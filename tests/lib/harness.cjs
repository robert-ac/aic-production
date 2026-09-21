/* Shared plumbing for the nav test suites.
   No framework: plain Node + Playwright, run against a local static server. */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8731';
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 800, height: 900 };
const NARROW = { width: 320, height: 720 };

/* Playwright lives in tests/node_modules after `npm install`, but a global
   install is just as good. Try both before giving up. */
function loadPlaywright() {
  const tried = [];
  const candidates = [
    'playwright',
    path.join(__dirname, '..', 'node_modules', 'playwright'),
  ];
  const globalRoot = process.env.NPM_GLOBAL_ROOT;
  if (globalRoot) candidates.push(path.join(globalRoot, 'playwright'));
  else {
    try {
      const out = require('child_process').execSync('npm root -g', { encoding: 'utf8' }).trim();
      if (out) candidates.push(path.join(out, 'playwright'));
    } catch (_) { /* npm not on PATH; the other candidates may still work */ }
  }
  for (const c of candidates) {
    try { return require(c); } catch (e) { tried.push(c); }
  }
  console.error('Could not load Playwright. Tried:\n  ' + tried.join('\n  ') +
    '\n\nInstall it with:  cd tests && npm install && npx playwright install chromium');
  process.exit(2);
}

/* Every page that renders the shared menu is one that loads nav.js.
   Derived from disk so new pages are covered without editing this list. */
function navPages() {
  const html = [];
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith('.html')) html.push(f);
  }
  const eventsDir = path.join(ROOT, 'events');
  if (fs.existsSync(eventsDir)) {
    for (const f of fs.readdirSync(eventsDir)) {
      if (f.endsWith('.html')) html.push('events/' + f);
    }
  }
  return html
    .filter(f => /js\/nav\.js/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')))
    .sort();
}

/* index.html is the only page on the .nav__links (home) template; every other
   nav page uses .pnav__tabs (subpage). They load different stylesheets, so the
   suites report them separately. */
function templateOf(page) { return page === 'index.html' ? 'home' : 'subpage'; }

async function serverUp() {
  try {
    const res = await fetch(BASE + '/index.html', { method: 'HEAD' });
    return res.ok;
  } catch (_) { return false; }
}

function requireServer() {
  return serverUp().then(up => {
    if (up) return;
    console.error('No static server at ' + BASE + '\nStart one first:\n' +
      '  python -m http.server 8731 --bind 127.0.0.1');
    process.exit(2);
  });
}

/* A run collects checks grouped by page so the summary can show both the total
   and how that total is made up. */
function createRun(title) {
  const checks = [];
  let page = '(setup)';
  let group = '';
  return {
    title,
    setPage(p) { page = p; },
    setGroup(g) { group = g; },
    check(name, ok, detail) {
      checks.push({ page, group, name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
      return !!ok;
    },
    get checks() { return checks; },
    report(opts) {
      const quiet = opts && opts.quiet;
      const failed = checks.filter(c => !c.ok);
      const pages = [...new Set(checks.map(c => c.page))];
      const groups = [...new Set(checks.map(c => c.group))].filter(Boolean);
      console.log('\n' + '='.repeat(64));
      console.log(title);
      console.log('='.repeat(64));
      if (!quiet) {
        for (const g of groups) {
          const inG = checks.filter(c => c.group === g);
          const bad = inG.filter(c => !c.ok).length;
          console.log('  ' + (bad ? 'FAIL' : 'ok  ') + '  ' + g.padEnd(42) +
            (inG.length - bad) + '/' + inG.length);
        }
      }
      console.log('-'.repeat(64));
      console.log('pages:  ' + pages.length);
      console.log('groups: ' + groups.length);
      console.log('checks: ' + checks.length + '   passed ' + (checks.length - failed.length) +
        '   failed ' + failed.length);
      if (failed.length) {
        console.log('\nFAILURES');
        for (const f of failed) {
          console.log('  ' + f.page + ' :: ' + f.group + ' :: ' + f.name + (f.detail ? '  -> ' + f.detail : ''));
        }
      }
      return failed.length;
    },
  };
}

/* Open a page and wait for nav.js to have rendered the menu. The panels are
   display:none until opened, so wait on `attached`, not visibility. */
async function openPage(browser, viewport, pageName) {
  const p = await browser.newPage({ viewport });
  await p.goto(BASE + '/' + pageName, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.mm__item .mm__panel a', { state: 'attached' });
  await p.waitForTimeout(200);
  return p;
}

module.exports = {
  ROOT, BASE, DESKTOP, MOBILE, NARROW,
  loadPlaywright, navPages, templateOf, requireServer, createRun, openPage,
};
