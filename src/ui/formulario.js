/* Formulário de parâmetros: monta os campos a partir das listas de parametros.js e
   grava direto no objeto de estado. Chama aoMudar() a cada alteração válida. */
import { SERINGA_CAMPOS, SERINGAS, ROTULOS } from '../modelo/parametros.js';
import { DESCRICAO_FOLGAS, FOLGAS_PADRAO } from '../modelo/folgas.js';

const h = (tag, attrs = {}, ...filhos) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) el.setAttribute(k, v);
  }
  for (const f of filhos.flat()) if (f !== null && f !== undefined) el.append(f.nodeType ? f : document.createTextNode(f));
  return el;
};
export { h };

let _id = 0;
function campo(obj, chave, rotulo, unidade, aoMudar, opts = {}) {
  const id = 'c' + (++_id);
  const inp = h('input', { id, type: 'number', inputmode: 'decimal', step: opts.passo ?? 'any', min: opts.min, max: opts.max });
  inp.value = obj[chave];
  inp.addEventListener('input', () => {
    const v = parseFloat(String(inp.value).replace(',', '.'));
    const ok = Number.isFinite(v) && (opts.min === undefined || v >= opts.min) && (opts.max === undefined || v <= opts.max);
    inp.classList.toggle('invalido', !ok);
    if (ok) { obj[chave] = v; aoMudar(); }
  });
  inp.__sync = () => { inp.value = obj[chave]; inp.classList.remove('invalido'); };
  return h('label', { class: 'campo', for: id },
    h('span', { class: 'rot' }, rotulo, opts.ajuda ? h('small', {}, opts.ajuda) : null),
    h('span', { class: 'val' }, inp, h('span', { class: 'u' }, unidade || '')));
}

function grupo(titulo, aberto, ...filhos) {
  const d = h('details', { class: 'grupo' }, h('summary', {}, titulo), ...filhos);
  if (aberto) d.open = true;
  return d;
}

export function montarFormulario(raiz, estado, aoMudar) {
  raiz.innerHTML = '';
  const E = estado.entradas;

  // ---- seringas
  const abas = h('div', { class: 'abas', role: 'tablist' });
  const paineis = h('div', {});
  Object.entries(SERINGAS).forEach(([k, s], i) => {
    const bt = h('button', { type: 'button', role: 'tab', class: 'aba' + (i === 0 ? ' ativa' : ''), 'aria-selected': i === 0 ? 'true' : 'false' }, s.nome.replace('Seringa ', '').replace(/^d[oa] /, ''));
    const pn = h('div', { class: 'painel-seringa', role: 'tabpanel', hidden: i === 0 ? null : '' },
      h('p', { class: 'nota' }, `${s.qtd} × ${s.nome}: ${s.uso}.`),
      ...SERINGA_CAMPOS.map(c => campo(E.seringas[k], c.k, c.rotulo, c.u, aoMudar, { min: c.min, max: c.max })));
    bt.addEventListener('click', () => {
      abas.querySelectorAll('.aba').forEach(b => { b.classList.remove('ativa'); b.setAttribute('aria-selected', 'false'); });
      paineis.querySelectorAll('.painel-seringa').forEach(p => { p.hidden = true; });
      bt.classList.add('ativa'); bt.setAttribute('aria-selected', 'true'); pn.hidden = false;
    });
    abas.append(bt); paineis.append(pn);
  });
  raiz.append(grupo('Seringas', true,
    h('p', { class: 'nota' }, 'Meça com paquímetro. cf e ca vão da face do corpo onde começa o bico até o meio da aba do êmbolo: fechado (êmbolo empurrado) e aberto (puxado até a última marca útil).'),
    abas, paineis));

  // ---- bola, material, impressão
  raiz.append(grupo('Bola', true,
    campo(E.bola, 'massa', 'Massa', 'g', aoMudar, { min: 1, max: 2000 }),
    campo(E.bola, 'diametro', 'Diâmetro', 'mm', aoMudar, { min: 10, max: 200 })));

  const presets = { PLA: [1.24, 50], PETG: [1.27, 45], ABS: [1.04, 40] };
  const sel = h('select', { id: 'matSel' }, ...Object.keys(presets).map(n => h('option', { value: n }, n)), h('option', { value: 'outro' }, 'Outro'));
  sel.value = presets[E.material.nome] ? E.material.nome : 'outro';
  const cDens = campo(E.material, 'densidade', 'Densidade', 'g/cm³', aoMudar, { min: 0.5, max: 3 });
  const cRes = campo(E.material, 'resistencia', 'Resistência', 'MPa', aoMudar, { min: 5, max: 200 });
  sel.addEventListener('change', () => {
    E.material.nome = sel.value;
    if (presets[sel.value]) { [E.material.densidade, E.material.resistencia] = presets[sel.value]; cDens.querySelector('input').__sync(); cRes.querySelector('input').__sync(); }
    aoMudar();
  });
  raiz.append(grupo('Material', false, h('label', { class: 'campo', for: 'matSel' }, h('span', { class: 'rot' }, 'Filamento'), h('span', { class: 'val' }, sel)), cDens, cRes));

  raiz.append(grupo('Espessura e impressora', true,
    campo(E, 'e', 'Espessura das placas (e)', 'mm', aoMudar, { min: 1.6, max: 8, ajuda: 'base e disco usam 2e' }),
    campo(E.impressora, 'x', 'Mesa X', 'mm', aoMudar, { min: 50, max: 1000 }),
    campo(E.impressora, 'y', 'Mesa Y', 'mm', aoMudar, { min: 50, max: 1000 }),
    campo(E.impressora, 'z', 'Altura Z', 'mm', aoMudar, { min: 20, max: 1000 })));

  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Número de dedos' });
  for (const n of [2, 3, 4]) {
    const b = h('button', { type: 'button', class: n === E.nd ? 'ativa' : '', 'aria-pressed': n === E.nd ? 'true' : 'false' }, String(n));
    b.addEventListener('click', () => { E.nd = n; seg.querySelectorAll('button').forEach(x => { x.classList.toggle('ativa', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); aoMudar(); });
    seg.append(b);
  }
  raiz.append(grupo('Garra', false, h('div', { class: 'campo' }, h('span', { class: 'rot' }, 'Dedos'), seg),
    h('p', { class: 'nota' }, 'A palma, o cubo e os dedos entram na próxima etapa, junto com o otimizador da garra.')));

  // ---- otimizados
  const O = estado.otimizados;
  raiz.append(grupo('Dimensões do braço', false,
    h('p', { class: 'nota' }, 'Por enquanto, valores do bucky v24. Na próxima etapa o otimizador calcula estes números a partir das seringas e da bola.'),
    ...Object.keys(O).map(k => campo(O, k, `${k} · ${ROTULOS[k][0]}`, 'mm', aoMudar, { min: 1, max: 1000, ajuda: ROTULOS[k][1] }))));

  // ---- avançado
  const C = estado.construcao;
  estado.folgas = estado.folgas || { ...FOLGAS_PADRAO };
  const unid = { alpha: '°', inclinacao_comando: '°', Fin: 'N', eta: '', FS: '', n_comando: '' };
  raiz.append(grupo('Avançado', false,
    h('h4', {}, 'Construção'),
    ...Object.keys(C).map(k => campo(C, k, ROTULOS[k][0], unid[k] ?? 'mm', aoMudar, { min: 0, max: 1000, ajuda: ROTULOS[k][1] })),
    h('h4', {}, 'Folgas (no diâmetro)'),
    ...Object.keys(FOLGAS_PADRAO).map(k => campo(estado.folgas, k, DESCRICAO_FOLGAS[k], 'mm', aoMudar, { min: 0, max: 6 }))));
}
