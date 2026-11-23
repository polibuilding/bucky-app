/* Roda o otimizador com as entradas padrão e mostra o resultado. */
import { estadoPadrao } from '../src/modelo/parametros.js';
import { derivar } from '../src/modelo/derivados.js';
import { dimensionar, paraDimensoes } from '../src/modelo/cinematica.js';
import { otimizar, CRITERIOS } from '../src/modelo/otimizador.js';
const est = estadoPadrao();
const P = derivar(est);
const g = P.garra;
console.log('garra padrão (ao 1, phig 33, curso 18):', g.ok, { o: g.o, yD5: g.yD5, rp: g.rp, rh: g.rh, Lf: g.Lf, gam: g.gam, fi: g.fi, ff: g.ff, uo: g.uo, uc: g.uc, r_cauda: g.r_cauda, lim: g.r_cauda_min, FS: g.FS, abre: g.abre, folga_cubo: g.folga_cubo, Rpal: g.Rpal });
console.log(g.checks.map(c => c[0] + ': ' + c[1].toFixed(2)).join('\n'));
for (const crit of ['area', 'volume']) {
  const t0 = Date.now();
  const res = await otimizar(P, crit);
  if (res.erro) { console.log(crit, res.msg); continue; }
  const r = res.r;
  console.log(`\n== ${crit}: ${CRITERIOS[crit].mostrar(res.f)} em ${Date.now() - t0} ms, ${res.avaliacoes} avaliações`);
  console.log('x', JSON.stringify(res.x));
  console.log('dims', JSON.stringify(paraDimensoes(r)), 'd4', r.d4?.toFixed(1), 'FS', r.FS1.toFixed(2), r.FS2.toFixed(2), 'A', (r.m.A / 100).toFixed(0), 'cm2 V', (r.m.V / 1e6).toFixed(2), 'L');
  console.log('falhas', r.checks.filter(c => c[1] < 0).map(c => c[0]));
}
