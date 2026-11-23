/* Núcleo geométrico: manifold-3d (WebAssembly).
   No navegador, o import map do index.html aponta 'manifold-3d' para o CDN;
   no Node (testes), resolve para node_modules. */
import Module from 'manifold-3d';

let _wasm = null;
export async function carregarKernel() {
  if (_wasm) return _wasm;
  const w = await Module();
  w.setup();
  w.setCircularSegments(64);
  _wasm = w;
  return w;
}

/* Contexto de construção de uma peça. Todo objeto criado aqui é registrado e
   liberado em fim(), porque o WebAssembly não tem coletor de lixo. */
export class Geo {
  constructor(w) {
    this.w = w; this.C = w.CrossSection; this.M = w.Manifold; this.vivos = [];
  }
  t(o) { if (o && !o.__g) { o.__g = this; this.vivos.push(o); } return o; }
  // ---- 2D
  circulo(r, c = [0, 0], seg = 0) { return this.t(this.C.circle(r, seg || segPara(r))).translate(c); }
  ret(x0, y0, x1, y1) {
    const a = Math.min(x0, x1), b = Math.min(y0, y1);
    return this.t(this.C.square([Math.abs(x1 - x0), Math.abs(y1 - y0)])).translate([a, b]);
  }
  poli(pts) {
    let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return this.t(new this.C([a < 0 ? pts.slice().reverse() : pts], 'Positive'));
  }
  uniao(lista) { return this.t(this.C.union(lista)); }
  casco(lista) { return this.t(this.C.hull(lista)); }
  /* faixa de largura w entre dois pontos, pontas redondas */
  faixa(p, q, w) { return this.casco([this.circulo(w / 2, p), this.circulo(w / 2, q)]); }
  /* setor de coroa circular entre raios r0..r1 e ângulos a0..a1 (graus) */
  coroa(r0, r1, a0, a1, c = [0, 0]) {
    const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 2));
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = rad(a0 + (a1 - a0) * i / n); pts.push([c[0] + r1 * Math.cos(a), c[1] + r1 * Math.sin(a)]); }
    for (let i = n; i >= 0; i--) { const a = rad(a0 + (a1 - a0) * i / n); pts.push([c[0] + r0 * Math.cos(a), c[1] + r0 * Math.sin(a)]); }
    return this.poli(pts);
  }
  /* rasgo em arco (pontas retas), centrado no raio rm, largura w */
  rasgoArco(rm, w, a0, a1, c = [0, 0]) { return this.coroa(rm - w / 2, rm + w / 2, a0, a1, c); }
  // ---- 3D
  extrudar(cs, h, z0 = 0) { return this.t(cs.extrude(h)).translate([0, 0, z0]); }
  revolver(cs) { return this.t(cs.revolve(segPara(20), 360)); }
  cilindro(r, h, c = [0, 0, 0]) { return this.t(this.M.cylinder(h, r, r, segPara(r))).translate(c); }
  caixa(x0, y0, z0, x1, y1, z1) { return this.t(this.M.cube([x1 - x0, y1 - y0, z1 - z0])).translate([x0, y0, z0]); }
  uniao3(lista) { return this.t(this.M.union(lista)); }
  /* converte em malha JS e libera tudo */
  fim(m) {
    const mesh = m.getMesh();
    const out = {
      pos: Float32Array.from(mesh.vertProperties.filter((_, i) => i % mesh.numProp < 3)),
      tri: Uint32Array.from(mesh.triVerts),
      volume: m.volume(),
      bbox: bboxDe(m),
    };
    for (const o of this.vivos) { try { o.delete(); } catch (e) { /* já liberado */ } }
    this.vivos = [];
    return out;
  }
}

/* Encadeamento: toda operação 2D/3D de um objeto criado pelo Geo também é registrada. */
const OPS2 = ['add', 'subtract', 'intersect', 'translate', 'rotate', 'scale', 'mirror', 'offset', 'simplify'];
const OPS3 = ['add', 'subtract', 'intersect', 'translate', 'rotate', 'scale', 'mirror'];
function instalarRastreio(w) {
  for (const [Cls, ops] of [[w.CrossSection, OPS2], [w.Manifold, OPS3]]) {
    const pr = Cls.prototype;
    if (pr.__instalado) continue;
    pr.__instalado = true;
    for (const op of ops) {
      const orig = pr[op];
      if (!orig || orig.__rastreado) continue;
      const nova = function (...a) {
        const r = orig.apply(this, a);
        if (this.__g && r && r !== this && typeof r === 'object') this.__g.t(r);
        return r;
      };
      nova.__rastreado = true;
      pr[op] = nova;
    }
  }
}
export function novoGeo(w) { instalarRastreio(w); return new Geo(w); }

/* fechamento morfológico: arredonda cantos côncavos com raio r */
export function arredondarConcavos(cs, r) { return cs.offset(r, 'Round').offset(-r, 'Round'); }
/* abertura morfológica: arredonda cantos convexos com raio r */
export function arredondarConvexos(cs, r) { return cs.offset(-r, 'Round').offset(r, 'Round'); }

export const rad = a => a * Math.PI / 180;
export const pol = (r, a, c = [0, 0]) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
function segPara(r) { return Math.max(24, Math.min(160, Math.ceil(2 * Math.PI * r / 0.6))); }
function bboxDe(m) { const b = m.boundingBox(); return [[b.min[0], b.min[1], b.min[2]], [b.max[0], b.max[1], b.max[2]]]; }
