/* Otimizador: amostragem aleatória + refinamento por coordenadas (como no otimizador antigo).
   Primeiro acha a garra (independe do braço), depois o braço que maximiza o critério. */
import { dimensionar } from './cinematica.js';
import { ajustarGarra } from './garra.js';

export const VARIAVEIS = [
  { id: 'phis', rot: 'Abertura máxima do ombro (°)', lo: 110, hi: 170, passo: 1 },
  { id: 'ks', rot: 'Razão B/A do ombro', lo: 0.6, hi: 1.6, passo: 0.01 },
  { id: 'th1', rot: 'Ângulo inicial do braço (°)', lo: -30, hi: 60, passo: 1 },
  { id: 'phic', rot: 'Abertura máxima do cotovelo (°)', lo: 110, hi: 170, passo: 1 },
  { id: 'kc', rot: 'Razão D/C do cotovelo', lo: 0.4, hi: 1.6, passo: 0.01 },
  { id: 'rho', rot: 'Antebraço / braço', lo: 0.8, hi: 2.2, passo: 0.01 },
  { id: 'phigiro', rot: 'Abertura máxima do giro (°)', lo: 110, hi: 170, passo: 1 },
  { id: 'kgiro', rot: 'Razão G1/G0 do giro', lo: 0.7, hi: 1.5, passo: 0.01 },
];

export const CRITERIOS = {
  area: { rot: 'Maior área de alcance', ajuda: 'área do plano vertical que o centro da meta percorre', f: m => m.A, mostrar: v => (v / 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' cm²' },
  volume: { rot: 'Maior volume de alcance', ajuda: 'área de alcance girada pela base', f: m => m.V, mostrar: v => (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' L' },
  pareto: { rot: 'Alcance × material (Pareto)', ajuda: 'mostra a troca entre área de alcance e plástico gasto; você escolhe o ponto', f: m => m.A, mostrar: v => (v / 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' cm²' },
};

/* Massa de plástico estimada (g), rápida o bastante para o laço do otimizador.
   Regressão sobre o volume real de todas as peças geradas (40 braços válidos, e = 3 mm,
   erro médio 1,4 %), escalada pela espessura e pela densidade. O valor exato aparece
   no resultado depois de gerar as peças. */
export function massaEstimada(P, r) {
  const vol = 53665.5 - 6.887 * r.L1 + 42.525 * r.L2 + 17.368 * r.dg * r.dg + 157.8 * r.dg1 + 359.66 * r.xA + 172.7 * r.yA; // mm³ com e = 3
  return Math.max(1, vol * (P.e / 3)) * P.material.densidade / 1000;
}

const espera = () => new Promise(r => setTimeout(r, 0));

export async function otimizar(P, criterio, progresso = () => {}) {
  const obj = CRITERIOS[criterio] || CRITERIOS.area;
  const xg = ajustarGarra(P);
  if (!xg) return { erro: 'garra', msg: 'Nenhuma geometria de garra atende às folgas com esta meta e esta seringa da garra.' };
  let semente = 1234567;
  const rnd = () => { semente |= 0; semente = semente + 0x6D2B79F5 | 0; let t = Math.imul(semente ^ semente >>> 15, 1 | semente); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const monta = v => { const x = { ...xg }; VARIAVEIS.forEach((q, i) => { x[q.id] = v[i]; }); return x; };
  let n = 0;
  const motivos = {};
  /* nota: configurações válidas valem o critério (> 0); inválidas valem −violação,
     para que o refinamento caminhe em direção à região válida quando ela é estreita. */
  const peso = nome => /FS|Torque/.test(nome) ? 100 : /possíveis|Garra atende/.test(nome) ? 1000 : 1;
  const nota = v => {
    n++; const r = dimensionar(P, monta(v));
    if (!r.ok) {
      let viol = 0;
      for (const c of r.checks) if (c[1] < 0) { motivos[c[0]] = (motivos[c[0]] || 0) + 1; viol += -c[1] * peso(c[0]); }
      return -1 - (Number.isFinite(viol) ? viol : 1e9);
    }
    const f = obj.f(r.m); return Number.isFinite(f) && f > 0 ? f : -1e9;
  };
  const top = [];
  const guarda = (v, f) => { top.push({ v, f }); top.sort((a, b) => b.f - a.f); if (top.length > 8) top.pop(); };
  const N = 6000;
  for (let i = 0; i < N; i++) {
    const v = VARIAVEIS.map(q => q.lo + rnd() * (q.hi - q.lo));
    guarda(v, nota(v));
    if (i % 300 === 0) { progresso(`Testando configurações: ${i} de ${N}`); await espera(); }
  }
  for (let k = 0; k < top.length; k++) {
    let { v, f } = top[k];
    let st = VARIAVEIS.map(q => 0.12 * (q.hi - q.lo));
    for (let it = 0; it < 90; it++) {
      let melhorou = false;
      for (let i = 0; i < v.length; i++) for (const s of [1, -1]) {
        const y = v.slice(); y[i] = Math.min(VARIAVEIS[i].hi, Math.max(VARIAVEIS[i].lo, y[i] + s * st[i]));
        const fy = nota(y); if (fy > f + 1e-9) { v = y; f = fy; melhorou = true; break; }
      }
      if (!melhorou) { st = st.map(s => s / 2); if (st.every((s, i) => s < 0.003 * (VARIAVEIS[i].hi - VARIAVEIS[i].lo))) break; }
    }
    top[k] = { v, f };
    progresso(`Refinando a região ${k + 1} de ${top.length}`); await espera();
  }
  top.sort((a, b) => b.f - a.f);
  if (!(top[0].f > 0)) {
    const prin = Object.entries(motivos).sort((a, b) => b[1] - a[1]).slice(0, 3).map(m => m[0].toLowerCase());
    return { erro: 'braco', motivos: prin, msg: `Nenhuma configuração do braço atende às restrições. As que mais falharam: ${prin.join('; ')}. Tente uma meta mais leve, uma seringa da garra mais curta, uma força de polegar maior ou uma impressora maior.` };
  }
  let { v, f } = top[0];
  const vr = v.map((x, i) => Math.round(x / VARIAVEIS[i].passo) * VARIAVEIS[i].passo);
  const fr = nota(vr); if (fr > 0) { v = vr; f = fr; }
  const x = monta(v);
  return { x, f, r: dimensionar(P, x), avaliacoes: n, criterio };
}

/* Fronteira de Pareto: maior área de alcance para cada orçamento de plástico.
   Método da restrição-ε: sorteia configurações, define orçamentos de massa entre a mais leve
   e a mais pesada válidas e, para cada um, maximiza a área com massa ≤ orçamento.
   Devolve os pontos não dominados, do mais leve ao mais pesado. */
export async function otimizarPareto(P, progresso = () => {}) {
  const xg = ajustarGarra(P);
  if (!xg) return { erro: 'garra', msg: 'Nenhuma geometria de garra atende às folgas com esta meta e esta seringa da garra.' };
  let semente = 7654321;
  const rnd = () => { semente |= 0; semente = semente + 0x6D2B79F5 | 0; let t = Math.imul(semente ^ semente >>> 15, 1 | semente); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const monta = v => { const x = { ...xg }; VARIAVEIS.forEach((q, i) => { x[q.id] = v[i]; }); return x; };
  const avalia = v => { const r = dimensionar(P, monta(v)); return { r, ok: r.ok && r.m.A > 0, A: r.m.A, g: massaEstimada(P, r) }; };
  const validos = [];
  const N = 6000;
  for (let i = 0; i < N; i++) {
    const v = VARIAVEIS.map(q => q.lo + rnd() * (q.hi - q.lo));
    const a = avalia(v); if (a.ok) validos.push({ v, A: a.A, g: a.g });
    if (i % 300 === 0) { progresso(`Testando configurações: ${i} de ${N}`); await espera(); }
  }
  if (validos.length < 2) return { erro: 'braco', msg: 'Poucas configurações válidas para montar a curva. Tente uma meta mais leve ou uma impressora maior.' };
  const gs = validos.map(p => p.g).sort((a, b) => a - b);
  const gmin = gs[0], gmax = gs[gs.length - 1];
  const K = 9, pontos = [];
  for (let k = 0; k < K; k++) {
    const orc = gmin + (gmax - gmin) * (k + 0.5) / K;
    const cand = validos.filter(p => p.g <= orc).sort((a, b) => b.A - a.A);
    if (!cand.length) continue;
    const nota = v => { const a = avalia(v); if (!a.ok) return -1e9; return a.g <= orc ? a.A : a.A - 1e4 * (a.g - orc); };
    let v = cand[0].v, f = nota(v);
    let st = VARIAVEIS.map(q => 0.12 * (q.hi - q.lo));
    for (let it = 0; it < 80; it++) {
      let melhorou = false;
      for (let i = 0; i < v.length; i++) for (const s of [1, -1]) {
        const y = v.slice(); y[i] = Math.min(VARIAVEIS[i].hi, Math.max(VARIAVEIS[i].lo, y[i] + s * st[i]));
        const fy = nota(y); if (fy > f + 1e-9) { v = y; f = fy; melhorou = true; break; }
      }
      if (!melhorou) { st = st.map(s => s / 2); if (st.every((s, i) => s < 0.003 * (VARIAVEIS[i].hi - VARIAVEIS[i].lo))) break; }
    }
    const vr = v.map((x, i) => Math.round(x / VARIAVEIS[i].passo) * VARIAVEIS[i].passo);
    const a = avalia(vr), b = avalia(v);
    const fim = a.ok && a.g <= orc * 1.01 ? { v: vr, ...a } : { v, ...b };
    if (fim.ok) pontos.push({ x: monta(fim.v), A: fim.A, g: fim.g, r: fim.r });
    progresso(`Montando a curva: ${k + 1} de ${K}`); await espera();
  }
  // só os não dominados (menos plástico e mais área)
  pontos.sort((a, b) => a.g - b.g);
  const frente = [];
  for (const p of pontos) if (!frente.length || p.A > frente[frente.length - 1].A + 1) frente.push(p);
  if (!frente.length) return { erro: 'braco', msg: 'Não foi possível montar a curva de Pareto com estas entradas.' };
  // ponto sugerido: o "joelho", mais distante da reta entre os extremos (normalizado)
  const p0 = frente[0], p1 = frente[frente.length - 1];
  const nx = p => (p.g - p0.g) / Math.max(1e-9, p1.g - p0.g), ny = p => (p.A - p0.A) / Math.max(1e-9, p1.A - p0.A);
  let joelho = frente.length - 1, dmax = -1;
  frente.forEach((p, i) => { const d = ny(p) - nx(p); if (d > dmax) { dmax = d; joelho = i; } });
  return { frente, joelho, amostras: validos.length };
}
