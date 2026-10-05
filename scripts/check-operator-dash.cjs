const assert = require('node:assert/strict');
const fs = require('node:fs');
const esbuild = require('esbuild');
const vm = require('node:vm');

const source = fs.readFileSync('convex/lib/repairDash.ts', 'utf8');
const { code } = esbuild.transformSync(source, { loader: 'ts', format: 'cjs' });
const context = { module: { exports: {} } };
vm.runInNewContext(code, context);
const { repairDash } = context.module.exports;
assert.equal(repairDash('Operations \uFFFD Manufacturing'), 'Operations - Manufacturing');
assert.equal(repairDash('A\uFFFDB\uFFFDC'), 'A-B-C');
assert.equal(repairDash('Operations - Planning – Delivery — Growth'), 'Operations - Planning – Delivery — Growth');
assert.equal(repairDash(''), '');
assert.equal(repairDash(repairDash('A\uFFFDB')), 'A-B');
console.log('Dash repair checks passed: replacement, repeated characters, preservation and repeat runs.');
