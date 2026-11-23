/* Varre combinações de entradas, otimiza cada uma e confere se todas as peças saem sólidas. */
import { carregarKernel, novoGeo } from '../src/geometria/kernel.js';
import { estadoPadrao } from '../src/modelo/parametros.js';
import { derivar } from '../src/modelo/derivados.js';
import { paraDimensoes } from '../src/modelo/cinematica.js';
import { otimizar } from '../src/modelo/otimizador.js';
import { PECAS, gerarPeca } from '../src/pecas/index.js';
const w = await carregarKernel();
const casos = [];
for (const e of [2.4, 3, 4]) for (const meta of [[30, 50], [58, 67], [120, 90]]) for (const Db of [[14, 90, 140], [16.2, 98, 158], [19, 110, 185]])
  for (const crit of ['area', 'volume']) casos.push({ e, meta, Db, crit });
let falhas = 0, n = 0, semSol = 0; const t0 = Date.now();
for (const c of casos) {
  const s = estadoPadrao();
  s.entradas.e = c.e; s.entradas.meta.massa = c.meta[0]; s.entradas.meta.diametro = c.meta[1];
  Object.assign(s.entradas.seringas.braco, { D: c.Db[0], cf: c.Db[1], ca: c.Db[2] });
  s.entradas.criterio = c.crit;
  const res = await otimizar(derivar(s), c.crit);
  if (res.erro) { semSol++; console.log('sem solução', JSON.stringify(c), res.msg); continue; }
  Object.assign(s.otimizados, paraDimensoes(res.r));
  const P = derivar(s);
  for (const p of PECAS) {
    n++;
    try { const m = gerarPeca(novoGeo, w, p, P); if (!(m.volume > 1)) { falhas++; console.log('VAZIA', p.id, JSON.stringify(c)); } }
    catch (err) { falhas++; console.log('ERRO', p.id, JSON.stringify(c), err.message); }
  }
}
console.log(`${casos.length} combinações otimizadas (${semSol} sem solução), ${n} peças geradas, ${falhas} falhas, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
