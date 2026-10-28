// Santiago Antiguo — paseo en primera persona para celular y computador (Three.js + three-mesh-bvh)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { crearSonido } from './sonido.js';
import { crearPersonajes } from './personajes.js';

const TACTIL = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (TACTIL) document.body.classList.add('tactil');

// ---------------------------------------------------------------- jugador
const RADIO = 0.35;                      // radio de la cápsula
const SEGMENTO = new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.1, 0));  // centro esfera alta -> baja
const OJOS = 0.2;                        // ojos sobre el centro de la esfera alta (1,65 m del suelo)
const CAMINAR = 3.2, CORRER = 7.0, SALTO = 5.0, GRAVEDAD = -18;

const $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ antialias: !TACTIL, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const CIELO = new THREE.Color('#c9d4dc');
scene.fog = new THREE.Fog(CIELO, 60, TACTIL ? 260 : 420);
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 2000);
camera.rotation.order = 'YXZ';

// sol de media mañana y cielo
const sol = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(50), THREE.MathUtils.degToRad(35));
const cielo = new Sky();
cielo.scale.setScalar(1800);
cielo.material.uniforms.turbidity.value = 6;
cielo.material.uniforms.rayleigh.value = 1.4;
cielo.material.uniforms.sunPosition.value.copy(sol);
scene.add(cielo);
scene.add(new THREE.HemisphereLight('#dfe8f0', '#7a6a55', 1.3));
const luzSol = new THREE.DirectionalLight('#fff1dc', 2.6);
luzSol.castShadow = true;
luzSol.shadow.bias = -0.0004;
luzSol.shadow.normalBias = 0.03;
scene.add(luzSol, luzSol.target);

// ---------------------------------------------------------------- calidad (escala de píxeles + sombras)
const CALIDADES = {
  baja: { px: 0.75, sombra: 0 },
  media: { px: 1.0, sombra: 1024 },
  alta: { px: Math.min(devicePixelRatio, 2), sombra: 2048 },
};
let calidad = TACTIL ? 'media' : 'alta', calidadAuto = true;
function aplicarCalidad() {
  const c = CALIDADES[calidad];
  renderer.setPixelRatio(c.px);
  luzSol.castShadow = c.sombra > 0;
  if (c.sombra) {
    luzSol.shadow.mapSize.set(c.sombra, c.sombra);
    luzSol.shadow.map?.dispose();
    luzSol.shadow.map = null;
    const s = c.sombra > 1024 ? 70 : 45;
    Object.assign(luzSol.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 400 });
    luzSol.shadow.camera.updateProjectionMatrix();
  }
  $('btn-calidad').textContent = `Calidad: ${calidadAuto ? 'auto · ' : ''}${calidad}`;
}
$('btn-calidad').onclick = () => {
  const orden = ['baja', 'media', 'alta'];
  if (calidadAuto) { calidadAuto = false; calidad = 'baja'; }
  else if (calidad === 'alta') { calidadAuto = true; calidad = TACTIL ? 'media' : 'alta'; }
  else calidad = orden[orden.indexOf(calidad) + 1];
  aplicarCalidad();
};
aplicarCalidad();

// ---------------------------------------------------------------- carga
const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/');
const gltf = new GLTFLoader().setDRACOLoader(draco);
const progreso = { ciudad: 0, colision: 0 };
const pintarBarra = () => { $('barra').firstChild.style.width = `${Math.round(100*(0.85*progreso.ciudad + 0.15*progreso.colision))}%`; };
const cargar = (url, clave) => gltf.loadAsync(url, (e) => { if (e.total) { progreso[clave] = e.loaded/e.total; pintarBarra(); } });

const [datos, ciudad, colision] = await Promise.all([
  fetch('datos/instancias.json').then((r) => r.json()),
  cargar('datos/ciudad.glb', 'ciudad'),
  cargar('datos/colision.glb', 'colision'),
]).catch((e) => { $('estado').textContent = 'No se pudo cargar la ciudad: ' + e.message; throw e; });
$('estado').textContent = 'Armando las manzanas…';
await new Promise(requestAnimationFrame);

const matrizInstancia = (x, y, z, giro) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), giro), new THREE.Vector3(1, 1, 1));

// cada asset se dibuja con un InstancedMesh por material (una llamada de dibujo por material)
ciudad.scene.updateMatrixWorld(true);
let llamadas = 0;
const mallas = {};                       // asset -> sus InstancedMesh (para girar a las personas)
for (const [asset, lista] of Object.entries(datos.instancias)) {
  const nodo = ciudad.scene.getObjectByName(asset);
  if (!nodo) continue;
  const matrices = lista.map(([x, y, z, g]) => matrizInstancia(x, y, z, g));
  nodo.traverse((m) => {
    if (!m.isMesh) return;
    const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const mat = m.material;
    if (mat.transparent || /vidrio|vitral/i.test(mat.name)) { mat.transparent = true; mat.depthWrite = false; mat.opacity = Math.min(mat.opacity, 0.45); }
    if (mat.map) mat.map.anisotropy = TACTIL ? 2 : 8;
    const im = new THREE.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((mx, i) => im.setMatrixAt(i, mx));
    im.computeBoundingSphere();
    im.castShadow = !mat.transparent;
    im.receiveShadow = true;
    scene.add(im);
    (mallas[asset] ||= []).push(im);
    llamadas++;
  });
}

// colisión: todas las envolventes convexas de todas las instancias en una sola malla con BVH
colision.scene.updateMatrixWorld(true);
const piezas = [];
for (const [asset, lista] of Object.entries(datos.instancias)) {
  const nodo = colision.scene.getObjectByName(asset);
  if (!nodo) continue;
  nodo.traverse((m) => {
    if (!m.isMesh) return;
    const base = new THREE.BufferGeometry().setAttribute('position', m.geometry.getAttribute('position'));
    base.setIndex(m.geometry.getIndex());
    base.applyMatrix4(m.matrixWorld);
    for (const [x, y, z, g] of lista) piezas.push(base.clone().applyMatrix4(matrizInstancia(x, y, z, g)));
  });
}
// los pisos (calles, veredas, plazas, escalones) no traen colisión propia: se toman de la malla visible
// los triángulos que miran hacia arriba y están a poca altura sobre la base de cada asset
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
for (const [asset, lista] of Object.entries(datos.instancias)) {
  const nodo = ciudad.scene.getObjectByName(asset);
  if (!nodo) continue;
  const tris = [];
  nodo.traverse((m) => {
    if (!m.isMesh || m.material.transparent) return;
    const pos = m.geometry.getAttribute('position'), idx = m.geometry.getIndex();
    const cuenta = idx ? idx.count : pos.count;
    for (let i = 0; i < cuenta; i += 3) {
      const [i0, i1, i2] = idx ? [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)] : [i, i + 1, i + 2];
      a.fromBufferAttribute(pos, i0).applyMatrix4(m.matrixWorld);
      b.fromBufferAttribute(pos, i1).applyMatrix4(m.matrixWorld);
      c.fromBufferAttribute(pos, i2).applyMatrix4(m.matrixWorld);
      if (Math.max(a.y, b.y, c.y) > 1.2) continue;
      n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
      if (n.y < 0.6) continue;
      tris.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  });
  if (!tris.length) continue;
  const base = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(tris, 3));
  for (const [x, y, z, g] of lista) piezas.push(base.clone().applyMatrix4(matrizInstancia(x, y, z, g)));
}
// piso de seguridad bajo toda la ciudad
const piso = new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI/2).translate(0, -4, 0);
piezas.push(new THREE.BufferGeometry().setAttribute('position', piso.getAttribute('position')).setIndex(piso.getIndex()));
const geoColision = mergeGeometries(piezas.map((p) => (p.index ? p.toNonIndexed() : p)), false);
const bvh = new MeshBVH(geoColision);
piezas.length = 0;

// ---------------------------------------------------------------- estado del jugador
const jugador = new THREE.Vector3();       // centro de la esfera alta de la cápsula
const velocidad = new THREE.Vector3();
let enSuelo = false, guinada = 0, cabeceo = 0;

function irA(lugar) {
  jugador.fromArray(lugar.pos).y -= OJOS;
  velocidad.set(0, 0, 0);
  const d = new THREE.Vector3().fromArray(lugar.mira).sub(new THREE.Vector3().fromArray(lugar.pos));
  guinada = Math.atan2(-d.x, -d.z);
  cabeceo = 0;
  $('lugares').classList.remove('abierto');
}
for (const l of datos.lugares) {
  const b = document.createElement('button');
  b.textContent = l.nombre;
  b.onclick = (e) => { e.stopPropagation(); irA(l); };
  $('lugares').append(b);
}
$('btn-lugares').onclick = (e) => { e.stopPropagation(); $('lugares').classList.toggle('abierto'); };
irA(datos.lugares[0]);
const sonido = crearSonido(datos, TACTIL);
$('btn-sonido').onclick = (e) => { e.stopPropagation(); $('btn-sonido').textContent = sonido.alternar() ? 'Sonido: sí' : 'Sonido: no'; };
const personajes = crearPersonajes({
  datos, mallas, matrizInstancia, jugador,
  alAbrir: () => { document.exitPointerLock?.(); teclas.clear(); },
});
window.santiago = { scene, camera, jugador, irA, datos, sonido, personajes };   // para inspeccionar desde la consola

// ---------------------------------------------------------------- controles
const teclas = new Set();
const mover = new THREE.Vector2();        // x: derecha, y: adelante (-1..1)
let correr = false, quiereSaltar = false;

addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; teclas.add(e.code); if (e.code === 'Space') quiereSaltar = true; });
addEventListener('keyup', (e) => teclas.delete(e.code));
renderer.domElement.addEventListener('click', () => { if (!TACTIL) renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); });
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  guinada -= e.movementX*0.0022;
  cabeceo = THREE.MathUtils.clamp(cabeceo - e.movementY*0.0022, -1.45, 1.45);
});

// táctil: mitad izquierda = palanca para caminar, mitad derecha = arrastrar para mirar
const palanca = $('palanca'), perilla = palanca.firstChild;
let dedoPalanca = null, origen = null, dedoMirar = null, ultimo = null;
const MAX = 50;
renderer.domElement.addEventListener('touchstart', (e) => {
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth/2 && dedoPalanca === null) {
      dedoPalanca = t.identifier; origen = { x: t.clientX, y: t.clientY };
      Object.assign(palanca.style, { display: 'block', left: `${t.clientX}px`, top: `${t.clientY}px` });
    } else if (dedoMirar === null) {
      dedoMirar = t.identifier; ultimo = { x: t.clientX, y: t.clientY };
    }
  }
  e.preventDefault();
}, { passive: false });
renderer.domElement.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === dedoPalanca) {
      let dx = t.clientX - origen.x, dy = t.clientY - origen.y;
      const l = Math.hypot(dx, dy);
      if (l > MAX) { dx *= MAX/l; dy *= MAX/l; }
      perilla.style.transform = `translate(${dx}px, ${dy}px)`;
      mover.set(dx/MAX, -dy/MAX);
      correr = l > MAX*1.6;
    } else if (t.identifier === dedoMirar) {
      guinada -= (t.clientX - ultimo.x)*0.005;
      cabeceo = THREE.MathUtils.clamp(cabeceo - (t.clientY - ultimo.y)*0.005, -1.45, 1.45);
      ultimo = { x: t.clientX, y: t.clientY };
    }
  }
  e.preventDefault();
}, { passive: false });
const soltar = (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === dedoPalanca) { dedoPalanca = null; mover.set(0, 0); correr = false; palanca.style.display = 'none'; perilla.style.transform = ''; }
    if (t.identifier === dedoMirar) dedoMirar = null;
  }
};
renderer.domElement.addEventListener('touchend', soltar);
renderer.domElement.addEventListener('touchcancel', soltar);
$('saltar').addEventListener('touchstart', (e) => { quiereSaltar = true; e.preventDefault(); }, { passive: false });

$('ayuda').textContent = TACTIL
  ? 'Izquierda: caminar · Derecha: mirar · Acércate a las personas para conversar'
  : 'Clic para mirar · WASD caminar · Shift correr · Espacio saltar · E hablar con las personas';
setTimeout(() => { $('ayuda').style.transition = 'opacity 1s'; $('ayuda').style.opacity = 0; }, 9000);

// ---------------------------------------------------------------- física de la cápsula
const caja = new THREE.Box3(), seg = new THREE.Line3(), pTri = new THREE.Vector3(), pCap = new THREE.Vector3(), delta = new THREE.Vector3();
const adelante = new THREE.Vector3(), derecha = new THREE.Vector3(), deseo = new THREE.Vector3();

function paso(dt) {
  // intención de movimiento según la vista
  let mx = mover.x, my = mover.y;
  if (teclas.has('KeyW') || teclas.has('ArrowUp')) my += 1;
  if (teclas.has('KeyS') || teclas.has('ArrowDown')) my -= 1;
  if (teclas.has('KeyD') || teclas.has('ArrowRight')) mx += 1;
  if (teclas.has('KeyA') || teclas.has('ArrowLeft')) mx -= 1;
  adelante.set(-Math.sin(guinada), 0, -Math.cos(guinada));
  derecha.set(Math.cos(guinada), 0, -Math.sin(guinada));
  deseo.set(0, 0, 0).addScaledVector(adelante, my).addScaledVector(derecha, mx);
  if (deseo.lengthSq() > 1) deseo.normalize();
  const rapidez = (correr || teclas.has('ShiftLeft') || teclas.has('ShiftRight')) ? CORRER : CAMINAR;
  const k = enSuelo ? 12 : 2;                        // en el aire casi no se corrige el rumbo
  velocidad.x += (deseo.x*rapidez - velocidad.x)*Math.min(1, k*dt);
  velocidad.z += (deseo.z*rapidez - velocidad.z)*Math.min(1, k*dt);
  if (quiereSaltar && enSuelo) velocidad.y = SALTO;
  quiereSaltar = false;
  velocidad.y += GRAVEDAD*dt;
  jugador.addScaledVector(velocidad, dt);

  // empujar la cápsula fuera de los triángulos que la atraviesan
  seg.start.copy(SEGMENTO.start).add(jugador);
  seg.end.copy(SEGMENTO.end).add(jugador);
  caja.makeEmpty().expandByPoint(seg.start).expandByPoint(seg.end);
  caja.min.addScalar(-RADIO); caja.max.addScalar(RADIO);
  bvh.shapecast({
    intersectsBounds: (b) => b.intersectsBox(caja),
    intersectsTriangle: (tri) => {
      const d = tri.closestPointToSegment(seg, pTri, pCap);
      if (d < RADIO) {
        const dir = pCap.sub(pTri).normalize();
        seg.start.addScaledVector(dir, RADIO - d);
        seg.end.addScaledVector(dir, RADIO - d);
      }
    },
  });
  delta.subVectors(seg.start, jugador);
  const antes = enSuelo, caida = velocidad.y;
  enSuelo = delta.y > Math.abs(dt*velocidad.y*0.25);
  if (enSuelo && !antes && caida < -3.5) sonido.paso(true);
  const off = Math.max(0, delta.length() - 1e-5);
  delta.normalize().multiplyScalar(off);
  jugador.add(delta);
  if (enSuelo) velocidad.y = Math.max(0, velocidad.y);
  else if (off > 0) { delta.normalize(); velocidad.addScaledVector(delta, -delta.dot(velocidad)); }
}

// ---------------------------------------------------------------- bucle
const reloj = new THREE.Clock();
let cuadros = 0, acumulado = 0, recorrido = 0;
function animar() {
  const dt = Math.min(reloj.getDelta(), 0.1);
  const sub = 5;
  for (let i = 0; i < sub; i++) paso(dt/sub);
  if (jugador.y < -30) irA(datos.lugares[0]);
  // pasos: uno cada cierta distancia recorrida sobre el suelo
  const rapidez = Math.hypot(velocidad.x, velocidad.z);
  if (enSuelo && rapidez > 0.5) {
    recorrido += rapidez*dt;
    if (recorrido > (rapidez > 5 ? 0.95 : 0.7)) { recorrido = 0; sonido.paso(); }
  }
  camera.position.copy(jugador).y += OJOS;
  camera.rotation.set(cabeceo, guinada, 0);
  luzSol.position.copy(jugador).addScaledVector(sol, 150);
  luzSol.target.position.copy(jugador);
  sonido.actualizar(camera);
  personajes.actualizar();
  renderer.render(scene, camera);

  // calidad automática: baja si va lento por varios segundos, sube si sobra holgura
  cuadros++; acumulado += dt;
  if (acumulado > 3) {
    const fps = cuadros/acumulado;
    if (calidadAuto) {
      if (fps < 26 && calidad !== 'baja') { calidad = calidad === 'alta' ? 'media' : 'baja'; aplicarCalidad(); }
      else if (fps > 55 && calidad === 'baja') { calidad = 'media'; aplicarCalidad(); }
    }
    cuadros = 0; acumulado = 0;
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

// primer cuadro para compilar los materiales antes de mostrar el botón
camera.position.copy(jugador).y += OJOS;
camera.rotation.set(cabeceo, guinada, 0);
renderer.compile(scene, camera);
$('barra').firstChild.style.width = '100%';
$('estado').textContent = `${Object.keys(datos.instancias).length} edificios y objetos · ${llamadas} mallas`;
$('entrar').style.display = 'block';
$('entrar').onclick = () => {
  $('carga').style.display = 'none';
  sonido.iniciar();
  reloj.getDelta();
  renderer.setAnimationLoop(animar);
  if (!TACTIL) renderer.domElement.requestPointerLock?.()?.catch?.(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
};
