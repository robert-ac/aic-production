/* Runs every nav suite in turn and exits non-zero if any of them failed.
   Usage:  node tests/run-all.cjs        (desktop on a representative set)
           PAGES=all node tests/run-all.cjs   (every page, slow) */
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const suites = ['nav-desktop.cjs', 'nav-mobile.cjs'];
let failed = 0;

for (const suite of suites) {
  const r = spawnSync(process.execPath, [path.join(__dirname, suite)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}

console.log('\n' + '='.repeat(64));
console.log(failed ? failed + ' of ' + suites.length + ' suites FAILED' : 'all ' + suites.length + ' suites passed');
process.exit(failed ? 1 : 0);
