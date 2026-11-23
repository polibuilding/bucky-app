/* Visor 3D das peças (three.js). Mostra uma peça ou todas lado a lado, como numa mesa de impressão. */
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
    this.cena.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
    const sol = new THREE.DirectionalLight(0xffffff, 1.6); sol.position.set(200, -300, 500); this.cena.add(sol);
    const sol2 = new THREE.DirectionalLight(0xffffff, 0.6); sol2.position.set(-300, 200, 200); this.cena.add(sol2);
    this.grupo = new THREE.Group(); this.cena.add(this.grupo);
    this.grade = null;
    new ResizeObserver(() => this.tamanho()).observe(el);
    this.tamanho();
    const loop = () => { this.ctrl.update(); this.ren.render(this.cena, this.cam); this.raf = requestAnimationFrame(loop); };
    loop();
  }
  tamanho() {
    const w = this.el.clientWidth || 300, h = this.el.clientHeight || 300;
    this.ren.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  }
  limpar() {
    for (const o of [...this.grupo.children]) { o.geometry?.dispose(); o.material?.dispose(); this.grupo.remove(o); }
    if (this.grade) { this.cena.remove(this.grade); this.grade.geometry.dispose(); this.grade = null; }
  }
  malha(m, cor) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
    geo.setIndex(new THREE.BufferAttribute(m.tri, 1));
    const nao = geo.toNonIndexed(); nao.computeVertexNormals(); geo.dispose();
    return new THREE.Mesh(nao, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.62, metalness: 0.02 }));
  }
  /* itens: [{malha, cor}] ; mesa: [x, y] em mm para a grade */
  mostrar(itens, mesa, manterCamera = false) {
    this.limpar();
    const caixas = [];
    for (const it of itens) {
      const ms = this.malha(it.malha, it.cor);
      const b = it.malha.bbox;
      ms.position.set(-(b[0][0] + b[1][0]) / 2 + (it.dx || 0), -(b[0][1] + b[1][1]) / 2 + (it.dy || 0), -b[0][2]);
      this.grupo.add(ms);
      caixas.push(new THREE.Box3().setFromObject(ms));
    }
    const caixa = caixas.reduce((a, b) => a.union(b), new THREE.Box3());
    const tam = caixa.getSize(new THREE.Vector3()), centro = caixa.getCenter(new THREE.Vector3());
    const lado = Math.max(mesa ? Math.max(mesa[0], mesa[1]) : 0, tam.x, tam.y) * 1.1;
    const div = Math.max(4, Math.round(lado / 10));
    this.grade = new THREE.GridHelper(div * 10, div, 0x9aa3ac, 0xd5dade);
    this.grade.rotation.x = Math.PI / 2; this.grade.position.set(centro.x, centro.y, -0.05);
    this.grade.material.transparent = true; this.grade.material.opacity = 0.55;
    this.cena.add(this.grade);
    if (!manterCamera) {
      const r = Math.max(tam.x, tam.y, tam.z * 2, 20);
      this.cam.position.set(centro.x + r * 0.9, centro.y - r * 1.3, centro.z + r * 1.1);
      this.ctrl.target.copy(centro);
    }
  }
}
