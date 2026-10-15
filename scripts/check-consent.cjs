const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
let count = 0;
for (const site of ['serious-dating-lab','aga-hair-start','mens-cleanlook-lab']) {
  for (const name of fs.readdirSync(path.join(root,site)).filter(n=>n.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(root,site,name),'utf8');
    const matches = [...html.matchAll(/<script data-consent-visibility>([\s\S]*?)<\/script>/g)];
    assert.equal(matches.length,1);
    assert.ok(matches[0].index < html.indexOf('</head>'));
    assert.equal(html.split('<section class="analytics-consent"').length,2);
    for (const [value, prompt] of [[null,true],['broken',true],[JSON.stringify({value:'accepted',time:Date.now()}),false],[JSON.stringify({value:'rejected',time:Date.now()}),false],[JSON.stringify({value:'accepted',time:1}),true],[JSON.stringify({value:'accepted',time:Date.now()+60000}),true],['blocked',true]]) {
      const classes = [];
      vm.runInNewContext(matches[0][1], {
        document: {documentElement:{classList:{add:v=>classes.push(v)}}},
        localStorage: {getItem:()=>{if(value==='blocked')throw Error('blocked');return value;}}, Date
      });
      assert.equal(classes.includes('analytics-prompt'),prompt,site+'/'+name);
    }
    count++;
  }
}
console.log(`PASS: ${count} static consent panels; pre-paint visibility for new, accepted, rejected, expired, future and blocked storage.`);
