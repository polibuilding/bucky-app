/* Ligações: eixo, click, travas de seringa. */
import { pol } from '../geometria/kernel.js';

/* Eixo: cabeça Ø 2·D0 × e/2 e haste Ø D0 que atravessa duas placas + o anel do click. */
export const eixo = {
  id: 'eixo', nome: 'Eixo', qtd: () => 2, cor: '#3d7cc9',
  gerar(g, P) {
    const haste = 3 * P.e + P.f_desliza;
    return g.cilindro(P.D0, P.e / 2).add(g.cilindro(P.D0 / 2, haste, [0, 0, P.e / 2]));
  },
};

/* Click: tampa Ø 2·D0 e anel em C (abertura alpha) que entra por pressão na haste. */
export const click = {
  id: 'click', nome: 'Click', qtd: () => 8, cor: '#3d7cc9',
  gerar(g, P) {
    const R = P.D0, a = P.alpha / 2;
    const cunha = g.poli([[0, 0], pol(3 * R, -a), pol(3 * R, 0), pol(3 * R, a)]);
    const anel = g.circulo(R).subtract(g.circulo((P.D0 + P.f_click) / 2)).subtract(cunha);
    return g.extrudar(g.circulo(R), P.e / 2).add(g.extrudar(anel, P.e, P.e / 2));
  },
};

/* Trava-corpo: anel deitado (eixo da seringa = z), assento do corpo na metade de cima,
   furo do bico, pino radial Ø D1 no plano do meio (= face do corpo da seringa). */
function travaCorpo(k, nome, qtd, cor) {
  return {
    id: 'trava_corpo_' + k, nome, qtd: () => qtd, cor, seringa: k,
    gerar(g, P) {
      const T = P.travas[k], R = T.anel / 2, h = T.larg;
      const anel = g.extrudar(g.circulo(R).subtract(g.circulo(T.bico / 2)), h / 2)
        .add(g.extrudar(g.circulo(R).subtract(g.circulo(T.assento / 2)), h / 2, h / 2));
      let pino = g.cilindro(P.D1 / 2, T.pino + 2.5).rotate([90, 0, 0]).translate([0, -(R - 2.5), h / 2]);
      if (T.afastador > 0.5) // colar que mantém a seringa afastada da placa
        pino = pino.add(g.cilindro(P.D1 / 2 + P.e / 2, T.afastador + 2.5).rotate([90, 0, 0]).translate([0, -(R - 2.5), h / 2]));
      return anel.add(pino);
    },
  };
}
export const travaCorpoBraco = travaCorpo('braco', 'Trava-corpo do braço', 3, '#8a7cf0');
export const travaCorpoGarra = travaCorpo('garra', 'Trava-corpo da garra', 1, '#8a7cf0');
export const travaCorpoComando = travaCorpo('comando', 'Trava-corpo de comando', 4, '#8a7cf0');

/* Trava-êmbolo: canal em C onde a aba do êmbolo entra pela frente (y = 0).
   A haste do êmbolo sai pela boca (lado +z, entre os lábios fe). O pino Ø D1 sai do fundo,
   ao longo de y, no plano da parede de trás do canal: fica a (fenda + parede)/2 além do
   meio da aba. Esse desvio entra no comprimento pino a pino (derivados.js). */
export const travaEmbolo = {
  id: 'trava_embolo', nome: 'Trava-êmbolo', qtd: () => 3, cor: '#5aa9e6', seringa: 'braco',
  gerar(g, P) {
    const T = P.travas.braco, p = P.e / 3, W = T.canal + 2 * p, H = T.fenda + 2 * p;
    const boca = Math.max(2, T.canal - 2 * P.fe), L = T.canal;
    const secao = g.ret(-W / 2, -H / 2, W / 2, H / 2)
      .subtract(g.ret(-T.canal / 2, -T.fenda / 2, T.canal / 2, T.fenda / 2))
      .subtract(g.ret(-boca / 2, T.fenda / 2 - 0.01, boca / 2, H / 2 + 1));
    // seção no plano (x, z): extruda em z e gira para que a extrusão vá para +y
    const canal = g.extrudar(secao, L).rotate([-90, 0, 0]).mirror([0, 0, 1]);
    const pz = -(T.fenda + p) / 2, r = P.D1 / 2;
    const nervura = g.caixa(-(r - 1.5), L / 2, pz - r, r - 1.5, L, -H / 2 + 0.01);
    const pino = g.cilindro(r, 2 * P.e).rotate([-90, 0, 0]).translate([0, L, pz]);
    return canal.add(nervura).add(pino).translate([0, 0, r - pz]);
  },
};
