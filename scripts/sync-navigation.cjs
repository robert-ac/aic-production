'use strict';

// Keep the HTML crawlable while nav.js remains the source of menu labels/URLs.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'assets/js/nav.js'), 'utf8');
const definition = source.match(/var menu = (\[[\s\S]*?\n  \]);/);
if (!definition) throw new Error('Could not read the shared navigation definition');
const menu = vm.runInNewContext(definition[1], {}, { timeout: 1000 });
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const pages = [...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'events')).filter(f => f.endsWith('.html')).map(f => 'events/' + f)];

function markup(file) {
  const prefix = file.startsWith('events/') ? '../' : '';
  const current = path.basename(file);
  let active = menu.findIndex(group => group.href === current);
  if (active < 0 && current !== 'index.html') {
    active = menu.findIndex(group => group.links.some(link => link[1].split('#')[0] === current));
  }
  const url = href => prefix + (href.startsWith('index.html') ? './' + href.slice(10) : href);
  return menu.map((group, index) => {
    const id = 'aic-menu-0-' + index;
    return '<div class="mm__item"><a class="mm__top' + (index === active ? ' is-active' : '') + '" href="' + url(group.href) + '"' + (group.href === current ? ' aria-current="page"' : '') + '>' + escape(group.label) + '</a><button class="mm-toggle" type="button" aria-label="' + escape(group.label) + ' sections" aria-expanded="false" aria-controls="' + id + '"><span aria-hidden="true"></span></button><div class="mm__panel" id="' + id + '">' + group.links.map(link => '<a href="' + url(link[1]) + '">' + escape(link[0]) + '</a>').join('') + '</div></div>';
  }).join('');
}

let changed = 0;
for (const file of pages) {
  const location = path.join(ROOT, file);
  const original = fs.readFileSync(location, 'utf8');
  if (!/js\/nav\.js/.test(original)) continue;
  const prefix = file.startsWith('events/') ? '../' : '';
  let html = original.replace(/<header class="pnav"><\/header>/, '<header class="pnav"><a class="pnav__brand" href="' + (prefix || './') + '" aria-label="Alexander Innovation Centre home"><img src="' + prefix + 'assets/img/aic-logo-wide-white-font.svg" alt="Alexander Innovation Centre" width="2663" height="428"></a><nav class="pnav__tabs" aria-label="Primary"><div class="mm"></div></nav><a class="btn btn--solid" href="' + prefix + 'founders-lab.html#join">Join AIC</a></header>');
  html = html.replace(/<div class="mm"><\/div>|<div class="mm"><!-- static-nav:start -->[\s\S]*?<!-- static-nav:end --><\/div>/,
    '<div class="mm"><!-- static-nav:start -->' + markup(file) + '<!-- static-nav:end --></div>');
  if (html !== original) {
    changed++;
    if (!process.argv.includes('--check')) fs.writeFileSync(location, html);
  }
}
if (process.argv.includes('--check') && changed) {
  console.error(changed + ' pages need navigation updates. Run node scripts/sync-navigation.cjs');
  process.exitCode = 1;
} else console.log('Static navigation: ' + changed + ' pages ' + (process.argv.includes('--check') ? 'out of sync' : 'updated'));
