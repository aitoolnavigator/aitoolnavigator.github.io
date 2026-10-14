(() => {
  document.querySelectorAll('[data-cost-tool]').forEach(tool => {
    const update = () => {
      const values = [...tool.querySelectorAll('input')].map(input => Number(input.value));
      const output = tool.querySelector('output');
      if (values.some(value => !Number.isFinite(value) || value < 0) || values[1] < 1 || !Number.isInteger(values[1])) {
        output.textContent = '金額は0以上、期間・回数は1以上の整数で入力してください。';
        return;
      }
      const [base, count, extra, once] = values;
      output.textContent = `合計 ${((base + extra) * count + once).toLocaleString('ja-JP')}円`;
    };
    tool.addEventListener('input', update);
    update();
  });
  document.querySelectorAll('.checklist').forEach(list => {
    const update = () => {
      const checks = [...list.querySelectorAll('input')];
      list.querySelector('output').textContent = `${checks.filter(check => check.checked).length} / ${checks.length}項目を確認済み`;
    };
    list.addEventListener('change', update);
    update();
  });
  document.querySelectorAll('[data-copy-note]').forEach(button => button.addEventListener('click', async () => {
    const note = document.getElementById(button.dataset.copyNote);
    const status = button.parentElement.querySelector('[role="status"]');
    try { await navigator.clipboard.writeText(note.value); status.textContent = 'メモをコピーしました。'; }
    catch { note.focus(); note.select(); status.textContent = 'コピーできませんでした。選択したメモをコピーしてください。'; }
  }));
})();
