(() => {
  const root = document.querySelector('[data-reader-search]');
  if (!root) return;
  const input = root.querySelector('input');
  const clear = root.querySelector('[data-search-clear]');
  const results = root.querySelector('.search-results');
  const status = root.querySelector('[role="status"]');
  const topics = root.parentElement.querySelector(':scope > ul');
  const entries = [...results.children];
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ja').trim();
  let composing = false;
  const update = () => {
    if (composing) return;
    const query = normalize(input.value);
    const words = query.split(/\s+/u).filter(Boolean);
    let count = 0;
    for (const entry of entries) {
      const match = words.every(word => normalize(entry.dataset.searchTerms).includes(word));
      entry.hidden = !match;
      if (match) count++;
    }
    results.hidden = !query;
    topics.hidden = Boolean(query);
    clear.hidden = !query;
    status.textContent = !query ? '' : count ? `${count}件の記事が見つかりました。` : '一致する記事がありません。「料金」「写真」など、短い言葉でもう一度お試しください。';
  };
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; update(); });
  input.addEventListener('input', update);
  input.addEventListener('search', update);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') event.preventDefault();
    if (event.key === 'Escape' && !event.isComposing) {
      input.value = '';
      update();
    }
  });
  clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  root.hidden = false;
  update();
})();
