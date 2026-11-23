/* Atuador: arco apoiado na faixa externa da base (mesmos ângulos), com nervura que atravessa o rasgo em arco
   e n encaixes inclinados para as trava-corpo das seringas de comando. */
import { rad } from '../geometria/kernel.js';
export const atuador = {
  id: 'atuador', nome: 'Atuador', qtd: () => 1, cor: '#8a7cf0',
  gerar(g, P) {
    const [a0, a1] = P.ang_atuador, e = P.e;
    const placa = g.extrudar(g.coroa(P.rMid - e, P.rExt, a0 - 10, a1 + 10), e);
    const nervura = g.extrudar(g.rasgoArco(P.rMid, 2 * e, a0 + 0.5, a1 - 0.5), P.hb, -P.hb); // atravessa a base
    let m = placa.add(nervura);
    const n = P.n_comando, w = P.D1 + 2 * e, Lt = 5 * e, inc = P.inclinacao_comando;
    const u = [Math.cos(rad(inc)), Math.sin(rad(inc))], nn = [Math.sin(rad(inc)), -Math.cos(rad(inc))];
    const r0 = P.rMid - e;
    const p0 = [r0, e];
    const aba = g.poli([p0, [p0[0] + u[0] * Lt, p0[1] + u[1] * Lt],
      [p0[0] + u[0] * Lt + nn[0] * e, p0[1] + u[1] * Lt + nn[1] * e], [p0[0] + nn[0] * e, p0[1] + nn[1] * e]]);
    const c = [p0[0] + u[0] * Lt * 0.55 + nn[0] * e / 2, p0[1] + u[1] * Lt * 0.55 + nn[1] * e / 2];
    for (let i = 0; i < n; i++) {
      const th = P.ang_meio_atuador + (i - (n - 1) / 2) * P.passo_comando / P.rMid * 180 / Math.PI;
      let s = g.extrudar(aba, w).translate([0, 0, -w / 2]).rotate([90, 0, 0]); // perfil (x,z), largura em y
      s = s.intersect(g.caixa(r0 - 30, -w, 0, r0 + 40, w, 60));             // corta o que passa abaixo da placa
      const furo = g.cilindro(P.furo_pino / 2, 4 * e).translate([0, 0, -2 * e])
        .rotate([0, 180 - inc, 0]).translate([c[0], 0, c[1]]);
      m = m.add(s.subtract(furo).rotate([0, 0, th]));
    }
    return m;
  },
};
