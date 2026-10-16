(function () {
  const hobbies = {
    movies: '休日は映画やドラマを観て、のんびり過ごす時間が好きです。',
    walks: '休日は散歩をして、気になった道やお店を見つけるのが好きです。',
    cooking: '休日は料理をして過ごすのが好きです。',
    cafes: '休日はカフェや、気になるお店を探すのが楽しみです。',
    books: '休日は本を読んで過ごす時間が好きです。',
    exercise: '休日は体を動かして、気分転換するのが好きです。',
    own: ''
  };
  const goals = {
    talk: 'まずはメッセージで、お互いの好きなことをゆっくり話せたらうれしいです。',
    marriage: '結婚を考えられる方と出会えたらと思い、始めました。お互いのことを少しずつ知っていけたらうれしいです。',
    life: 'ふだんの何気ない時間を、一緒に楽しめる方と出会えたらうれしいです。'
  };
  const tones = {
    warm: ['はじめまして。プロフィールを見てくださって、ありがとうございます。', 'よろしくお願いします。'],
    calm: ['はじめまして。プロフィールをご覧いただき、ありがとうございます。', 'どうぞよろしくお願いいたします。']
  };
  const clean = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 180).join('');
  function buildDraft({ hobby, detail, goal, tone }) {
    if (!Object.hasOwn(hobbies, hobby) || !Object.hasOwn(goals, goal) || !Object.hasOwn(tones, tone)) throw Error('Invalid option');
    detail = clean(detail);
    if (detail && !/[。！？!?…」）)]$/.test(detail)) detail += '。';
    const [hello, close] = tones[tone];
    return [hello, [hobbies[hobby], detail].filter(Boolean).join(''), goals[goal], close].filter(Boolean).join('\n\n');
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { buildDraft }; return; }
  const form = document.getElementById('profile-form');
  if (!form) return;
  const result = document.getElementById('profile-result');
  const draft = document.getElementById('profile-draft');
  const status = document.getElementById('profile-status');
  const count = () => { document.getElementById('profile-count').textContent = Array.from(draft.value).length; };
  document.getElementById('profile-generate').disabled = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    draft.value = buildDraft({ hobby: form.elements.hobby.value, detail: form.elements.detail.value, goal: form.elements.goal.value, tone: form.elements.tone.value });
    result.hidden = false;
    status.textContent = '下書きができました。自分と違うところは直してからコピーしてください。';
    count();
    draft.focus();
  });
  draft.addEventListener('input', () => { count(); status.textContent = ''; });
  document.getElementById('profile-copy').addEventListener('click', async () => {
    if (!draft.value.trim()) { status.textContent = 'コピーする文章を入力してください。'; return; }
    try { await navigator.clipboard.writeText(draft.value); status.textContent = '文章をコピーしました。'; }
    catch { draft.focus(); draft.select(); status.textContent = '自動コピーできませんでした。選択した文章をコピーしてください。'; }
  });
  document.getElementById('profile-clear').addEventListener('click', () => {
    form.reset(); draft.value = ''; result.hidden = true; count(); status.textContent = '';
    document.getElementById('profile-hobby').focus();
  });
  document.getElementById('profile-share').addEventListener('click', async () => {
    const url = 'https://aitoolnavigator.github.io/serious-dating-lab/profile-builder.html?utm_source=social&utm_medium=organic&utm_campaign=first_decision&utm_content=profile_builder';
    const shareStatus = document.getElementById('profile-share-status');
    try { await navigator.clipboard.writeText(url); shareStatus.textContent = 'ツールのURLをコピーしました。入力内容と下書きは含まれません。'; }
    catch { shareStatus.textContent = '自動コピーできませんでした。ブラウザーのアドレス欄から、このページのURLをコピーしてください。'; }
  });
})();
