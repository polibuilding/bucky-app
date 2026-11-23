/* Gera as folhas de desenho (SVG e PDF) com os parâmetros padrão. */
import fs from 'node:fs';
import { carregarKernel } from '../src/geometria/kernel.js';
import { estadoPadrao } from '../src/modelo/parametros.js';
import { derivar } from '../src/modelo/derivados.js';
import { PECAS } from '../src/pecas/index.js';
import { folhasDasPecas, A4 } from '../src/desenhos/desenhar.js';
import { paraSVG } from '../src/desenhos/folha.js';
import { pdfDeFolhas } from '../src/exportar/pdf.js';
const w = await carregarKernel();
const P = derivar(estadoPadrao());
const t0 = Date.now();
const fs_ = folhasDasPecas(w, PECAS, P);
const dir = process.argv[2] || 'outputs/teste-desenhos';
fs.mkdirSync(dir, { recursive: true });
fs_.forEach((x, i) => fs.writeFileSync(`${dir}/${String(i + 1).padStart(2, '0')}-${x.id}.svg`, paraSVG(x.folha)));
fs.writeFileSync(`${dir}/desenhos.pdf`, pdfDeFolhas(fs_.map(x => x.folha), A4));
console.log(fs_.length, 'folhas em', Date.now() - t0, 'ms');
