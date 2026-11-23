/* Base: disco Ø 2·rB com orelha em G0 (dg0) e faixa externa até rExt onde fica o atuador.
   Metade de baixo: furo Ø Rd + f_disco (passa a aba do disco).
   Metade de cima: ressalto Ø Rd_degrau + f_degrau (segura o disco por cima).
   O disco fica apoiado na mesa e preso pelo ressalto. */
import { arredondarConcavos } from '../geometria/kernel.js';
export const base = {
  id: 'base', nome: 'Base', qtd: () => 1, cor: '#5aa9e6',
  gerar(g, P) {
    const [a0, a1] = P.ang_atuador;
    let perfil = g.uniao([
      g.circulo(P.rB),
      g.ret(0, -P.se, P.dg0, P.se), g.circulo(P.se, [P.dg0, 0]),
      g.coroa(P.rB - 1, P.rExt, a0 - 10, a1 + 10),
    ]);
    perfil = arredondarConcavos(perfil, P.r_filete);
    const comuns = g.uniao([g.circulo(P.furo_pino / 2, [P.dg0, 0]), g.rasgoArco(P.rMid, 2 * P.e + P.f_pressao, a0, a1)]);
    const baixo = perfil.subtract(comuns).subtract(g.circulo((P.Rd + P.f_disco) / 2));
    const cima = perfil.subtract(comuns).subtract(g.circulo((P.Rd_degrau + P.f_degrau) / 2));
    return g.extrudar(baixo, P.hb / 2).add(g.extrudar(cima, P.hb / 2, P.hb / 2));
  },
};
