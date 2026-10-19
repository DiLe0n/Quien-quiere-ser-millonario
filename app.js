/* ¿Quién quiere ser millonario? — editor + juego
   Todo se guarda en localStorage del navegador. */

const STORAGE_KEY = 'qqsm-data-v1';
const LETTERS = ['A', 'B', 'C', 'D'];
const DEFAULT_TIME = 60; // segundos por pregunta (0 = sin límite)

const DEFAULT_DATA = {
  title: 'Edición especial',
  currency: '$',
  currencyPos: 'before',
  shuffle: false,
  levels: [
    { q: '¿De qué color es el cielo en un día despejado?', a: ['Verde', 'Azul', 'Rojo', 'Amarillo'], correct: 1, prize: 100, safe: false },
    { q: '¿Cuántos días tiene una semana?', a: ['5', '6', '7', '8'], correct: 2, prize: 200, safe: false },
    { q: '¿Qué animal es conocido como "el rey de la selva"?', a: ['El león', 'El elefante', 'El tigre', 'El gorila'], correct: 0, prize: 300, safe: false },
    { q: '¿Cuál es el planeta más cercano al Sol?', a: ['Venus', 'Marte', 'Tierra', 'Mercurio'], correct: 3, prize: 500, safe: false },
    { q: '¿Cuántos lados tiene un hexágono?', a: ['5', '6', '7', '8'], correct: 1, prize: 1000, safe: true },
    { q: '¿En qué continente está Egipto?', a: ['Asia', 'Europa', 'África', 'Oceanía'], correct: 2, prize: 2000, safe: false },
    { q: '¿Quién escribió "Don Quijote de la Mancha"?', a: ['Miguel de Cervantes', 'Lope de Vega', 'Gabriel García Márquez', 'Federico García Lorca'], correct: 0, prize: 4000, safe: false },
    { q: '¿Cuál es el símbolo químico del oro?', a: ['Go', 'Ag', 'Or', 'Au'], correct: 3, prize: 8000, safe: false },
    { q: '¿Cuál es el océano más grande del mundo?', a: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'], correct: 2, prize: 16000, safe: false },
    { q: '¿En qué año llegó Cristóbal Colón a América?', a: ['1492', '1500', '1521', '1488'], correct: 0, prize: 32000, safe: true },
    { q: '¿Qué pintor creó "La noche estrellada"?', a: ['Pablo Picasso', 'Vincent van Gogh', 'Claude Monet', 'Salvador Dalí'], correct: 1, prize: 64000, safe: false },
    { q: '¿Cuál es el hueso más largo del cuerpo humano?', a: ['Húmero', 'Tibia', 'Fémur', 'Columna'], correct: 2, prize: 125000, safe: false },
    { q: '¿Cuál es la capital de Australia?', a: ['Sídney', 'Melbourne', 'Perth', 'Canberra'], correct: 3, prize: 250000, safe: false },
    { q: '¿Qué gas es el más abundante en la atmósfera terrestre?', a: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Argón'], correct: 1, prize: 500000, safe: false },
    { q: '¿Cuántos huesos tiene el cuerpo humano adulto?', a: ['206', '186', '212', '230'], correct: 0, prize: 1000000, safe: false },
  ],
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));
const rand = n => Math.floor(Math.random() * n);
const shuffled = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ===================== Datos ===================== */

function normalize(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.levels)) return null;
  return {
    title: String(d.title ?? ''),
    currency: String(d.currency ?? '$'),
    currencyPos: d.currencyPos === 'after' ? 'after' : 'before',
    shuffle: !!d.shuffle,
    levels: d.levels.map(l => ({
      q: String(l.q ?? ''),
      a: [0, 1, 2, 3].map(i => String((l.a || [])[i] ?? '')),
      correct: [0, 1, 2, 3].includes(+l.correct) ? +l.correct : 0,
      prize: Number(l.prize) || 0,
      safe: !!l.safe,
      time: l.time == null || l.time === '' || isNaN(+l.time) ? DEFAULT_TIME : Math.max(0, Math.round(+l.time)),
    })),
  };
}

function load() {
  try {
    const d = normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    if (d) return d;
  } catch (e) { /* sin datos o almacenamiento bloqueado */ }
  return normalize(DEFAULT_DATA);
}

let data = load();
let saveTimer;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignorar */ }
  const f = $('#saved-flag');
  f.classList.add('show');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => f.classList.remove('show'), 1200);
}

function money(n) {
  const s = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(n || 0);
  const c = data.currency || '';
  return data.currencyPos === 'after' ? `${s} ${c}`.trim() : `${c}${s}`;
}

function validate() {
  const errs = [];
  if (!data.levels.length) errs.push('Agrega al menos una pregunta.');
  data.levels.forEach((l, i) => {
    const miss = [];
    if (!l.q.trim()) miss.push('la pregunta');
    const empty = l.a.map((a, j) => a.trim() ? null : LETTERS[j]).filter(Boolean);
    if (empty.length) miss.push('respuesta ' + empty.join(', '));
    if (miss.length) errs.push(`Nivel ${i + 1}: falta ${miss.join(' y ')}.`);
  });
  return errs;
}

/* ===================== Pantallas ===================== */

function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
  if (id === 'home') renderHome();
  if (id === 'editor') renderEditor();
}

function renderHome() {
  $('#home-title').textContent = data.title;
  const top = data.levels.length ? data.levels[data.levels.length - 1].prize : 0;
  $('#home-hint').textContent = data.levels.length
    ? `${data.levels.length} preguntas · premio mayor ${money(top)}`
    : 'Aún no hay preguntas. Entra al editor para crearlas.';
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 5000);
}

function modal(title, bodyNodes, buttons) {
  $('#modal-title').textContent = title;
  const body = $('#modal-body');
  body.replaceChildren(...bodyNodes);
  const bw = $('#modal-buttons');
  bw.replaceChildren(...buttons.map(b => {
    const el = document.createElement('button');
    el.className = 'btn ' + (b.cls || '');
    el.textContent = b.label;
    el.onclick = () => { closeModal(); b.onClick?.(); };
    return el;
  }));
  $('#modal').hidden = false;
  bw.firstChild?.focus();
}
function closeModal() { $('#modal').hidden = true; }
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/* ===================== Editor ===================== */

function renderEditor() {
  $('#cfg-title').value = data.title;
  $('#cfg-currency').value = data.currency;
  $('#cfg-currency-pos').value = data.currencyPos;
  $('#cfg-shuffle').checked = data.shuffle;
  renderLevels();
}

function renderLevels() {
  const list = $('#levels');
  const tpl = $('#tpl-level');
  list.replaceChildren();
  data.levels.forEach((lv, i) => {
    const card = tpl.content.firstElementChild.cloneNode(true);
    card.querySelector('.level-num').textContent = `Nivel ${i + 1}`;
    card.classList.toggle('safe', lv.safe);
    $$('[data-f]', card).forEach(inp => {
      const f = inp.dataset.f;
      if (f === 'correct') { inp.name = 'correct-' + i; inp.checked = +inp.value === lv.correct; }
      else if (f === 'safe') inp.checked = lv.safe;
      else if (f === 'prize') inp.value = lv.prize;
      else if (f === 'time') inp.value = lv.time;
      else if (f === 'q') inp.value = lv.q;
      else inp.value = lv.a[+f.slice(1)];
      inp.addEventListener(inp.type === 'radio' || inp.type === 'checkbox' ? 'change' : 'input', () => {
        if (f === 'correct') lv.correct = +inp.value;
        else if (f === 'safe') { lv.safe = inp.checked; card.classList.toggle('safe', lv.safe); }
        else if (f === 'prize') lv.prize = Number(inp.value) || 0;
        else if (f === 'time') lv.time = Math.max(0, Math.round(Number(inp.value) || 0));
        else if (f === 'q') lv.q = inp.value;
        else lv.a[+f.slice(1)] = inp.value;
        card.classList.remove('invalid');
        save();
      });
    });
    $$('[data-act]', card).forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'del') {
        modal('¿Eliminar pregunta?', [el('p', '', `Se borrará el nivel ${i + 1}${lv.q ? ': "' + lv.q + '"' : ''}.`)], [
          { label: 'Eliminar', cls: 'btn-gold', onClick: () => { data.levels.splice(i, 1); save(); renderLevels(); } },
          { label: 'Cancelar' },
        ]);
        return;
      }
      const j = act === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= data.levels.length) return;
      [data.levels[i], data.levels[j]] = [data.levels[j], data.levels[i]];
      save(); renderLevels();
    }));
    list.appendChild(card);
  });
}

function addLevel() {
  const last = data.levels[data.levels.length - 1];
  data.levels.push({ q: '', a: ['', '', '', ''], correct: 0, prize: last ? last.prize * 2 : 100, safe: false, time: last ? last.time : DEFAULT_TIME });
  save(); renderLevels();
  const cards = $$('.level-card');
  const c = cards[cards.length - 1];
  c.scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('textarea', c).focus({ preventScroll: true });
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const name = (data.title || 'preguntas').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  a.href = URL.createObjectURL(blob);
  a.download = `millonario-${name || 'preguntas'}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importJSON(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = normalize(JSON.parse(r.result));
      if (!d) throw new Error();
      data = d; save(); renderEditor();
      toast(`Importadas ${d.levels.length} preguntas.`);
    } catch (e) {
      toast('Ese archivo no es un juego válido (JSON exportado desde aquí).');
    }
  };
  r.readAsText(file);
}

function bindEditor() {
  $('#cfg-title').addEventListener('input', e => { data.title = e.target.value; save(); });
  $('#cfg-currency').addEventListener('input', e => { data.currency = e.target.value; save(); });
  $('#cfg-currency-pos').addEventListener('change', e => { data.currencyPos = e.target.value; save(); });
  $('#cfg-shuffle').addEventListener('change', e => { data.shuffle = e.target.checked; save(); });
  $('#ed-add').onclick = addLevel;
  $('#ed-add-2').onclick = addLevel;
  $('#ed-sort').onclick = () => { data.levels.sort((a, b) => a.prize - b.prize); save(); renderLevels(); };
  $('#ed-export').onclick = exportJSON;
  $('#ed-import').addEventListener('change', e => { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ''; });
  $('#ed-reset').onclick = () => modal('¿Restaurar ejemplo?', [el('p', '', 'Se reemplazarán todas tus preguntas por las de ejemplo. Exporta primero si quieres conservarlas.')], [
    { label: 'Restaurar', cls: 'btn-gold', onClick: () => { data = normalize(DEFAULT_DATA); save(); renderEditor(); } },
    { label: 'Cancelar' },
  ]);
  $('#ed-back').onclick = () => show('home');
  $('#ed-play').onclick = startGame;
  $('#ed-time-all').onclick = () => {
    const t = Math.max(0, Math.round(Number($('#cfg-time-all').value) || 0));
    data.levels.forEach(l => (l.time = t));
    save(); renderLevels();
    toast(t ? `Todas las preguntas tienen ahora ${t} segundos.` : 'Todas las preguntas quedaron sin límite de tiempo.');
  };
}

/* ===================== Sonido ===================== */

const Sound = {
  ctx: null,
  on: true,
  tone(freq, dur, type = 'sine', when = 0, vol = 0.14) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = this.ctx.currentTime + when;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* sin audio */ }
  },
  select() { this.tone(440, 0.15, 'triangle'); },
  lock() { this.tone(110, 1.6, 'sawtooth', 0, 0.06); this.tone(165, 1.6, 'sine', 0, 0.1); },
  correct() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 'triangle', i * 0.11)); },
  wrong() { [311, 233, 156].forEach((f, i) => this.tone(f, 0.55, 'sawtooth', i * 0.25, 0.08)); },
  lifeline() { [660, 880].forEach((f, i) => this.tone(f, 0.2, 'sine', i * 0.1)); },
  win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.45, 'triangle', i * 0.16)); },
};

/* ===================== Juego ===================== */

let g = null;

function startGame() {
  const errs = validate();
  if (errs.length) {
    show('editor');
    toast('Antes de jugar completa:\n' + errs.slice(0, 4).join('\n') + (errs.length > 4 ? `\n…y ${errs.length - 4} más.` : ''));
    errs.length && data.levels.forEach((l, i) => {
      const bad = !l.q.trim() || l.a.some(a => !a.trim());
      if (bad) $$('.level-card')[i]?.classList.add('invalid');
    });
    return;
  }
  closeModal();
  g = { lvl: 0, used: { fifty: false, phone: false, audience: false }, state: 'idle', selected: null, cur: null, timer: null };
  $$('.lifeline').forEach(b => { b.classList.remove('used'); b.disabled = false; });
  show('game');
  renderLadder();
  showQuestion();
}

function guaranteed() {
  let amt = 0;
  for (let i = 0; i < g.lvl; i++) if (data.levels[i].safe) amt = data.levels[i].prize;
  return amt;
}
const banked = () => (g.lvl > 0 ? data.levels[g.lvl - 1].prize : 0);

function renderLadder() {
  const ol = $('#ladder');
  ol.replaceChildren(...data.levels.map((l, i) => {
    const li = el('li');
    li.classList.toggle('safe', l.safe);
    li.classList.toggle('passed', i < g.lvl);
    li.classList.toggle('current', i === g.lvl);
    li.append(el('span', 'n', i + 1), el('span', 'd', '◆'), el('span', 'p', money(l.prize)));
    return li;
  }));
  ol.querySelector('.current')?.scrollIntoView({ block: 'nearest' });
}

function showQuestion() {
  const lv = data.levels[g.lvl];
  const order = data.shuffle ? shuffled([0, 1, 2, 3]) : [0, 1, 2, 3];
  g.cur = { q: lv.q, a: order.map(i => lv.a[i]), correct: order.indexOf(lv.correct) };
  g.state = 'idle';
  g.selected = null;
  stopTimer();
  startClock(lv.time);
  $('#info-panel').hidden = true;
  $('#q-text').textContent = g.cur.q;
  $$('.answer').forEach((b, i) => {
    b.className = 'hex answer';
    b.disabled = false;
    $('span', b).textContent = g.cur.a[i];
  });
  $('#playing-for').textContent = `Pregunta ${g.lvl + 1} de ${data.levels.length} · por ${money(lv.prize)}`;
  $('#g-walk').textContent = `Retirarse con ${money(banked())}`;
  $('#g-walk').disabled = false;
}

function pick(i) {
  if (!g || g.state !== 'idle') return;
  const b = $$('.answer')[i];
  if (b.classList.contains('gone')) return;
  $$('.answer').forEach(x => x.classList.remove('selected'));
  b.classList.add('selected');
  g.selected = i;
  Sound.select();
  modal('¿Es tu respuesta final?', [el('p', '', `${LETTERS[i]}: ${g.cur.a[i]}`)], [
    { label: 'Respuesta final', cls: 'btn-gold', onClick: lockAnswer },
    { label: 'Cambiar', onClick: () => b.classList.remove('selected') },
  ]);
}

function lockAnswer() {
  g.state = 'locked';
  stopTimer();
  stopClock();
  const b = $$('.answer')[g.selected];
  b.classList.remove('selected');
  b.classList.add('locked');
  $$('.answer, .lifeline').forEach(x => (x.disabled = true));
  $('#g-walk').disabled = true;
  Sound.lock();
  setTimeout(reveal, 2200);
}

function reveal() {
  const btns = $$('.answer');
  const right = btns[g.cur.correct];
  btns[g.selected].classList.remove('locked');
  right.classList.add('correct', 'blink');

  if (g.selected === g.cur.correct) {
    const prize = data.levels[g.lvl].prize;
    const last = g.lvl === data.levels.length - 1;
    g.lvl++;
    renderLadder();
    if (last) {
      Sound.win();
      setTimeout(() => endGame('win', prize), 1500);
      return;
    }
    Sound.correct();
    setTimeout(() => modal('¡Correcto!', [el('p', '', 'Llevas ganado'), el('div', 'big-money', money(prize))], [
      { label: 'Siguiente pregunta', cls: 'btn-gold', onClick: nextQuestion },
      { label: `Retirarse con ${money(prize)}`, onClick: () => endGame('walk', prize) },
    ]), 1400);
  } else {
    btns[g.selected].classList.add('wrong');
    Sound.wrong();
    setTimeout(() => endGame('lose', guaranteed()), 2600);
  }
}

function nextQuestion() {
  $$('.lifeline').forEach(b => (b.disabled = b.classList.contains('used')));
  showQuestion();
}

function endGame(kind, amount) {
  g.state = 'done';
  stopTimer();
  stopClock();
  const correctTxt = `${LETTERS[g.cur.correct]}: ${g.cur.a[g.cur.correct]}`;
  const titles = { win: '¡Eres millonario!', walk: 'Te retiraste', lose: 'Respuesta incorrecta', time: '¡Se acabó el tiempo!' };
  const body = [];
  if (kind === 'time') body.push(el('p', '', `La respuesta correcta era ${correctTxt}.`));
  if (kind === 'lose') body.push(el('p', '', `La respuesta correcta era ${correctTxt}.`));
  if (kind === 'walk') body.push(el('p', '', 'Decidiste no arriesgar más.'));
  body.push(el('p', '', kind === 'win' ? '¡Contestaste todas las preguntas! Te llevas' : 'Te llevas'));
  body.push(el('div', 'big-money', money(amount)));
  modal(titles[kind], body, [
    { label: 'Jugar de nuevo', cls: 'btn-gold', onClick: startGame },
    { label: 'Menú principal', onClick: () => show('home') },
  ]);
}

function walkAway() {
  if (!g || g.state !== 'idle') return;
  const amt = banked();
  modal('¿Quieres retirarte?', [el('p', '', 'Si te retiras ahora te llevas'), el('div', 'big-money', money(amt))], [
    { label: 'Sí, retirarme', cls: 'btn-gold', onClick: () => {
      g.state = 'locked';
      stopClock();
      const b = $$('.answer')[g.cur.correct];
      b.classList.add('correct');
      $$('.answer, .lifeline').forEach(x => (x.disabled = true));
      setTimeout(() => endGame('walk', amt), 1500);
    } },
    { label: 'Seguir jugando' },
  ]);
}

/* ----- Comodines ----- */

function useLifeline(kind) {
  if (!g || g.state !== 'idle' || g.used[kind]) return;
  g.used[kind] = true;
  $('#ll-' + kind).classList.add('used');
  $('#ll-' + kind).disabled = true;
  Sound.lifeline();
  ({ fifty, phone, audience })[kind]();
}

const visibleAnswers = () => [0, 1, 2, 3].filter(i => !$$('.answer')[i].classList.contains('gone'));

function fifty() {
  const wrong = shuffled(visibleAnswers().filter(i => i !== g.cur.correct));
  wrong.slice(0, 2).forEach(i => {
    const b = $$('.answer')[i];
    b.classList.add('gone');
    b.classList.remove('selected');
    b.disabled = true;
  });
}

function phone() {
  const vis = visibleAnswers();
  const sure = Math.random() < 0.8;
  const guess = sure ? g.cur.correct : vis[rand(vis.length)];
  const phrases = sure
    ? ['Estoy casi seguro de que es la', 'Sin duda, yo diría la', 'Me la sé: es la']
    : ['Mmm… no estoy seguro, pero creo que es la', 'Ni idea, la verdad… ¿quizás la', 'Me late que es la'];
  const panel = $('#info-panel');
  const timer = el('div', 'timer', '30');
  panel.replaceChildren(
    el('h3', '', '📞 Llamada a un amigo'),
    el('p', '', `"${phrases[rand(phrases.length)]} ${LETTERS[guess]}: ${g.cur.a[guess]}"`),
    timer,
  );
  panel.hidden = false;
  let t = 30;
  stopTimer();
  g.timer = setInterval(() => {
    t--;
    timer.textContent = t;
    if (t <= 5 && t > 0) Sound.tone(880, 0.08, 'square', 0, 0.05);
    if (t <= 0) { stopTimer(); timer.textContent = '¡Tiempo!'; }
  }, 1000);
}

/* ----- Reloj por pregunta ----- */

const CLOCK_LEN = 2 * Math.PI * 44; // circunferencia del anillo SVG

function startClock(total) {
  stopClock();
  const box = $('#clock');
  box.hidden = !total;
  if (!total) return;
  g.clock = { total, left: total, int: null };
  drawClock();
  g.clock.int = setInterval(() => {
    // Pausado mientras hay un diálogo abierto o corre la llamada a un amigo
    if (g.state !== 'idle' || !$('#modal').hidden || g.timer) return;
    g.clock.left--;
    drawClock();
    if (g.clock.left > 0 && g.clock.left <= 10) Sound.tone(g.clock.left <= 5 ? 1046 : 784, 0.08, 'square', 0, 0.05);
    if (g.clock.left <= 0) timeUp();
  }, 1000);
}

function drawClock() {
  const { total, left } = g.clock;
  $('#clock-num').textContent = left;
  $('#clock-prog').style.strokeDashoffset = CLOCK_LEN * (1 - left / total) + 'px';
  $('#clock').classList.toggle('low', left <= 10);
}

function stopClock() {
  if (g?.clock) { clearInterval(g.clock.int); g.clock = null; }
}

function timeUp() {
  stopClock();
  g.state = 'locked';
  $$('.answer').forEach(x => x.classList.remove('selected'));
  $$('.answer, .lifeline').forEach(x => (x.disabled = true));
  $('#g-walk').disabled = true;
  $$('.answer')[g.cur.correct].classList.add('correct', 'blink');
  Sound.wrong();
  const amt = banked();
  setTimeout(() => endGame('time', amt), 2200);
}

function stopTimer() { if (g?.timer) { clearInterval(g.timer); g.timer = null; } }

function audience() {
  const vis = visibleAnswers();
  const pct = [0, 0, 0, 0];
  const diff = g.lvl / Math.max(1, data.levels.length - 1); // más difícil = público menos seguro
  pct[g.cur.correct] = Math.round(75 - diff * 35 + Math.random() * 15);
  let rest = 100 - pct[g.cur.correct];
  const others = shuffled(vis.filter(i => i !== g.cur.correct));
  others.forEach((i, k) => {
    const v = k === others.length - 1 ? rest : Math.round(Math.random() * rest);
    pct[i] = v; rest -= v;
  });
  pct[g.cur.correct] += rest;

  const bars = el('div', 'bars');
  const fills = [];
  for (let i = 0; i < 4; i++) {
    const bar = el('div', 'bar');
    const f = el('div', 'fill');
    fills.push([f, pct[i]]);
    bar.append(el('span', 'pct', vis.includes(i) ? pct[i] + '%' : ''), f, el('b', '', LETTERS[i]));
    bars.append(bar);
  }
  const panel = $('#info-panel');
  panel.replaceChildren(el('h3', '', '👥 Ayuda del público'), bars);
  panel.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => fills.forEach(([f, p]) => (f.style.height = p * 1.3 + 'px'))));
}

function bindGame() {
  $$('.answer').forEach((b, i) => b.addEventListener('click', () => pick(i)));
  $('#ll-fifty').onclick = () => useLifeline('fifty');
  $('#ll-phone').onclick = () => useLifeline('phone');
  $('#ll-audience').onclick = () => useLifeline('audience');
  $('#g-walk').onclick = walkAway;
  $('#g-menu').onclick = () => modal('Menú', [el('p', '', '¿Qué quieres hacer? Si sales se perderá la partida actual.')], [
    { label: 'Continuar jugando', cls: 'btn-gold' },
    { label: 'Reiniciar partida', onClick: startGame },
    { label: 'Salir al menú', onClick: () => { stopTimer(); stopClock(); show('home'); } },
  ]);
  $('#g-sound').onclick = e => { Sound.on = !Sound.on; e.currentTarget.textContent = Sound.on ? '🔊' : '🔇'; };
  $('#g-full').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  $('#g-ladder').onclick = () => $('#ladder-wrap').classList.toggle('open');

  document.addEventListener('keydown', e => {
    if (!$('#game').classList.contains('active') || !$('#modal').hidden) return;
    const k = e.key.toUpperCase();
    const i = LETTERS.indexOf(k);
    if (i >= 0) pick(i);
  });
}

/* ===================== Inicio ===================== */

$('#btn-play').onclick = startGame;
$('#btn-editor').onclick = () => show('editor');
// Diálogos que se pueden cancelar con Esc o con clic fuera de la caja
const CANCELABLE = ['¿Es tu respuesta final?', '¿Quieres retirarte?', 'Menú', '¿Eliminar pregunta?', '¿Restaurar ejemplo?'];
function cancelModal() {
  if ($('#modal').hidden || !CANCELABLE.includes($('#modal-title').textContent)) return;
  $$('.answer').forEach(x => x.classList.remove('selected'));
  closeModal();
}
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') cancelModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cancelModal(); });

bindEditor();
bindGame();
show('home');
