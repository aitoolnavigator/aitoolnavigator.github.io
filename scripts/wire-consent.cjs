const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const markup = fs.readFileSync(path.join(root, 'assets/analytics-consent.html'), 'utf8').trim();
// Decide banner visibility before first paint; never load an analytics service here.
const early = '<script data-consent-visibility>(function(){var s;try{s=JSON.parse(localStorage.getItem("media-analytics-consent-v1"))}catch(e){}if(!(s&&["accepted","rejected"].includes(s.value)&&Number.isFinite(s.time)&&Date.now()-s.time>=0&&Date.now()-s.time<15552000000))document.documentElement.classList.add("analytics-prompt")})();</script>';
let count = 0;
for (const site of ['serious-dating-lab','aga-hair-start','mens-cleanlook-lab']) {
  for (const name of fs.readdirSync(path.join(root,site)).filter(n=>n.endsWith('.html'))) {
    const file = path.join(root,site,name);
    let html = fs.readFileSync(file,'utf8');
    if (!html.includes('data-consent-visibility')) html = html.replace('</head>',early+'</head>');
    if (!html.includes('<section class="analytics-consent"')) {
      const disclosure = /<p class="disclosure">[\s\S]*?<\/p>/g;
      if ([...html.matchAll(disclosure)].length !== 1) throw Error(file);
      html = html.replace(disclosure,match=>match+markup);
    }
    fs.writeFileSync(file,html);
    count++;
  }
}
console.log(`Pre-rendered consent on ${count} pages.`);
