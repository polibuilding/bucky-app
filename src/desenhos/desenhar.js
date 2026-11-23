/* Folhas de desenho de cada peça: vista de cima e vista de frente (projeções do sólido)
   com as cotas dos parâmetros que definem a peça. */
import { Folha, Vista, A4, escalaPara, moldura } from './folha.js';
import { novoGeo } from '../geometria/kernel.js';


function projecao(m) {
  const cs = m.project();
  const pol = cs.toPolygons().map(l => l.map(p => [p[0], p[1]]));
  cs.delete();
  return pol;
}
function caixa(pol) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const l of pol) for (const [x, y] of l) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/* Cotas por peça. c = vista de cima, f = vista de frente (x, z). */
const COTAS = {
  base(P, c, f) {
    c.cota([0, 0], [P.dg0, 0], 'dg0', P.dg0, -14, { h: true });
    c.furo([0, 0], (P.Rd + P.f_disco) / 2, 'Rd + f_disco', P.Rd + P.f_disco, -60);
    c.furo([0, 0], P.rExt, '1,2 · dg0', P.rExt, 200, true);
    c.furo([P.dg0, 0], P.furo_pino / 2, 'D1 + f_giro', P.furo_pino, 40);
    c.angulo([0, 0], P.ang_atuador[0], P.ang_atuador[1], 14, 'arco do atuador', P.ang_atuador[1] - P.ang_atuador[0]);
    f.cota([P.rB, 0], [P.rB, P.hb], 'hb = 2e', P.hb, 10, { v: true });
  },
  disco(P, c, f) {
    c.furo([0, 0], P.Rd / 2, 'Rd = 1,2 · Lb', P.Rd, 35);
    c.cota([0, -(P.Lb + P.f_pressao) / 2], [0, (P.Lb + P.f_pressao) / 2], 'Lb + f_pressao', P.Lb + P.f_pressao, -(P.Rd / 2) * c.k - 6, { v: true });
    f.cota([P.Rd / 2, 0], [P.Rd / 2, P.hb], 'hb', P.hb, 10, { v: true });
    f.cota([-P.Rd_degrau / 2, P.hb], [P.Rd_degrau / 2, P.hb], 'Rd − 3e', P.Rd_degrau, 6, { h: true });
  },
  atuador(P, c, f) {
    c.angulo([0, 0], P.ang_atuador[0], P.ang_atuador[1], 10, 'arco', P.ang_atuador[1] - P.ang_atuador[0]);
    c.furo([0, 0], P.rExt, '1,2 · dg0', P.rExt, P.ang_atuador[0] - 6, true);
    f.cota([0, 0], [0, -P.hb], 'nervura = hb', P.hb, -8, { v: true });
  },
  corpo(P, c) {
    const E1 = [0, P.L0], A = [P.xA, P.L0 - P.yA];
    c.cota([0, 0], E1, 'L0', P.L0, -(P.Lb / 2) * c.k - 10, { v: true });
    c.cota(E1, A, 'xA', P.xA, P.se * c.k + 8, { h: true });
    c.cota(A, E1, 'yA', P.yA, -(P.se * c.k + 8), { v: true });
    c.cota([-P.Lb / 2, 0], [P.Lb / 2, 0], 'Lb = xA', P.Lb, -7, { h: true });
    c.cota([-P.aba_fim, 0], [-P.aba_fim, P.yt], 'hb + LE + f + 2e', P.yt, 10, { v: true });
    c.cota([0, P.yt], [-P.xs_ombro, P.yt], 'dg1 + (D1 + e)/2', P.xs_ombro, 9, { h: true });
    c.furo(E1, P.furo_eixo / 2, 'D0 + f_giro', P.furo_eixo, 120);
    c.furo(A, P.furo_pino / 2, 'D1 + f_giro', P.furo_pino, -40);
  },
  ombro(P, c, f) {
    c.cota([-P.ombro_lado / 2, 0], [P.ombro_lado / 2, 0], 'D1 + 2e', P.ombro_lado, -7, { h: true });
    c.furo([0, P.ombro_lado / 2], P.furo_ombro / 2, 'D1 + f_seringa', P.furo_ombro, 40);
    f.cota([-P.ombro_lado / 2, 0], [-P.ombro_lado / 2, P.ombro_esp], 'e − f_desliza', P.ombro_esp, -9, { v: true });
  },
  braco(P, c) {
    c.cota([0, 0], [P.L1, 0], 'L1', P.L1, -(P.se * c.k + 8), { h: true });
    c.cota([0, 0], [P.d1, 0], 'd1', P.d1, P.se * c.k + 6, { h: true });
    c.cota([P.L1 - P.d2, 0], [P.L1, 0], 'd2', P.d2, P.se * c.k + 15, { h: true });
    c.cota([0, -P.se], [0, P.se], '2 · se', 2 * P.se, -(P.se * c.k + 6), { v: true });
    c.furo([0, 0], P.furo_eixo / 2, 'D0 + f_giro', P.furo_eixo, 135);
    c.furo([P.d1, 0], P.furo_pino / 2, 'D1 + f_giro', P.furo_pino, -60);
  },
  antebraco(P, c) {
    c.cota([0, 0], [P.L2, 0], 'L2', P.L2, -(P.se * c.k + 8), { h: true });
    c.cota([0, 0], [P.d3, 0], 'd3', P.d3, P.se * c.k + 6, { h: true });
    c.cota([P.L2 - P.d4, 0], [P.L2, 0], 'd4', P.d4, P.se * c.k + 15, { h: true });
    c.cota([P.L2 - P.garfo, 0], [P.L2, 0], '(L2 − d3)/2', P.garfo, -(P.se * c.k + 17), { h: true });
    c.cota([P.L2, -P.trilho / 2], [P.L2, P.trilho / 2], '3e', P.trilho, 8, { v: true });
    c.furo([P.L2 - P.d4, 0], P.furo_pino / 2, 'D1 + f_giro', P.furo_pino, 120);
  },
  pulso(P, c) {
    c.cota([0, -P.trilho / 2], [P.pulso_comp, -P.trilho / 2], 'comprimento', P.pulso_comp, -(P.pulso_travessa[1] / 2 - P.trilho / 2) * c.k - 8, { h: true });
    c.cota([0, P.trilho / 2], [P.pulso_rasgo, P.trilho / 2], 'rasgo', P.pulso_rasgo, 7, { h: true });
    c.cota([P.pulso_comp, -P.pulso_travessa[1] / 2], [P.pulso_comp, P.pulso_travessa[1] / 2], '7e', P.pulso_travessa[1], 8, { v: true });
  },
  palma(P, c, f) {
    const G = P.garra;
    c.cota([0, 0], [G.o, 0], 'o', G.o, -(G.rp * c.k) - 8, { h: true });
    c.cota([G.o, 0], [G.o, G.rp], 'rp', G.rp, (G.o * c.k) + 10, { v: true });
    c.furo([0, 0], G.Rpal, 'raio externo', G.Rpal, 225, true);
    f.cota([G.Rpal, -G.tp / 2], [G.Rpal, G.tp / 2], '2e', G.tp, 8, { v: true });
  },
  cubo(P, c, f) {
    const G = P.garra;
    c.cota([0, 0], [G.o, 0], 'o', G.o, -(G.rh * c.k) - 8, { h: true });
    c.cota([G.o, 0], [G.o, G.rh], 'rh', G.rh, (G.o * c.k) + 10, { v: true });
    c.cota([0, 0], [0, -G.yD5], 'eixo da seringa da garra', G.yD5, -(G.o * c.k) - 14, { v: true });
    f.cota([G.Rcub, -G.tc / 2], [G.Rcub, G.tc / 2], '2e', G.tc, 8, { v: true });
  },
  dedo(P, c) {
    const G = P.garra, a = G.gam * Math.PI / 180, t = [-Math.cos(a), -Math.sin(a)];
    c.cota([0, 0], [G.Lf, 0], 'Lf', G.Lf, -(G.bd / 2 * c.k + 8), { h: true });
    c.cota([0, 0], [t[0] * G.cauda, t[1] * G.cauda], 'cauda', G.cauda, -9);
    c.cota([t[0] * G.fi, t[1] * G.fi], [t[0] * G.ff, t[1] * G.ff], 'rasgo fi → ff', G.ff - G.fi, 9);
    c.angulo([0, 0], 180 + G.gam, 180, 16, 'gama', -G.gam);
  },
  eixo(P, c, f) {
    c.furo([0, 0], P.D0, '2 · D0', 2 * P.D0, 45);
    f.cota([P.D0 / 2, P.e / 2], [P.D0 / 2, P.e / 2 + 3 * P.e + P.f_desliza], '3e + f_desliza', 3 * P.e + P.f_desliza, 10, { v: true });
    f.cota([-P.D0 / 2, P.e], [P.D0 / 2, P.e], 'D0', P.D0, -6, { h: true });
  },
  click(P, c, f) {
    c.furo([0, 0], (P.D0 + P.f_click) / 2, 'D0 + f_click', P.D0 + P.f_click, 200);
    c.angulo([0, 0], -P.alpha / 2, P.alpha / 2, 12, 'alpha', P.alpha);
    f.cota([P.D0, 0], [P.D0, 1.5 * P.e], '1,5e', 1.5 * P.e, 8, { v: true });
  },
  trava_corpo_braco(P, c, f) { travaCotas(P, c, f, 'braco'); },
  trava_corpo_garra(P, c, f) { travaCotas(P, c, f, 'garra'); },
  trava_corpo_comando(P, c, f) { travaCotas(P, c, f, 'comando'); },
  trava_embolo(P, c) {
    const T = P.travas.braco;
    c.cota([-T.canal / 2, 0], [T.canal / 2, 0], 'LE + f_seringa', T.canal, -8, { h: true });
  },
};
function travaCotas(P, c, f, k) {
  const T = P.travas[k];
  c.furo([0, 0], T.anel / 2, 'D + f_seringa + e', T.anel, 40);
  c.furo([0, 0], T.bico / 2, 'db', T.bico, 200);
  f.cota([-T.anel / 2, 0], [-T.anel / 2, T.larg], 'D1', T.larg, -8, { v: true });
}

/* Gera as folhas de todas as peças. pecas = PECAS; w = kernel. */
export function folhasDasPecas(w, pecas, P, cabecalho = '') {
  const folhas = [];
  const total = pecas.length;
  pecas.forEach((peca, i) => {
    const g = novoGeo(w);
    let topo, frente;
    try {
      const m = peca.gerar(g, P);
      topo = projecao(m);
      frente = projecao(m.rotate([-90, 0, 0]));
    } finally { g.fim(g.t(w.Manifold.cube([0.01, 0.01, 0.01]))); }
    const bt = caixa(topo), bf = caixa(frente);
    const W = Math.max(bt.w, bf.w), H = bt.h + bf.h;
    const k = escalaPara(W, H, 215, 100);
    const xc = 15 + 225 / 2;
    const f = new Folha(peca.nome, `${peca.qtd(P)} peça(s) · ${P.material.nome} · espessura e = ${P.e} mm${cabecalho ? ' · ' + cabecalho : ''}`);
    const yTop = 172;
    const c = new Vista(f, topo, k, xc - (bt.x0 + bt.x1) / 2 * k, yTop - bt.y1 * k);
    const yF = yTop - bt.h * k - 20;
    const fr = new Vista(f, frente, k, xc - (bf.x0 + bf.x1) / 2 * k, yF - bf.y1 * k);
    f.texto(20, yTop + 2, 'Vista de cima', { tam: 2.8, cor: '#3A7BD5', negrito: true });
    f.texto(20, yF + 2, 'Vista de frente', { tam: 2.8, cor: '#3A7BD5', negrito: true });
    try { (COTAS[peca.id] || (() => {}))(P, c, fr); } catch (err) { f.texto(20, 30, 'Cotas indisponíveis: ' + err.message, { tam: 2.6, cor: '#B9471A' }); }
    moldura(f, k, i + 1, total);
    folhas.push({ id: peca.id, nome: peca.nome, folha: f, escala: k });
  });
  return folhas;
}

export { A4 };
