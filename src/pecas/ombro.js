/* Ombro: plaquinha que atravessa o rasgo da aba do corpo e segura a trava-êmbolo
   da seringa de giro (G1). O lábio na ponta prende atrás da aba. */
export const ombro = {
  id: 'ombro', nome: 'Ombro', qtd: () => 1, cor: '#f2c14e',
  gerar(g, P) {
    const l = P.ombro_lado, H = P.ombro_alt, r = Math.min(P.e, l / 3);
    const placa = g.casco([g.circulo(r, [-l / 2 + r, r]), g.circulo(r, [l / 2 - r, r]), g.ret(-l / 2, r, l / 2, H)])
      .subtract(g.circulo(P.furo_ombro / 2, [0, l / 2]));
    const corpoPlaca = g.extrudar(placa, P.ombro_esp);
    const labio = g.extrudar(g.ret(-l / 2, H - P.ombro_labio, l / 2, H), 1.5 * P.e + P.ombro_esp / 2 - P.ombro_esp, P.ombro_esp);
    return corpoPlaca.add(labio);
  },
};
