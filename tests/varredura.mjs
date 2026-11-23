/* Varre combinações de parâmetros e confere se todas as peças saem sólidas e coerentes. */
import { carregarKernel, novoGeo } from '../src/geometria/kernel.js';
import { estadoPadrao } from '../src/modelo/parametros.js';
import { derivar } from '../src/modelo/derivados.js';
import { PECAS, gerarPeca } from '../src/pecas/index.js';
const w = await carregarKernel();
const casos = [];
for (const e of [2.4, 3, 4]) for (const xA of [60, 88.3, 115]) for (const L of [[100, 110], [130, 150], [180, 200]])
  for (const dg0 of [70, 83.5, 105]) for (const D of [14, 16.2, 19]) casos.push({ e, xA, L, dg0, D });
let falhas = 0, n = 0; const t0 = Date.now();
for (const c of casos) {
  const s = estadoPadrao();
  s.entradas.e = c.e; s.otimizados.xA = c.xA; s.otimizados.L1 = c.L[0]; s.otimizados.L2 = c.L[1];
  s.otimizados.d1 = 0.69 * c.L[0]; s.otimizados.d2 = 0.79 * c.L[0]; s.otimizados.d3 = 0.41 * c.L[1]; s.otimizados.d4 = 0.8 * c.L[1];
  s.otimizados.dg0 = c.dg0; s.otimizados.dg1 = c.dg0; s.entradas.seringas.braco.D = c.D;
  const P = derivar(s);
  for (const p of PECAS) {
    n++;
    try {
      const m = gerarPeca(novoGeo, w, p, P);
      const ok = m.volume > 1 && m.tri.length > 30;
      if (!ok) { falhas++; console.log('VAZIA', p.id, JSON.stringify(c)); }
    } catch (err) { falhas++; console.log('ERRO', p.id, JSON.stringify(c), err.message); }
  }
}
console.log(`${n} peças geradas em ${casos.length} combinações, ${falhas} falhas, ${((Date.now() - t0) / n).toFixed(1)} ms por peça`);
