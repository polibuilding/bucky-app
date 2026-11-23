/* Formulário de parâmetros: monta os campos e grava direto no objeto de estado.
   aoMudar(tipo) é chamado a cada alteração válida; tipo = 'entrada' | 'construcao' | 'dimensao'. */
import { SERINGA_CAMPOS, SERINGAS, ROTULOS } from '../modelo/parametros.js';
import { DESCRICAO_FOLGAS, FOLGAS_PADRAO } from '../modelo/folgas.js';
import { CRITERIOS } from '../modelo/otimizador.js';

export const h = (tag, attrs = {}, ...filhos) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) el.append(f.nodeType ? f : document.createTextNode(f));
  return el;
};

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

function grupo(titulo, aberto, cor, ...filhos) {
  const d = h('details', { class: 'grupo ' + cor }, h('summary', {}, titulo), h('div', { class: 'conteudo' }, ...filhos));
  if (aberto) d.open = true;
  // sanfona: abrir um grupo fecha os outros, para a página não crescer demais
  d.addEventListener('toggle', () => {
    if (!d.open) return;
    d.parentElement?.querySelectorAll(':scope > details.grupo[open]').forEach(o => { if (o !== d) o.open = false; });
  });
  return d;
}

export function montarFormulario(raiz, estado, aoMudar, aoOtimizar) {
  raiz.innerHTML = '';
  const E = estado.entradas;
  const ent = () => aoMudar('entrada'), con = () => aoMudar('construcao'), dim = () => aoMudar('dimensao');
  let cor = 0; const prox = () => (cor++ % 2 ? 'amarelo' : 'azul');

  // ---- seringas
  const abas = h('div', { class: 'abas', role: 'tablist' });
  const paineis = h('div', {});
  Object.entries(SERINGAS).forEach(([k, s], i) => {
    const bt = h('button', { type: 'button', role: 'tab', class: 'aba' + (i === 0 ? ' ativa' : ''), 'aria-selected': i === 0 ? 'true' : 'false' }, s.curto);
    const pn = h('div', { class: 'painel-seringa', role: 'tabpanel', hidden: i !== 0 },
      h('p', { class: 'nota' }, `${s.nome} (${s.qtd}). ${s.uso}`),
      ...SERINGA_CAMPOS.map(c => campo(E.seringas[k], c.k, c.rotulo, c.u, ent, { min: c.min, max: c.max })));
    bt.addEventListener('click', () => {
      abas.querySelectorAll('.aba').forEach(b => { b.classList.remove('ativa'); b.setAttribute('aria-selected', 'false'); });
      paineis.querySelectorAll('.painel-seringa').forEach(p => { p.hidden = true; });
      bt.classList.add('ativa'); bt.setAttribute('aria-selected', 'true'); pn.hidden = false;
    });
    abas.append(bt); paineis.append(pn);
  });
  raiz.append(grupo('Seringas', true, prox(),
    h('p', { class: 'nota' }, 'Medidas com paquímetro. Os comprimentos vão da face do corpo onde começa o bico até o meio da aba do êmbolo: fechado com o êmbolo todo empurrado, aberto puxado até a última marca útil.'),
    abas, paineis));

  // ---- meta
  raiz.append(grupo('Meta', false, prox(),
    h('p', { class: 'nota' }, 'A meta é o que se pretende movimentar com o braço, simplificado aqui para uma esfera com massa e diâmetro definidos por você.'),
    campo(E.meta, 'massa', 'Massa', 'g', ent, { min: 1, max: 2000 }),
    campo(E.meta, 'diametro', 'Diâmetro', 'mm', ent, { min: 20, max: 200 })));

  // ---- material
  const presets = { PLA: [1.24, 50], PETG: [1.27, 45], ABS: [1.04, 40] };
  const sel = h('select', { id: 'matSel' }, ...Object.keys(presets).map(n => h('option', { value: n }, n)), h('option', { value: 'outro' }, 'Outro'));
  sel.value = presets[E.material.nome] ? E.material.nome : 'outro';
  const cDens = campo(E.material, 'densidade', 'Densidade', 'g/cm³', ent, { min: 0.5, max: 3 });
  const cRes = campo(E.material, 'resistencia', 'Resistência', 'MPa', ent, { min: 5, max: 200 });
  sel.addEventListener('change', () => {
    E.material.nome = sel.value;
    if (presets[sel.value]) { [E.material.densidade, E.material.resistencia] = presets[sel.value]; cDens.querySelector('input').__sync(); cRes.querySelector('input').__sync(); }
    ent();
  });
  raiz.append(grupo('Material', false, prox(), h('label', { class: 'campo', for: 'matSel' }, h('span', { class: 'rot' }, 'Filamento'), h('span', { class: 'val' }, sel)), cDens, cRes));

  raiz.append(grupo('Espessura e impressora', false, prox(),
    campo(E, 'e', 'Espessura das placas (e)', 'mm', ent, { min: 1.6, max: 8, ajuda: 'base e disco usam 2e' }),
    campo(E.impressora, 'x', 'Mesa X', 'mm', ent, { min: 50, max: 1000 }),
    campo(E.impressora, 'y', 'Mesa Y', 'mm', ent, { min: 50, max: 1000 }),
    campo(E.impressora, 'z', 'Altura Z', 'mm', ent, { min: 20, max: 1000 })));

  // ---- critério
  const crit = h('div', { class: 'criterios', role: 'radiogroup', 'aria-label': 'Critério de otimização' });
  for (const [k, c] of Object.entries(CRITERIOS)) {
    const id = 'crit_' + k;
    const r = h('input', { type: 'radio', name: 'criterio', id, value: k, checked: E.criterio === k });
    r.addEventListener('change', () => { E.criterio = k; ent(); });
    crit.append(h('label', { class: 'criterio', for: id }, r, h('span', {}, h('b', {}, c.rot), h('small', {}, c.ajuda))));
  }
  raiz.append(grupo('Critério de otimização', false, prox(), crit,
    h('button', { type: 'button', class: 'btn primario largo', id: 'btnOtimizar2', onclick: aoOtimizar }, 'Otimizar meu Bucky')));

  // ---- avançado
  const C = estado.construcao;
  estado.folgas = estado.folgas || { ...FOLGAS_PADRAO };
  const GARRA = ['ac', 'aperto', 'ponta_dedo', 'folga_meta', 'folga_abertura', 'atrito'];
  const BRACO = Object.keys(C).filter(k => !GARRA.includes(k));
  const rot = k => ROTULOS[k] || [k, '', ''];
  const O = estado.otimizados;
  raiz.append(grupo('Avançado', false, prox(),
    h('p', { class: 'nota' }, 'Valores de construção que funcionaram no protótipo. Mude só se souber o efeito.'),
    h('h4', {}, 'Construção e forças'),
    ...BRACO.map(k => campo(C, k, rot(k)[0], rot(k)[2], con, { min: 0, max: 1000, ajuda: rot(k)[1] })),
    h('h4', {}, 'Garra'),
    ...GARRA.map(k => campo(C, k, rot(k)[0], rot(k)[2], con, { min: -60, max: 200, ajuda: rot(k)[1] })),
    h('h4', {}, 'Folgas (no diâmetro)'),
    ...Object.keys(FOLGAS_PADRAO).map(k => campo(estado.folgas, k, DESCRICAO_FOLGAS[k], 'mm', con, { min: 0, max: 6 })),
    h('h4', {}, 'Dimensões (ajuste manual)'),
    h('p', { class: 'nota' }, 'O otimizador preenche estes valores. Você pode ajustar à mão depois.'),
    ...Object.keys(O).map(k => campo(O, k, `${k} · ${rot(k)[0]}`, rot(k)[2], dim, { min: -90, max: 1000, ajuda: rot(k)[1] }))));
}
