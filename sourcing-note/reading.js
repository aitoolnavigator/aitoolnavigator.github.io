(() => {
  const search = document.querySelector('.guide-search');
  if (search) {
    const input = search.querySelector('input');
    const rows = [...document.querySelectorAll('[data-guide-terms]')];
    const groups = [...document.querySelectorAll('.guide-group')];
    const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ja').trim();
    let composing = false;
    const update = () => {
      if (composing) return;
      const words = normalize(input.value).split(/\s+/u).filter(Boolean);
      let count = 0;
      for (const row of rows) {
        row.hidden = !words.every(word => normalize(row.dataset.guideTerms).includes(word));
        if (!row.hidden) count++;
      }
      for (const group of groups) group.hidden = ![...group.querySelectorAll('[data-guide-terms]')].some(row => !row.hidden);
      document.querySelector('#guide-count').textContent = `${count}本の記事`;
      document.querySelector('.guide-empty').hidden = count !== 0;
    };
    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => { composing = false; update(); });
    input.addEventListener('input', update);
    input.addEventListener('search', update);
    document.querySelector('#guide-clear').addEventListener('click', () => { input.value = ''; update(); input.focus(); });
    // Selecting a category must also work when a previous search hid that group.
    for (const link of document.querySelectorAll('.category-index a')) link.addEventListener('click', () => { input.value = ''; update(); });
    search.hidden = false;
    update();
  }
  const form = document.querySelector('[data-goal-tool]');
  if (form) {
    const output = document.querySelector('#goal-result');
    form.querySelector('button').disabled = false;
    form.addEventListener('input', () => { output.textContent = '入力を変更しました。もう一度計算してください。'; });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const goal = document.querySelector('#goal-amount').valueAsNumber;
      const margin = document.querySelector('#goal-margin').valueAsNumber;
      const minutes = document.querySelector('#goal-time').valueAsNumber;
      if (![goal, margin, minutes].every(Number.isFinite) || margin <= 0 || goal < 0 || minutes < 0) return;
      const units = Math.ceil(goal / margin);
      const hours = Math.round(units * minutes / 60 * 10) / 10;
      output.textContent = `必要な販売数：${units.toLocaleString('ja-JP')}個。入力した作業時間の合計：約${hours.toLocaleString('ja-JP')}時間。販売数の予測・達成の保証ではありません。`;
    });
  }
})();
