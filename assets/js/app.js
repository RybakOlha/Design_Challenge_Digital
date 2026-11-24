'use strict';
const $ = id => document.getElementById(id), work = $('work'), key = 'design-challenge-digital-v1';
const fresh = () => ({ student: '', className: '', variant: 'A', tab: 0, theme: false, A: { letters: {}, extra: '', pins: [], math: {} }, B: { letters: {}, extra: '', pins: [], math: {} } });
let state = fresh();
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (validState(saved))
    state = saved;
}
catch (e) { }
// Validate backups before replacing the current work.
function validState(s) {
  const record = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  return record(s) && typeof s.student === 'string' && typeof s.className === 'string' && typeof s.theme === 'boolean' && ['A', 'B'].includes(s.variant) && [0, 1, 2, 3, 4, 5].includes(s.tab) && ['A', 'B'].every(v => {
    const r = s[v];
    return record(r) && record(r.letters) && Object.entries(r.letters).every(([k, x]) => /^\d+,\d+$/.test(k) && typeof x === 'string' && /^[A-Z]?$/.test(x)) && typeof r.extra === 'string' && Array.isArray(r.pins) && r.pins.length <= 12 && r.pins.every(p => record(p) && typeof p.problem === 'string' && typeof p.fix === 'string' && ((p.x === null && p.y === null) || [p.x, p.y].every(x => Number.isFinite(x) && x >= 0 && x <= 100))) && record(r.math) && Object.values(r.math).every(x => typeof x === 'string') && ['puzzle', 'logic', 'fact'].every(k => r[k] === undefined || (record(r[k]) && Object.entries(r[k]).every(([id, value]) => k === 'puzzle' && /^screen[0-3]$/.test(id) ? Array.isArray(value) && value.length <= 30 && value.every(n => Number.isInteger(n) && n >= 0 && n < 16) : typeof value === 'string')));

  });
}
let selected = 0, checked = false;
const save = () => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    $('status').textContent = 'Збережено локально';
  }
  catch (e) {
    $('status').textContent = 'Автозбереження недоступне — експортуйте JSON';
  }
};
const current = () => state[state.variant];
const el = (tag, attrs = {}, text = '') => {
  const n = document.createElement(tag);
  if (tag === 'button')
    n.type = 'button';
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  n.textContent = text;
  return n;
};
function bindText(id, obj, k) {
  const n = $(id);
  n.value = obj[k] ?? '';
  n.oninput = () => {
    obj[k] = n.value;
    save();
  };
}
function sync() {
  for (const k of ['student', 'className'])
    bindText(k, state, k);
  $('variant').value = state.variant;
  document.body.classList.toggle('dark', state.theme);
  $('theme').setAttribute('aria-pressed', String(state.theme));
  render();
}
$('variant').onchange = e => {
  state.variant = e.target.value;
  selected = 0;
  checked = false;
  save();
  render();
};
$('theme').onclick = () => {
  state.theme = !state.theme;
  document.body.classList.toggle('dark', state.theme);
  $('theme').setAttribute('aria-pressed', String(state.theme));
  save();
};
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  state.tab = +b.dataset.tab;
  save();
  render();
});
function render() {
  document.querySelectorAll('[data-tab]').forEach(b => {
    b.classList.toggle('active', +b.dataset.tab === state.tab);
    b.setAttribute('aria-current', +b.dataset.tab === state.tab ? 'page' : 'false');
  });
  selected = 0;
  checked = false;
  [crossword, audit, math, puzzle, logic, fact][state.tab]();
}
function crossword() {
  const d = DATA[state.variant], r = current(), sol = Object.fromEntries(d.cells.map(([x, y, z]) => [`${x},${y}`, z]));
  work.innerHTML = `
    <article>
      <h2>01 / Design Crossword</h2>
      <p>20 слів · 20–25 хв · 10 балів за слова + 2 за пояснення. Англійською, без пробілів. Оберіть запитання, вводьте літери.</p>
      <div class="split">
        <div class="scroll">
          <div id="grid" class="cross">
          </div>
        </div>
        <div id="clues">
        </div>
      </div>
      <label>Додатково: поясніть різницю між ${state.variant === 'A' ? 'Component та Instance' : 'Fill container та Hug contents'}<textarea id="extra">
      </textarea>
    </label>
    <div class="actions">
      <button class="primary" id="checkCross">Перевірити слова</button>
      <span id="crossResult" class="result" role="status">
      </span>
    </div>
    </article>
  `;
  bindText('extra', r, 'extra');
  const grid = $('grid');
  grid.style.gridTemplateColumns = `repeat(${Math.max(...d.cells.map(c => c[0])) + 1},32px)`;
  const inputs = {};
  function highlight() {
    const c = d.clues[selected];
    for (const [k, n] of Object.entries(inputs))
      n.parentNode.classList.toggle('selected', c.c.some(a => a.join(',') === k));
    document.querySelectorAll('.clue').forEach((n, i) => {
      n.classList.toggle('active', i === selected);
      n.setAttribute('aria-pressed', String(i === selected));
    });
  }
  function score() {
    let count = d.clues.filter(c => c.c.every(a => r.letters[a.join(',')] === sol[a.join(',')])).length;
    $('crossResult').textContent = `${count}/20 слів · ${count / 2}/10 балів; пояснення перевіряє вчитель.`;
    for (const [k, n] of Object.entries(inputs)) {
      n.parentNode.classList.toggle('good', r.letters[k] === sol[k]);
      n.parentNode.classList.toggle('bad', !!r.letters[k] && r.letters[k] !== sol[k]);

    }
  }
  for (const [x, y, z] of d.cells) {
    const k = `${x},${y}`, cell = el('div', { class: 'cell', style: `grid-column:${x + 1};grid-row:${y + 1}` }), n = el('input', { 'aria-label': `Рядок ${y + 1}, колонка ${x + 1}`, maxlength: '1', autocomplete: 'off' });
    n.value = r.letters[k] || '';
    const start = d.clues.find(c => c.c[0].join(',') === k);
    if (start)
      cell.append(el('small', {}, start.n));
    cell.append(n);
    grid.append(cell);
    inputs[k] = n;
    n.onfocus = () => {
      if (!d.clues[selected].c.some(a => a.join(',') === k))
        selected = d.clues.findIndex(c => c.c.some(a => a.join(',') === k));
      highlight();
    };
    n.oninput = () => {
      n.value = n.value.toUpperCase().replace(/[^A-Z]/g, '');
      r.letters[k] = n.value;
      save();
      if (checked)
        score();
      const c = d.clues[selected], i = c.c.findIndex(a => a.join(',') === k);
      if (n.value && i < c.c.length - 1)
        inputs[c.c[i + 1].join(',')].focus();
    };
    n.onkeydown = e => {
      const c = d.clues[selected], i = c.c.findIndex(a => a.join(',') === k);
      if (e.key === 'Backspace' && !n.value && i > 0)
        inputs[c.c[i - 1].join(',')].focus();
      const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (dirs[e.key]) {
        e.preventDefault();
        const [dx, dy] = dirs[e.key];
        inputs[`${x + dx},${y + dy}`]?.focus();

      }
    };

  }
  d.clues.forEach((c, i) => {
    const b = el('button', { class: 'clue', 'aria-pressed': 'false' }, `${c.n}. ${c.d === 'h' ? '→' : '↓'} ${c.q} (${c.c.length})`);
    b.onclick = () => {
      selected = i;
      highlight();
      inputs[c.c[0].join(',')].focus();
    };
    $('clues').append(b);
  });
  highlight();
  $('checkCross').onclick = () => {
    checked = true;
    score();
  };
  if (checked)
    score();
}
function audit() {
  const r = current();
  work.innerHTML = `
    <article>
      <h2>02 / UI Bug Hunt</h2>
      <p>15–20 хв · 12 балів. Порівняйте еталон і внутрішню сторінку. Позначте 12 різних помилок на нижньому макеті. Для кожної поясніть порушення та виправлення.</p>
      <h3>Еталонна головна сторінка</h3>
      <img class="reference" alt="Еталонна сторінка" src="assets/images/${state.variant}-reference.png">
      <h3>Сторінка для аудиту</h3>
      <div class="imagewrap" id="auditImage">
        <img alt="Внутрішня сторінка з навмисними помилками" src="assets/images/${state.variant}-audit.png">
      </div>
      <button id="addPin">Додати запис без позначки</button>
      <div id="auditRows">
      </div>
      <p id="auditCount" class="result" role="status">
    </p>
    </article>
  `;
  function rows() {
    const w = $('auditImage');
    w.querySelectorAll('.pin').forEach(n => n.remove());
    $('auditRows').replaceChildren();
    r.pins.forEach((p, i) => {
      if (p.x !== null) {
        const b = el('button', { class: 'pin', style: `left:${p.x}%;top:${p.y}%`, 'aria-label': `Помилка ${i + 1}` }, i + 1);
        b.onclick = e => {
          e.stopPropagation();
          $('problem' + i).focus();
        };
        w.append(b);

      }
      const row = el('section', { class: 'auditrow', 'aria-label': `Запис ${i + 1}` });
      row.append(el('strong', {}, i + 1));
      for (const [k, label] of [['problem', 'Помилка / правило'], ['fix', 'Виправлення']]) {
        const l = el('label', {}, label), n = el('textarea', { id: k + i });
        n.value = p[k];
        n.oninput = () => {
          p[k] = n.value;
          save();
          count();
        };
        l.append(n);
        row.append(l);

      }
      const b = el('button', {}, 'Видалити');
      b.onclick = () => {
        r.pins.splice(i, 1);
        save();
        rows();
      };
      row.append(b);
      $('auditRows').append(row);
    });
    count();
  }
  function count() {
    $('auditCount').textContent = `Заповнено ${r.pins.filter(p => p.problem.trim() && p.fix.trim()).length}/12 записів. Якість перевіряє вчитель.`;
  }
  function add(x, y) {
    if (r.pins.length >= 12)
      return;
    r.pins.push({ x, y, problem: '', fix: '' });
    save();
    rows();
    $('problem' + (r.pins.length - 1)).focus();
  }
  $('auditImage').onclick = e => {
    const b = e.currentTarget.getBoundingClientRect();
    add((e.clientX - b.left) / b.width * 100, (e.clientY - b.top) / b.height * 100);
  };
  $('addPin').onclick = () => add(null, null);
  rows();
}
function math() {
  const a = state.variant === 'A', r = current().math;
  work.innerHTML = `
    <article>
      <h2>03 / Responsive Math</h2>
      <p>15–20 хв · 12 балів. Запишіть формули та пояснення. Числові відповіді перевіряються автоматично.</p>
      <h3>1. Desktop</h3>
      <p>1440 px, відступи по ${a ? 80 : 96} px, 4 картки, Gap ${a ? 24 : 32} px.</p>
      <label>Ширина картки, px<input id="m1" type="number" step="any">
      </label>
      <label>Формула<textarea id="f1">
      </textarea>
    </label>
    <h3>2. Auto Layout</h3>
    <p>Картка ${a ? 360 : 400} px, Padding по ${a ? 16 : 20} px, зображення ${a ? 96 : 112} px, Gap ${a ? 12 : 16} px. Текст Fill container.</p>
    <div class="fields">
      <label>Початкова ширина тексту<input id="m2" type="number" step="any">
      </label>
      <label>Після збільшення картки на 40 px<input id="m3" type="number" step="any">
      </label>
    </div>
    <label>Розрахунок<textarea id="f2">
    </textarea>
    </label>
    <h3>3. Tablet</h3>
    <p>768 px, відступи по ${a ? 24 : 32} px, Gap ${a ? 16 : 20} px, мінімальна ширина ${a ? 220 : 216} px.</p>
    <div class="fields">
    <label>Максимальна кількість карток<input id="m4" type="number">
    </label>
    <label>Фактична ширина (до 0,1 px)<input id="m5" type="number" step="any">
    </label>
    </div>
    <label>Розрахунок<textarea id="f3">
    </textarea>
    </label>
    <h3>4. Mobile · лабораторія компонування</h3>
    <p>Мінімальна ширина картки ${a ? 160 : 170} px. Виберіть відступи, Gap і кількість колонок для 390 та 320 px.</p>
    <div class="fields">
    <label>Відступ з кожного боку<input id="pad" type="number" min="0" max="100">
    </label>
    <label>Gap<input id="gap" type="number" min="0" max="100">
    </label>
    <label>Колонки 390 px<select id="n390">
    <option>1</option>
    <option>2</option>
    <option>3</option>
    </select>
    </label>
    <label>Колонки 320 px<select id="n320">
    <option>1</option>
    <option>2</option>
    <option>3</option>
    </select>
    </label>
    </div>
    <div class="split">
    <div id="p390">
    </div>
    <div id="p320">
    </div>
    </div>
    <label>Розрахунки та обґрунтування<textarea id="f4">
    </textarea>
    </label>
    <button class="primary" id="checkMath">Перевірити розрахунки</button>
    <div id="mathResult" class="result" role="status">
    </div>
    </article>
  `;
  for (const [k, v] of Object.entries({ pad: '16', gap: '12', n390: '2', n320: '1' }))
    if (r[k] === undefined)
      r[k] = v;
  for (const k of ['m1', 'm2', 'm3', 'm4', 'm5', 'f1', 'f2', 'f3', 'f4', 'pad', 'gap', 'n390', 'n320']) {
    bindText(k, r, k);
    if (['pad', 'gap', 'n390', 'n320'].includes(k))
      $(k).oninput = () => {
        r[k] = $(k).value;
        save();
        preview();
      };

  }
  function width(w) {
    return (w - 2 * Number(r.pad) - (Number(r['n' + w]) - 1) * Number(r.gap)) / Number(r['n' + w]);
  }
  function preview() {
    for (const w of [390, 320]) {
      const p = $('p' + w), n = Number(r['n' + w]), valid = r.pad !== '' && r.gap !== '' && +r.pad >= 0 && +r.pad <= 100 && +r.gap >= 0 && +r.gap <= 100;
      p.replaceChildren(el('strong', {}, `${w} px · ${valid ? width(w).toFixed(1) : '—'} px / картка`));
      if (!valid) {
        p.append(el('p', {}, 'Введіть відступи та Gap від 0 до 100.'));
        continue;

      }
      const outer = el('div', { class: 'preview', style: `width:${w}px;padding:${+r.pad}px` }), inner = el('div', { style: `grid-template-columns:repeat(${n},minmax(0,1fr));gap:${+r.gap}px` });
      for (let i = 0; i < n * 2; i++)
        inner.append(el('span', {}, `Картка ${i + 1}`));
      outer.append(inner);
      p.append(outer, el('p', {}, width(w) >= (a ? 160 : 170) ? 'Мінімальна ширина дотримана' : 'Картки надто вузькі'));

    }
  }
  preview();
  $('checkMath').onclick = () => {
    const expected = a ? [302, 220, 260, 3, 688 / 3] : [288, 232, 272, 3, 664 / 3];
    const results = expected.map((v, i) => r['m' + (i + 1)]?.trim() && Math.abs(Number(r['m' + (i + 1)]) - v) <= (i === 3 ? 0 : .051));
    $('mathResult').textContent = results.map((ok, i) => `${['1', '2а', '2б', '3а', '3б'][i]}: ${ok ? 'правильно' : 'перевірте'}`).join(' · ') + ' | Формули й обґрунтування оцінює вчитель.';
  };
}
function download(name, text, type) {
  const u = URL.createObjectURL(new Blob([text], { type })), a = el('a', { href: u, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
$('json').onclick = () => download('design-challenge.json', JSON.stringify(state, null, 2), 'application/json');
$('txt').onclick = () => {
  let out = `Design Challenge Digital\nУчень: ${state.student}\nКлас: ${state.className}\n`;
  for (const v of ['A', 'B']) {
    const r = state[v];
    out += `\nВаріант ${v}\n01. Crossword\n`;
    for (const c of DATA[v].clues)
      out += `${c.n}${c.d}: ${c.c.map(a => r.letters[a.join(',')] || '_').join('')}\n`;
    out += `Пояснення: ${r.extra}\n02. Bug Hunt\n`;
    r.pins.forEach((p, i) => out += `${i + 1}. ${p.problem}\nРішення: ${p.fix}\nПозначка: ${p.x === null ? 'без позначки' : p.x.toFixed(1) + '%, ' + p.y.toFixed(1) + '%'}\n`);
    out += '03. Responsive Math\n' + Object.entries(r.math).map(([k, v]) => `${k}: ${v}`).join('\n') + '\n';
    out += extraReport(r, v);
  }
  download('design-challenge.txt', out, 'text/plain;charset=utf-8');
};
$('restore').onchange = async (e) => {
  try {
    const s = JSON.parse(await e.target.files[0].text());
    if (!validState(s))
      throw Error();
    state = s;
    selected = 0;
    checked = false;
    save();
    sync();
  }
  catch (e) {
    alert('Не вдалося відновити: некоректний JSON.');
  }
  finally {
    $('restore').value = '';
  }
};
sync();
