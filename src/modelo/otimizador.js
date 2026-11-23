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
};

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
