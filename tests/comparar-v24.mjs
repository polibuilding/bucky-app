/* Gera as peças com os parâmetros padrão (equivalentes ao bucky v24) e compara
   volume e caixa envolvente com os STL exportados do Fusion. */
import fs from 'node:fs';
import { carregarKernel, novoGeo } from '../src/geometria/kernel.js';
import { estadoPadrao } from '../src/modelo/parametros.js';
import { derivar } from '../src/modelo/derivados.js';
import { PECAS, gerarPeca } from '../src/pecas/index.js';
import { stlBinario } from '../src/exportar/stl.js';

const REF = {
  base: 'base__base', disco: 'disco__disco', corpo: 'corpo__Corpo2', ombro: 'ombro__lig-d3',
  braco: 'braco__braco', antebraco: 'antebraco__antebraco', pulso: 'pulso__pulso', eixo: 'eixo__eixo',
  click: 'click__cap', trava_corpo_braco: 'trava-corpo-D10__trava-corpo-D10', trava_corpo_garra: 'trava-corpo-d5__trava-corpo-d5',
  trava_corpo_comando: 'trava-corpo-d20__trava-corpo-d20', trava_embolo: 'trava-embolo-D10__trava-embolo', atuador: 'atuador__atuador',
};
function lerSTL(f) {
  const b = fs.readFileSync(f); const n = b.readUInt32LE(80); let vol = 0; const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12, v = [0, 1, 2].map(j => [0, 1, 2].map(k => b.readFloatLE(o + j * 12 + k * 4)));
    for (const p of v) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); }
    const [a, c, d] = v; vol += (a[0] * (c[1] * d[2] - c[2] * d[1]) - a[1] * (c[0] * d[2] - c[2] * d[0]) + a[2] * (c[0] * d[1] - c[1] * d[0])) / 6;
  }
  return { vol: Math.abs(vol), ext: mx.map((x, k) => x - mn[k]) };
}
const w = await carregarKernel();
const est = estadoPadrao();
const P = derivar(est);
fs.mkdirSync('outputs/teste-v24', { recursive: true });
const f1 = x => x.toFixed(1).padStart(8);
console.log('peça                     vol gerado  vol v24   dif%   ext gerada (ordenada)        ext v24 (ordenada)');
for (const p of PECAS) {
  const m = gerarPeca(novoGeo, w, p, P);
  fs.writeFileSync(`outputs/teste-v24/${p.id}.stl`, stlBinario(m, p.id));
  const ext = m.bbox[1].map((x, k) => x - m.bbox[0][k]).sort((a, b) => b - a);
  const r = REF[p.id] && lerSTL(`referencia/fusion-v24/stl/${REF[p.id]}.stl`);
  const re = r ? r.ext.slice().sort((a, b) => b - a) : null;
  console.log(p.id.padEnd(22), f1(m.volume), r ? f1(r.vol) : '     —  ', r ? (((m.volume / r.vol) - 1) * 100).toFixed(1).padStart(6) : '',
    '  ', ext.map(f1).join(''), '  ', re ? re.map(f1).join('') : '');
}
