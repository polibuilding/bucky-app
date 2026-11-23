import { base } from './base.js';
import { disco } from './disco.js';
import { corpo } from './corpo.js';
import { ombro } from './ombro.js';
import { braco } from './braco.js';
import { antebraco } from './antebraco.js';
import { pulso } from './pulso.js';
import { eixo, click, travaCorpoBraco, travaCorpoGarra, travaCorpoComando, travaEmbolo } from './ligacoes.js';
import { atuador } from './atuador.js';

/* Ordem de exibição. A mão (palma, cubo, dedos) entra na próxima etapa, junto com o otimizador da garra. */
export const PECAS = [base, disco, atuador, corpo, ombro, braco, antebraco, pulso,
  eixo, click, travaCorpoBraco, travaCorpoGarra, travaCorpoComando, travaEmbolo];

export function gerarPeca(novoGeo, w, peca, P) {
  const g = novoGeo(w);
  try { return g.fim(peca.gerar(g, P)); }
  catch (err) { g.fim(g.t(w.Manifold.cube([0.001, 0.001, 0.001]))); throw err; }
}
