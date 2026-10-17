const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const sites = ['serious-dating-lab', 'aga-hair-start', 'mens-cleanlook-lab'];
const proof = process.env.WAYFINDING_PROOF;
const server = http.createServer((req, res) => {
  let pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(root, '.' + decodeURIComponent(pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
    res.writeHead(404).end(); return;
  }
  const type = {'.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2'}[path.extname(file)] || 'text/html; charset=utf-8';
  res.setHeader('Content-Type', type);
  res.end(fs.readFileSync(file));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless: true, channel: 'chrome'});
  let count = 0;
  try {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({viewport: {width, height: 1000}});
      await page.route('https://**/*', route => route.abort());
      for (const site of sites) {
        for (const name of fs.readdirSync(path.join(root, site)).filter(n => n.endsWith('.html') && n !== 'editorial-policy.html')) {
          await page.goto(`${base}/${site}/${name}`);
          const home = name === 'index.html';
          const directory = page.locator(home ? '.topic-directory' : '.article-directory');
          assert.equal(await directory.count(), 1, site + '/' + name);
          assert(await directory.isVisible());
          assert.equal(await page.locator('.mobile-outline').count(), 0);
          assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), `overflow ${width} ${site}/${name}`);
          const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id));
          assert.equal(ids.length, new Set(ids).size, 'duplicate ids');
          const links = await directory.locator(home ? ':scope > ul > li > a' : 'li a').all();
          assert(links.length >= 2);
          if (home) {
            assert.equal(links.length, 6);
            const box = await directory.boundingBox();
            const comic = await page.locator('.lead-stories').boundingBox();
            assert(box.y + box.height <= comic.y, 'directory must precede feature');
            assert(box.y < 700, 'directory starts too far down');
            const search = page.getByRole('searchbox', {name: '記事を検索', exact: true});
            assert(await search.isVisible());
            const term = {'serious-dating-lab': '解約', 'aga-hair-start': '副作用', 'mens-cleanlook-lab': '麻酔'}[site];
            const target = {'serious-dating-lab': 'paid-plan.html', 'aga-hair-start': 'doctor-questions.html', 'mens-cleanlook-lab': 'hair-removal.html'}[site];
            const transmitted = [];
            const recordRequest = request => {
              if (!['image', 'font', 'stylesheet'].includes(request.resourceType())) transmitted.push(request.url());
            };
            page.on('request', recordRequest);
            const storage = await page.evaluate(() => JSON.stringify({...localStorage}));
            await search.fill(term);
            assert(await page.locator(`.search-results a[href="./${target}"]`).isVisible());
            await search.press('Enter');
            assert(new URL(page.url()).pathname.endsWith('/index.html'));
            await search.fill('<script>見つからない語</script>');
            assert.equal(await page.locator('.search-results li:visible').count(), 0);
            assert((await page.locator('.search-status').innerText()).includes('一致する記事がありません'));
            await page.getByRole('button', {name: '検索をクリア', exact: true}).click();
            assert(await links[0].isVisible());
            assert.equal(await page.locator('.search-status').innerText(), '');
            assert.equal(await page.evaluate(() => JSON.stringify({...localStorage})), storage);
            assert.equal(transmitted.length, 0, 'search must not transmit data: ' + JSON.stringify(transmitted));
            page.off('request', recordRequest);
          } else {
            assert.equal(await page.locator('.reader-summary li').count() >= 2, true);
            const summary = await page.locator('.reader-summary').boundingBox();
            const box = await directory.boundingBox();
            assert(summary.y < box.y, 'summary must precede contents');
            const comic = page.locator('.comic-story');
            if (await comic.count()) {
              assert(!await comic.isVisible(), 'comic must be optional initially');
              await page.locator('.story-extra > summary').click();
              assert(await comic.isVisible(), 'comic must open');
              assert((await directory.boundingBox()).y < (await comic.boundingBox()).y, 'contents must precede comic');
              await page.locator('.story-extra > summary').click();
              assert(!await comic.isVisible(), 'comic must close');
            }
            for (const link of links) {
              const href = await link.getAttribute('href');
              const target = page.locator('[id="' + href.slice(1) + '"]');
              assert.equal(await target.count(), 1, `broken ${site}/${name} ${href}`);
              assert(await target.isVisible(), `hidden target ${href}`);
            }
            const first = links[0];
            await first.click();
            assert(new URL(page.url()).hash === await first.getAttribute('href'));
            await page.evaluate(() => window.scrollTo(0, 0));
          }
          if (proof && (home || ['paid-plan.html', 'cost.html', 'hair-removal.html'].includes(name))) {
            fs.mkdirSync(proof, {recursive: true});
            await page.screenshot({path: path.join(proof, `${site}-${name.replace('.html', '')}-${width}.png`)});
          }
          count++;
        }
      }
      await page.close();
    }
    const staticPage = await browser.newPage({javaScriptEnabled: false, viewport: {width: 390, height: 900}});
    await staticPage.route('https://**/*', route => route.abort());
    for (const site of sites) {
      await staticPage.goto(`${base}/${site}/`);
      assert.equal(await staticPage.locator('.topic-directory > ul > li > a:visible').count(), 6);
      assert(!await staticPage.locator('.reader-search').isVisible(), 'no nonfunctional search without JS');
    }
    await staticPage.goto(`${base}/aga-hair-start/cost.html`);
    await staticPage.locator('.story-extra > summary').click();
    assert(await staticPage.locator('.comic-story').isVisible(), 'comic opens without JS');
    await staticPage.close();
    console.log(`PASS: ${count} responsive page checks; local search, optional comics, no-JS routes, anchors, unique IDs, no horizontal overflow.`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
