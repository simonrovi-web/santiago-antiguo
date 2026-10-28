// Santiago Antiguo — paseo en primera persona para celular y computador (Three.js + three-mesh-bvh)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { crearSonido } from './sonido.js';
import { crearPersonajes } from './personajes.js';
import { crearAgentes } from './agentes.js';
import { crearMenu } from './menu.js';
import { crearBrujula } from './brujula.js';
import { crearMisiones } from './misiones.js';
import { crearPuertas } from './puertas.js';
import { crearModos, MODOS, MOMENTOS } from './modos.js';
import { crearAventuras } from './aventuras.js';
import { crearVida } from './vida.js';
import { crearComunidad } from './comunidad.js';
import { SITIOS } from './modos.js';

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
scene.fog = new THREE.Fog(CIELO, 60, TACTIL ? 220 : 420);
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 2000);
camera.rotation.order = 'YXZ';

// sol, cielo y luces (la hora del día las ajusta en ponerHora)
const sol = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(50), THREE.MathUtils.degToRad(35));
const cielo = new Sky();
cielo.scale.setScalar(1800);
cielo.material.uniforms.turbidity.value = 6;
cielo.material.uniforms.rayleigh.value = 1.4;
cielo.material.uniforms.sunPosition.value.copy(sol);
scene.add(cielo);
const luzCielo = new THREE.HemisphereLight('#dfe8f0', '#7a6a55', 1.3);
scene.add(luzCielo);
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
let calidad = TACTIL ? 'media' : 'alta', calidadAuto = true, sombras = true, noche = 0, detalleCalidad = 1;
function aplicarCalidad() {
  const c = CALIDADES[calidad];
  renderer.setPixelRatio(c.px);
  detalleCalidad = { baja: 0.5, media: 0.75, alta: 1 }[calidad];
  luzSol.castShadow = sombras && c.sombra > 0;
  if (c.sombra) {
    luzSol.shadow.mapSize.set(c.sombra, c.sombra);
    luzSol.shadow.map?.dispose();
    luzSol.shadow.map = null;
    const s = c.sombra > 1024 ? 70 : 45;
    Object.assign(luzSol.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 400 });
    luzSol.shadow.camera.updateProjectionMatrix();
  }
}
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
await new Promise((r) => { requestAnimationFrame(r); setTimeout(r, 120); });   // deja pintar el aviso (o sigue si la pestaña está oculta)

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
  const nodo = colision.scene.getObjectByName(asset) || colision.scene.getObjectByName(asset + "001");   // Blender agrega .001 si el nombre ya existe
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
const agentes = crearAgentes({ datos, mallas, jugador, sonido });
const puertas = crearPuertas({ datos, mallas, jugador, sonido });
const personajes = crearPersonajes({
  datos, agentes, jugador, sonido,
  alAbrir: () => { document.exitPointerLock?.(); teclas.clear(); },
});

// ---------------------------------------------------------------- hora del día
// Santiago está en el hemisferio sur: el sol sale por el oriente (+x), pasa por el norte (-z) y se pone al poniente
const luzFarol = [], FAROLES = (datos.instancias.SM_Farol || []).map(([x, y, z]) => new THREE.Vector3(x, y + 3.3, z));
for (let i = 0; i < (TACTIL ? 4 : 8); i++) {
  const l = new THREE.PointLight('#ffbf6e', 0, 16, 1.6);
  scene.add(l);
  luzFarol.push(l);
}
const matsNoche = [];
scene.traverse((o) => {
  if (!o.isMesh || matsNoche.some(([m]) => m === o.material)) return;
  if (/Luz_Farol/.test(o.material.name)) matsNoche.push([o.material, '#ffd49a', 4]);
  else if (/^Vidrio/.test(o.material.name)) matsNoche.push([o.material, '#ffae55', 0.5]);
});
const cDia = new THREE.Color('#c9d4dc'), cOcaso = new THREE.Color('#d8a184'), cNoche = new THREE.Color('#0b1220');
const sDia = new THREE.Color('#fff1dc'), sOcaso = new THREE.Color('#ff9a55'), luna = new THREE.Color('#9fb6e0');
const lerp = THREE.MathUtils.lerp, suave = THREE.MathUtils.smoothstep;
let vida = null;
let hora = 10.5, nubes = 0, lejania = TACTIL ? 220 : 420;
const gris = new THREE.Color('#8b929a');
function ponerHora(h) {
  hora = ((h % 24) + 24) % 24;
  const t = (hora - 6.9)/(20.1 - 6.9);                   // 0 al salir el sol, 1 al ponerse
  const alto = Math.sin(t*Math.PI)*THREE.MathUtils.degToRad(64);
  const horiz = new THREE.Vector3(Math.cos(t*Math.PI), 0, -0.55).normalize();
  sol.copy(horiz).multiplyScalar(Math.cos(alto)).setY(Math.sin(alto)).normalize();
  const dia = suave(sol.y, -0.04, 0.22), ocaso = (1 - suave(sol.y, 0.04, 0.3))*dia;
  noche = 1 - suave(sol.y, -0.12, 0.06);
  cielo.material.uniforms.sunPosition.value.copy(sol);
  cielo.visible = sol.y > -0.25;
  // de noche la luna ilumina desde lo alto con luz fría y tenue
  if (sol.y > 0) { luzSol.color.copy(sDia).lerp(sOcaso, ocaso); luzSol.intensity = 2.6*dia; }
  else { sol.set(0.35, 0.85, 0.4).normalize(); luzSol.color.copy(luna); luzSol.intensity = 0.35; }
  luzCielo.intensity = lerp(0.12, 1.3, dia);
  luzCielo.color.set(dia > 0.5 ? '#dfe8f0' : '#8aa0c8');
  luzSol.intensity *= 1 - 0.7*nubes;
  luzCielo.intensity *= 1 - 0.25*nubes;
  cielo.material.uniforms.turbidity.value = 6 + 14*nubes;
  cielo.material.uniforms.rayleigh.value = 1.4 + 2*nubes;
  const fondo = cDia.clone().lerp(cOcaso, ocaso).lerp(gris, 0.65*nubes*dia).lerp(cNoche, noche);
  scene.fog.color.copy(fondo);
  scene.background = cielo.visible ? null : fondo;
  renderer.toneMappingExposure = lerp(0.9, 1.15, noche);
  for (const [m, color, k] of matsNoche) { m.emissive.set(color); m.emissiveIntensity = k*noche; }
  sonido.nocturno(noche > 0.5);
}
let tFaroles = 0;
function encenderFaroles(dt) {
  if ((tFaroles -= dt) > 0) return;
  tFaroles = 0.5;
  const cercanos = noche > 0.05 ? FAROLES.map((p) => [p.distanceToSquared(jugador), p]).sort((a, b) => a[0] - b[0]).slice(0, luzFarol.length) : [];
  luzFarol.forEach((l, i) => {
    l.intensity = cercanos[i] ? 22*noche : 0;
    if (cercanos[i]) l.position.copy(cercanos[i][1]);
  });
}

// ---------------------------------------------------------------- menú de opciones
let sensibilidad = 1, invertir = 1, correrSiempre = false, ciclo = false, verFps = false;
const menu = crearMenu({
  tactil: TACTIL,
  aplicar(id, v, todo) {
    if (id.startsWith('vol_') || id === 'silencio') {
      const g = todo.silencio ? 0 : 1;
      for (const c of ['general', 'ambiente', 'naturaleza', 'ciudad', 'pasos']) sonido.volumen(c, g*todo['vol_' + c]/100);
      sonido.volumen('voces', g*todo.vol_voz/100);
      personajes.voz({ volumen: g*todo.vol_voz/100 });
    }
    else if (id === 'hora') ponerHora(v);
    else if (id === 'ciclo') ciclo = v;
    else if (id === 'calidad') { calidadAuto = v === 'auto'; calidad = calidadAuto ? (TACTIL ? 'media' : 'alta') : v; aplicarCalidad(); }
    else if (id === 'sombras') { sombras = v; aplicarCalidad(); }
    else if (id === 'distancia') { lejania = v; scene.fog.far = v*(1 - 0.45*nubes); scene.fog.near = scene.fog.far*0.15; }
    else if (id === 'clima') {
      nubes = { despejado: 0, nublado: 0.6, lluvia: 1 }[v] ?? 0;
      vida?.clima(v);
      scene.fog.far = lejania*(1 - 0.45*nubes); scene.fog.near = scene.fog.far*0.15;
      ponerHora(hora);
    }
    else if (id === 'fov') { camera.fov = v; camera.updateProjectionMatrix(); }
    else if (id === 'fps') { verFps = v; $('fps').style.display = v ? 'block' : 'none'; }
    else if (id === 'sensibilidad') sensibilidad = v/100;
    else if (id === 'invertir') invertir = v ? -1 : 1;
    else if (id === 'correr') correrSiempre = v;
    else if (id === 'mira') $('mira').style.display = v ? 'block' : 'none';
    else if (id === 'voz') personajes.voz({ activa: v });
    else if (id === 'vel_voz') personajes.voz({ velocidad: v/100 });
    else if (id === 'gente') agentes.enMarcha(v);
    else if (id === 'charla_libre') personajes.permitirTexto(v);
  },
  acciones: {
    alAbrir: () => { document.exitPointerLock?.(); teclas.clear(); mover.set(0, 0); $('lugares').classList.remove('abierto'); },
    plaza: () => irA(datos.lugares[0]),
  },
});
$('btn-menu').onclick = (e) => { e.stopPropagation(); menu.alternar(); };
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || personajes.abierto()) return;
  if (e.code === 'KeyM' || (e.code === 'Escape' && !document.pointerLockElement)) menu.alternar();
});
// en el computador, Esc suelta el mouse: aprovechar para abrir el menú (como en los juegos)
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && $('carga').style.display === 'none' && !menu.abierto() && !personajes.abierto()) menu.abrir();
});
// ---------------------------------------------------------------- misión del cartero y brújula
const rayo = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
const suelo = (x, yDesde, z) => { rayo.origin.set(x, yDesde, z); const h = bvh.raycastFirst(rayo, THREE.DoubleSide); return h ? h.point.y : null; };
function toast(texto, ms = 4500) {
  const t = document.createElement('div');
  t.className = 'aviso';
  t.textContent = texto;
  $('avisos').append(t);
  setTimeout(() => t.classList.add('fuera'), ms);
  setTimeout(() => t.remove(), ms + 600);
}
const misiones = crearMisiones({ datos, ciudad, scene, suelo, jugador, personajes, toast });
const modos = crearModos({ datos, jugador, suelo, toast, misiones });
misiones.conectar(modos);
misiones.activar(false);
// fotografía de lo que se ve (sin la interfaz), para la portada del reportero
const fotografiar = () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/jpeg', 0.85); };
const aventuras = crearAventuras({ datos, ciudad, scene, suelo, jugador, personajes, toast, sonido, modos, fotografiar });
modos.conectarAventuras(aventuras);
vida = crearVida({ datos, scene, camera, jugador, suelo, sonido, agentes });
vida.clima(menu.valor('clima'));
// el lugar con nombre más cercano (para rotular las postales)
const lugarCercano = () => {
  let mejor = null, dmin = 60;
  for (const s of SITIOS) if (s.pos) { const d = Math.hypot(jugador.x - s.pos.x, jugador.z - s.pos.z); if (d < dmin) { dmin = d; mejor = s.nombre; } }
  return mejor;
};
const comunidad = crearComunidad({ scene, jugador, toast, modos, lugarCercano });
$('btn-postal').onclick = (e) => { e.stopPropagation(); comunidad.escribir(); };
const brujula = crearBrujula();
$('btn-mision').onclick = (e) => { e.stopPropagation(); misiones.alternarPanel(); };
addEventListener('keydown', (e) => { if (e.target.tagName !== 'INPUT' && e.code === 'KeyJ') misiones.alternarPanel(); });
// todos los lugares importantes de la ciudad, frente a su fachada
const yaListados = new Set(datos.lugares.map((l) => l.nombre));
for (const [nombre, ancla, dist] of SITIOS.filter((s) => s.ancla && !['plaza', 'catedral', 'portales', 'moneda'].includes(s.id) && !yaListados.has(s.nombre)).map((s) => [s.nombre, s.ancla, s.radio + 10])) {
  const inst = datos.instancias[ancla]?.[0];
  if (!inst) continue;
  const [x, y, z, g] = inst;
  // la fachada mira hacia -y local: en el mundo glTF, hacia (sin g, cos g) en (x, z)
  const fx = Math.sin(g), fz = Math.cos(g);
  const l = { nombre, pos: [x + fx*dist, y + 1.65, z + fz*dist], mira: [x, y + 6, z] };
  const b = document.createElement('button');
  b.textContent = nombre;
  b.onclick = (e) => { e.stopPropagation(); irA(l); };
  $('lugares').append(b);
}
window.santiago = { scene, camera, jugador, irA, datos, sonido, personajes, agentes, menu, ponerHora, misiones };   // para inspeccionar desde la consola

// ---------------------------------------------------------------- controles
const teclas = new Set();
const mover = new THREE.Vector2();        // x: derecha, y: adelante (-1..1)
let correr = false, quiereSaltar = false;

addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; teclas.add(e.code); if (e.code === 'Space') quiereSaltar = true; });
addEventListener('keyup', (e) => teclas.delete(e.code));
renderer.domElement.addEventListener('click', () => { if (!TACTIL) renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); });
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  guinada -= e.movementX*0.0022*sensibilidad;
  cabeceo = THREE.MathUtils.clamp(cabeceo - e.movementY*0.0022*sensibilidad*invertir, -1.45, 1.45);
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
      guinada -= (t.clientX - ultimo.x)*0.005*sensibilidad;
      cabeceo = THREE.MathUtils.clamp(cabeceo - (t.clientY - ultimo.y)*0.005*sensibilidad*invertir, -1.45, 1.45);
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
  const rapidez = (correr || correrSiempre || teclas.has('ShiftLeft') || teclas.has('ShiftRight')) ? CORRER : CAMINAR;
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
let cuadros = 0, acumulado = 0, recorrido = 0, tHora = 0;
const adelanteVista = new THREE.Vector3();
// ¿el jugador está bajo techo? Un rayo hacia arriba y cuatro hacia los lados: techo y al menos tres
// muros alrededor significa estar adentro (bajo un árbol no cuenta)
const rayoInterior = new THREE.Ray(), dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let tInterior = 0, adentro = 0, adentroMeta = 0;
function detectarInterior(dt) {
  if ((tInterior -= dt) <= 0) {
    tInterior = 0.25;
    const o = camera.position;
    rayoInterior.origin.copy(o); rayoInterior.direction.set(0, 1, 0);
    const techo = bvh.raycastFirst(rayoInterior, THREE.DoubleSide, 0, 22);
    let muros = 0;
    if (techo) for (const [dx, dz] of dirs) {
      rayoInterior.origin.copy(o); rayoInterior.direction.set(dx, 0, dz);
      if (bvh.raycastFirst(rayoInterior, THREE.DoubleSide, 0, 30)) muros++;
    }
    // con techo: 3 o 4 muros es adentro; 2 es un lugar semiabierto (un portal, un zaguán)
    adentroMeta = !techo ? 0 : muros >= 3 ? 1 : muros === 2 ? 0.5 : 0;
  }
  const antes = adentro;
  adentro += (adentroMeta - adentro)*Math.min(1, dt*4);
  if (Math.abs(adentro - antes) > 0.002 || (tInterior === 0.25)) { sonido.interior(adentro); vida?.techo(adentro > 0.5); }
}
// los conjuntos que quedan enteros más allá de la niebla no se dibujan (alivia mucho al celular)
const lejanos = scene.children.filter((o) => o.isInstancedMesh && o.frustumCulled && o.boundingSphere && o.boundingSphere.radius < 150);
let tLejanos = 0;
// nivel de detalle por distancia: los interiores, los detalles chicos y los objetos menudos de cada
// edificio solo se dibujan cerca. Cada material de cada asset es un InstancedMesh: se dejan al comienzo
// las instancias cercanas y se recorta el conteo. (No se tocan las mallas con puertas ni las animadas,
// porque usan el índice de instancia.)
const INTERIOR = /^(Cielo_Yeso|Enlucido|Piso_Madera|Madera_Mueble|Alfombra|Papel_Mural|Tela_|Lienzo|Libros|Loza|Cortina|Sabana|Tela_Blanca|Dorado)/;
const DETALLE = /^(Hierro_Forjado|Hierro_Verde|Bronce|Escudo_|Luz_Farol|Cobre|Crin|Piel|Naranja|Flor_)/;
const MENUDOS = /^SM_(Farol|Banco|Poste_|Placa_Calle|Grifo|Pilon|Bebedero|Tendedero|Peaton_Sentado|Canon|Asta|Monumento|Tinaja|Chimenea)/;
const porDistancia = [];
for (const [asset, ims] of Object.entries(mallas)) {
  for (const im of ims) {
    if (im.geometry.getAttribute('aHoja') || im.geometry.getAttribute('aAnim') || im.count < 1) continue;
    const nombre = im.material.name;
    // sin alcance propio: se dibuja mientras esté dentro de la niebla y delante de la cámara
    const alcance = MENUDOS.test(asset) ? 70 : INTERIOR.test(nombre) ? 28 : DETALLE.test(nombre) ? 60 : Infinity;
    if (!im.geometry.boundingSphere) im.geometry.computeBoundingSphere();
    const bs = im.geometry.boundingSphere;
    const original = im.instanceMatrix.array.slice();
    const centros = [];
    // centro de cada instancia: la esfera de la geometría trasladada (el giro se cubre agrandando el radio)
    for (let i = 0; i < im.count; i++) centros.push([original[i*16 + 12] + original[i*16]*bs.center.x + original[i*16 + 8]*bs.center.z, original[i*16 + 13] + bs.center.y, original[i*16 + 14] + original[i*16 + 2]*bs.center.x + original[i*16 + 10]*bs.center.z]);
    porDistancia.push({ im, original, centros, alcance, radio: bs.radius + 2, total: im.count });
    im.frustumCulled = false;
  }
}
const frustum = new THREE.Frustum(), mvp = new THREE.Matrix4(), esfera = new THREE.Sphere();
function recortarLejanos(dt) {
  if ((tLejanos -= dt) > 0) return;
  tLejanos = 0.15;
  camera.updateMatrixWorld();
  frustum.setFromProjectionMatrix(mvp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  for (const im of lejanos) im.visible = im.boundingSphere.center.distanceTo(camera.position) - im.boundingSphere.radius < scene.fog.far + 20;
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  for (const d of porDistancia) {
    const lim = Math.min(d.alcance*detalleCalidad*(TACTIL ? 0.85 : 1), scene.fog.far + d.radio);
    const r2 = lim*lim, arr = d.im.instanceMatrix.array;
    let n = 0;
    for (let i = 0; i < d.total; i++) {
      const [x, y, z] = d.centros[i];
      const dd = (x - cx)**2 + (y - cy)**2 + (z - cz)**2;
      if (dd > r2) continue;
      // lo cercano se dibuja siempre (sus sombras caen a la vista aunque esté detrás de la cámara)
      if (dd > (30 + d.radio)**2) {
        esfera.center.set(x, y, z); esfera.radius = d.radio*1.15 + 3;
        if (!frustum.intersectsSphere(esfera)) continue;
      }
      arr.set(d.original.subarray(i*16, i*16 + 16), n*16); n++;
    }
    d.im.count = n;
    if (n) d.im.instanceMatrix.needsUpdate = true;
  }
}
function animar() { cuadro(Math.min(reloj.getDelta(), 0.1)); }
function cuadro(dt) {
  const sub = 5;
  agentes.actualizar(dt);
  recortarLejanos(dt);
  for (let i = 0; i < sub; i++) paso(dt/sub);
  agentes.empujar();
  puertas.empujar();
  if (jugador.y < -30) irA(datos.lugares[0]);
  // pasos: uno cada cierta distancia recorrida sobre el suelo
  const rapidez = Math.hypot(velocidad.x, velocidad.z);
  if (enSuelo && rapidez > 0.5) {
    recorrido += rapidez*dt;
    if (recorrido > (rapidez > 5 ? 0.95 : 0.7)) { recorrido = 0; sonido.paso(); }
  }
  camera.position.copy(jugador).y += OJOS;
  camera.rotation.set(cabeceo, guinada, 0);
  if (ciclo) {
    hora += dt/120;                                     // una hora del juego cada dos minutos
    if ((tHora -= dt) <= 0) { tHora = 0.25; ponerHora(hora); if (menu.abierto()) menu.ponerHora(hora); }
  }
  encenderFaroles(dt);
  luzSol.position.copy(jugador).addScaledVector(sol, 150);
  luzSol.target.position.copy(jugador);
  sonido.actualizar(camera);
  personajes.actualizar();
  misiones.actualizar(reloj.elapsedTime);
  modos.actualizar(dt);
  aventuras.actualizar(dt, reloj.elapsedTime);
  vida.actualizar(dt, reloj.elapsedTime);
  detectarInterior(dt);
  comunidad.actualizar(dt, reloj.elapsedTime);
  puertas.actualizar(dt, adelanteVista.set(-Math.sin(guinada), 0, -Math.cos(guinada)));
  const obj = misiones.objetivo();
  brujula.actualizar(-guinada*180/Math.PI, jugador, obj?.a ? { x: obj.a.pos.x, z: obj.a.pos.z, nombre: obj.a.def.nombre } : modos.objetivo());
  renderer.render(scene, camera);

  // calidad automática: baja si va lento por varios segundos, sube si sobra holgura
  cuadros++; acumulado += dt;
  if (acumulado > (verFps ? 1 : 3)) {
    const fps = cuadros/acumulado;
    if (verFps) $('fps').textContent = `${Math.round(fps)} fps · ${calidad}`;
    if (ciclo) menu.ponerHora(hora, true);
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

// ---------------------------------------------------------------- pantalla de inicio: modalidad, momento del día y nombre
let jugando = false, momento = null;
function pintarInicio() {
  const r = modos.guardado().records;
  $('modos').innerHTML = MODOS.map((m) => `<button data-modo="${m.id}"><span>${m.icono}</span><b>${m.nombre}</b><small>${m.texto}</small>
    ${r[m.id] ? `<em>Récord: ${r[m.id]} pts</em>` : ''}</button>`).join('');
  $('momentos').innerHTML = MOMENTOS.map(([n, h]) => `<button data-hora="${h}" class="${momento === h ? 'activo' : ''}">${n}</button>`).join('');
  $('nombre').value = modos.nombre() || '';
  $('modos').querySelectorAll('button').forEach((b) => { b.onclick = () => entrar(b.dataset.modo); });
  $('momentos').querySelectorAll('button').forEach((b) => { b.onclick = () => { momento = +b.dataset.hora; menu.poner('hora', momento); pintarInicio(); }; });
}
function entrar(id) {
  modos.nombre($('nombre').value.trim());
  $('carga').style.display = 'none';
  sonido.iniciar();
  modos.empezar(id);
  if (id !== 'cartero') irA(datos.lugares[0]);
  if (!jugando) { jugando = true; reloj.getDelta(); renderer.setAnimationLoop(animar); }
  if (!TACTIL) renderer.domElement.requestPointerLock?.()?.catch?.(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}
function mostrarInicio() {
  document.exitPointerLock?.();
  menu.cerrar();
  pintarInicio();
  $('carga').classList.add('listo');
  $('carga').style.display = 'flex';
}
$('btn-album').onclick = () => modos.album();
$('carga').classList.add('listo');
pintarInicio();
window.santiago.modos = modos;
// para pruebas: avanza el juego s segundos a 30 cuadros por segundo (aunque la pestaña no se vea)
window.santiago.simular = (seg) => { for (let i = 0; i < seg*30; i++) cuadro(1/30); };
window.santiago.entrar = entrar;
window.santiago.teclas = teclas;
Object.assign(window.santiago, { renderer, vida, puertas, aventuras, bvh, mallas });
window.santiago.mostrarInicio = mostrarInicio;
document.addEventListener('santiago-inicio', mostrarInicio);
