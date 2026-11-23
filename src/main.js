/* Bucky: aplicativo do braço hidráulico com seringas. */
import { carregarKernel, novoGeo } from './geometria/kernel.js';
import { estadoPadrao } from './modelo/parametros.js';
import { derivar, nomesFusion } from './modelo/derivados.js';
import { FOLGAS_PADRAO } from './modelo/folgas.js';
import { avaliar, paraDimensoes } from './modelo/cinematica.js';
import { otimizar, CRITERIOS } from './modelo/otimizador.js';
import { montar } from './montagem/montagem.js';
import { PECAS, gerarPeca } from './pecas/index.js';
import { folhasDasPecas, A4 } from './desenhos/desenhar.js';
import { paraSVG } from './desenhos/folha.js';
import { stlBinario } from './exportar/stl.js';
import { pdfDeFolhas } from './exportar/pdf.js';
import { criarZip } from './exportar/zip.js';
import { montarFormulario, h } from './ui/formulario.js';
import { Visor } from './ui/visor3d.js';

const CHAVE = 'bucky-app-estado-v2';

const $ = s => document.querySelector(s);
const fmt = (v, d = 1) => Number.isFinite(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';
let estado = carregar(), kernel = null, P = null, R = null, malhas = {}, cores = {};
let aba = 'montagem', selecionada = 'todas', tempo = null, primeira = true, folhasCache = null, ocupado = false;
const juntas = { giro: 0.5, ombro: 0.45, cotovelo: 0.55, garra: 0 };

function carregar() {
  const b = estadoPadrao(); b.folgas = { ...FOLGAS_PADRAO };
  try { const raw = localStorage.getItem(CHAVE); if (raw) return mesclar(b, JSON.parse(raw)); } catch (e) { /* sem armazenamento */ }
  return b;
}
function mesclar(b, o) {
  for (const k in b) if (o && o[k] !== undefined) {
    if (typeof b[k] === 'object' && b[k] !== null) mesclar(b[k], o[k]);
    else if (typeof o[k] === typeof b[k]) b[k] = o[k];
  }
  if (o && typeof o.assinatura === 'string') b.assinatura = o.assinatura;
  return b;
}
function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* ignora */ } }
const assinatura = () => JSON.stringify([estado.entradas, estado.construcao, estado.folgas]);

/* ---------- cálculo ---------- */
function recalcular(regerar = true) {
  P = derivar(estado);
  R = avaliar(P);
  if (regerar) {
    malhas = {}; cores = {}; folhasCache = null;
    const erros = [], t0 = performance.now();
    for (const p of PECAS) {
      cores[p.id] = p.cor;
      try { malhas[p.id] = gerarPeca(novoGeo, kernel, p, P); } catch (err) { erros.push(`${p.nome}: ${err.message}`); }
    }
    $('#tempo').textContent = `${PECAS.length} peças geradas em ${fmt(performance.now() - t0, 0)} ms`;
    $('#avisos').hidden = !erros.length;
    $('#avisos').textContent = erros.length ? 'Não foi possível gerar: ' + erros.join('; ') : '';
  }
  resultado(); tabela(); mostrar(!primeira); primeira = false;
  if (aba === 'desenhos') desenhos();
}

/* ---------- resultado ---------- */
function resultado() {
  const box = $('#resultado'); box.innerHTML = '';
  const crit = estado.entradas.criterio, desat = estado.origem === 'otimizado' && estado.assinatura !== assinatura();
  const est = h('div', { class: 'estado' });
  if (estado.origem === 'v24') est.append(h('span', { class: 'selo amarelo' }, 'Exemplo'), 'Bucky v24, com as medidas do Fusion. Clique em Otimizar para gerar o seu.');
  else if (desat) est.append(h('span', { class: 'selo nao' }, 'Desatualizado'), 'As entradas mudaram depois da última otimização. Otimize de novo.');
  else est.append(h('span', { class: 'selo azul' }, 'Otimizado'), `Melhor configuração para: ${CRITERIOS[estado.criterioUsado || crit]?.rot.toLowerCase() || ''}.`);
  est.append(h('span', { class: 'selo ' + (R.ok ? 'ok' : 'nao') }, R.ok ? 'atende a todas as verificações' : 'há verificações não atendidas'));
  box.append(est);
  const rho = estado.entradas.material.densidade / 1000;
  let massa = 0; for (const p of PECAS) if (malhas[p.id]) massa += p.qtd(P) * malhas[p.id].volume * rho;
  const m = [
    ['area', CRITERIOS.area.mostrar(R.m.A), 'Área de alcance'],
    ['volume', CRITERIOS.volume.mostrar(R.m.V), 'Volume de alcance'],
    ['', `${fmt(P.L1, 0)} / ${fmt(P.L2, 0)} mm`, 'Braço / antebraço'],
    ['', `${fmt(R.FS1, 2)} / ${fmt(R.FS2, 2)}`, 'Segurança ombro / cotovelo'],
    ['', `${fmt(P.garra.FS || 0, 1)}`, 'Segurança da pega'],
    ['', `${fmt(massa, 0)} g`, 'Plástico impresso'],
  ];
  box.append(h('div', { class: 'metricas' }, ...m.map(([k, v, r]) => h('div', { class: 'metrica' + (k && k === crit ? ' destaque' : '') }, h('div', { class: 'v' }, v), h('div', { class: 'r' }, r)))));
  const todas = [...R.checks, ...(P.garra.checks || [])];
  const falhas = todas.filter(c => c[1] < 0).length;
  const det = h('details', { class: 'checks' }, h('summary', {}, `Verificações (${todas.length - falhas} de ${todas.length} atendidas)`),
    h('ul', {}, ...todas.map(([n, v]) => h('li', { class: v < 0 ? 'nao' : '' }, h('span', {}, n), h('span', {}, v < 0 ? 'não atende' : 'ok')))));
  if (falhas) det.open = true;
  box.append(det);
}

/* ---------- visualização ---------- */
function mostrar(manter = false) {
  if (!kernel) return;
  const I = estado.entradas.impressora;
  $('#controles').hidden = aba !== 'montagem';
  $('#verTodas').hidden = aba !== 'pecas' || selecionada === 'todas';
  if (aba === 'montagem') {
    const M = montar(P, juntas);
    visor.montagem(M, malhas, cores, manter);
    $('#rotVisor').textContent = 'Braço montado: mova as seringas';
    for (const inp of document.querySelectorAll('#controles input')) inp.nextElementSibling.textContent = fmt(M.pose.s[inp.dataset.junta], 0) + ' mm';
    return;
  }
  if (selecionada !== 'todas' && malhas[selecionada]) {
    const p = PECAS.find(x => x.id === selecionada);
    visor.mostrar([{ malha: malhas[selecionada], cor: p.cor }], [I.x, I.y], manter);
    $('#rotVisor').textContent = p.nome;
    return;
  }
  const itens = []; let x = 0, y = 0, linha = 0; const larg = 440;
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

function cabe(m) {
  const I = estado.entradas.impressora;
  const ex = m.bbox[1][0] - m.bbox[0][0], ey = m.bbox[1][1] - m.bbox[0][1], ez = m.bbox[1][2] - m.bbox[0][2];
  return ((ex <= I.x && ey <= I.y) || (ex <= I.y && ey <= I.x)) && ez <= I.z;
}

function tabela() {
  const tb = $('#tabPecas tbody'); tb.innerHTML = '';
  let total = 0, massa = 0;
  const rho = estado.entradas.material.densidade / 1000;
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
}

function gerarFolhas() {
  if (!folhasCache) folhasCache = folhasDasPecas(kernel, PECAS, P, estado.origem === 'v24' ? 'exemplo v24' : 'otimizado');
  return folhasCache;
}
function desenhos() {
  const box = $('#folhas'); box.innerHTML = '';
  const fs = gerarFolhas();
  fs.forEach((x, i) => {
    const svg = paraSVG(x.folha), url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const a = h('a', { class: 'folha', href: '#', title: 'Baixar SVG' }, h('img', { src: url, alt: `Desenho: ${x.nome}`, loading: 'lazy' }), `${i + 1}. ${x.nome}`);
    a.addEventListener('click', ev => { ev.preventDefault(); baixar(svg, `${String(i + 1).padStart(2, '0')}-${x.id}.svg`, 'image/svg+xml'); });
    box.append(a);
  });
}

/* ---------- ações ---------- */
function baixar(dados, nome, tipo) {
  const blob = dados instanceof Blob ? dados : new Blob([dados], { type: tipo });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function exportarZip() {
  const bt = $('#btnZip'); bt.disabled = true; const txt = bt.textContent; bt.textContent = 'Gerando…';
  try {
    await new Promise(r => setTimeout(r, 20));
    const arquivos = [], fs = gerarFolhas();
    const linhas = ['Bucky: braço hidráulico com seringas', `Gerado em ${new Date().toLocaleString('pt-BR')}`,
      estado.origem === 'v24' ? 'Configuração: exemplo bucky v24' : `Configuração otimizada (${CRITERIOS[estado.criterioUsado]?.rot || ''})`, '',
      'Peças (imprimir a quantidade indicada):'];
    for (const p of PECAS) {
      const m = malhas[p.id]; if (!m) continue;
      const q = p.qtd(P);
      arquivos.push({ nome: `pecas/${p.id}_x${q}.stl`, dados: stlBinario(m, p.id) });
      linhas.push(`  ${String(q).padStart(2)} × ${p.nome}  (pecas/${p.id}_x${q}.stl)`);
    }
    arquivos.push({ nome: 'desenhos/desenhos.pdf', dados: pdfDeFolhas(fs.map(x => x.folha), A4) });
    fs.forEach((x, i) => arquivos.push({ nome: `desenhos/svg/${String(i + 1).padStart(2, '0')}-${x.id}.svg`, dados: paraSVG(x.folha) }));
    linhas.push('', 'Desenhos: desenhos/desenhos.pdf (uma folha A4 por peça) e desenhos/svg/.',
      'Pinos da mão: fio de filamento ou arame no diâmetro Dpino.', '',
      `Área de alcance: ${CRITERIOS.area.mostrar(R.m.A)}   Volume: ${CRITERIOS.volume.mostrar(R.m.V)}`);
    const { seringas, meta, material, impressora, garra, travas, ...resto } = P;
    arquivos.push({ nome: 'parametros.json', dados: JSON.stringify({ formato: 'bucky-app', versao: 2, estado, derivados: resto, garra: semFuncoes(garra), fusion: nomesFusion(P) }, null, 2) });
    arquivos.push({ nome: 'LEIAME.txt', dados: linhas.join('\r\n') });
    baixar(await criarZip(arquivos), 'meu-bucky.zip', 'application/zip');
  } finally { bt.disabled = false; bt.textContent = txt; }
}
const semFuncoes = o => JSON.parse(JSON.stringify(o));

async function rodarOtimizador() {
  if (ocupado || !kernel) return;
  ocupado = true;
  const bts = [$('#btnOtimizar'), $('#btnOtimizar2')].filter(Boolean);
  bts.forEach(b => { b.disabled = true; b.textContent = 'Otimizando…'; });
  try {
    const Pin = derivar(estado);
    const res = await otimizar(Pin, estado.entradas.criterio, msg => { bts.forEach(b => { b.textContent = msg; }); });
    if (res.erro) { $('#avisos').hidden = false; $('#avisos').textContent = res.msg; return; }
    Object.assign(estado.otimizados, paraDimensoes(res.r));
    estado.origem = 'otimizado'; estado.criterioUsado = estado.entradas.criterio; estado.assinatura = assinatura();
    $('#avisos').hidden = true;
    salvar();
    montarFormulario($('#painel'), estado, aoMudar, rodarOtimizador);
    primeira = true; recalcular(true);
  } finally {
    ocupado = false;
    bts.forEach(b => { b.disabled = false; });
    $('#btnOtimizar').textContent = 'Otimizar';
    const b2 = $('#btnOtimizar2'); if (b2) b2.textContent = 'Otimizar meu Bucky';
  }
}

function aoMudar(tipo) {
  if (tipo === 'dimensao' && estado.origem === 'otimizado') estado.assinatura = assinatura();
  salvar();
  clearTimeout(tempo);
  tempo = setTimeout(() => recalcular(true), 220);
}

function trocarAba(nova) {
  aba = nova;
  document.querySelectorAll('.aba-vis').forEach(b => { const a = b.dataset.aba === nova; b.classList.toggle('ativa', a); b.setAttribute('aria-selected', a ? 'true' : 'false'); });
  $('#caixaVisor').hidden = nova === 'desenhos';
  $('#painelPecas').hidden = nova !== 'pecas';
  $('#painelDesenhos').hidden = nova !== 'desenhos';
  if (nova === 'desenhos') { $('#folhas').innerHTML = '<p class="nota">Gerando as folhas…</p>'; setTimeout(desenhos, 20); }
  else mostrar(false);
}

let visor;
async function iniciar() {
  montarFormulario($('#painel'), estado, aoMudar, rodarOtimizador);
  visor = new Visor($('#visor'));
  document.querySelectorAll('.aba-vis').forEach(b => b.addEventListener('click', () => trocarAba(b.dataset.aba)));
  document.querySelectorAll('#controles input').forEach(inp => {
    inp.value = Math.round(juntas[inp.dataset.junta] * 100);
    inp.addEventListener('input', () => { juntas[inp.dataset.junta] = inp.value / 100; mostrar(true); });
  });
  $('#verTodas').addEventListener('click', () => { selecionada = 'todas'; tabela(); mostrar(); });
  $('#btnZip').addEventListener('click', exportarZip);
  $('#btnPdf').addEventListener('click', () => baixar(pdfDeFolhas(gerarFolhas().map(x => x.folha), A4), 'desenhos-bucky.pdf', 'application/pdf'));
  $('#btnOtimizar').addEventListener('click', rodarOtimizador);
  $('#btnExemplo').addEventListener('click', () => {
    estado = estadoPadrao(); estado.folgas = { ...FOLGAS_PADRAO }; salvar();
    montarFormulario($('#painel'), estado, aoMudar, rodarOtimizador); primeira = true; recalcular(true);
  });
  try { kernel = await carregarKernel(); }
  catch (err) {
    $('#avisos').hidden = false;
    $('#avisos').textContent = 'Não foi possível carregar o gerador de peças (manifold-3d). Verifique a conexão e recarregue a página.';
    return;
  }
  $('#carregando').hidden = true;
  recalcular(true);
}
iniciar();
