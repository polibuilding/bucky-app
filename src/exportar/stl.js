/* STL binário a partir da malha {pos, tri} gerada pelo kernel. */
export function stlBinario(m, nome = 'peca') {
  const nt = m.tri.length / 3, buf = new ArrayBuffer(84 + nt * 50), dv = new DataView(buf);
  const cab = ('bucky ' + nome).slice(0, 79);
  for (let i = 0; i < cab.length; i++) dv.setUint8(i, cab.charCodeAt(i) & 0x7f);
  dv.setUint32(80, nt, true);
  const P = m.pos, T = m.tri;
  for (let t = 0; t < nt; t++) {
    const o = 84 + t * 50, a = T[3 * t] * 3, b = T[3 * t + 1] * 3, c = T[3 * t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true);
    for (const [j, i] of [[0, a], [1, b], [2, c]]) for (let k = 0; k < 3; k++) dv.setFloat32(o + 12 + j * 12 + k * 4, P[i + k], true);
  }
  return new Uint8Array(buf);
}
