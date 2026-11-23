/* Disco: gira dentro da base. Metade de baixo Ø Rd, metade de cima Ø Rd − 3e (degrau).
   Rasgo central onde entra o pé do corpo (comprimento Lb). */
export const disco = {
  id: 'disco', nome: 'Disco', qtd: () => 1, cor: '#e05a4f',
  gerar(g, P) {
    const rasgo = g.ret(-P.rasgo_fixo / 2, -(P.Lb + P.f_pressao) / 2, P.rasgo_fixo / 2, (P.Lb + P.f_pressao) / 2);
    const baixo = g.circulo(P.Rd / 2).subtract(rasgo);
    const cima = g.circulo(P.Rd_degrau / 2).subtract(rasgo);
    return g.extrudar(baixo, P.hb / 2).add(g.extrudar(cima, P.hb / 2, P.hb / 2));
  },
};
