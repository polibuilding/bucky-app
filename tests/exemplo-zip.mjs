/* Gera outputs/bucky-pecas-v24.zip com os parâmetros padrão (mesmo conteúdo do botão do site). */
import fs from 'node:fs';
import { carregarKernel, novoGeo } from '../src/geometria/kernel.js';
import { estadoPadrao } from '../src/modelo/parametros.js';
import { derivar, nomesFusion } from '../src/modelo/derivados.js';
import { FOLGAS_PADRAO } from '../src/modelo/folgas.js';
import { PECAS, gerarPeca } from '../src/pecas/index.js';
import { stlBinario } from '../src/exportar/stl.js';
import { criarZip } from '../src/exportar/zip.js';
const w = await carregarKernel();
const estado = estadoPadrao(); estado.folgas = { ...FOLGAS_PADRAO };
const P = derivar(estado);
const arq = [], linhas = ['Bucky: braço hidráulico por seringas (parâmetros padrão = bucky v24)', '', 'Peças:'];
for (const p of PECAS) {
  const m = gerarPeca(novoGeo, w, p, P), q = p.qtd(P);
  arq.push({ nome: `pecas/${p.id}_x${q}.stl`, dados: stlBinario(m, p.id) });
  linhas.push(`  ${String(q).padStart(2)} × ${p.nome}`);
}
const { seringas, bola, material, impressora, ...resto } = P;
arq.push({ nome: 'parametros.json', dados: JSON.stringify({ formato: 'bucky-app', versao: 1, estado, derivados: resto, fusion: nomesFusion(P) }, null, 2) });
arq.push({ nome: 'LEIAME.txt', dados: linhas.join('\r\n') });
const blob = await criarZip(arq);
fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync('outputs/bucky-pecas-v24.zip', Buffer.from(await blob.arrayBuffer()));
console.log('ok', blob.size, 'bytes');
