/* Derivados: transforma entradas + otimizados + construção + folgas em todas as
   medidas que as peças usam. As fórmulas reproduzem o modelo bucky v24 do Fusion,
   trocando a folga multiplicativa (tol) pelas folgas fixas de folgas.js. */
import { FOLGAS_PADRAO } from './folgas.js';
import { calcGarra } from './garra.js';

export function derivar(estado) {
  const E = estado.entradas, O = estado.otimizados, C = estado.construcao;
  const F = { ...FOLGAS_PADRAO, ...(estado.folgas || {}) };
  const e = E.e, S = E.seringas;
  const P = { ...O, ...C, ...F, e, nd: 4 };

  // ---- espessuras e larguras gerais
  P.hb = 2 * e;                       // base e disco
  P.se = C.D0 / 2 + 2 * e;            // meia-largura dos elos (olhal Ø 2·se)
  P.furo_eixo = C.D0 + F.f_giro;      // furos dos eixos 1 e 2
  P.furo_pino = C.D1 + F.f_giro;      // furos dos pinos das travas
  P.furo_ombro = C.D1 + F.f_seringa;  // pino da trava-êmbolo no ombro (mais solto, de propósito)
  P.rasgo_fixo = e + F.f_pressao;     // rasgos de encaixe fixo para placa de espessura e

  // ---- giro: disco e base
  P.Lb = O.xA;                                  // pé do corpo (= rasgo do disco)
  P.Rd = 1.2 * P.Lb;                            // Ø do disco
  P.Rd_degrau = P.Rd - 3 * e;                   // Ø do degrau do disco (metade de cima)
  P.rB = Math.max(P.Rd / 2 + 2 * P.se, O.dg0 - P.se) + e / 2; // raio do disco da base
  P.rExt = 1.2 * O.dg0;                         // raio externo da faixa do atuador
  P.rMid = (P.rB + P.rExt) / 2;                 // raio do rasgo/nervura do atuador
  P.Rb = 2 * P.rB;                              // nome do Fusion (diâmetro)

  // ---- atuador (seringas de comando)
  const Dc = S.comando;
  P.anel_comando = Dc.D + F.f_seringa + e;       // Ø externo da trava-corpo D20
  P.passo_comando = P.anel_comando + 2.4;        // distância entre encaixes, ao longo do arco
  P.ang_meio_atuador = 135;                      // centro do arco do atuador (graus)
  const nC = C.n_comando;
  const meio = (((nC - 1) / 2) * P.passo_comando + P.anel_comando / 2 + 1.3) / P.rMid * 180 / Math.PI;
  P.ang_atuador = [P.ang_meio_atuador - meio, P.ang_meio_atuador + meio]; // v24: 100° a 170°

  // ---- corpo
  P.yt = P.hb + S.braco.LE + F.f_seringa + 2 * e;  // altura da aba de giro (v24: hb + LE10 + 2e)
  P.aba_alt = e + P.rasgo_fixo;                     // altura da aba
  P.ombro_lado = C.D1 + 2 * e;                      // largura da plaquinha do ombro
  P.rasgo_ombro = [P.ombro_lado + 2 * F.f_desliza, P.rasgo_fixo]; // rasgo na aba (comprimento, largura)
  P.xs_ombro = O.dg1 + (C.D1 + e) / 2;              // centro do rasgo, a partir do eixo de giro
  P.aba_fim = P.xs_ombro + P.rasgo_ombro[0] / 2 + e;

  // ---- ombro (peça)
  P.ombro_esp = e - F.f_desliza;                    // entra no rasgo da aba
  P.ombro_pescoco = e + 1.25;
  P.ombro_labio = e / 2;
  P.ombro_alt = P.ombro_lado + P.ombro_pescoco + P.ombro_labio;

  // ---- garra (4 dedos em planos deslocados; ver garra.js)
  P.seringas = S; P.meta = E.meta; P.impressora = E.impressora; P.material = E.material;
  P.travas = {};
  P.travas.braco = { fenda: Math.max(1.5 * S.braco.ee, S.braco.ee + F.f_seringa) };
  const g = calcGarra(P, { ao: O.ao, phig: O.phig, cgl: O.cgl });
  P.garra = g;
  P.tp = g.tp; P.tc = g.tc;
  P.d4 = g.ok ? g.tp / 2 + g.uc + g.pescoco + S.garra.cf : 120;

  // ---- antebraço e pulso. A palma fica entre o ressalto do antebraço e a travessa do pulso.
  P.trilho = 3 * e;                                 // largura do trilho
  P.garfo = (O.L2 - O.d3) / 2;                      // rasgo do garfo (v24: 4,405 cm fixo)
  P.pulso_rasgo = (O.L2 - O.d3) - C.D1 - 2 * e - P.garfo;
  P.pulso_comp = P.pulso_rasgo + P.garfo + e / 2;   // a travessa fica logo depois da ponta do antebraço
  P.pulso_travessa = [e / 2, 7 * e];                // espessura, altura
  const assento = P.tp + F.f_desliza;               // vão da palma
  P.gancho = { de: O.L2 - assento - e, ate: O.L2 - assento, alt: 2 * e / 3 };
  P.z_palma = O.L2 - assento / 2;                   // meio da palma, a partir do eixo 2

  // ---- seringa da garra: afastada do antebraço para a aba do êmbolo passar fora dos dedos
  const anelG = S.garra.D + F.f_seringa + e;
  P.afastador_garra = Math.max(0, g.yD5 - e / 2 - anelG / 2);

  // ---- travas de seringa
  for (const k of ['braco', 'garra', 'comando']) {
    const s = S[k];
    P.travas[k] = {
      anel: s.D + F.f_seringa + e,        // Ø externo do anel
      assento: s.D + F.f_seringa,         // Ø do assento do corpo da seringa
      bico: s.db,                         // furo do bico
      larg: C.D1,                         // espessura do anel
      pino: 2 * e + (k === 'garra' ? P.afastador_garra : 0), // comprimento do pino
      afastador: k === 'garra' ? P.afastador_garra : 0,
      canal: s.LE + F.f_seringa,          // largura do canal da aba do êmbolo
      fenda: Math.max(1.5 * s.ee, s.ee + F.f_seringa), // altura da fenda da aba
    };
  }

  // ---- curso das seringas
  for (const k of ['braco', 'garra', 'comando']) {
    const s = S[k];
    P['cau_' + k] = s.cf + C.eta * (s.ca - s.cf);
    P['curso_' + k] = P['cau_' + k] - s.cf;
  }

  return P;
}

/* Parâmetros com os nomes do Fusion (para conferir com o bucky v24 e exportar). */
export function nomesFusion(P) {
  const S = P.seringas;
  return {
    L0: P.L0, L1: P.L1, L2: P.L2, d1: P.d1, d2: P.d2, d3: P.d3, d4: P.d4,
    xA: P.xA, yA: P.yA, dg0: P.dg0, dg1: P.dg1,
    D20: S.comando.D, D10: S.braco.D, D5: S.garra.D,
    db20: S.comando.db, db10: S.braco.db, db5: S.garra.db,
    LE20: S.comando.LE, LE10: S.braco.LE, LE5: S.garra.LE, ee10: S.braco.ee,
    e: P.e, hb: P.hb, se: P.se, D0: P.D0, D1: P.D1, alpha: P.alpha, Dpino: P.Dpino,
    Lb: P.Lb, Rd: P.Rd, Rb: P.Rb, fe10: P.fe, nd: P.nd,
    rp: 2 * P.garra.rp, alfa: P.garra.gam, Ld: P.garra.Lf,
  };
}
