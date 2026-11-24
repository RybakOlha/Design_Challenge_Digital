'use strict';
// Interactive modules 04–06.
function moduleData(k) {
  const r = current();
  return r[k] ?? (r[k] = {});
}
function field(parent, r, k, label, area = true) {
  const l = el('label', {}, label), n = el(area ? 'textarea' : 'input');
  n.value = r[k] ?? '';
  n.oninput = () => {
    r[k] = n.value;
    save();
  };
  l.append(n);
  parent.append(l);
  return n;
}
function puzzle() {
  const r = moduleData('puzzle'), a = state.variant === 'A';
  const names = ['Логотип', 'Навігація', 'Hero-блок', 'Пошук', 'Категорії', a ? 'Картка товару' : 'Картка курсу', 'Фільтри', 'Підвал', 'Переваги', 'Хлібні крихти', 'Пагінація', 'Відгуки', a ? 'Кошик' : 'Мої курси', 'Рекламний банер', 'Друге меню', 'Другий логотип'];
  work.innerHTML = `
    <article>
     <h2>
      04 / Design Puzzle
     </h2>
     <p>
      20 хв · 12 балів. Відновіть головну сторінку та каталог для Desktop і Mobile. Перетягніть фрагмент або оберіть його та натисніть «Додати» на потрібному екрані. Повторне використання дозволено.
     </p>
     <h3 id="product">
     </h3>
     <div class="palette" id="palette">
     </div>
     <div class="screen-grid" id="screens">
     </div>
     <h3>
      Обґрунтування
     </h3>
     <div id="reason">
     </div>
     <p>
      Оцінювання: добір, структура, адаптація, аргументація — по 3 бали. Перевіряє вчитель.
     </p>
    </article>
  `;
  $('product').textContent = a ? 'NORD · магазин меблів' : 'StudyFlow · освітня платформа';
  let chosen = 0;
  names.forEach((name, i) => {
    const b = el('button', { draggable: 'true', class: 'fragment' }, `${i + 1}. ${name}`);
    b.onclick = () => {
      chosen = i;
      $('palette').querySelectorAll('button').forEach((n, j) => n.classList.toggle('active', j === i));
    };
    b.ondragstart = e => e.dataTransfer.setData('text/plain', String(i));
    $('palette').append(b);
  });
  $('palette').firstChild.classList.add('active');
  ['Головна · Desktop', 'Каталог · Desktop', 'Головна · Mobile', 'Каталог · Mobile'].forEach((title, j) => {
    const k = 'screen' + j;
    if (!Array.isArray(r[k]))
      r[k] = [];
    const section = el('section', { class: 'screen-box' }), h = el('h3', {}, title), body = el('div', { class: 'wire ' + (j > 1 ? 'mobile' : 'desktop') }), add = el('button', {}, 'Додати вибраний');
    section.append(h, body, add);
    $('screens').append(section);
    function draw() {
      body.replaceChildren();
      r[k].forEach((id, i) => {
        const row = el('div', { class: 'wire-block' });
        row.append(el('span', {}, names[id] ?? '?'));
        for (const [symbol, delta] of [['↑', -1], ['↓', 1], ['×', 0]]) {
          const b = el('button', { 'aria-label': symbol === '×' ? 'Видалити' : symbol === '↑' ? 'Вище' : 'Нижче' }, symbol);
          b.onclick = () => {
            if (!delta)
              r[k].splice(i, 1);
            else if (i + delta >= 0 && i + delta < r[k].length)
              [r[k][i], r[k][i + delta]] = [r[k][i + delta], r[k][i]];
            save();
            draw();
          };
          row.append(b);
        }
        body.append(row);
      });
    }
    function insert(i) {
      if (Number.isInteger(i) && i >= 0 && i < names.length && r[k].length < 30) {
        r[k].push(i);
        save();
        draw();
      }
    }
    add.onclick = () => insert(chosen);
    body.ondragover = e => e.preventDefault();
    body.ondrop = e => {
      e.preventDefault();
      const v = e.dataTransfer.getData('text/plain');
      if (v !== '')
        insert(Number(v));
    };
    draw();
  });
  ['Спільні блоки', 'Компоненти Figma', 'Контейнери Auto Layout', 'Адаптація: колонки та навігація', 'Невикористані фрагменти та причини'].forEach((q, i) => field($('reason'), r, 'reason' + i, q));
}
function logic() {
  const r = moduleData('logic'), a = state.variant === 'A';
  const base = a ? ['Обрати', 'Синій', '8'] : ['Записатися', 'Зелений', '12'], next = a ? ['Детальніше', 'Чорний', '16'] : ['Переглянути', 'Синій', '20'], over = a ? ['Купити', 'Сірий', '0'] : ['Почати', 'Чорний', '4'];
  work.innerHTML = `
    <article>
     <h2>
      05 / Figma Logic
     </h2>
     <p>
      15–20 хв · 12 балів. Передбачте результат без Figma. Кожна задача — 3 бали.
     </p>
     <h3>
      1. Ефект доміно
     </h3>
     <div id="domino">
     </div>
     <h3>
      2. Ланцюг Auto Layout
     </h3>
     <div id="chain">
     </div>
     <h3>
      3. Знайдіть причину
     </h3>
     <div id="symptoms">
     </div>
     <h3>
      4. Дерево компонентів
     </h3>
     <div id="tree">
     </div>
     <button class="primary" id="logicCheck">
      Перевірити однозначні відповіді
     </button>
     <p class="result" id="logicResult" role="status">
     </p>
    </article>
  `;
  $('domino').append(el('p', {}, `Головний компонент: ${base.join(' / ')}. Нові властивості: ${next.join(' / ')}. Порядок: текст / Fill / Radius (px).`));
  const expected = {};
  ['A', 'B', 'C', 'D'].forEach((id, i) => {
    const box = el('div', { class: 'fields' });
    $('domino').append(el('h4', {}, `Instance ${id}: ${i ? 'локально змінено ' + ['', 'текст', 'Fill', 'Radius'][i] + ' на ' + over[i - 1] : 'без змін'}`), box);
    ['Текст', 'Fill', 'Radius'].forEach((q, j) => {
      const k = `${id}${j}`;
      field(box, r, k, q, false);
      expected[k] = i === j + 1 ? over[j] : next[j];
    });
  });
  field($('domino'), r, 'why', 'Чому окремі властивості не оновилися?');
  const w = a ? 400 : 440, p = a ? 20 : 24, cp = a ? 16 : 20, g = a ? 12 : 16, img = a ? 96 : 112, w2 = w + 80, img2 = img + 32, card = w - 2 * p, text = card - 2 * cp - g - img;
  $('chain').append(el('p', {}, `Зовнішній Auto Layout: ${w} px, Padding ${p} px з кожного боку. Картка Fill container: Padding ${cp}, Gap ${g}. Зображення Fixed ${img}; текст Fill container; кнопка Hug contents. Послідовно збільшуємо фрейм до ${w2}, потім зображення до ${img2}.`));
  ['Початкова ширина картки', 'Початкова ширина тексту', 'Ширина тексту після збільшення фрейму', 'Ширина тексту після збільшення зображення'].forEach((q, i) => {
    field($('chain'), r, 'num' + i, q, false);
    expected['num' + i] = String([card, text, text + 80, text + 48][i]);
  });
  field($('chain'), r, 'hug', 'Що станеться з кнопкою Hug contents, якщо напис не змінюється?');
  ['Кнопка залишилася вузькою після розширення контейнера', 'Напис виходить за межі кнопки', 'Екземпляр не змінив колір після редагування оригіналу', 'Іконка втратила прив’язку до правого краю звичайного фрейму'].forEach((q, i) => {
    $('symptoms').append(el('h4', {}, q));
    field($('symptoms'), r, 'cause' + i, 'Причина та рішення');
  });
  $('tree').append(el('p', {}, `Каталог із 12 ${a ? 'товарів' : 'курсів'}. Кожна картка містить зображення, назву, ${a ? 'ціну' : 'тривалість'}, кнопку та іконку обраного.`));
  field($('tree'), r, 'tree', 'Запишіть дерево компонентів з відступами; позначте головні компоненти, вкладені екземпляри та змінні властивості.');
  $('logicCheck').onclick = () => {
    const n = Object.entries(expected).filter(([k, v]) => String(r[k] ?? '').trim().toLowerCase() === v.toLowerCase()).length;
    $('logicResult').textContent = `${n} із 16 однозначних полів. Пояснення та остаточні 12 балів перевіряє вчитель.`;
  };
}
const FACT = { A: [['Auto Layout автоматично робить будь-який макет повністю адаптивним.', 'Н'], ['Картки з однаковою структурою доцільно створювати на основі компонента.', 'П'], ['У мобільному каталозі завжди має бути одна колонка.', 'Н'], ['Зміна головного компонента може не вплинути на локально перевизначену властивість.', 'П'], ['Темну тему достатньо створити інвертуванням усіх кольорів.', 'Н'], ['Внутрішні сторінки можуть мати іншу структуру контенту, зберігаючи дизайн-систему.', 'П'], ['Усі тексти повинні мати однаковий розмір шрифту.', 'Н'], ['Fill container доцільний для кнопки, що має заповнювати доступну ширину Auto Layout.', 'П'], ['Різні кольори кнопок завжди є помилкою.', 'Н'], ['Desktop-макет можна використати як основу Mobile.', 'П'], ['Для читабельності достатньо збільшити шрифт.', 'Н'], ['Fixed width може бути частиною адаптивного інтерфейсу.', 'П']], B: [['Усі елементи необхідно створювати як компоненти.', 'Н'], ['Padding та Gap виконують різні функції.', 'П'], ['Mobile може мати іншу послідовність блоків.', 'П'], ['Instance не дозволяє змінювати текст.', 'Н'], ['Hug contents доцільний для кнопки, ширина якої залежить від напису.', 'П'], ['Однакові відступи гарантують правильну ієрархію.', 'Н'], ['На внутрішніх сторінках можна використовувати додатковий колір.', 'У'], ['У темній темі потрібно перевіряти контраст.', 'П'], ['Constraints замінює продумування адаптивності.', 'Н'], ['Усі картки обов’язково мають однакову висоту.', 'Н'], ['Екземпляри можуть містити різні зображення.', 'П'], ['Навігацію Desktop можна залишити без змін у Mobile.', 'У']] };
function fact() {
  const r = moduleData('fact'), qs = FACT[state.variant];
  work.innerHTML = `
    <article>
     <h2>
      06 / AI Fact Check
     </h2>
     <p>
      15 хв · 12 балів. П — правильне, Н — неправильне, У — правильне за певних умов. Класифікуйте всі твердження, а для шести неправильних або умовних наведіть виправлення та приклад.
     </p>
     <div id="facts">
     </div>
     <button class="primary" id="factCheck">
      Перевірити класифікацію
     </button>
     <p class="result" id="factResult" role="status">
     </p>
     <h3>
      Аргументація шести тверджень
     </h3>
     <div id="factReasons">
     </div>
     <p>
      Класифікація — 6 балів; виправлення — 3; приклади — 3. Аргументовані альтернативи оцінює вчитель.
     </p>
    </article>
  `;
  qs.forEach(([q], i) => {
    const row = el('div', { class: 'fact-row' }), l = el('label', {}, `${i + 1}. ${q}`), s = el('select', { 'aria-label': `Твердження ${i + 1}` });
    for (const v of ['', 'П', 'Н', 'У'])
      s.append(el('option', { value: v }, v || 'Оберіть'));
    s.value = r['q' + i] ?? '';
    s.onchange = () => {
      r['q' + i] = s.value;
      save();
      $('factResult').textContent = '';
    };
    l.append(s);
    row.append(l);
    $('facts').append(row);
  });
  for (let i = 0; i < 6; i++) {
    const b = el('section', { class: 'reason-box' });
    $('factReasons').append(b);
    field(b, r, 'id' + i, 'Номер твердження', false);
    field(b, r, 'fix' + i, 'Проблема та виправлена рекомендація');
    field(b, r, 'example' + i, 'Приклад застосування');
  }
  $('factCheck').onclick = () => {
    const n = qs.filter((q, i) => r['q' + i] === q[1]).length;
    $('factResult').textContent = `За ключем: ${n}/12 · ${n / 2}/6 балів. Альтернативні обґрунтування перевіряє вчитель.`;
  };
}
function extraReport(r, v) {
  let out = '';
  for (const [k, title] of [['puzzle', '04. Design Puzzle'], ['logic', '05. Figma Logic'], ['fact', '06. AI Fact Check']]) {
    out += '\n' + title + '\n';
    for (const [id, val] of Object.entries(r[k] || {}))
      out += id + ': ' + (Array.isArray(val) ? val.map(n => n + 1).join(', ') : val) + '\n';
  }
  return out;
}
