/* Gera outputs/bucky-pecas-v24.zip com os parâmetros padrão (mesmo conteúdo do botão do site). */
import fs from 'node:fs';
import { carregarKernel, novoGeo } from '../src/geometria/kernel.js';
import { estadoPadrao } from '../src/modelo/parametros.js';
import { derivar, nomesFusion } from '../src/modelo/derivados.js';
import { FOLGAS_PADRAO } from '../src/modelo/folgas.js';
import { PECAS, gerarPeca } from '../src/pecas/index.js';
import { stlBinario } from '../src/exportar/stl.js';
import { criarZip } from '../src/exportar/zip.js';
import { folhasDasPecas, A4 } from '../src/desenhos/desenhar.js';
import { paraSVG } from '../src/desenhos/folha.js';
import { pdfDeFolhas } from '../src/exportar/pdf.js';
const w = await carregarKernel();
const estado = estadoPadrao(); estado.folgas = { ...FOLGAS_PADRAO };
const P = derivar(estado);
const arq = [], linhas = ['Bucky: braço hidráulico com seringas (exemplo = bucky v24)', '', 'Peças:'];
for (const p of PECAS) {
  const m = gerarPeca(novoGeo, w, p, P), q = p.qtd(P);
  arq.push({ nome: `pecas/${p.id}_x${q}.stl`, dados: stlBinario(m, p.id) });
  linhas.push(`  ${String(q).padStart(2)} × ${p.nome}`);
}
const fs_ = folhasDasPecas(w, PECAS, P, 'exemplo v24');
arq.push({ nome: 'desenhos/desenhos.pdf', dados: pdfDeFolhas(fs_.map(x => x.folha), A4) });
fs_.forEach((x, i) => arq.push({ nome: `desenhos/svg/${String(i + 1).padStart(2, '0')}-${x.id}.svg`, dados: paraSVG(x.folha) }));
const { seringas, meta, material, impressora, garra, travas, ...resto } = P;
arq.push({ nome: 'parametros.json', dados: JSON.stringify({ formato: 'bucky-app', versao: 2, estado, derivados: resto, fusion: nomesFusion(P) }, null, 2) });
arq.push({ nome: 'LEIAME.txt', dados: linhas.join('\r\n') });
const blob = await criarZip(arq);
fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync('outputs/bucky-pecas-v24.zip', Buffer.from(await blob.arrayBuffer()));
console.log('ok', blob.size, 'bytes');
