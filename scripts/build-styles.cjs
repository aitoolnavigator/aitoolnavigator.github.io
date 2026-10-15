const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const sites = ['serious-dating-lab', 'aga-hair-start', 'mens-cleanlook-lab'];
const allowed = ['decision-articles.css', 'illustration-system.css', 'editorial-comics.css', 'magazine-v3.css', 'site-analytics.css'];
const outputs = new Map();
const pages = [];
// Read and validate every page before changing files, preserving each cascade.
for (const site of sites) for (const name of fs.readdirSync(path.join(root, site)).filter(n => n.endsWith('.html'))) {
  const file = path.join(root, site, name);
  const html = fs.readFileSync(file, 'utf8');
  const current = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)];
  let sources = current.map(m => m[0].match(/href="\.\.\/assets\/([^"]+)"/)?.[1]);
  if (sources.length === 1 && /^site-(reading|policy)\.[a-f0-9]+\.css$/.test(sources[0])) {
    const bundle = fs.readFileSync(path.join(root, 'assets', sources[0]), 'utf8');
    sources = [...bundle.matchAll(/\/\* Source: ([a-z0-9-]+\.css) \*\//g)].map(m => m[1]);
  }
  if (sources.length < 4 || sources.some(s => !allowed.includes(s)) || new Set(sources).size !== sources.length ||
      !['decision-articles.css', 'magazine-v3.css', 'site-analytics.css'].every(s => sources.includes(s))) throw Error('Unexpected stylesheet set: ' + file);
  const css = sources.map(name => `/* Source: ${name} */\n${fs.readFileSync(path.join(root, 'assets', name), 'utf8').replace(/\r\n/g, '\n')}`).join('\n');
  const hash = crypto.createHash('sha256').update(css).digest('hex').slice(0, 10);
  const comics = sources.includes('editorial-comics.css');
  const output = `site-${comics ? 'reading' : 'policy'}.${hash}.css`;
  outputs.set(output, css);
  pages.push({file, html, output});
}
for (const [output, css] of outputs) fs.writeFileSync(path.join(root, 'assets', output), css);
for (let {file, html, output} of pages) {
  let first = true;
  html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, () => {
    if (!first) return '';
    first = false;
    return `<link rel="stylesheet" href="../assets/${output}">`;
  });
  fs.writeFileSync(file, html);
}
console.log(`Built ${outputs.size} deterministic CSS bundles; wired ${pages.length} pages.`);
