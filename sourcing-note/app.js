(() => {
  const items = [...document.querySelectorAll('.candidate')];
  const query = document.querySelector('#query');
  const status = document.querySelector('#status');
  const sort = document.querySelector('#sort');
  const list = document.querySelector('#candidate-list');
  const empty = document.querySelector('#empty');
  const message = document.querySelector('#save-message');
  const storageKey = 'sourcing-note-saved-v1';
  const ids = new Set(items.map(item => item.dataset.id));
  let saved = new Set();
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(value)) saved = new Set(value.filter(id => ids.has(id)));
  } catch (_) { /* Storage is optional; browsing and calculation still work. */ }
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ja').trim();
  const refresh = () => {
    const words = normalize(query.value).split(/\s+/u).filter(Boolean);
    let count = 0;
    const ordered = [...items];
    if (sort.value === 'cheap') ordered.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    if (sort.value === 'name') ordered.sort((a, b) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
    for (const item of ordered) {
      const visible = words.every(word => normalize(item.dataset.terms).includes(word)) &&
        (status.value === 'all' || status.value === item.dataset.kind || (status.value === 'saved' && saved.has(item.dataset.id)));
      item.hidden = !visible;
      if (visible) count++;
      list.append(item);
      const button = item.querySelector('[data-save]');
      button.setAttribute('aria-pressed', String(saved.has(item.dataset.id)));
      button.textContent = saved.has(item.dataset.id) ? '保存済み' : '保存';
      button.setAttribute('aria-label', item.querySelector('h3').textContent + (saved.has(item.dataset.id) ? 'の保存を解除' : 'を保存'));
    }
    document.querySelector('#result-count').textContent = `${count}件 / 全4件`;
    empty.hidden = count !== 0;
    document.querySelector('#empty-message').textContent = status.value === 'qualified' ? '現時点では、仕入れ$30以下・成約$80以上と経費後の利益を確認できた商品はありません。' : status.value === 'saved' ? '候補の保存ボタンを押すと、ここで絞り込めます。' : '型番やメーカー名を短くして、もう一度お試しください。';
  };
  document.querySelector('#filters').hidden = false;
  let composing = false;
  query.addEventListener('compositionstart', () => { composing = true; });
  query.addEventListener('compositionend', () => { composing = false; refresh(); });
  query.addEventListener('input', () => { if (!composing) refresh(); });
  query.addEventListener('search', refresh);
  status.addEventListener('change', refresh);
  sort.addEventListener('change', refresh);
  document.querySelector('#reset').addEventListener('click', () => { query.value = ''; status.value = 'all'; sort.value = 'default'; refresh(); query.focus(); });
  for (const button of document.querySelectorAll('[data-save]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const id = button.dataset.save;
      if (saved.has(id)) saved.delete(id); else saved.add(id);
      try { localStorage.setItem(storageKey, JSON.stringify([...saved])); message.textContent = '保存内容をこのブラウザーに反映しました。'; }
      catch (_) { message.textContent = 'この環境では永続保存できません。このページを開いている間だけ保持します。'; }
      refresh();
    });
  }
  const form = document.querySelector('#calc-form');
  form.querySelector('[type="submit"]').disabled = false;
  const fields = ['sale', 'fx', 'buy', 'domestic', 'buyer-shipping', 'shipping', 'fee', 'fixed', 'packing', 'other'];
  const profit = document.querySelector('#profit');
  const breakdown = document.querySelector('#breakdown');
  const target = document.querySelector('#target-result');
  const usd = value => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(value);
  const clearResult = () => {
    profit.textContent = '未計算';
    breakdown.textContent = 'すべての項目を入力すると計算できます。';
    target.textContent = '';
    delete profit.parentElement.dataset.negative;
  };
  form.addEventListener('input', clearResult);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) { clearResult(); return; }
    const values = Object.fromEntries(fields.map(id => [id, document.getElementById(id).valueAsNumber]));
    if (Object.values(values).some(value => !Number.isFinite(value)) || values.fx <= 0) { clearResult(); return; }
    const revenue = values.sale + values['buyer-shipping'];
    const sourcing = (values.buy + values.domestic) / values.fx;
    const fees = revenue * values.fee / 100 + values.fixed;
    const expenses = sourcing + fees + values.shipping + values.packing + values.other;
    const difference = revenue - expenses;
    profit.textContent = usd(difference);
    profit.parentElement.dataset.negative = String(difference < 0);
    breakdown.textContent = `受取予定 ${usd(revenue)} − 入力した経費 ${usd(expenses)}。この金額で売れることを示すものではありません。`;
    const priceMatch = values.buy / values.fx <= 30 && values.sale >= 80;
    target.textContent = `${priceMatch ? '入力した本体価格は目標条件内です。' : '入力した本体価格は目標条件外です。'} 成約実績・状態・在庫の確認とは別の試算です。${difference > 0 ? '未計上の費用や返品で差額が減る可能性があります。' : ''}`;
  });
  form.addEventListener('reset', () => { clearResult(); document.querySelector('#calc-item').textContent = '商品名を選ぶか、金額を直接入力'; });
  for (const button of document.querySelectorAll('[data-calculate]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const item = items.find(item => item.dataset.id === button.dataset.calculate);
      form.reset();
      document.querySelector('#buy').value = item.dataset.price;
      document.querySelector('#calc-item').textContent = item.querySelector('h3').textContent + ' / 国内の商品価格を入力済み';
      document.querySelector('#calculator').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
      document.querySelector('#sale').focus({preventScroll: true});
    });
  }
  refresh();
})();
