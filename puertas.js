// Puertas que se abren y se cierran. Las puertas de dos hojas vienen cerradas en el modelo; el exportador
// registra sus jambas y el lado de adentro. Aquí se marcan los vértices de cada hoja dentro de la malla de
// su edificio y el shader las gira sobre su bisagra según una textura con el ángulo de cada hoja de cada
// instancia. Las hojas cerradas bloquean el paso (colisión propia, porque se mueven).
import * as THREE from 'three';

const ABIERTA = 1.4;          // radianes que gira una hoja abierta
const ALCANCE = 2.4;          // metros para poder abrir una puerta

const GLSL_COMUN = /* glsl */`
attribute float aHoja;        // índice de la hoja dentro del edificio (-1: no es puerta)
attribute vec3 aBisagra;      // x, z de la bisagra (coordenadas del edificio) y sentido de giro
uniform sampler2D uPuertas;   // ángulo de cada hoja (columna) en cada instancia (fila)
vec2 rotarY(vec2 d, float a) { float c = cos(a), s = sin(a); return vec2(d.x*c + d.y*s, -d.x*s + d.y*c); }`;

export function crearPuertas({ datos, mallas, jugador, sonido }) {
  const puertas = [];             // una por puerta de cada instancia
  const porAsset = {};

  for (const [asset, lista] of Object.entries(datos.puertas || {})) {
    const inst = datos.instancias[asset];
    if (!inst || !mallas[asset]) continue;
    const nHojas = lista.length*2;
    // hojas: bisagra en una jamba, borde libre al centro; el sentido hace que gire hacia adentro
    const hojas = [];
    lista.forEach(([ax, az, bx, bz, ix, iz, y0, alto]) => {
      const mx = (ax + bx)/2, mz = (az + bz)/2;
      for (const [hx, hz] of [[ax, az], [bx, bz]]) {
        const ux = mx - hx, uz = mz - hz;
        const [rx, rz] = [ux*Math.cos(0.3) + uz*Math.sin(0.3), -ux*Math.sin(0.3) + uz*Math.cos(0.3)];
        const sentido = (rx - ux)*(ix - mx) + (rz - uz)*(iz - mz) > 0 ? 1 : -1;
        hojas.push({ hx, hz, sentido });
      }
    });
    // marcar los vértices de cada hoja en todas las mallas (una por material) del edificio
    let alguna = false;
    for (const im of mallas[asset]) {
      const pos = im.geometry.getAttribute('position');
      const hoja = new Float32Array(pos.count).fill(-1), bis = new Float32Array(pos.count*3);
      let n = 0;
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
        for (let k = 0; k < lista.length; k++) {
          const [ax, az, bx, bz, , , y0, alto] = lista[k];
          if (y < y0 - 0.02 || y > y0 + alto - 0.005) continue;   // la hoja llega a 1 cm del montante; los fierros del montante parten justo en el alto
          const dx = bx - ax, dz = bz - az, l2 = dx*dx + dz*dz;
          const t = ((x - ax)*dx + (z - az)*dz)/l2;
          if (t < 0.004 || t > 0.996) continue;
          const perp = Math.abs((x - ax)*dz - (z - az)*dx)/Math.sqrt(l2);
          if (perp > 0.13) continue;
          const h = 2*k + (t < 0.5 ? 0 : 1);
          hoja[v] = h; bis[v*3] = hojas[h].hx; bis[v*3 + 1] = hojas[h].hz; bis[v*3 + 2] = hojas[h].sentido;
          n++;
          break;
        }
      }
      if (!n) continue;
      alguna = true;
      im.geometry.setAttribute('aHoja', new THREE.BufferAttribute(hoja, 1));
      im.geometry.setAttribute('aBisagra', new THREE.BufferAttribute(bis, 3));
      im.userData.conPuertas = true;
    }
    if (!alguna) continue;
    // textura de ángulos: columna = hoja, fila = instancia
    const datosTex = new Float32Array(nHojas*inst.length);
    const tex = new THREE.DataTexture(datosTex, nHojas, inst.length, THREE.RedFormat, THREE.FloatType);
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    porAsset[asset] = { tex, datosTex, nHojas };
    for (const im of mallas[asset]) {
      if (!im.userData.conPuertas) continue;
      const base = im.material;
      const mat = base.clone();
      const prevCompile = base.onBeforeCompile;
      mat.onBeforeCompile = (sh, r) => {
        prevCompile?.call(base, sh, r);
        sh.uniforms.uPuertas = { value: tex };
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\n' + GLSL_COMUN)
          .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
  float angPuerta = 0.0;
  if (aHoja > -0.5) {
    angPuerta = texelFetch(uPuertas, ivec2(int(aHoja + 0.5), gl_InstanceID), 0).r*aBisagra.z;
    objectNormal.xz = rotarY(objectNormal.xz, angPuerta);
  }`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
  if (aHoja > -0.5) transformed.xz = aBisagra.xy + rotarY(transformed.xz - aBisagra.xy, angPuerta);`);
      };
      mat.customProgramCacheKey = () => 'puertas';
      im.material = mat;
    }
    // cada puerta de cada instancia, en coordenadas del mundo (para abrirla y para chocar con ella)
    inst.forEach(([x, y, z, g], i) => {
      const c = Math.cos(g), s = Math.sin(g);
      const mundo = (px, pz) => [x + px*c + pz*s, z - px*s + pz*c];
      lista.forEach(([ax, az, bx, bz, ix, iz, y0, alto], k) => {
        const [wax, waz] = mundo(ax, az), [wbx, wbz] = mundo(bx, bz), [wix, wiz] = mundo(ix, iz);
        puertas.push({ asset, i, k, a: [wax, waz], b: [wbx, wbz], m: [(wax + wbx)/2, (waz + wbz)/2], dentro: [wix, wiz],
          y: y + y0, alto, angulo: 0, meta: 0 });
      });
    });
  }

  // índice espacial simple (celdas de 16 m) para encontrar puertas cercanas
  const celdas = new Map();
  const clave = (x, z) => `${Math.floor(x/16)},${Math.floor(z/16)}`;
  for (const p of puertas) {
    const kk = clave(p.m[0], p.m[1]);
    if (!celdas.has(kk)) celdas.set(kk, []);
    celdas.get(kk).push(p);
  }
  function cercanas(x, z) {
    const r = [];
    const cx = Math.floor(x/16), cz = Math.floor(z/16);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = celdas.get(`${cx + i},${cz + j}`); if (l) r.push(...l); }
    return r;
  }

  const animando = new Set();
  function alternar(p) {
    p.meta = p.meta > 0 ? 0 : ABIERTA;
    animando.add(p);
    sonido?.puerta([p.m[0], p.y + 1.2, p.m[1]], p.meta > 0);
  }

  // ---- botón para abrir o cerrar la puerta que se tiene enfrente
  const boton = document.createElement('button');
  boton.id = 'puerta';
  document.body.append(boton);
  let enfrente = null;
  boton.onclick = (e) => { e.stopPropagation(); if (enfrente) alternar(enfrente); };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'KeyF' && enfrente) { e.preventDefault(); alternar(enfrente); }
  });

  let tBusca = 0;
  return {
    cantidad: puertas.length,
    actualizar(dt, adelante) {
      // animación de las hojas
      for (const p of animando) {
        const d = p.meta - p.angulo;
        p.angulo += Math.sign(d)*Math.min(Math.abs(d), dt*2.6);
        const pa = porAsset[p.asset];
        pa.datosTex[p.i*pa.nHojas + 2*p.k] = p.angulo;
        pa.datosTex[p.i*pa.nHojas + 2*p.k + 1] = p.angulo;
        pa.tex.needsUpdate = true;
        if (p.angulo === p.meta) animando.delete(p);
      }
      if ((tBusca -= dt) > 0) return;
      tBusca = 0.15;
      // la puerta más cercana que se tiene delante (o al lado, si está muy cerca)
      let mejor = null, dmin = ALCANCE;
      for (const p of cercanas(jugador.x, jugador.z)) {
        if (Math.abs(jugador.y - 1.45 - p.y) > 1.6) continue;
        const dx = p.m[0] - jugador.x, dz = p.m[1] - jugador.z, d = Math.hypot(dx, dz);
        if (d < dmin && (d < 1.2 || (dx*adelante.x + dz*adelante.z)/d > 0.35)) { dmin = d; mejor = p; }
        // las que quedaron abiertas se cierran solas cuando uno se aleja
        if (p.meta > 0 && d > 14) alternar(p);
      }
      if (mejor !== enfrente || (mejor && boton.dataset.abierta !== String(mejor.meta > 0))) {
        enfrente = mejor;
        boton.style.display = mejor ? 'block' : 'none';
        if (mejor) {
          boton.dataset.abierta = String(mejor.meta > 0);
          boton.textContent = mejor.meta > 0 ? '🚪 Cerrar la puerta (F)' : '🚪 Abrir la puerta (F)';
        }
      }
    },
    // las hojas cerradas (o casi) son una pared: empujar al jugador fuera de ellas
    empujar() {
      for (const p of cercanas(jugador.x, jugador.z)) {
        if (p.angulo > 0.5 || jugador.y - 1.45 > p.y + p.alto || jugador.y < p.y - 0.5) continue;
        const [ax, az] = p.a, [bx, bz] = p.b;
        const dx = bx - ax, dz = bz - az, l2 = dx*dx + dz*dz;
        const t = Math.max(0, Math.min(1, ((jugador.x - ax)*dx + (jugador.z - az)*dz)/l2));
        const qx = ax + dx*t, qz = az + dz*t;
        const ex = jugador.x - qx, ez = jugador.z - qz, d = Math.hypot(ex, ez), min = 0.42;
        if (d < min) {
          // hacia el lado en que ya estaba el jugador (si está justo encima, hacia afuera)
          let nx = ex/(d || 1), nz = ez/(d || 1);
          if (d < 1e-3) { nx = -(p.dentro[0] - p.m[0]); nz = -(p.dentro[1] - p.m[1]); const l = Math.hypot(nx, nz); nx /= l; nz /= l; }
          jugador.x = qx + nx*min; jugador.z = qz + nz*min;
        }
      }
    },
  };
}
