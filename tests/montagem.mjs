/* Confere a montagem: comprimento das seringas desenhadas = comprimento pedido pela pose. */
import { estadoPadrao } from '../src/modelo/parametros.js';
import { derivar } from '../src/modelo/derivados.js';
import { montar } from '../src/montagem/montagem.js';
const P = derivar(estadoPadrao());
for (const tt of [0, 0.5, 1]) {
  const t = { giro: tt, ombro: tt, cotovelo: tt, garra: tt };
  const M = montar(P, t);
  const linhas = M.seringas.map(s => {
    const dPlano = Math.hypot(s.a[0] - s.b[0], s.a[2] - s.b[2]), d3 = Math.hypot(s.a[0] - s.b[0], s.a[1] - s.b[1], s.a[2] - s.b[2]);
    return `${s.nome}: pedido ${s.s.toFixed(1)}  3D ${d3.toFixed(1)}  (dy ${(s.a[1] - s.b[1]).toFixed(1)})`;
  });
  console.log(`t=${tt} th1=${M.pose.th1.toFixed(1)} th2=${M.pose.th2.toFixed(1)} giro=${M.pose.thg.toFixed(1)} dedos=${M.pose.alfa.toFixed(1)}\n  ` + linhas.join('\n  '));
}
