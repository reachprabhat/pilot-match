// Run only against two disposable fictional founders. Never use real founder links here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const base = 'https://neat-hyena-46.convex.site';
const codes = ['a'.repeat(43), 'b'.repeat(43)];
const cli = (fn, args) => JSON.parse(execFileSync(process.execPath, ['node_modules/convex/bin/main.js', 'run', fn, JSON.stringify(args)], {encoding: 'utf8'}));
const reset = (suffix = 'a') => cli('founderSearches:reset', {founderId: 'quota-check-fictional-' + suffix});
const post = async (route, body) => {
  const response = await fetch(base + '/api/' + route, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  return {status: response.status, body: await response.json()};
};
(async () => {
  for (const code of codes) assert.equal((await post('founder', {code})).body.company, 'Fictional Test Company', 'Only disposable fictional founders may be tested');
  reset(); reset('b');
  const invalid = await post('search', {code: codes[0], ask: 'word '.repeat(301), requestId: crypto.randomUUID()});
  assert.equal(invalid.status, 400);
  assert.equal((await post('founder', {code: codes[0]})).body.searchCount, 0);
  const requests = await Promise.all(Array.from({length: 8}, () => post('search', {code: codes[0], ask: 'A fictional pilot for testing simultaneous requests', requestId: crypto.randomUUID()})));
  assert.equal(requests.filter(r => r.status === 200).length, 3);
  assert.equal(requests.filter(r => r.status === 429).length, 5);
  assert.equal((await post('founder', {code: codes[1]})).body.searchCount, 0);
  reset();
  const retry = {code: codes[0], ask: 'A fictional retry test', requestId: crypto.randomUUID()};
  assert.equal((await post('search', retry)).body.searchCount, 1);
  assert.equal((await post('search', retry)).body.searchCount, 1);
  reset();
  const tabs = await (await fetch('http://127.0.0.1:9222/json')).json();
  const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, {once: true}));
  let id = 0;
  const pending = new Map(), errors = [];
  ws.addEventListener('message', ({data}) => {
    const m = JSON.parse(data);
    if (m.id) {const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result);}
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {pending.set(++id, {resolve, reject}); ws.send(JSON.stringify({id, method, params}));});
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
    if (r.exceptionDetails) throw Error('Browser evaluation failed: ' + r.exceptionDetails.text);
    return r.result.value;
  };
  const wait = async expression => {
    for (let n = 0; n < 100; n++) {if (await evaluate(expression)) return; await new Promise(r => setTimeout(r, 100));}
    throw Error('Browser did not reach expected state: ' + expression);
  };
  const navigate = async code => {
    await send('Page.navigate', {url: 'about:blank'});
    await wait('location.href === "about:blank"');
    await send('Page.navigate', {url: base + '/#f=' + code});
    await wait('document.getElementById("ask") && !document.getElementById("ask").hidden');
  };
  const type = text => evaluate(`pilotAsk.value = ${JSON.stringify(text)}; pilotAsk.dispatchEvent(new Event('input', {bubbles: true}));`);
  const note = () => evaluate('matchingNote.textContent');
  const capture = async name => {
    const shot = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true});
    fs.writeFileSync(path.join(os.tmpdir(), 'pilot-match-quota-' + name + '.png'), Buffer.from(shot.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  for (const [name, width, height] of [['desktop', 1280, 800], ['phone', 390, 844], ['small-phone', 320, 740]]) {
    reset();
    await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});
    await navigate(codes[0]);
    assert.match(await note(), /3 searches remaining/);
    assert.equal(await evaluate('searchButton.disabled'), true);
    await type('word '.repeat(301));
    assert.equal(await evaluate('searchButton.disabled'), true);
    await type('A fictional manufacturing pilot');
    assert.equal(await evaluate('searchButton.disabled'), false);
    if (name === 'phone') {
      await evaluate(`window.originalFetch = window.fetch; window.fetch = (url, options) => url === '/api/search' ? Promise.resolve(new Response('{}', {status: 503})) : window.originalFetch(url, options); searchButton.click();`);
      await wait('searchMessage.textContent === "Busy right now. Try again in a few minutes." && !submitting');
      assert.match(await note(), /3 searches remaining/);
      assert.equal((await post('founder', {code: codes[0]})).body.searchCount, 0);
      await evaluate('window.fetch = window.originalFetch');
      await capture('phone-error');
    }
    await capture(name + '-ready');
    for (let n = 1; n <= 3; n++) {
      await type('Fictional pilot ask number ' + n);
      await evaluate('searchButton.click(); searchButton.click();');
      await wait(`!submitting && remaining === ${3 - n} && searchMessage.textContent === 'Your ask is saved. Matching opens soon.'`);
      assert.equal((await post('founder', {code: codes[0]})).body.searchCount, n);
    }
    assert.equal(await evaluate('searchButton.disabled'), true);
    assert.equal(await note(), 'You’ve used all 3 searches.');
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
    assert.equal(await evaluate('localStorage.length + sessionStorage.length'), 0);
    await capture(name + '-limit');
    await send('Page.reload', {ignoreCache: true});
    await wait('document.getElementById("ask") && !document.getElementById("ask").hidden && remaining === 0');
    assert.equal(await evaluate('searchButton.disabled'), true);
    assert.equal(await note(), 'You’ve used all 3 searches.');
    reset();
    await evaluate('window.dispatchEvent(new Event("focus"))');
    await wait('remaining === 3');
    await type('Fictional ask after a reset');
    assert.equal(await evaluate('searchButton.disabled'), false);
    await navigate(codes[1]);
    assert.match(await note(), /3 searches remaining/);
    await evaluate('document.getElementById("back").click(); document.getElementById("open-ask").click();');
    assert.equal(await evaluate('searchButton.disabled'), true);
    assert.equal(await note(), 'Matching opens soon');
    console.log(`${name}: three saves, double-click protection, remembered limit, reset, independent founder, no overflow, no browser storage passed.`);
  }
  assert.deepEqual(errors, []);
  ws.close();
  reset(); reset('b');
  console.log('Hosted Convex checks passed: eight simultaneous requests allow exactly three, rejected asks cost zero, retries cost once, phone error costs zero.');
})().catch(error => {console.error(error); process.exitCode = 1;});
