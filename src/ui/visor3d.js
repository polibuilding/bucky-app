/* Visor 3D (three.js): peças soltas ou o braço montado com as seringas. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Visor {
  constructor(el) {
    this.el = el;
    this.ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.ren.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    el.appendChild(this.ren.domElement);
    this.cena = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(35, 1, 1, 5000);
    this.cam.up.set(0, 0, 1);
    this.ctrl = new OrbitControls(this.cam, this.ren.domElement);
    this.ctrl.enableDamping = true;
    this.cena.add(new THREE.HemisphereLight(0xffffff, 0xb8c6d8, 1.7));
    const sol = new THREE.DirectionalLight(0xffffff, 1.5); sol.position.set(200, -300, 500); this.cena.add(sol);
    const sol2 = new THREE.DirectionalLight(0xffffff, 0.55); sol2.position.set(-300, 200, 200); this.cena.add(sol2);
    this.grupo = new THREE.Group(); this.cena.add(this.grupo);
    this.geoCache = new WeakMap();
    this.grade = null;
    new ResizeObserver(() => this.tamanho()).observe(el);
    this.tamanho();
    const loop = () => { this.ctrl.update(); this.ren.render(this.cena, this.cam); requestAnimationFrame(loop); };
    loop();
  }
  tamanho() {
    const w = this.el.clientWidth || 300, h = this.el.clientHeight || 300;
    this.ren.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  }
  geometria(m) {
    let g = this.geoCache.get(m);
    if (!g) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
      geo.setIndex(new THREE.BufferAttribute(m.tri, 1));
      g = geo.toNonIndexed(); g.computeVertexNormals(); geo.dispose();
      this.geoCache.set(m, g);
    }
    return g;
  }
  material(cor, opac = 1) {
    return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.6, metalness: 0.02, side: THREE.DoubleSide, transparent: opac < 1, opacity: opac, depthWrite: opac >= 1 });
  }
  limpar() {
    for (const o of [...this.grupo.children]) { o.material?.dispose(); this.grupo.remove(o); }
    if (this.grade) { this.cena.remove(this.grade); this.grade.geometry.dispose(); this.grade = null; }
    this.modo = null;
  }
  gradeEm(cx, cy, lado) {
    const div = Math.max(4, Math.round(lado / 10));
    this.grade = new THREE.GridHelper(div * 10, div, 0x9fb3cc, 0xdde6f2);
    this.grade.rotation.x = Math.PI / 2; this.grade.position.set(cx, cy, -0.05);
    this.cena.add(this.grade);
  }
  enquadrar(caixa, manter) {
    if (manter) return;
    const tam = caixa.getSize(new THREE.Vector3()), centro = caixa.getCenter(new THREE.Vector3());
    const r = Math.max(tam.x, tam.y, tam.z * 1.4, 20);
    this.cam.position.set(centro.x + r * 0.55, centro.y - r * 1.55, centro.z + r * 0.75);
    this.ctrl.target.copy(centro);
  }
  /* peças soltas: itens [{malha, cor, dx, dy}] */
  mostrar(itens, mesa, manter = false) {
    this.limpar(); this.modo = 'pecas';
    const caixa = new THREE.Box3();
    for (const it of itens) {
      const ms = new THREE.Mesh(this.geometria(it.malha), this.material(it.cor));
      const b = it.malha.bbox;
      ms.position.set(-(b[0][0] + b[1][0]) / 2 + (it.dx || 0), -(b[0][1] + b[1][1]) / 2 + (it.dy || 0), -b[0][2]);
      this.grupo.add(ms); caixa.union(new THREE.Box3().setFromObject(ms));
    }
    const tam = caixa.getSize(new THREE.Vector3()), c = caixa.getCenter(new THREE.Vector3());
    this.gradeEm(c.x, c.y, Math.max(mesa ? Math.max(...mesa) : 0, tam.x, tam.y) * 1.1);
    this.enquadrar(caixa, manter);
  }
  /* braço montado: M = resultado de montar(); malhas por id; cores por id */
  montagem(M, malhas, cores, manter = false) {
    if (this.modo !== 'montagem') { this.limpar(); this.modo = 'montagem'; manter = false; }
    else { for (const o of [...this.grupo.children]) { o.material?.dispose(); if (o.userData.temp) o.geometry.dispose(); this.grupo.remove(o); } }
    const caixa = new THREE.Box3();
    for (const it of M.itens) {
      const m = malhas[it.id]; if (!m) continue;
      const ms = new THREE.Mesh(this.geometria(m), this.material(cores[it.id] || '#3A7BD5'));
      ms.matrixAutoUpdate = false; ms.matrix.fromArray(it.m); ms.updateMatrixWorld(true);
      this.grupo.add(ms); caixa.union(new THREE.Box3().setFromObject(ms));
    }
    for (const s of M.seringas) this.seringa(s);
    if (M.meta) {
      const esf = new THREE.Mesh(new THREE.SphereGeometry(M.meta.r, 40, 24), this.material('#C9DB3B', 0.85));
      esf.userData.temp = true; esf.position.set(...M.meta.c); this.grupo.add(esf);
    }
    if (!this.grade) { const c = caixa.getCenter(new THREE.Vector3()); this.gradeEm(0, 0, 420); void c; }
    this.enquadrar(caixa, manter);
  }
  seringa(s) {
    const a = new THREE.Vector3(...s.a), b = new THREE.Vector3(...s.b);
    const L = a.distanceTo(b); if (L < 1) return;
    const u = b.clone().sub(a).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), u);
    const tubo = (r, x0, x1, cor, opac) => {
      const g = new THREE.CylinderGeometry(r, r, Math.max(0.1, x1 - x0), 28);
      const m = new THREE.Mesh(g, this.material(cor, opac)); m.userData.temp = true;
      m.quaternion.copy(q); m.position.copy(a.clone().addScaledVector(u, (x0 + x1) / 2)); this.grupo.add(m);
    };
    const corpo = Math.min(L - 4, Math.max(20, L * 0.62));
    tubo(s.D / 2, 0, corpo, '#DDE8F5', 0.55);                 // corpo da seringa
    tubo(s.D / 2 - 1.2, corpo * 0.45, corpo - 0.5, '#3A7BD5', 0.85); // líquido
    tubo(Math.max(1.5, s.D / 7), corpo * 0.4, L, '#F4F7FB', 0.95);   // haste do êmbolo
    tubo(s.LE / 2, L - 1, L + 1, '#F4F7FB', 0.95);             // aba do êmbolo
  }
}
