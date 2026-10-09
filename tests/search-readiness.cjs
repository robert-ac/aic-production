'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = [...fs.readdirSync(root).filter(file => file.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'events')).filter(file => file.endsWith('.html')).map(file => 'events/' + file)];
const origin = 'https://www.alexic.ca';
const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(urls).size, urls.length, 'No duplicate sitemap URLs');
for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, origin);
  const html = read(parsed.pathname === '/' ? 'index.html' : parsed.pathname.slice(1));
  assert(!/<meta name="robots" content="[^"]*noindex/i.test(html), url + ' must be indexable');
  assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)[1], url, 'Sitemap and canonical agree');
}
for (const file of pages) {
  const html = read(file);
  assert(!/https:\/\/alexic\.ca\b/.test(html), file + ': no old primary-host references');
  schemas(html); // Fail on malformed JSON-LD.
  if (/js\/nav\.js/.test(html)) {
    const header = html.match(/<header\b[^>]*>[\s\S]*?<\/header>/)[0];
    assert.equal((header.match(/class="mm__top/g) || []).length, 5, file + ': crawlable navigation');
  }
  for (const match of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
    const url = new URL(match[1].replace(/&amp;/g, '&'), origin + '/' + file);
    if (url.origin !== origin) continue;
    const target = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
    if (!/\.(html|css|js|webp|png|jpe?g|svg|mp4)$/i.test(target)) continue;
    assert(fs.existsSync(path.join(root, target)), file + ': missing target ' + target);
  }
  if (file.startsWith('events/')) {
    const data = schemas(html);
    const article = data.find(schema => schema['@type'] === 'Article');
    assert(article, file + ': Article schema');
    assert(html.includes('By <a href="../about-aic.html">Alexander Innovation Centre</a>'));
    assert.equal(article.author.name, 'Alexander Innovation Centre');
    assert.equal(article.mainEntityOfPage['@id'], origin + '/' + file);
    assert(data.some(schema => schema['@type'] === 'BreadcrumbList'));
  }
}
assert(!schemas(read('alebex-ai.html')).find(schema => schema['@type'] === 'SoftwareApplication').offers, 'Do not advertise a free software price');
assert(!read('accelerator.html').includes('Join the ecosystem in person · September 22'), 'No expired event invitation');
assert(!read('llms.txt').includes('/team.html'), 'No broken team link');
assert(/name="robots" content="noindex,follow"/.test(read('button-styles.html')));
assert(read('lab.html').includes('id="infrastructure-layers"'), 'Illustration also has text content');
execFileSync(process.execPath, [path.join(root, 'scripts/sync-navigation.cjs'), '--check'], { stdio: 'inherit' });
console.log('Search readiness passed: ' + pages.length + ' pages, ' + urls.length + ' sitemap URLs, 6 articles.');
