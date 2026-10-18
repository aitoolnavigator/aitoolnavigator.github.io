const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const proof = process.env.SOURCING_PROOF;
const server = http.createServer((req, res) => {
  let url = new URL(req.url, 'http://localhost').pathname;
  if (url.endsWith('/')) url += 'index.html';
  const file = path.resolve(root, '.' + decodeURIComponent(url));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', {'.css':'text/css', '.js':'text/javascript', '.png':'image/png'}[path.extname(file)] || 'text/html; charset=utf-8');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/sourcing-note/`;
  const browser = await chromium.launch({headless:true, channel:'chrome'});
  try {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({viewport:{width, height:1000}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.candidate:visible').count(), 4);
      assert((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
      assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
      await page.getByRole('searchbox').fill('ニコン');
      assert.equal(await page.locator('.candidate:visible').count(), 1);
      await page.getByRole('searchbox').fill('');
      await page.locator('#status').selectOption('qualified');
      assert(await page.locator('#empty').isVisible());
      assert.equal(await page.locator('.candidate:visible').count(), 0);
      await page.getByRole('button', {name:'すべての候補に戻す'}).click();
      await page.locator('#sort').selectOption('cheap');
      assert.equal(await page.locator('.candidate:visible').first().getAttribute('data-id'), 'nikon');
      await page.locator('[data-save="nikon"]').click();
      assert.equal(await page.locator('[data-save="nikon"]').getAttribute('aria-pressed'), 'true');
      await page.locator('#status').selectOption('saved');
      assert.equal(await page.locator('.candidate:visible').count(), 1);
      await page.reload();
      assert.equal(await page.locator('[data-save="nikon"]').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-save="nikon"]').click();
      assert.equal(await page.locator('[data-save="nikon"]').getAttribute('aria-pressed'), 'false');
      await page.locator('[data-id="pentax"] summary').click();
      assert(await page.locator('[data-id="pentax"] .evidence').isVisible());
      assert.equal(await page.locator('[data-id="pentax"] .evidence a').count(), 3);
      await page.locator('[data-id="pentax"] summary').click();
      await page.locator('[data-calculate="nikon"]').click();
      assert.equal(await page.locator('#buy').inputValue(), '1650');
      assert.equal(await page.locator('#sale').inputValue(), '');
      const inputs = {sale:80, fx:150, buy:3000, domestic:0, 'buyer-shipping':0, shipping:15, fee:15, fixed:0.3, packing:1, other:2};
      const requests = [];
      page.on('request', request => { if (['fetch','xhr','document','ping'].includes(request.resourceType())) requests.push(request.url()); });
      for (const [id, value] of Object.entries(inputs)) await page.locator(`[id="${id}"]`).fill(String(value));
      await page.getByRole('button', {name:'差額を計算'}).click();
      assert.equal(await page.locator('#profit').innerText(), '$29.70');
      assert((await page.locator('#target-result').innerText()).includes('目標条件内'));
      await page.locator('#shipping').fill('100');
      assert.equal(await page.locator('#profit').innerText(), '未計算');
      await page.getByRole('button', {name:'差額を計算'}).click();
      assert.equal(await page.locator('#profit').innerText(), '-$55.30');
      await page.locator('#fx').fill('0');
      await page.getByRole('button', {name:'差額を計算'}).click();
      assert.equal(await page.locator('#profit').innerText(), '未計算');
      await page.getByRole('button', {name:'入力を消す'}).click();
      assert.equal(await page.locator('#buy').inputValue(), '');
      assert.equal(requests.length, 0, 'calculator must not transmit');
      assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
      const image = page.locator('.criteria img');
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(el => el.decode());
      assert(await image.evaluate(el => el.naturalWidth > 100));
      await page.evaluate(() => window.scrollTo(0,0));
      if (proof) { fs.mkdirSync(proof, {recursive:true}); await page.screenshot({path:path.join(proof, `sourcing-${width}.png`), fullPage:true}); }
      assert.deepEqual(errors, []);
      await page.close();
    }
    const staticPage = await browser.newPage({javaScriptEnabled:false});
    await staticPage.goto(url);
    assert.equal(await staticPage.locator('.candidate:visible').count(), 4);
    assert(await staticPage.getByRole('button', {name:'差額を計算'}).isDisabled());
    assert(!await staticPage.locator('#filters').isVisible());
    await staticPage.locator('[data-id="nikon"] summary').click();
    assert(await staticPage.locator('[data-id="nikon"] .evidence').isVisible());
    await staticPage.close();
    const readingPages = fs.readdirSync(path.join(root, 'sourcing-note')).filter(name => name.endsWith('.html') && name !== 'index.html');
    assert.equal(readingPages.length, 13);
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({viewport:{width, height:1000}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const name of readingPages) {
        await page.goto(url + name);
        assert.equal(await page.locator('h1').count(), 1);
        assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), `overflow ${width} ${name}`);
        const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
        assert.equal(ids.length, new Set(ids).size);
        const anchors = await page.locator('a[href^="#"]').all();
        for (const anchor of anchors) assert.equal(await page.locator('[id="' + (await anchor.getAttribute('href')).slice(1) + '"]').count(), 1);
        if (name !== 'guides.html') {
          assert.equal(await page.locator('.reading-section').count(), 4);
          assert.equal(await page.locator('.reading-summary li').count(), 3);
          assert.equal(await page.locator('.article-related .guide-row').count(), 3);
          const first = page.locator('.reading-contents a').first();
          await first.click();
          assert(new URL(page.url()).hash === await first.getAttribute('href'));
          await page.evaluate(() => window.scrollTo(0,0));
        }
        if (proof && ['guides.html','monthly-units.html','thirty-eighty-study.html'].includes(name)) await page.screenshot({path:path.join(proof, `${name.replace('.html','')}-${width}.png`)});
      }
      await page.goto(url + 'guides.html');
      assert.equal(await page.locator('.guide-group').count(), 4);
      assert.equal(await page.locator('[data-guide-terms]:visible').count(), 12);
      await page.getByRole('searchbox', {name:'記事を検索'}).fill('仕入れ上限');
      assert(await page.locator('.guide-row[href="./sourcing-ceiling.html"]').isVisible());
      await page.getByRole('searchbox', {name:'記事を検索'}).fill('絶対に一致しない検索');
      assert(await page.locator('.guide-empty').isVisible());
      await page.locator('.category-index a[href="#risk"]').click();
      assert.equal(await page.locator('[data-guide-terms]:visible').count(), 12);
      await page.goto(url + 'monthly-units.html');
      const requests = [];
      page.on('request', request => { if (['fetch','xhr','ping','document'].includes(request.resourceType())) requests.push(request.url()); });
      await page.locator('#goal-margin').fill('3000');
      await page.getByRole('button', {name:'必要な販売数を計算'}).click();
      assert((await page.locator('#goal-result').innerText()).includes('4個'));
      assert((await page.locator('#goal-result').innerText()).includes('2時間'));
      await page.locator('#goal-margin').fill('0');
      await page.getByRole('button', {name:'必要な販売数を計算'}).click();
      assert(!(await page.locator('#goal-result').innerText()).includes('Infinity'));
      await page.locator('#goal-margin').fill('1000');
      await page.locator('#goal-amount').fill('0');
      await page.getByRole('button', {name:'必要な販売数を計算'}).click();
      assert((await page.locator('#goal-result').innerText()).includes('0個'));
      assert.equal(requests.length, 0, 'goal input must not be transmitted');
      assert.deepEqual(errors, []);
      await page.close();
    }
    const blocked = await browser.newPage();
    await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', {get(){throw new Error('blocked');}}); });
    await blocked.goto(url);
    await blocked.locator('[data-save="nikon"]').click();
    assert((await blocked.locator('#save-message').innerText()).includes('永続保存できません'));
    await blocked.locator('#status').selectOption('saved');
    assert.equal(await blocked.locator('.candidate:visible').count(), 1);
    await blocked.close();
    console.log('PASS: 3 viewports; sourcing tools, 4 categories / 12 articles, article navigation, library search, goal calculation, invalid/reset/no-transmission, image and no-JS.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
