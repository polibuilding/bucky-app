import { base } from './base.js';
import { disco } from './disco.js';
import { corpo } from './corpo.js';
import { ombro } from './ombro.js';
import { braco } from './braco.js';
import { antebraco } from './antebraco.js';
import { pulso } from './pulso.js';
import { eixo, click, travaCorpoBraco, travaCorpoGarra, travaCorpoComando, travaEmbolo } from './ligacoes.js';
import { atuador } from './atuador.js';
import { palma, cubo, dedo } from './mao.js';

/* Ordem de exibição. */
export const PECAS = [base, disco, atuador, corpo, ombro, braco, antebraco, pulso, palma, cubo, dedo,
  eixo, click, travaCorpoBraco, travaCorpoGarra, travaCorpoComando, travaEmbolo];

export function gerarPeca(novoGeo, w, peca, P) {
  const g = novoGeo(w);
  try { return g.fim(peca.gerar(g, P)); }
  catch (err) { g.fim(g.t(w.Manifold.cube([0.001, 0.001, 0.001]))); throw err; }
}

/* Cores alternadas, amarelo e azul. */
const CORES = ['#F2B705', '#3A7BD5'];
PECAS.forEach((p, i) => { p.cor = CORES[i % 2]; });
