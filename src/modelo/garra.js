/* Garra de 4 dedos com pino no rasgo.
   Eixo do antebraço = z (para a ponta). Cada dedo é uma placa num plano paralelo ao eixo,
   deslocado de "o" do centro (em cata-vento): os planos ficam em x = ±o e y = ±o.
   Por isso as caudas de dedos opostos podem se cruzar atrás da palma sem bater.
   No plano de cada dedo, "r" é a coordenada radial (a partir da linha central do plano)
   e "z" a axial. O pivô fica na palma (r = rp); o pino do cubo (r = rh) corre num rasgo
   da cauda. Empurrar o cubo para a palma (u menor) abre os dedos.

   Grandezas (como no otimizador antigo):
   ac, ao  ângulo do dedo com o eixo, fechado e aberto (graus; negativo = para dentro)
   phig    ângulo do rasgo com o eixo, com a garra aberta
   S       curso usado da seringa da garra
   c       rp − rh;  u = c / tan(phi) = distância axial pino do cubo -> plano dos pivôs
   fi, ff  distância pivô -> pino do cubo, ao longo do rasgo, aberta e fechada */

const rad = a => a * Math.PI / 180;
const G = 9.81;

export function planoDedos(P) {
  const e = P.e, tf = e, f = P.f_desliza, Sg = P.seringas.garra;
  const anelG = Sg.D + P.f_seringa + e;
  const m = Math.max(Sg.LE / 2 + P.f_seringa / 2 + e / 3, anelG / 2) + tf / 2 + f; // meia-largura livre em volta da seringa da garra
  const trilho = 1.5 * e + tf / 2 + f;                                             // dedo não toca o trilho
  const o = Math.max(trilho, m);
  return { o, m, yD5: o + m, tf, bd: 2 * e, anelG };
}

export function calcGarra(P, x) {
  const g = { ok: false };
  const pl = planoDedos(P);
  Object.assign(g, pl);
  const Rb = P.meta.diametro / 2;
  if (Rb <= pl.o + 1) { g.msg = 'A meta é pequena demais para os 4 dedos'; return g; }
  const Sg = P.seringas.garra, eta = P.eta;
  const cau = Sg.cf + eta * (Sg.ca - Sg.cf);
  g.Smax = cau - Sg.cf;
  g.S = Math.max(0.5, Math.min(g.Smax, x.cgl));
  g.tp = 2 * P.e;                                  // espessura da palma
  g.Rbe = Math.sqrt(Rb * Rb - pl.o * pl.o);        // seção da meta no plano do dedo
  g.zb = g.tp / 2 + P.folga_meta + Rb;             // centro da meta à frente do plano dos pivôs
  const ac = rad(P.ac);
  g.rp = (g.Rbe + pl.bd / 2 - g.zb * Math.sin(ac)) / Math.cos(ac);
  g.t = -g.rp * Math.sin(ac) + g.zb * Math.cos(ac);
  g.Lf = g.t + P.ponta_dedo;
  g.dA = x.ao - (P.ac - P.aperto);
  g.phio = x.phig; g.phic = x.phig - g.dA;
  const cot = a => 1 / Math.tan(rad(a));
  g.c = g.S / (cot(g.phic) - cot(g.phio));
  g.uo = g.c * cot(g.phio); g.uc = g.c * cot(g.phic);
  g.gam = x.ao - g.phio;                           // dobra do dedo (ângulo dedo-cauda)
  g.rh = g.rp - g.c;
  g.fi = g.c / Math.sin(rad(g.phio)); g.ff = g.c / Math.sin(rad(g.phic));
  g.cauda = g.ff + P.e + P.Dpino;                  // comprimento da cauda a partir do pivô
  g.r_cauda = g.rp - g.cauda * Math.sin(rad(g.phio)); // ponta da cauda (garra aberta), coordenada radial
  g.r_cauda_min = -(pl.o - pl.tf / 2 - P.f_desliza); // pode cruzar o centro até o plano do dedo vizinho
  g.tipO = g.rp + g.Lf * Math.sin(rad(x.ao));
  g.abre = g.tipO - pl.bd / 2 - (g.Rbe + P.folga_abertura);
  // força: seringa de comando empurrando a da garra
  const Dm = P.seringas.comando.D;
  g.F = P.Fin * Math.pow(Sg.D / Dm, 2) * P.etaf;
  g.phiK = P.ac - g.gam;
  const sK = Math.sin(rad(g.phiK));
  g.tau = (g.F / 4) * g.c / (sK * sK);
  g.Fn = g.tau / g.t;
  g.FS = 4 * P.atrito * g.Fn / ((P.meta.massa / 1000) * G);
  // cubo: o pino fica a u atrás dos pivôs; a pega da aba do êmbolo fica mais atrás,
  // depois de onde a cauda alcança, para atravessar o plano do dedo vizinho sem bater.
  g.tc = 2 * P.e;
  g.pescoco = (g.ff - g.fi + P.e + P.Dpino) * Math.cos(rad(g.phio)) + pl.tf + P.f_desliza;
  g.folga_cubo = g.uo - g.tp / 2 - g.tc / 2 - P.f_desliza; // cubo aberto x palma
  // pescoço da pega: entre o plano x = −o e a cauda do dedo que fica no plano y = −o
  g.pega_x = [-(pl.o - pl.tf / 2 - P.f_desliza), Math.min(pl.o - pl.tf / 2 - P.f_desliza, g.r_cauda - pl.tf / 2 - P.f_desliza)];
  g.pega_larg = g.pega_x[1] - g.pega_x[0];
  g.Rpal = Math.hypot(g.rp, pl.o) + P.Dpino / 2 + P.e;
  g.Rcub = Math.hypot(g.rh, pl.o) + P.Dpino / 2 + P.e;
  g.valido = Number.isFinite(g.c) && g.c > 1 && g.phic > 3 && g.phio < 88 && g.rh > pl.o * 0.2 && x.ao > P.ac;
  g.ok = g.valido && g.r_cauda >= g.r_cauda_min && g.abre >= 0 && g.folga_cubo >= 0 && g.phiK >= 10 && g.FS >= 2 && g.pega_larg >= 4;
  g.checks = [
    ['Cauda não toca o dedo vizinho', g.r_cauda - g.r_cauda_min],
    ['Dedos abrem além da meta', g.abre],
    ['Cubo aberto não toca a palma', g.folga_cubo],
    ['Ângulo de transmissão (≥ 10°)', g.phiK - 10],
    ['Fator de segurança da pega (≥ 2)', g.FS - 2],
    ['Pega da seringa da garra cabe entre os dedos', g.pega_larg - 4],
  ];
  return g;
}

/* Procura ao, phig e curso que atendem a todas as restrições com a maior margem. */
export function ajustarGarra(P, x0) {
  let best = null;
  const Smax = Math.floor(P.eta * (P.seringas.garra.ca - P.seringas.garra.cf));
  for (let ao = 0; ao <= 40; ao += 1) for (let phig = 15; phig <= 80; phig += 1) for (let S = 4; S <= Smax; S += 1) {
    const x = { ao, phig, cgl: S };
    const g = calcGarra(P, x);
    if (!g.ok) continue;
    const sc = Math.min(g.r_cauda - g.r_cauda_min, g.abre, 2 * g.folga_cubo, (g.phiK - 10) / 2, (g.FS - 2) * 3, g.pega_larg - 4) - 0.02 * g.Rpal - 0.05 * (g.uc + g.pescoco) + 0.001 * S;
    if (!best || sc > best.sc) best = { sc, x };
  }
  return best ? best.x : null;
}
