/* Corpo (tronco): origem no eixo de giro, no fundo do pé.
   Pé Lb × hb que entra no disco; torre = casco do pé com o olhal do eixo 1 (altura L0);
   faixa até A (xA à frente, yA abaixo do eixo 1); aba de giro para trás, na altura yt,
   com o rasgo onde entra o ombro (G1). */
import { arredondarConcavos, arredondarConvexos } from '../geometria/kernel.js';
export const corpo = {
  id: 'corpo', nome: 'Corpo', qtd: () => 1, cor: '#7b6cf6',
  pontos(P) { return { E1: [0, P.L0], A: [P.xA, P.L0 - P.yA] }; },
  perfil(g, P) {
    const { E1, A } = this.pontos(P);
    const pe = g.ret(-P.Lb / 2, 0, P.Lb / 2, P.hb);
    const torre = g.casco([pe, g.circulo(P.se, E1)]);
    let aba = g.ret(-P.aba_fim, P.yt - P.aba_alt / 2, 0, P.yt + P.aba_alt / 2);
    aba = arredondarConvexos(aba, Math.min(P.r_filete, P.aba_alt / 2 - 0.01));
    let s = arredondarConcavos(g.uniao([pe, torre, aba]), 1.5 * P.se);
    s = arredondarConcavos(g.uniao([s, g.faixa(E1, A, 2 * P.se)]), P.se / 2);
    const [lr, wr] = P.rasgo_ombro;
    return s.subtract(g.uniao([
      g.circulo(P.furo_eixo / 2, E1), g.circulo(P.furo_pino / 2, A),
      g.ret(-P.xs_ombro - lr / 2, P.yt - wr / 2, -P.xs_ombro + lr / 2, P.yt + wr / 2),
    ]));
  },
  gerar(g, P) { return g.extrudar(this.perfil(g, P), P.e); },
};
