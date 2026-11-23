/* Braço: barra L1 entre o eixo 1 (x = 0) e o eixo 2 (x = L1).
   B a d1 do eixo 1; C a d2 do eixo 2. */
export const braco = {
  id: 'braco', nome: 'Braço', qtd: () => 1, cor: '#4f8fd6',
  pontos(P) { return { E1: [0, 0], E2: [P.L1, 0], B: [P.d1, 0], C: [P.L1 - P.d2, 0] }; },
  perfil(g, P) {
    const p = this.pontos(P);
    return g.faixa(p.E1, p.E2, 2 * P.se).subtract(g.uniao([
      g.circulo(P.furo_eixo / 2, p.E1), g.circulo(P.furo_eixo / 2, p.E2),
      g.circulo(P.furo_pino / 2, p.B), g.circulo(P.furo_pino / 2, p.C),
    ]));
  },
  gerar(g, P) { return g.extrudar(this.perfil(g, P), P.e); },
};
