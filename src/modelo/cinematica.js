/* Cinemática e dimensionamento do braço.
   Juntas acionadas por seringa (lei dos cossenos): ponto fixo a df do eixo, ponto móvel a dm,
   comprimento pino a pino s entre cf e cau. O ângulo no eixo entre os dois pontos é phi.
   - ombro: A (corpo) e B (braço); phi = theta1 − psi, psi = direção de A
   - cotovelo: C (braço, apontando para o eixo 1) e D (antebraço); theta2 = phi − 180
   - giro: G0 (base) e G1 (aba do corpo, atrás do braço); k = 1 */
import { calcGarra } from './garra.js';

const rad = a => a * Math.PI / 180, deg = r => r * 180 / Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const G = 9.81;

/* Comprimentos pino a pino. Nas juntas do braço o pino da trava-êmbolo fica
   (fenda + parede)/2 além do meio da aba do êmbolo. */
export function cursos(P) {
  const S = P.seringas, T = P.travas.braco;
  const desvio = (T.fenda + P.e / 3) / 2;
  const cf = S.braco.cf + desvio, ca = S.braco.ca + desvio;
  const cau = cf + P.eta * (ca - cf);
  return { desvio, cf, ca, cau, curso: cau - cf };
}

export function junta(cf, cau, k, phimax) {
  const df = cau / Math.sqrt(1 + k * k - 2 * k * Math.cos(rad(phimax)));
  const dm = k * df;
  const arg = (df * df + dm * dm - cf * cf) / (2 * df * dm);
  const valido = Math.abs(arg) < 1 && phimax > 0 && phimax < 180 && cf < cau && k > 0;
  const phimin = deg(Math.acos(clamp(arg, -1, 1)));
  const h1 = df * dm * Math.sin(rad(phimin)) / cf, h2 = df * dm * Math.sin(rad(phimax)) / cau;
  return { df, dm, phimin, phimax, dth: phimax - phimin, valido, hmin: Math.min(h1, h2) };
}

/* ângulo no eixo para uma seringa de comprimento s entre pontos a df e dm */
export function anguloJunta(df, dm, s) {
  return deg(Math.acos(clamp((df * df + dm * dm - s * s) / (2 * df * dm), -1, 1)));
}

/* Dimensiona tudo a partir das variáveis do otimizador.
   x = {phis, ks, th1, phic, kc, rho, phigiro, ao, phig, cgl} */
export function dimensionar(P, x) {
  const r = { x };
  const c = cursos(P);
  r.c = c;
  const Sb = P.seringas.braco, Dm = P.seringas.comando.D;
  r.Fat = P.Fin * Math.pow(Sb.D / Dm, 2) * P.etaf;              // força no êmbolo da seringa do braço, N
  r.s = junta(c.cf, c.cau, x.ks, x.phis);
  r.cJ = junta(c.cf, c.cau, x.kc, x.phic);
  r.g = junta(c.cf, c.cau, x.kgiro ?? 1, x.phigiro ?? P.phimax_giro);
  r.psi = x.th1 - r.s.phimin;
  r.th1 = [x.th1, x.th1 + r.s.dth];
  r.th2 = [r.cJ.phimin - 180, r.cJ.phimax - 180];
  r.garra = calcGarra(P, x);
  const gr = r.garra;
  // massas (kg) e comprimentos
  const se = P.se, e = P.e;
  const lam = P.material.densidade / 1000 * (2 * se * e) * 1.15 / 1000; // kg/mm (placa + olhais)
  const mP = (P.meta.massa + P.m_garra) / 1000, ms = P.m_seringa / 1000;
  const Mdisp1 = r.Fat * r.s.hmin, Mdisp2 = r.Fat * r.cJ.hmin;
  const ex = gr.ok ? (-gr.tp / 2 + gr.zb) : 40;                // ponta do trilho -> centro da meta
  const rho = x.rho;
  // torque necessário com o braço na horizontal, em função de L1 (L2 = rho·L1)
  const req1 = L1 => G * (mP * (L1 + rho * L1 + ex) + (lam * L1 + ms) * L1 / 2 + (lam * rho * L1 + ms) * (L1 + rho * L1 / 2)) * P.FS;
  const req2 = L2 => G * (mP * (L2 + ex) + (lam * L2 + ms) * L2 / 2) * P.FS;
  const raiz = (f, alvo) => { let a = 10, b = 600; if (f(a) > alvo) return 0; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (f(m) > alvo) b = m; else a = m; } return a; };
  r.L1t = raiz(req1, Mdisp1);
  r.L2t = raiz(req2, Mdisp2);
  const I = P.impressora, Lfab = Math.max(I.x, I.y) - 2 * se;
  r.L1 = Math.max(10, Math.floor(Math.min(r.L1t, r.L2t / rho, Lfab, Lfab / rho)));
  r.L2 = Math.round(rho * r.L1);
  r.d0 = r.s.df; r.d1 = r.s.dm; r.d2 = r.cJ.df; r.d3 = r.cJ.dm; r.dg = r.g.df; r.dg1 = r.g.dm;
  r.xA = r.d0 * Math.cos(rad(r.psi)); r.yA = -r.d0 * Math.sin(rad(r.psi));
  r.hA = P.hb + 2 * se + 4;
  r.L0 = r.yA + r.hA;
  r.FS1 = Mdisp1 / (req1(r.L1) / P.FS); r.FS2 = Mdisp2 / (req2(r.L2) / P.FS);
  // posição de E (seringa da garra): fechada, o cubo está o mais longe da palma
  if (gr.ok) {
    r.d4 = gr.tp / 2 + gr.uc + gr.pescoco + P.seringas.garra.cf;
    r.E = r.L2 - r.d4;
  }
  r.checks = verificar(P, r);
  r.ok = r.checks.every(c => c[1] >= 0);
  r.m = metricas(P, r);
  return r;
}

function verificar(P, r) {
  const se = P.se, e = P.e, D1 = P.D1, I = P.impressora, gr = r.garra;
  const out = [];
  out.push(['Juntas possíveis com estas seringas', r.s.valido && r.cJ.valido && r.g.valido ? 1 : -1]);
  out.push(['Ombro: B cabe no braço', r.L1 - r.d1 - se]);
  out.push(['Cotovelo: C cabe no braço', r.L1 - r.d2 - se]);
  out.push(['B e C não se sobrepõem', Math.abs(r.d1 - (r.L1 - r.d2)) - (D1 + 2 * e)]);
  out.push(['A à frente do eixo do ombro', r.xA - 2 * se]);
  out.push(['Torque no ombro (FS)', r.FS1 - P.FS]);
  out.push(['Torque no cotovelo (FS)', r.FS2 - P.FS]);
  out.push(['Garra atende às folgas', gr.ok ? 1 : -1]);
  if (gr.ok) {
    out.push(['D antes do trilho do cubo', (r.L2 - gr.tp / 2 - gr.uc - gr.tc / 2) - (r.d3 + se + e)]);
    out.push(['E longe do cotovelo', r.E - (se + gr.anelG / 2 + e)]);
    out.push(['E e D não se sobrepõem', Math.abs(r.E - r.d3) - (D1 + 2 * e)]);
  }
  const lado = Math.min(I.x, I.y);
  out.push(['Base cabe na impressora', lado - 2.4 * r.dg]);
  out.push(['Braço cabe na impressora', Math.max(I.x, I.y) - (r.L1 + 2 * se)]);
  out.push(['Antebraço cabe na impressora', Math.max(I.x, I.y) - (r.L2 + se)]);
  out.push(['Corpo cabe na impressora', Math.max(I.x, I.y) - ((r.dg1 ?? r.dg) + 20 + r.xA + se)]);
  // volume: cada seringa de comando precisa empurrar o curso inteiro da seringa que comanda
  const Sm = P.seringas.comando, cm = Sm.cf + P.eta * (Sm.ca - Sm.cf) - Sm.cf;
  const Ab = P.seringas.braco.D ** 2, Am = Sm.D ** 2;
  out.push(['Curso da seringa de comando basta', Am * cm - Ab * r.c.curso]);
  return out;
}

/* Área útil (plano vertical) e volume (com o giro), só onde a meta fica acima da mesa
   e à frente do corpo. */
export function metricas(P, r) {
  const n = 28, gr = r.garra;
  if (!gr.ok) return { A: 0, V: 0 };
  const L2p = r.L2 - gr.tp / 2 + gr.zb, Rb = P.meta.diametro / 2, xb = Rb + P.se;
  const [a1, b1] = r.th1, [a2, b2] = r.th2;
  const d1 = Math.abs(rad(b1 - a1)) / n, d2 = Math.abs(rad(b2 - a2)) / n;
  let A = 0, Vx = 0;
  for (let i = 0; i < n; i++) {
    const t1 = a1 + (b1 - a1) * (i + 0.5) / n, c1 = Math.cos(rad(t1)), s1 = Math.sin(rad(t1));
    for (let k = 0; k < n; k++) {
      const t2 = a2 + (b2 - a2) * (k + 0.5) / n, t12 = rad(t1 + t2);
      const x = r.L1 * c1 + L2p * Math.cos(t12), z = r.L0 + r.L1 * s1 + L2p * Math.sin(t12);
      if (z >= Rb && x >= xb) { const dA = Math.abs(r.L1 * L2p * Math.sin(rad(t2))) * d1 * d2; A += dA; Vx += x * dA; }
    }
  }
  return { A, V: Vx * Math.abs(rad(r.g.dth)), L2p };
}

/* Converte o resultado em dimensões para as peças (estado.otimizados). */
export function paraDimensoes(r) {
  const x = r.x, f1 = v => Math.round(v * 10) / 10;
  return {
    L0: f1(r.L0), L1: r.L1, L2: r.L2, xA: f1(r.xA), yA: f1(r.yA),
    d1: f1(r.d1), d2: f1(r.d2), d3: f1(r.d3), dg0: f1(r.dg), dg1: f1(r.dg1),
    ao: x.ao, phig: x.phig, cgl: x.cgl,
  };
}

/* Avalia as dimensões atuais (sem otimizar): ângulos, torque, área, volume e verificações. */
export function avaliar(P) {
  const c = cursos(P), Sb = P.seringas.braco, Dm = P.seringas.comando.D;
  const r = { x: { ao: P.ao, phig: P.phig, cgl: P.cgl }, c };
  r.Fat = P.Fin * Math.pow(Sb.D / Dm, 2) * P.etaf;
  const jd = (df, dm) => {
    const a = anguloJunta(df, dm, c.cf), b = anguloJunta(df, dm, c.cau);
    const h = (phi, s) => df * dm * Math.sin(rad(phi)) / s;
    const ok = Math.abs((df * df + dm * dm - c.cf * c.cf) / (2 * df * dm)) < 1 && Math.abs((df * df + dm * dm - c.cau * c.cau) / (2 * df * dm)) < 1;
    return { df, dm, phimin: a, phimax: b, dth: b - a, valido: ok, hmin: Math.min(h(a, c.cf), h(b, c.cau)) };
  };
  r.d0 = Math.hypot(P.xA, P.yA); r.d1 = P.d1; r.d2 = P.d2; r.d3 = P.d3; r.dg = P.dg0; r.dg1 = P.dg1;
  r.s = jd(r.d0, P.d1); r.cJ = jd(P.d2, P.d3); r.g = jd(P.dg0, P.dg1);
  r.psi = deg(Math.atan2(-P.yA, P.xA));
  r.th1 = [r.psi + r.s.phimin, r.psi + r.s.phimax];
  r.th2 = [r.cJ.phimin - 180, r.cJ.phimax - 180];
  r.garra = P.garra;
  r.L0 = P.L0; r.L1 = P.L1; r.L2 = P.L2; r.xA = P.xA; r.yA = P.yA;
  const se = P.se, e = P.e, gr = r.garra;
  const lam = P.material.densidade / 1000 * (2 * se * e) * 1.15 / 1000;
  const mP = (P.meta.massa + P.m_garra) / 1000, ms = P.m_seringa / 1000;
  const ex = gr.ok ? (-gr.tp / 2 + gr.zb) : 40;
  const req1 = G * (mP * (P.L1 + P.L2 + ex) + (lam * P.L1 + ms) * P.L1 / 2 + (lam * P.L2 + ms) * (P.L1 + P.L2 / 2));
  const req2 = G * (mP * (P.L2 + ex) + (lam * P.L2 + ms) * P.L2 / 2);
  r.FS1 = r.Fat * r.s.hmin / req1; r.FS2 = r.Fat * r.cJ.hmin / req2;
  if (gr.ok) { r.d4 = P.d4; r.E = P.L2 - P.d4; }
  r.checks = verificar(P, r);
  r.ok = r.checks.every(k => k[1] >= 0);
  r.m = metricas(P, r);
  return r;
}
