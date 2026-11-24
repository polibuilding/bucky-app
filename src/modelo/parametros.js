/* Parâmetros do aplicativo, em camadas:
   1. ENTRADAS: o que o usuário informa (seringas, meta, material, espessura, impressora, critério).
   2. OTIMIZADOS: dimensões do braço e variáveis da garra. O padrão é o bucky v24 do Fusion;
      o botão Otimizar substitui pelos valores ótimos para as entradas.
   3. CONSTRUCAO: constantes de construção (aparecem em "Avançado").
   Os derivados (fórmulas fixas) ficam em derivados.js. */

/* Seringas: medidas com paquímetro. cf e ca vão da face do corpo onde começa o bico
   até o meio da aba do êmbolo. */
export const SERINGA_CAMPOS = [
  { k: 'D',  rotulo: 'Ø externo do corpo',        u: 'mm', min: 5,  max: 40,  passo: 0.1 },
  { k: 'db', rotulo: 'Ø da base do bico',          u: 'mm', min: 2,  max: 15,  passo: 0.1 },
  { k: 'LE', rotulo: 'Ø da aba do êmbolo',         u: 'mm', min: 6,  max: 40,  passo: 0.1 },
  { k: 'ee', rotulo: 'Espessura da aba do êmbolo', u: 'mm', min: 0.5, max: 6, passo: 0.1 },
  { k: 'cf', rotulo: 'Comprimento fechado',        u: 'mm', min: 20, max: 300, passo: 0.5 },
  { k: 'ca', rotulo: 'Comprimento aberto',         u: 'mm', min: 20, max: 400, passo: 0.5 },
];

export const SERINGAS = {
  braco:   { nome: 'Seringas do braço',   curto: 'Braço',   qtd: 3, uso: 'Movem o giro, o ombro e o cotovelo.' },
  garra:   { nome: 'Seringa da garra',    curto: 'Garra',   qtd: 1, uso: 'Abre e fecha os dedos.' },
  comando: { nome: 'Seringas de comando', curto: 'Comando', qtd: 4, uso: 'Ficam no atuador; você empurra com o polegar.' },
};

export const ENTRADAS_PADRAO = {
  seringas: {
    // Medidas do bucky v24. cf/ca do braço: 100/160 pino a pino menos o desvio de 2 mm da trava-êmbolo.
    braco:   { D: 16.2, db: 9.4, LE: 18.5, ee: 2,   cf: 98,  ca: 158 },
    garra:   { D: 13.2, db: 5.5, LE: 14.5, ee: 2.3, cf: 70,  ca: 110 },
    comando: { D: 20.7, db: 9.4, LE: 21,   ee: 2,   cf: 105, ca: 175 },
  },
  meta: { massa: 58, diametro: 67 },              // g, mm (bola de tênis)
  material: { nome: 'PLA', densidade: 1.24, resistencia: 50 }, // g/cm³, MPa
  e: 3,                                           // espessura das placas, mm
  impressora: { x: 220, y: 220, z: 250 },         // mm
  criterio: 'area',
};

/* Dimensões do bucky v24 + variáveis da garra (ao, phig, cgl). */
export const OTIMIZADOS_PADRAO = {
  L0: 80.2, L1: 130, L2: 150, xA: 88.3, yA: 50.2,
  d1: 89.9, d2: 103.2, d3: 61.9, dg0: 83.5, dg1: 83.5,
  ao: 1, phig: 33, cgl: 18,
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
  etaf: 0.7,    // rendimento hidráulico
  eta: 0.95,    // fração útil do curso
  FS: 1.5,      // fator de segurança de torque
  m_garra: 60,  // massa da mão + seringa da garra, g
  m_seringa: 30, // massa de uma seringa cheia de água, g
  phimax_giro: 140, // abertura máxima da junta de giro, graus
  // garra
  ac: -12,      // ângulo dos dedos fechados (negativo = para dentro), graus
  aperto: 4,    // quanto o dedo ainda fecharia além do contato, graus
  ponta_dedo: 8, // dedo além do ponto de contato, mm
  folga_meta: 8, // meta à frente da palma, mm
  folga_abertura: 6, // ponta do dedo aberto além da meta, mm
  atrito: 0.4,  // coeficiente de atrito dedo-meta
};

/* Rótulos para a interface: [título, ajuda, unidade]. */
export const ROTULOS = {
  L0: ['Altura do eixo do ombro', 'acima da mesa', 'mm'], L1: ['Braço', 'eixo 1 → eixo 2', 'mm'], L2: ['Antebraço', 'eixo 2 → ponta do trilho', 'mm'],
  xA: ['A, horizontal', 'à frente do eixo 1', 'mm'], yA: ['A, vertical', 'abaixo do eixo 1', 'mm'],
  d1: ['B', 'eixo 1 → B, no braço', 'mm'], d2: ['C', 'eixo 2 → C, no braço', 'mm'], d3: ['D', 'eixo 2 → D, no antebraço', 'mm'],
  dg0: ['G0', 'eixo de giro → orelha da base', 'mm'], dg1: ['G1', 'eixo de giro → ombro', 'mm'],
  ao: ['Dedos abertos', 'ângulo com o eixo', '°'], phig: ['Rasgo do dedo, aberto', 'ângulo com o eixo', '°'], cgl: ['Curso usado na garra', '', 'mm'],
  D0: ['Ø do eixo', '', 'mm'], D1: ['Ø do pino das travas', '', 'mm'], Dpino: ['Ø do pino da mão', 'furo para fio ou arame', 'mm'],
  alpha: ['Abertura do click', '', '°'], fe: ['Lábio da trava-êmbolo', '', 'mm'], r_filete: ['Raio dos cantos', '', 'mm'],
  inclinacao_comando: ['Inclinação das seringas de comando', '', '°'], n_comando: ['Seringas de comando', '', ''],
  Fin: ['Força do polegar', '', 'N'], etaf: ['Rendimento hidráulico', '', ''], eta: ['Fração útil do curso', '', ''], FS: ['Fator de segurança', '', ''],
  m_garra: ['Massa da mão', 'com a seringa da garra', 'g'], m_seringa: ['Massa de uma seringa cheia', '', 'g'], phimax_giro: ['Abertura máxima do giro', '', '°'],
  ac: ['Dedos fechados', 'ângulo com o eixo', '°'], aperto: ['Aperto além do contato', '', '°'], ponta_dedo: ['Dedo além do contato', '', 'mm'],
  folga_meta: ['Meta à frente da palma', '', 'mm'], folga_abertura: ['Dedo aberto além da meta', '', 'mm'], atrito: ['Atrito dedo-meta', '', ''],
};

export function clonar(o) { return JSON.parse(JSON.stringify(o)); }

export function estadoPadrao() {
  return {
    entradas: clonar(ENTRADAS_PADRAO),
    otimizados: clonar(OTIMIZADOS_PADRAO),
    construcao: clonar(CONSTRUCAO_PADRAO),
    origem: 'v24',  // 'v24' (exemplo) ou 'otimizado'
    criterioUsado: '',
    assinatura: '',
    pareto: null,        // pontos da curva alcance × plástico (critério Pareto)
    paretoEscolhido: 0,
  };
}
