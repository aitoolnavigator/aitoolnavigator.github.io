(function () {
  function estimate(values) {
    const keys = ['server', 'api', 'backup', 'domain', 'setup', 'hours', 'hourly', 'months'];
    if (!keys.every(key => Number.isFinite(values[key]) && values[key] >= 0 && values[key] <= 10000000) ||
        !Number.isInteger(values.months) || values.months < 1 || values.months > 120) return null;
    const recurring = values.server + values.api + values.backup;
    // Annual domain charges are paid at the start of each contract year.
    const cash = recurring * values.months + values.domain * Math.ceil(values.months / 12) + values.setup;
    const labor = values.hours * values.hourly * values.months;
    return { cash, average: cash / values.months, labor, total: cash + labor };
  }
  if (typeof module !== 'undefined') module.exports = { estimate };
  if (typeof document === 'undefined') return;
  const form = document.querySelector('#ai-cost-form');
  if (!form) return;
  const output = document.querySelector('#ai-cost-result');
  const money = value => Math.round(value).toLocaleString('ja-JP') + '円';
  const reset = () => { output.textContent = '未計算'; };
  form.querySelector('button[type=submit]').disabled = false;
  form.addEventListener('input', reset);
  form.addEventListener('reset', reset);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const entries = [...new FormData(form)].map(([key, value]) => [key, value.trim() === '' ? NaN : Number(value)]);
    const values = Object.fromEntries(entries);
    const result = estimate(values);
    if (!result) { output.textContent = '入力した数値と期間を確認してください。'; return; }
    output.textContent = values.months + 'か月の支払見込み：' + money(result.cash) +
      ' ／ 月平均：' + money(result.average) + '。作業時間の換算額：' + money(result.labor) +
      '。作業時間を含む合計：' + money(result.total) + '。';
  });
  document.querySelector('#ai-cost-example').addEventListener('click', () => {
    const example = { server: 1000, api: 2000, backup: 300, domain: 1200, setup: 3000, hours: 2, hourly: 1500, months: 12 };
    for (const [name, value] of Object.entries(example)) form.elements.namedItem(name).value = value;
    reset();
  });
})();
