/* Folhas de desenho técnico: primitivas em mm de papel (A4 deitado, origem no canto
   inferior esquerdo, y para cima), renderizadas em SVG e em PDF pelo mesmo código. */

export const A4 = { w: 297, h: 210 };
const ESCALAS = [5, 4, 3, 2, 1.5, 1, 0.5, 0.4, 0.25, 0.2, 0.1];
const rotEscala = k => k >= 1 ? `${+k.toFixed(2)}:1` : `1:${+(1 / k).toFixed(2)}`;

export class Folha {
  constructor(titulo, info) { this.titulo = titulo; this.info = info; this.p = []; }
  linha(a, b, e = {}) { this.p.push({ t: 'l', pts: [a, b], ...estilo(e) }); }
  poli(pts, fechado, e = {}) { this.p.push({ t: 'p', pts, fechado, ...estilo(e) }); }
  texto(x, y, s, e = {}) { this.p.push({ t: 'x', x, y, s: String(s), tam: e.tam || 3, anc: e.anc || 'start', rot: e.rot || 0, cor: e.cor || '#1E2329', negrito: !!e.negrito }); }
}
function estilo(e) {
  return { cor: e.cor || '#1E2329', larg: e.larg ?? 0.25, traco: e.traco || null, preench: e.preench || null };
}

/* Vista: polígonos do modelo (mm) desenhados com escala k e origem (ox, oy) no papel. */
export class Vista {
  constructor(folha, polis, k, ox, oy, nome) {
    Object.assign(this, { f: folha, k, ox, oy });
    const T = p => this.P(p);
    folha.p.push({ t: 'm', laços: polis.map(pl => pl.map(T)), ...estilo({ larg: 0.35, preench: '#FFF4CC' }) });
    if (nome) this.nome = nome;
  }
  P(p) { return [this.ox + p[0] * this.k, this.oy + p[1] * this.k]; }
  /* linha de centro */
  centro(a, b) { this.f.linha(this.P(a), this.P(b), { cor: '#7A8591', larg: 0.18, traco: [6, 1.5, 1, 1.5] }); }
  /* cota alinhada entre a e b, afastada "off" mm de papel (sinal = lado) */
  cota(a, b, rot, val, off = 8, e = {}) {
    let A = this.P(a), B = this.P(b);
    if (e.h) B = [B[0], A[1]];
    if (e.v) B = [A[0], B[1]];
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
    const u = [dx / L, dy / L], n = [-u[1], u[0]];
    const a2 = [A[0] + n[0] * off, A[1] + n[1] * off], b2 = [B[0] + n[0] * off, B[1] + n[1] * off];
    const pA = this.P(a), pB = this.P(b);
    const ext = (p, q) => this.f.linha([p[0] + n[0] * Math.sign(off) * 1, p[1] + n[1] * Math.sign(off) * 1], [q[0] + n[0] * Math.sign(off) * 1.5, q[1] + n[1] * Math.sign(off) * 1.5], { cor: '#A85A0A', larg: 0.15 });
    ext(pA, a2); ext(e.h || e.v ? [b2[0] - n[0] * off, b2[1] - n[1] * off] : pB, b2);
    this.f.linha(a2, b2, { cor: '#A85A0A', larg: 0.2 });
    seta(this.f, a2, u); seta(this.f, b2, [-u[0], -u[1]]);
    let ang = Math.atan2(u[1], u[0]) * 180 / Math.PI;
    if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
    const m = [(a2[0] + b2[0]) / 2 + n[0] * 1.2 * Math.sign(off || 1), (a2[1] + b2[1]) / 2 + n[1] * 1.2 * Math.sign(off || 1)];
    rotulo(this.f, m[0], m[1], rot, val, ang, off < 0 ? 'abaixo' : 'acima');
  }
  /* diâmetro ou raio com linha de chamada no ângulo dado */
  furo(c, r, rot, val, ang = 45, raio = false) {
    const C = this.P(c), R = r * this.k, u = [Math.cos(ang * Math.PI / 180), Math.sin(ang * Math.PI / 180)];
    const a = [C[0] + u[0] * R, C[1] + u[1] * R], b = [C[0] + u[0] * (R + 9), C[1] + u[1] * (R + 9)];
    const ini = raio ? C : [C[0] - u[0] * R, C[1] - u[1] * R];
    this.f.linha(ini, b, { cor: '#A85A0A', larg: 0.2 });
    seta(this.f, a, [-u[0], -u[1]]);
    const fim = [b[0] + (u[0] >= 0 ? 4 : -4), b[1]];
    this.f.linha(b, fim, { cor: '#A85A0A', larg: 0.2 });
    rotulo(this.f, fim[0] + (u[0] >= 0 ? 1 : -1), fim[1] + 0.6, (raio ? 'R ' : 'Ø ') + rot, val, 0, 'linha', u[0] >= 0 ? 'start' : 'end');
  }
  /* ângulo entre duas direções (graus, no modelo) a partir de c */
  angulo(c, a0, a1, rpap, rot, val) {
    const C = this.P(c), pts = [], n = 24;
    for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; pts.push([C[0] + rpap * Math.cos(a), C[1] + rpap * Math.sin(a)]); }
    this.f.poli(pts, false, { cor: '#A85A0A', larg: 0.2 });
    const am = (a0 + a1) / 2 * Math.PI / 180;
    rotulo(this.f, C[0] + (rpap + 3) * Math.cos(am), C[1] + (rpap + 3) * Math.sin(am), rot, val, 0, 'linha', Math.cos(am) >= 0 ? 'start' : 'end', '°');
  }
}

function seta(f, p, u) {
  const n = [-u[1], u[0]], L = 2.2, W = 0.7;
  f.poli([p, [p[0] + u[0] * L + n[0] * W, p[1] + u[1] * L + n[1] * W], [p[0] + u[0] * L - n[0] * W, p[1] + u[1] * L - n[1] * W]], true, { cor: '#A85A0A', larg: 0.1, preench: '#A85A0A' });
}
function rotulo(f, x, y, nome, val, ang, lado, anc = 'middle', un = '') {
  const s = `${nome} = ${fmt(val)}${un}`;
  const dy = lado === 'abaixo' ? -3 : lado === 'acima' ? 0.6 : 0;
  const r = ang * Math.PI / 180;
  f.texto(x - Math.sin(r) * dy, y + Math.cos(r) * dy, s, { tam: 2.6, anc, rot: ang, cor: '#A85A0A' });
}
export const fmt = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR');

/* Escolhe a escala para caber na caixa (mm de papel). */
export function escalaPara(larg, alt, cw, ch) {
  for (const k of ESCALAS) if (larg * k <= cw && alt * k <= ch) return k;
  return ESCALAS[ESCALAS.length - 1];
}

/* Moldura e carimbo. */
export function moldura(f, k, n, total) {
  const { w, h } = A4;
  f.poli([[8, 8], [w - 8, 8], [w - 8, h - 8], [8, h - 8]], true, { larg: 0.5 });
  const cx = w - 8 - 110, cy = 8;
  f.poli([[cx, cy], [w - 8, cy], [w - 8, cy + 24], [cx, cy + 24]], true, { larg: 0.35, preench: '#EAF2FF' });
  f.linha([cx, cy + 12], [w - 8, cy + 12], { larg: 0.25 });
  f.linha([cx + 70, cy], [cx + 70, cy + 12], { larg: 0.25 });
  f.texto(cx + 3, cy + 16, f.titulo, { tam: 5, negrito: true });
  f.texto(w - 11, cy + 16, 'Bucky', { tam: 4, anc: 'end', cor: '#3A7BD5', negrito: true });
  f.texto(cx + 3, cy + 7.2, f.info, { tam: 2.6 });
  f.texto(cx + 3, cy + 2.8, 'Cotas em mm. Cada cota mostra o parâmetro que a define.', { tam: 2.2, cor: '#5F6770' });
  f.texto(cx + 73, cy + 7.2, `Escala ${rotEscala(k)}`, { tam: 2.6 });
  f.texto(cx + 73, cy + 2.8, `Folha ${n} de ${total}`, { tam: 2.6 });
}

/* ---------- SVG ---------- */
export function paraSVG(f) {
  const { w, h } = A4, Y = y => (h - y).toFixed(2), X = x => x.toFixed(2);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" font-family="Helvetica, Arial, sans-serif"><rect width="${w}" height="${h}" fill="#fff"/>`;
  for (const p of f.p) {
    if (p.t === 'x') {
      const tr = p.rot ? ` transform="rotate(${(-p.rot).toFixed(2)} ${X(p.x)} ${Y(p.y)})"` : '';
      o += `<text x="${X(p.x)}" y="${Y(p.y)}" font-size="${p.tam}" fill="${p.cor}" text-anchor="${p.anc}"${p.negrito ? ' font-weight="bold"' : ''}${tr}>${esc(p.s)}</text>`;
    } else {
      const laços = p.t === 'm' ? p.laços : [p.pts], fecha = p.t === 'm' || p.fechado;
      const d = laços.map(l => l.map((q, i) => (i ? 'L' : 'M') + X(q[0]) + ' ' + Y(q[1])).join('') + (fecha ? 'Z' : '')).join('');
      o += `<path d="${d}" fill="${p.preench || 'none'}" fill-rule="evenodd" stroke="${p.cor}" stroke-width="${p.larg}"${p.traco ? ` stroke-dasharray="${p.traco.join(' ')}"` : ''} stroke-linejoin="round"/>`;
    }
  }
  return o + '</svg>';
}
