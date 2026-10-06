const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');
const validator = new Proxy(() => validator, {get: () => validator});
function load(file) {
  const context = {module: {exports: {}}, require: name => name === './_generated/server'
    ? {internalMutation: x => x, internalQuery: x => x}
    : name === './searchRules' ? load('convex/searchRules.ts') : {v: validator}};
  vm.runInNewContext(esbuild.transformSync(fs.readFileSync(file, 'utf8'), {loader: 'ts', format: 'cjs'}).code, context);
  return context.module.exports;
}
(async () => {
  const functions = load('convex/founderSearches.ts');
  const rows = [{_id: 'a', founderId: 'example-a', linkHash: 'a'.repeat(64)}, {_id: 'b', founderId: 'example-b', linkHash: 'b'.repeat(64)}];
  const saved = [];
  let failInsert = false;
  const db = {
    query: table => ({withIndex: (index, select) => {
      const conditions = [];
      const q = {eq: (key, value) => {conditions.push([key, value]); return q;}};
      select(q);
      return {unique: async () => (table === 'founders' ? rows : saved).find(row => conditions.every(([key, value]) => row[key] === value)) || null};
    }}),
    insert: async (table, value) => {if (failInsert) throw Error('Database unavailable'); saved.push(value); return 'saved';},
    patch: async (id, patch) => Object.assign(rows.find(row => row._id === id), patch),
  };
  const submit = (n, more = {}) => functions.submit.handler({db}, {linkHash: rows[0].linkHash, requestId: `request-${n}-example`, ask: 'A fictional manufacturing pilot', ...more});
  for (const ask of ['', '  ', 'word '.repeat(301)]) {
    assert.equal((await submit(0, {ask})).status, 'invalid_ask');
    assert.equal(rows[0].searchCount, undefined);
  }
  failInsert = true;
  await assert.rejects(submit(1), /unavailable/);
  assert.equal(rows[0].searchCount, undefined);
  failInsert = false;
  for (let n = 1; n <= 3; n++) {
    const result = await submit(n);
    assert.equal(result.status, 'saved');
    assert.equal(result.searchesRemaining, 3 - n);
    assert.equal(rows[0].searchCount, n);
    assert.equal((await submit(n)).status, 'saved');
    assert.equal(rows[0].searchCount, n, 'retry must not charge twice');
  }
  assert.equal((await submit(4)).status, 'limit_reached');
  assert.equal(saved.length, 3);
  assert.equal((await submit(1, {linkHash: rows[1].linkHash})).searchesRemaining, 2);
  assert.equal((await submit(1, {linkHash: 'c'.repeat(64)})).status, 'invalid_link');
  assert.equal((await functions.reset.handler({db}, {founderId: 'example-a'})).searchesRemaining, 3);
  assert.equal(rows[0].searchCount, 0);
  assert.equal(rows[1].searchCount, 1);
  assert.equal(saved.length, 4, 'reset preserves saved asks');
  assert.equal((await submit(1)).searchesRemaining, 3, 'old retry after reset must not spend a new search');
  assert.equal((await submit(5)).searchesRemaining, 2);
  await assert.rejects(functions.reset.handler({db}, {founderId: rows[0]._id}), /founderId from your sheet.*not.*_id/);
  rows.push({_id: 'fictional-sheet-one', founderId: '1', searchCount: 3});
  rows.push({_id: 'fictional-sheet-two', founderId: '2', searchCount: 2});
  assert.equal((await functions.reset.handler({db}, {founderId: ' 1 '})).searchesRemaining, 3);
  assert.equal(rows[2].searchCount, 0);
  assert.equal(rows[3].searchCount, 2, 'resetting sheet ID 1 must leave sheet ID 2 untouched');
  assert.equal((await functions.reset.handler({db}, {founderId: '2'})).searchesRemaining, 3);
  await assert.rejects(functions.reset.handler({db}, {founderId: 'unknown'}), /not found/);
  console.log('Search checks passed: three per founder, failed saves and validation cost zero, retries cost once, reset preserves history and other founders.');
})().catch(error => {console.error(error); process.exitCode = 1;});
