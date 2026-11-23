/* Pulso: T que encaixa em cruz no garfo do antebraço. O rasgo sai da raiz;
   a travessa fica na ponta do trilho. */
export const pulso = {
  id: 'pulso', nome: 'Pulso', qtd: () => 1, cor: '#c9b48c',
  perfil(g, P) {
    const L = P.pulso_comp, t = P.trilho / 2, [et, ht] = P.pulso_travessa;
    return g.uniao([g.ret(0, -t, L, t), g.ret(L - et, -ht / 2, L, ht / 2)])
      .subtract(g.ret(-1, -P.rasgo_fixo / 2, P.pulso_rasgo, P.rasgo_fixo / 2));
  },
  gerar(g, P) { return g.extrudar(this.perfil(g, P), P.e); },
};
