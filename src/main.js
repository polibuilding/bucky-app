/* Bucky: aplicativo do braço hidráulico por seringas.
   Etapa 1: parâmetros, derivados e geração das peças estruturais em STL. */
import { carregarKernel, novoGeo } from './geometria/kernel.js';
import { estadoPadrao, clonar } from './modelo/parametros.js';
import { derivar, nomesFusion } from './modelo/derivados.js';
import { FOLGAS_PADRAO } from './modelo/folgas.js';
import { PECAS, gerarPeca } from './pecas/index.js';
import { stlBinario } from './exportar/stl.js';
import { criarZip } from './exportar/zip.js';
import { montarFormulario, h } from './ui/formulario.js';
import { Visor } from './ui/visor3d.js';

const CHAVE = 'bucky-app-estado-v1';
/* Valores do Fusion (bucky v24) para conferência. */
const V24 = { L0: 80.2, L1: 130, L2: 150, d1: 89.9, d2: 103.2, d3: 61.9, d4: 120, xA: 88.3, yA: 50.2, dg0: 83.5, dg1: 83.5,
  D20: 20.7, D10: 16.2, D5: 13.2, db20: 9.4, db10: 9.4, db5: 5.5, LE20: 21.5, LE10: 19, LE5: 15, ee10: 2,
  e: 3, hb: 6, se: 10, D0: 8, D1: 8, alpha: 90, Dpino: 2.5, Lb: 88.3, Rd: 105.96, Rb: 150, fe10: 4, nd: 4 };
/* No v24, LE é a largura do canal; aqui LE é a aba medida e o canal = LE + f_seringa. */
const AJUSTE_LE = { LE20: 1, LE10: 1, LE5: 1 };

const $ = s => document.querySelector(s);
let estado = carregar(), kernel = null, P = null, malhas = {}, selecionada = 'todas', tempo = null, primeira = true;

function carregar() {
  const base = estadoPadrao();
  base.folgas = { ...FOLGAS_PADRAO };
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) { const o = JSON.parse(raw); return mesclar(base, o); }
  } catch (e) { /* armazenamento indisponível */ }
  return base;
}
function mesclar(b, o) {
  for (const k in b) if (o && o[k] !== undefined) {
    if (typeof b[k] === 'object' && b[k] !== null) mesclar(b[k], o[k]);
    else if (typeof o[k] === typeof b[k]) b[k] = o[k];
  }
  return b;
}
function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* ignora */ } }

const fmt = (v, d = 1) => Number.isFinite(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';

function cabe(m) {
  const I = estado.entradas.impressora;
  const ex = m.bbox[1][0] - m.bbox[0][0], ey = m.bbox[1][1] - m.bbox[0][1], ez = m.bbox[1][2] - m.bbox[0][2];
  return ((ex <= I.x && ey <= I.y) || (ex <= I.y && ey <= I.x)) && ez <= I.z;
}

function regenerar() {
  P = derivar(estado);
  const erros = [];
  malhas = {};
  const t0 = performance.now();
  for (const p of PECAS) {
    try { malhas[p.id] = gerarPeca(novoGeo, kernel, p, P); }
    catch (err) { erros.push(`${p.nome}: ${err.message}`); }
  }
  $('#tempo').textContent = `${PECAS.length} peças geradas em ${fmt(performance.now() - t0, 0)} ms`;
  $('#avisos').hidden = !erros.length;
  $('#avisos').textContent = erros.length ? 'Não foi possível gerar: ' + erros.join('; ') : '';
  tabela(); conferencia(); mostrar(!primeira); primeira = false;
}

function tabela() {
  const tb = $('#tabPecas tbody'); tb.innerHTML = '';
  let total = 0, massa = 0;
  const rho = estado.entradas.material.densidade / 1000; // g/mm³
  for (const p of PECAS) {
    const m = malhas[p.id]; if (!m) continue;
    const q = p.qtd(P), ext = m.bbox[1].map((x, k) => x - m.bbox[0][k]);
    total += q; massa += q * m.volume * rho;
    const ok = cabe(m);
    const tr = h('tr', { class: selecionada === p.id ? 'sel' : '', tabindex: '0' },
      h('td', {}, h('span', { class: 'bolinha', style: `background:${p.cor}` }), p.nome),
      h('td', { class: 'num' }, String(q)),
      h('td', { class: 'num' }, ext.map(x => fmt(x, 1)).join(' × ')),
      h('td', { class: 'num' }, fmt(m.volume * rho, 1)),
      h('td', {}, h('span', { class: 'selo ' + (ok ? 'ok' : 'nao') }, ok ? 'cabe' : 'não cabe')),
      h('td', {}, h('button', { type: 'button', class: 'btn mini', onclick: ev => { ev.stopPropagation(); baixar(stlBinario(m, p.id), `${p.id}.stl`, 'model/stl'); } }, 'STL')));
    const sel = () => { selecionada = p.id; tabela(); mostrar(); };
    tr.addEventListener('click', sel);
    tr.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); sel(); } });
    tb.append(tr);
  }
  $('#resumo').textContent = `${total} peças impressas, cerca de ${fmt(massa, 0)} g de ${estado.entradas.material.nome}`;
  $('#verTodas').classList.toggle('ativa', selecionada === 'todas');
}

function mostrar(manter = false) {
  const I = estado.entradas.impressora;
  if (selecionada !== 'todas' && malhas[selecionada]) {
    const p = PECAS.find(x => x.id === selecionada);
    visor.mostrar([{ malha: malhas[selecionada], cor: p.cor }], [I.x, I.y], manter);
    $('#rotVisor').textContent = p.nome;
    return;
  }
  // todas: distribui em fileiras
  const itens = []; let x = 0, y = 0, linha = 0; const larg = 420;
  for (const p of PECAS) {
    const m = malhas[p.id]; if (!m) continue;
    const ex = m.bbox[1][0] - m.bbox[0][0], ey = m.bbox[1][1] - m.bbox[0][1];
    if (x + ex > larg && x > 0) { x = 0; y -= linha + 12; linha = 0; }
    itens.push({ malha: m, cor: p.cor, dx: x + ex / 2, dy: y - ey / 2 });
    x += ex + 12; linha = Math.max(linha, ey);
  }
  visor.mostrar(itens, null, manter);
  $('#rotVisor').textContent = 'Todas as peças (uma de cada)';
}

function conferencia() {
  const F = nomesFusion(P), tb = $('#tabConf tbody'); tb.innerHTML = '';
  for (const [k, v] of Object.entries(F)) {
    const ref = V24[k] !== undefined ? V24[k] : null;
    const comp = AJUSTE_LE[k] ? v + P.f_seringa : v;
    const dif = ref === null ? null : comp - ref;
    tb.append(h('tr', {},
      h('td', {}, h('code', {}, k)),
      h('td', { class: 'num' }, fmt(comp, 2)),
      h('td', { class: 'num' }, ref === null ? '—' : fmt(ref, 2)),
      h('td', { class: 'num ' + (dif !== null && Math.abs(dif) > 0.05 ? 'dif' : '') }, dif === null ? '' : (Math.abs(dif) < 0.005 ? '=' : (dif > 0 ? '+' : '') + fmt(dif, 2)))));
  }
}

function baixar(dados, nome, tipo) {
  const blob = dados instanceof Blob ? dados : new Blob([dados], { type: tipo });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function exportarZip() {
  const bt = $('#btnZip'); bt.disabled = true; bt.textContent = 'Gerando…';
  try {
    const arquivos = [];
    const linhas = ['Bucky: braço hidráulico por seringas', `Gerado em ${new Date().toLocaleString('pt-BR')}`, '', 'Peças (imprimir a quantidade indicada):'];
    for (const p of PECAS) {
      const m = malhas[p.id]; if (!m) continue;
      const q = p.qtd(P);
      arquivos.push({ nome: `pecas/${p.id}_x${q}.stl`, dados: stlBinario(m, p.id) });
      linhas.push(`  ${String(q).padStart(2)} × ${p.nome}  (pecas/${p.id}_x${q}.stl)`);
    }
    linhas.push('', 'A mão (palma, cubo e dedos) e os desenhos técnicos entram nas próximas etapas.');
    const { seringas, bola, material, impressora, ...resto } = P;
    arquivos.push({ nome: 'parametros.json', dados: JSON.stringify({ formato: 'bucky-app', versao: 1, estado, derivados: resto, fusion: nomesFusion(P) }, null, 2) });
    arquivos.push({ nome: 'LEIAME.txt', dados: linhas.join('\r\n') });
    baixar(await criarZip(arquivos), 'bucky-pecas.zip', 'application/zip');
  } finally { bt.disabled = false; bt.textContent = 'Baixar todas as peças (.zip)'; }
}

function aoMudar() {
  salvar();
  clearTimeout(tempo);
  tempo = setTimeout(regenerar, 200);
}

let visor;
async function iniciar() {
  montarFormulario($('#painel'), estado, aoMudar);
  visor = new Visor($('#visor'));
  $('#verTodas').addEventListener('click', () => { selecionada = 'todas'; tabela(); mostrar(); });
  $('#btnZip').addEventListener('click', exportarZip);
  $('#btnPadrao').addEventListener('click', () => {
    estado = estadoPadrao(); estado.folgas = { ...FOLGAS_PADRAO }; salvar();
    montarFormulario($('#painel'), estado, aoMudar); regenerar();
  });
  try {
    kernel = await carregarKernel();
  } catch (err) {
    $('#avisos').hidden = false;
    $('#avisos').textContent = 'Não foi possível carregar o gerador de peças (manifold-3d). Verifique a conexão e recarregue a página.';
    return;
  }
  $('#carregando').hidden = true;
  regenerar();
}
iniciar();
