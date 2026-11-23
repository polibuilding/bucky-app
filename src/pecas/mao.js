/* Mão: palma, cubo e dedos (4). Referencial da mão: z = eixo do antebraço (para a ponta),
   antebraço no plano y = 0, pulso no plano x = 0, seringa da garra em y = −yD5.
   Dedo k: direção radial r_k e plano n_k·p = o (cata-vento), com n_k = r_k girado −90°. */
import { rad } from '../geometria/kernel.js';

export const DEDOS = [0, 1, 2, 3].map(k => {
  const a = rad(90 + 90 * k);
  const r = [Math.round(Math.cos(a)), Math.round(Math.sin(a))];
  return { k, r, n: [r[1], -r[0]] };
});

/* faixa (retângulo) no plano do dedo k: |n·p − o| ≤ w/2 e r·p ∈ [r0, r1] */
function faixaDedo(g, d, o, w, r0, r1) {
  const c = p => [d.n[0] * p[0] + d.r[0] * p[1], d.n[1] * p[0] + d.r[1] * p[1]];
  return g.poli([c([o - w / 2, r0]), c([o + w / 2, r0]), c([o + w / 2, r1]), c([o - w / 2, r1])]);
}
/* furo de fio atravessando a peça ao longo de n_k, no ponto (o, rr) do plano do dedo, na altura z */
function furoFio(g, d, o, rr, z, diam, comp) {
  const p = [d.n[0] * o + d.r[0] * rr, d.n[1] * o + d.r[1] * rr];
  const ang = Math.atan2(d.n[1], d.n[0]) * 180 / Math.PI;
  return g.cilindro(diam / 2, comp).translate([0, 0, -comp / 2]).rotate([90, 0, 0]).rotate([0, 0, ang + 90]).translate([p[0], p[1], z]);
}
/* braço em garfo da palma/cubo para o dedo k: banda em volta do plano do dedo, do centro até r1 */
function garfo(g, d, o, meia, r1) {
  const fim = [d.n[0] * o + d.r[0] * r1, d.n[1] * o + d.r[1] * r1];
  return g.uniao([faixaDedo(g, d, o, 2 * meia, -o, r1), g.circulo(meia, fim)]);
}
function cruz(g, P, f) {
  const a = (3 * P.e + f) / 2, b = (P.e + f) / 2;
  return g.uniao([g.ret(-a, -b, a, b), g.ret(-b, -a, b, a)]);
}

function exigeGarra(P) { if (!P.garra.ok) throw new Error('a garra não atende às folgas com estas entradas; clique em Otimizar'); }

export const palma = {
  id: 'palma', nome: 'Palma', qtd: () => 1, cor: '#4f8fd6',
  gerar(g, P) {
    exigeGarra(P);
    const G = P.garra, o = G.o, tf = G.tf, f = P.f_desliza;
    const r_in = G.rp - (G.tp / 2) * Math.tan(rad(G.phio)) - G.bd / (2 * Math.cos(rad(G.phio))) - f;
    const meia = (tf + f) / 2 + P.e, cubo0 = Math.hypot(1.5 * P.e, 0.5 * P.e) + P.e + 1;
    let s = g.uniao([g.circulo(Math.max(cubo0, o + meia)), ...DEDOS.map(d => garfo(g, d, o, meia, G.rp + P.Dpino / 2 + P.e))]);
    s = s.subtract(cruz(g, P, P.f_pressao));
    for (const d of DEDOS) s = s.subtract(faixaDedo(g, d, o, tf + f, r_in, G.Rpal + 5));
    let m = g.extrudar(s, G.tp, -G.tp / 2);
    for (const d of DEDOS) m = m.subtract(furoFio(g, d, o, G.rp, 0, P.Dpino + P.f_giro, 3 * G.Rpal));
    return m;
  },
};

export const cubo = {
  id: 'cubo', nome: 'Cubo', qtd: () => 1, cor: '#f2c14e',
  gerar(g, P) {
    exigeGarra(P);
    const G = P.garra, o = G.o, tf = G.tf, f = P.f_desliza, e = P.e, Sg = P.seringas.garra;
    const r_in = Math.min(G.r_cauda, G.rh - (G.tc / 2) * Math.tan(rad(G.phio)) - G.bd / (2 * Math.cos(rad(G.phio)))) - f;
    const meia = (tf + f) / 2 + e;
    let s = g.uniao([g.circulo(o + meia), ...DEDOS.map(d => garfo(g, d, o, meia, G.rh + P.Dpino / 2 + e))]);
    s = s.subtract(cruz(g, P, f));
    for (const d of DEDOS) s = s.subtract(faixaDedo(g, d, o, tf + f, r_in, G.Rcub + 5));
    let m = g.extrudar(s, G.tc, -G.tc / 2);
    for (const d of DEDOS) m = m.subtract(furoFio(g, d, o, G.rh, 0, P.Dpino + P.f_giro, 3 * G.Rcub));
    // pega da aba do êmbolo da seringa da garra, atrás do cubo (z = −pescoço), centrada em y = −yD5
    const zf = -G.pescoco, fenda = P.travas.garra.fenda, p = e / 3;
    const canal = Sg.LE + P.f_seringa, W = canal / 2 + p, yc = -G.yD5;
    const pescoco = g.caixa(G.pega_x[0], yc, zf, G.pega_x[1], -(1.5 * e + f), -G.tc / 2 + 0.01);
    const bloco = g.caixa(-W, yc - W, zf - fenda / 2 - p, W, yc + W, zf + fenda / 2 + p);
    const aba = g.caixa(-canal / 2, yc - W - 1, zf - fenda / 2, canal / 2, yc + canal / 2, zf + fenda / 2);
    const boca = Math.max(2, canal - 2 * P.fe);
    const haste = g.caixa(-boca / 2, yc - W - 1, zf - fenda / 2 - p - 1, boca / 2, yc, zf - fenda / 2 + 0.01);
    m = m.add(pescoco).add(bloco.subtract(aba).subtract(haste));
    return m;
  },
};

/* Dedo deitado no próprio plano: pivô na origem, dedo ao longo de +x, lado de dentro (para a meta) em +y.
   A cauda sai a 180° + gam e tem o rasgo onde corre o pino do cubo. */
export const dedo = {
  id: 'dedo', nome: 'Dedo', qtd: () => 4, cor: '#4f8fd6',
  perfil(g, P) {
    exigeGarra(P);
    const G = P.garra, bd = G.bd, gam = rad(G.gam);
    const t = [-Math.cos(gam), -Math.sin(gam)];
    const fim = [t[0] * G.cauda, t[1] * G.cauda];
    let s = g.uniao([g.faixa([0, 0], [G.Lf, 0], bd), g.faixa([0, 0], fim, bd),
      g.ret(G.Lf - 3 * P.e - 1, bd / 2 - 0.5, G.Lf + bd / 2 - 0.5, bd / 2 + 2)]); // ressalto de contato na ponta
    const w = P.Dpino + P.f_desliza;
    const a = G.fi - w / 2 - 0.5, b = G.ff + w / 2 + 0.5;
    s = s.subtract(g.faixa([t[0] * (a + w / 2), t[1] * (a + w / 2)], [t[0] * (b - w / 2), t[1] * (b - w / 2)], w))
      .subtract(g.circulo((P.Dpino + P.f_giro) / 2));
    return s;
  },
  gerar(g, P) { return g.extrudar(this.perfil(g, P), P.garra.tf); },
};
