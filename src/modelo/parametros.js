/* Parâmetros do aplicativo, em três camadas:
   1. ENTRADAS: o que o usuário informa (seringas, bola, material, espessura, impressora).
   2. OTIMIZADOS: o que o otimizador define (comprimentos e pontos de fixação).
      Os valores padrão são os do modelo bucky v24 do Fusion.
   3. CONSTRUCAO: constantes de construção com valor padrão (aparecem em "Avançado").
   Os derivados (fórmulas fixas) ficam em derivados.js. */

/* Seringas: as 6 medidas que o usuário tira com paquímetro.
   cf e ca são medidos entre os planos onde ficam os pinos das travas:
   face do corpo onde começa o bico  ->  meio da aba do êmbolo. */
export const SERINGA_CAMPOS = [
  { k: 'D',  rotulo: 'Ø externo do corpo',        u: 'mm', min: 5,  max: 40,  passo: 0.1 },
  { k: 'db', rotulo: 'Ø da base do bico',          u: 'mm', min: 2,  max: 15,  passo: 0.1 },
  { k: 'LE', rotulo: 'Ø da aba do êmbolo',         u: 'mm', min: 6,  max: 40,  passo: 0.1 },
  { k: 'ee', rotulo: 'Espessura da aba do êmbolo', u: 'mm', min: 0.5, max: 6, passo: 0.1 },
  { k: 'cf', rotulo: 'Comprimento fechado (pino a pino)', u: 'mm', min: 20, max: 300, passo: 0.5 },
  { k: 'ca', rotulo: 'Comprimento aberto (pino a pino)',  u: 'mm', min: 20, max: 400, passo: 0.5 },
];

export const SERINGAS = {
  braco:   { nome: 'Seringa do braço (D10)', qtd: 3, uso: 'giro, ombro e cotovelo' },
  garra:   { nome: 'Seringa da garra (D5)',  qtd: 1, uso: 'abre e fecha a garra' },
  comando: { nome: 'Seringa de comando (D20)', qtd: 4, uso: 'no atuador, empurradas pelo polegar' },
};

export const ENTRADAS_PADRAO = {
  seringas: {
    // D, db e ee vêm do v24; LE = largura do canal do v24 menos f_seringa.
    // cf e ca: valores de trabalho do otimizador antigo. Medir e corrigir.
    braco:   { D: 16.2, db: 9.4, LE: 18.5, ee: 2, cf: 100, ca: 160 },
    garra:   { D: 13.2, db: 5.5, LE: 14.5, ee: 2.3, cf: 70,  ca: 110 },
    comando: { D: 20.7, db: 9.4, LE: 21,   ee: 2, cf: 105, ca: 175 },
  },
  bola: { massa: 58, diametro: 67 },              // g, mm (bola de tênis)
  material: { nome: 'PLA', densidade: 1.24, resistencia: 50 }, // g/cm³, MPa
  e: 3,                                           // espessura das placas, mm
  impressora: { x: 220, y: 220, z: 250 },         // mm
  nd: 4,                                          // número de dedos (2 a 4)
};

export const OTIMIZADOS_PADRAO = {
  L0: 80.2,  // altura do eixo 1 acima da mesa
  L1: 130,   // eixo 1 -> eixo 2
  L2: 150,   // eixo 2 -> ponta do trilho
  xA: 88.3,  // A: à frente do eixo 1
  yA: 50.2,  // A: abaixo do eixo 1
  d1: 89.9,  // eixo 1 -> B (no braço)
  d2: 103.2, // eixo 2 -> C (no braço)
  d3: 61.9,  // eixo 2 -> D (no antebraço)
  d4: 120,   // E -> ponta do trilho
  dg0: 83.5, // eixo de giro -> G0 (orelha da base)
  dg1: 83.5, // eixo de giro -> G1 (ombro)
};

export const CONSTRUCAO_PADRAO = {
  D0: 8,        // Ø do eixo
  D1: 8,        // Ø do pino das travas
  Dpino: 2.5,   // Ø do furo para o fio/arame dos pinos da mão
  alpha: 90,    // abertura do click em C, graus
  fe: 4,        // largura dos lábios do canal da trava-êmbolo
  r_filete: 2,  // raio dos cantos vivos pequenos
  inclinacao_comando: 60, // inclinação das seringas de comando sobre a base, graus
  n_comando: 4, // seringas de comando no atuador
  Fin: 40,      // força do polegar, N
  eta: 0.95,    // fração útil do curso
  FS: 1.5,      // fator de segurança de torque
};

/* Rótulos para a interface. */
export const ROTULOS = {
  L0: ['Altura do eixo 1', 'eixo do ombro acima da mesa'],
  L1: ['Braço', 'eixo 1 → eixo 2'],
  L2: ['Antebraço', 'eixo 2 → ponta do trilho'],
  xA: ['A, horizontal', 'à frente do eixo 1'],
  yA: ['A, vertical', 'abaixo do eixo 1'],
  d1: ['B', 'eixo 1 → B, no braço'],
  d2: ['C', 'eixo 2 → C, no braço'],
  d3: ['D', 'eixo 2 → D, no antebraço'],
  d4: ['E', 'E → ponta do trilho'],
  dg0: ['G0', 'eixo de giro → orelha da base'],
  dg1: ['G1', 'eixo de giro → ombro'],
  D0: ['Ø do eixo', ''], D1: ['Ø do pino das travas', ''], Dpino: ['Ø do pino da mão', 'furo para fio ou arame'],
  alpha: ['Abertura do click', ''], fe: ['Lábio da trava-êmbolo', ''], r_filete: ['Raio dos cantos', ''],
  inclinacao_comando: ['Inclinação das seringas de comando', ''], n_comando: ['Seringas de comando', ''],
  Fin: ['Força do polegar', ''], eta: ['Fração útil do curso', ''], FS: ['Fator de segurança', ''],
};

export function clonar(o) { return JSON.parse(JSON.stringify(o)); }

export function estadoPadrao() {
  return {
    entradas: clonar(ENTRADAS_PADRAO),
    otimizados: clonar(OTIMIZADOS_PADRAO),
    construcao: clonar(CONSTRUCAO_PADRAO),
  };
}
