/* Montagem: posiciona cada peça (gerada no próprio referencial) no braço montado.
   Mundo: z para cima, x para a frente (braço com giro zero), y lateral; a frente é −y.
   Plano do braço = plano (u, w) com u horizontal ao longo do braço e w = z.
   Camadas: corpo em y ∈ [−e/2, e/2], braço na frente dele, antebraço na frente do braço.
   Seringas: cotovelo pela frente; ombro e garra por trás (alternadas). */
import { anguloJunta, cursos } from '../modelo/cinematica.js';
import { DEDOS } from '../pecas/mao.js';

const rad = a => a * Math.PI / 180, deg = r => r * 180 / Math.PI;

/* matriz 4x4 (coluna-major) a partir de colunas 3D e translação */
function mat(cx, cy, cz, t) {
  return [cx[0], cx[1], cx[2], 0, cy[0], cy[1], cy[2], 0, cz[0], cz[1], cz[2], 0, t[0], t[1], t[2], 1];
}
function mul(a, b) { // a·b, coluna-major
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
function ponto(m, p) { return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]; }
const rotZ = a => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return mat([c, s, 0], [-s, c, 0], [0, 0, 1], [0, 0, 0]); };

/* placa no plano do braço: origem (u0, w0), ângulo th, face em y = yFace, espessura para −y */
function placa(u0, w0, th, yFace) {
  const c = Math.cos(rad(th)), s = Math.sin(rad(th));
  return mat([c, 0, s], [-s, 0, c], [0, -1, 0], [u0, yFace, w0]);
}

/* Faixa de movimento de cada seringa e ângulos correspondentes. t ∈ [0, 1] (fechada → aberta). */
export function faixas(P) {
  const c = cursos(P), Sg = P.seringas.garra;
  const cauG = Sg.cf + P.eta * (Sg.ca - Sg.cf);
  return { c, garra: [Sg.cf, cauG] };
}

export function pose(P, t) {
  const c = cursos(P), s = k => c.cf + t[k] * (c.cau - c.cf);
  const d0 = Math.hypot(P.xA, P.yA), psi = deg(Math.atan2(-P.yA, P.xA));
  const phiS = anguloJunta(d0, P.d1, s('ombro'));
  const th1 = psi + phiS;
  const phiC = anguloJunta(P.d2, P.d3, s('cotovelo'));
  const th2 = phiC - 180;
  const phiG = anguloJunta(P.dg0, P.dg1, s('giro'));
  const phiGmed = anguloJunta(P.dg0, P.dg1, (c.cf + c.cau) / 2);
  const thg = phiG - phiGmed;                         // giro relativo ao meio do curso
  const G = P.garra, Sg = P.seringas.garra;
  const sg = Sg.cf + t.garra * (G.ok ? G.S : P.eta * (Sg.ca - Sg.cf));
  const u = G.ok ? Math.max(G.uo, G.uc - (sg - Sg.cf)) : 20;
  const phi = G.ok ? deg(Math.atan2(G.c, u)) : 30;
  const alfa = phi + (G.ok ? G.gam : 0);
  return { th1, th2, thg, phiGmed, u, alfa, s: { ombro: s('ombro'), cotovelo: s('cotovelo'), giro: s('giro'), garra: sg } };
}

/* Lista de peças posicionadas e seringas para o visor. */
export function montar(P, t) {
  const p = pose(P, t), e = P.e;
  const itens = [], ser = [];
  // base fixa, girada para que o meio do giro aponte para +x
  const Mb = rotZ(-(180 + p.phiGmed));                // G0 a 0° na base; G1 fica a 180° do braço
  itens.push({ id: 'base', m: Mb }, { id: 'atuador', m: Mb });
  const Mg = rotZ(p.thg);                             // giro do braço
  itens.push({ id: 'disco', m: Mg });
  const yC = e / 2, yB = -e / 2, yA = -3 * e / 2;     // faces de trás das placas (espessura para −y)
  const Mc0 = placa(0, 0, 0, yC), Mc = mul(Mg, Mc0);
  itens.push({ id: 'corpo', m: Mc });
  const E1 = [0, P.L0];
  const Mbr0 = placa(E1[0], E1[1], p.th1, yB), Mbr = mul(Mg, Mbr0);
  itens.push({ id: 'braco', m: Mbr });
  const E2 = [E1[0] + P.L1 * Math.cos(rad(p.th1)), E1[1] + P.L1 * Math.sin(rad(p.th1))];
  const ta = p.th1 + p.th2;
  const Ma0 = placa(E2[0], E2[1], ta, yA), Ma = mul(Mg, Ma0);
  itens.push({ id: 'antebraco', m: Ma });
  // eixos e clicks
  // no referencial do braço: corpo atrás (z de −e a 0), braço (0 a e), antebraço (e a 2e)
  const id3 = (x, z) => mat([1, 0, 0], [0, 1, 0], [0, 0, 1], [x, 0, z]);
  const vira = (x, z) => mat([1, 0, 0], [0, -1, 0], [0, 0, -1], [x, 0, z]);
  itens.push({ id: 'eixo', m: mul(Mbr, id3(0, -1.5 * e)) }, { id: 'click', m: mul(Mbr, vira(0, 2.5 * e)) });
  itens.push({ id: 'eixo', m: mul(Mbr, id3(P.L1, -0.5 * e)) }, { id: 'click', m: mul(Mbr, vira(P.L1, 3.5 * e)) });
  // pulso e mão: referencial da mão na linha do eixo do antebraço
  const ua = [Math.cos(rad(ta)), Math.sin(rad(ta))], na = [-ua[1], ua[0]];
  const yMid = yA - e / 2;
  const noEixo = z => [E2[0] + ua[0] * z, yMid, E2[1] + ua[1] * z];
  const mao = z => mul(Mg, mat([na[0], 0, na[1]], [0, -1, 0], [ua[0], 0, ua[1]], noEixo(z)));
  const raiz = P.L2 - P.garfo - P.pulso_rasgo;
  {
    const o = noEixo(raiz); // pulso: x ao longo do eixo, y lateral, z espessura (no plano do braço)
    itens.push({ id: 'pulso', m: mul(Mg, mat([ua[0], 0, ua[1]], [0, 1, 0], [na[0], 0, na[1]], [o[0] - na[0] * e / 2, o[1], o[2] - na[1] * e / 2])) });
  }
  const G = P.garra;
  if (G.ok) {
    itens.push({ id: 'palma', m: mao(P.z_palma) });
    itens.push({ id: 'cubo', m: mao(P.z_palma - p.u) });
    const Mm = mao(P.z_palma);
    for (const d of DEDOS) {
      const a = rad(p.alfa);
      const dir = [d.r[0] * Math.sin(a), d.r[1] * Math.sin(a), Math.cos(a)];
      const den = [-d.r[0] * Math.cos(a), -d.r[1] * Math.cos(a), Math.sin(a)];
      const nn = [d.n[0], d.n[1], 0];
      const piv = [d.n[0] * G.o + d.r[0] * G.rp - nn[0] * G.tf / 2, d.n[1] * G.o + d.r[1] * G.rp - nn[1] * G.tf / 2, 0];
      itens.push({ id: 'dedo', m: mul(Mm, mat(dir, den, nn, piv)) });
    }
    // meta, presa entre os dedos
    const zb = P.z_palma - G.tp / 2 + G.zb;
    itens.meta = { c: ponto(Mg, noEixo(zb)), r: P.meta.diametro / 2 };
  }
  // ---- seringas: pino do corpo (trava-corpo) e pino do êmbolo
  const T = P.travas, Rb = T.braco.anel / 2, emb = T.braco.canal / 2 + e;  // afastamentos da placa
  // pontos calculados no plano do braço (antes do giro) e depois girados
  const naPlaca = (M0, x, y) => ponto(M0, [x, y, 0]);
  const Ab = naPlaca(Mc0, P.xA, P.L0 - P.yA), Bb = naPlaca(Mbr0, P.d1, 0);
  // dy > 0 desloca para trás (+y), dy < 0 para a frente; depois aplica o giro
  const lado = (q, dy) => ponto(Mg, [q[0], q[1] + dy, q[2]]);
  // ombro por trás: atrás do corpo (face y = yC) e atrás do braço (face y = yB)
  ser.push({ nome: 'ombro', a: lado(Ab, Rb), b: lado(Bb, emb), D: P.seringas.braco.D, s: p.s.ombro, LE: P.seringas.braco.LE });
  // cotovelo pela frente: frente do braço (yB − e) e frente do antebraço (yA − e)
  const Cb = naPlaca(Mbr0, P.L1 - P.d2, 0), Db = naPlaca(Ma0, P.d3, 0);
  ser.push({ nome: 'cotovelo', a: lado(Cb, -(e + Rb)), b: lado(Db, -(e + emb)), D: P.seringas.braco.D, s: p.s.cotovelo, LE: P.seringas.braco.LE });
  // garra por trás do antebraço, afastada; o êmbolo vai até a pega do cubo
  if (G.ok) {
    const Eb = naPlaca(Ma0, P.L2 - P.d4, 0);
    const Ea = lado(Eb, T.garra.anel / 2 + P.afastador_garra);
    const zf = P.z_palma - p.u - G.pescoco;
    const Mm = mao(zf);
    ser.push({ nome: 'garra', a: Ea, b: ponto(Mm, [0, -G.yD5, 0]), D: P.seringas.garra.D, s: p.s.garra, LE: P.seringas.garra.LE });
  }
  // giro: na altura do anel da trava sobre a orelha da base
  const zg = P.hb + Rb;
  const G0 = ponto(Mb, [P.dg0, 0, zg]);
  const G1 = ponto(Mg, [-P.dg1, 0, zg]);
  ser.push({ nome: 'giro', a: G0, b: G1, D: P.seringas.braco.D, s: p.s.giro, LE: P.seringas.braco.LE });
  return { itens, seringas: ser, meta: itens.meta, pose: p };
}
