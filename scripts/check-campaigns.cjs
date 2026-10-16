const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../assets/site-analytics.js'), 'utf8');
function run(search, accepted = true) {
  const buttons = ['rejected','accepted'].map(value => ({ getAttribute: () => value, addEventListener() {}, focus() {} }));
  const panel = { querySelectorAll: () => buttons, querySelector: () => buttons[0] };
  const window = { addEventListener() {} };
  const document = {
    querySelector: selector => selector === '.analytics-consent' ? panel : { appendChild() {} },
    createElement: () => ({ addEventListener() {} }),
    head: { appendChild() {} }, documentElement: { classList: { add() {} } },
    set cookie(_) {}
  };
  vm.runInNewContext(code, {
    window, document, URLSearchParams,
    location: { hostname: 'aitoolnavigator.github.io', origin: 'https://aitoolnavigator.github.io', pathname: '/serious-dating-lab/profile-builder.html', search },
    localStorage: { getItem: () => JSON.stringify({ value: accepted ? 'accepted' : 'rejected', time: Date.now() }) }
  });
  return window.dataLayer?.find(a => a[0] === 'config')?.[2];
}
for (const [source, medium] of [['github','referral'],['social','organic']]) {
  const config = run(`?utm_source=${source}&utm_medium=${medium}&utm_campaign=first_decision&utm_content=profile_builder&private=SECRET`);
  assert.equal(config.campaign_source, source);
  assert.equal(config.campaign_medium, medium);
  assert.equal(config.campaign_content, 'profile_builder');
  assert.ok(!JSON.stringify(config).includes('SECRET'));
  assert.equal(config.page_referrer, '');
  assert.ok(!config.page_location.includes('?'));
}
for (const query of ['?utm_source=__proto__&utm_medium=referral&utm_campaign=first_decision', '?utm_source=SECRET&utm_medium=referral&utm_campaign=first_decision', '?utm_source=github&utm_medium=SECRET&utm_campaign=first_decision']) {
  assert.equal(run(query).campaign_source, undefined);
  assert.ok(!JSON.stringify(run(query)).includes('SECRET'));
}
assert.equal(run('?utm_source=github&utm_medium=referral&utm_campaign=first_decision', false), undefined);
console.log('PASS: fixed social/GitHub labels, private/unknown queries discarded, opt-out sends nothing.');
