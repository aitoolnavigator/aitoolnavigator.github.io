const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const {estimate} = require('../assets/ai-cost-calculator.js');
const root = path.resolve(__dirname, '..');
const example = {server:1000,api:2000,backup:300,domain:1200,setup:3000,hours:2,hourly:1500,months:12};
assert.deepEqual(estimate(example), {cash:43800, average:3650, labor:36000, total:79800});
assert.equal(estimate({...example,months:1}).cash, 7500);
assert.equal(estimate({...example,months:13}).cash, 48300);
for (const months of [0, -1, NaN, Infinity, 1.5, 121]) assert.equal(estimate({...example,months}), null);
assert.equal(estimate({...example,api:NaN}), null);
assert.equal(estimate({...example,server:-1}), null);
assert.equal(estimate({...example,api:10000001}), null);
const zero = Object.fromEntries(Object.keys(example).map(k => [k, k === 'months' ? 1 : 0]));
assert.equal(estimate(zero).total, 0);
const server = http.createServer((req,res) => {
  const name = new URL(req.url,'http://localhost').pathname.replace(/\/$/, '/index.html');
  const file = path.resolve(root, '.' + decodeURIComponent(name));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {res.writeHead(404).end();return;}
  res.setHeader('Content-Type', {'.js':'text/javascript','.css':'text/css'}[path.extname(file)] || 'text/html; charset=utf-8');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    for(const width of [320,390,1440]) {
      const page=await browser.newPage({viewport:{width,height:1000}});
      // Never create advertising traffic during local QA.
      await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
      for(const name of ['index.html','editorial-policy.html','server-cost-calculator-for-ai.html']) {
        await page.goto(base+name);
        assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),name+' '+width);
      }
      const requests=[];
      page.on('request',r=>requests.push(r.url()));
      assert.equal(await page.locator('#ai-cost-result').innerText(),'未計算');
      await page.getByRole('button',{name:'運用費を計算',exact:true}).click();
      assert.equal(await page.locator('#ai-cost-result').innerText(),'未計算');
      await page.getByRole('button',{name:'仮の例を入力',exact:true}).click();
      await page.getByRole('button',{name:'運用費を計算',exact:true}).click();
      assert((await page.locator('#ai-cost-result').innerText()).includes('43,800円'));
      assert((await page.locator('#ai-cost-result').innerText()).includes('79,800円'));
      await page.locator('[name=months]').fill('0');
      assert.equal(await page.locator('#ai-cost-result').innerText(),'未計算');
      await page.getByRole('button',{name:'運用費を計算',exact:true}).click();
      assert.equal(await page.locator('#ai-cost-result').innerText(),'未計算');
      await page.getByRole('button',{name:'入力を消す',exact:true}).click();
      assert.equal(await page.locator('[name=server]').inputValue(),'');
      assert.equal(requests.length,0,'calculator inputs must not transmit');
      if(process.env.AI_COST_PROOF){fs.mkdirSync(process.env.AI_COST_PROOF,{recursive:true});await page.screenshot({path:path.join(process.env.AI_COST_PROOF,`cost-${width}.png`),fullPage:true});}
      await page.close();
    }
    const page=await browser.newPage({javaScriptEnabled:false});
    await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    await page.goto(base+'server-cost-calculator-for-ai.html');
    assert(await page.getByRole('button',{name:'運用費を計算',exact:true}).isDisabled());
    assert((await page.locator('#s2').innerText()).includes('43,800円'));
    console.log('PASS: cost math, annual renewal boundaries, empty/invalid/zero/reset, no transmission, no-JS and 3 responsive pages at 3 widths.');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
