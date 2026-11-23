/* Antebraço: eixo 2 em x = 0. E a L2 − d4, D a d3. Depois de D vira o trilho (3e)
   com o garfo (rasgo de (L2 − d3)/2 a partir da ponta) e dois ganchos que seguram a palma. */
import { arredondarConcavos } from '../geometria/kernel.js';
export const antebraco = {
  id: 'antebraco', nome: 'Antebraço', qtd: () => 1, cor: '#d9c7a3',
  pontos(P) { return { E2: [0, 0], E: [P.L2 - P.d4, 0], D: [P.d3, 0], ponta: [P.L2, 0] }; },
  perfil(g, P) {
    const p = this.pontos(P), t = P.trilho / 2;
    let s = g.uniao([g.faixa(p.E2, p.D, 2 * P.se), g.ret(p.D[0], -t, P.L2, t)]);
    s = arredondarConcavos(s, P.e);
    return s.subtract(g.uniao([
      g.circulo(P.furo_eixo / 2, p.E2), g.circulo(P.furo_pino / 2, p.E), g.circulo(P.furo_pino / 2, p.D),
      g.ret(P.L2 - P.garfo, -P.rasgo_fixo / 2, P.L2 + 1, P.rasgo_fixo / 2),
    ]));
  },
  gerar(g, P) {
    const t = P.trilho / 2, w = P.rasgo_fixo / 2, k = P.gancho;
    const ganchos = g.uniao([g.ret(k.de, w, k.ate, t), g.ret(k.de, -t, k.ate, -w)]);
    return g.extrudar(this.perfil(g, P), P.e).add(g.extrudar(ganchos, k.alt, P.e));
  },
};
