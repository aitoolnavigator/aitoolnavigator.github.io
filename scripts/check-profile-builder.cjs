const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildDraft } = require('../assets/profile-builder.js');
const input = { hobby: 'books', detail: '先週は小説を読みました。', goal: 'talk', tone: 'warm' };
for (const hobby of ['movies','walks','cooking','cafes','books','exercise','own']) {
  for (const goal of ['talk','marriage','life']) for (const tone of ['warm','calm']) {
    const text = buildDraft({ ...input, hobby, goal, tone });
    assert.ok(text.includes(input.detail));
    assert.ok(text.length < 500);
    assert.ok(!text.includes('undefined'));
    assert.ok(!/勤務先|年収|歳です/.test(text));
  }
}
assert.throws(() => buildDraft({ ...input, hobby: '__proto__' }));
assert.throws(() => buildDraft({ ...input, goal: 'unknown' }));
assert.throws(() => buildDraft({ ...input, tone: 'unknown' }));
assert.ok(buildDraft({ ...input, detail: 'パン屋を回りました' }).includes('パン屋を回りました。'));
assert.ok(!buildDraft({ ...input, detail: 'パン屋を回りました。' }).includes('。。'));
assert.ok(!buildDraft({ ...input, hobby: 'own', detail: '' }).includes('\n\n\n'));
assert.ok(!buildDraft({ ...input, detail: 'a'.repeat(10000) }).includes('a'.repeat(181)));
assert.ok(buildDraft({ ...input, detail: 'こんにちは\u0000\nこんばんは' }).includes('こんにちは こんばんは'));
const source = fs.readFileSync(path.join(__dirname, '../assets/profile-builder.js'), 'utf8');
assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|\.innerHTML|gtag\(/.test(source));
assert.ok(source.includes("const url = 'https://aitoolnavigator.github.io/serious-dating-lab/profile-builder.html?utm_source=social&utm_medium=organic&utm_campaign=first_decision&utm_content=profile_builder'"));
console.log('PASS: 42 drafts, option validation, punctuation, empty/custom/long inputs and no input transmission/storage/HTML insertion.');
