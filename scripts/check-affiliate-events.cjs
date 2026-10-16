const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/affiliate-slots.js'), 'utf8');

async function run({ baked = false, mismatch = false, mode = 'ok' } = {}) {
  const events = [], handlers = [];
  const attrs = { 'data-affiliate-slot': 'slot', 'data-affiliate-program': 'program' };
  if (baked) attrs['data-affiliate-approved'] = mismatch ? 'other' : 'program';
  const anchor = {
    href: baked ? 'https://px.a8.net/svt/ejp?a8mat=verified' : 'https://official.example/',
    textContent: 'Official',
    getAttribute: name => attrs[name] ?? null,
    addEventListener: (_, listener) => handlers.push(listener)
  };
  const slot = { id: 'slot', approved_program_id: 'program', approved_url: 'https://px.a8.net/svt/ejp?a8mat=verified', tracking_pixel: 'https://www16.a8.net/0.gif?a8mat=verified' };
  vm.runInNewContext(source, {
    document: {
      querySelectorAll: () => [anchor],
      querySelector: () => baked ? {} : null,
      createElement: () => ({ setAttribute() {}, style: {} }),
      body: { appendChild() {} }
    },
    window: { location: { pathname: '/article.html', search: '?private=secret' }, gtag: (...args) => events.push(args) },
    fetch: () => mode === 'fail' ? Promise.reject(Error('offline')) : Promise.resolve({ ok: true, json: () => Promise.resolve({ slots: [slot] }) })
  });
  assert.equal(handlers.length, 1);
  handlers[0]();
  assert.equal(events[0][1], baked && !mismatch ? 'affiliate_click' : 'official_link_click');
  await new Promise(resolve => setImmediate(resolve));
  handlers[0]();
  assert.equal(events[1][1], mode === 'ok' || baked && !mismatch ? 'affiliate_click' : 'official_link_click');
  assert.ok(!JSON.stringify(events).includes('secret'));
  assert.equal(handlers.length, 1);
}

(async () => {
  await run();
  await run({ mode: 'fail' });
  await run({ baked: true });
  await run({ baked: true, mode: 'fail' });
  await run({ baked: true, mismatch: true, mode: 'fail' });
  console.log('PASS: immediate/static/runtime/offline/mismatched click classification; no private query data.');
})().catch(error => { console.error(error); process.exitCode = 1; });
