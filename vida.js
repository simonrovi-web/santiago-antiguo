// Vida de la ciudad: perros callejeros, palomas en la plaza, lluvia, pregones de los vendedores
// y la banda que toca retretas en la glorieta de la Plaza de Armas.
import * as THREE from 'three';

const PREGONES = ['mote', 'diarios', 'flores', 'empanadas', 'motemei', 'agua', 'tortillas'];

export function crearVida({ datos, scene, camera, jugador, suelo, sonido, agentes }) {
  const azar = (a, b) => a + Math.random()*(b - a);
  const plaza = datos.instancias.SM_Pileta?.[0] || [0, 0.15, 0];

  // ---------------------------------------------------------------- perros callejeros
  function cuerpoPerro(color) {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    const caja = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
    caja(0.62, 0.26, 0.24, 0, 0.5, 0);                     // tronco (mira a +x)
    const cabeza = caja(0.22, 0.2, 0.2, 0.38, 0.66, 0);
    caja(0.14, 0.1, 0.12, 0.52, 0.62, 0);                  // hocico
    for (const z of [-0.07, 0.07]) caja(0.05, 0.1, 0.04, 0.34, 0.8, z);   // orejas
    const patas = [];
    for (const [x, z] of [[0.24, 0.08], [0.24, -0.08], [-0.24, 0.08], [-0.24, -0.08]]) {
      const p = new THREE.Group(); p.position.set(x, 0.42, z);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.07), m); b.position.y = -0.21; b.castShadow = true;
      p.add(b); g.add(p); patas.push(p);
    }
    const cola = new THREE.Group(); cola.position.set(-0.31, 0.58, 0);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), m); c.position.x = -0.1; cola.add(c); g.add(cola);
    cola.rotation.z = 0.6;
    return { g, patas, cola, cabeza };
  }
  const perros = [];
  const colores = ['#8a6a45', '#3b2f26', '#c9b28a', '#6e5440', '#d8cfc0', '#5a4a3a'];
  for (let i = 0; i < 9; i++) {
    const p = cuerpoPerro(colores[i % colores.length]);
    const x = plaza[0] + azar(-60, 60), z = plaza[2] + azar(-60, 60);
    p.g.position.set(x, suelo(x, 5, z) ?? 0.15, z);
    scene.add(p.g);
    perros.push({ ...p, meta: null, espera: azar(0, 4), fase: 0, vel: 0, ladrido: 0 });
  }
  function nuevaMeta(d) {
    // calles y veredas: a lo largo de una línea de la grilla, o hacia el jugador si es curioso
    const c = d.g.position;
    if (Math.random() < 0.25 && Math.hypot(jugador.x - c.x, jugador.z - c.z) < 25) return { x: jugador.x + azar(-1.5, 1.5), z: jugador.z + azar(-1.5, 1.5) };
    const x = c.x + azar(-18, 18), z = c.z + azar(-18, 18);
    return Math.hypot(x - plaza[0], z - plaza[2]) < 130 ? { x, z } : { x: plaza[0] + azar(-20, 20), z: plaza[2] + azar(-20, 20) };
  }
  function actualizarPerros(dt) {
    for (const d of perros) {
      const c = d.g.position;
      const dj = Math.hypot(jugador.x - c.x, jugador.z - c.z);
      if (dj > 120) continue;
      d.ladrido -= dt;
      if (dj < 3.5 && d.ladrido <= 0 && Math.random() < 0.02) { sonido?.ladrido?.([c.x, c.y + 0.6, c.z]); d.ladrido = azar(6, 15); }
      if (!d.meta) {
        d.espera -= dt; d.vel = 0;
        if (d.espera <= 0) d.meta = nuevaMeta(d);
      } else {
        const dx = d.meta.x - c.x, dz = d.meta.z - c.z, dist = Math.hypot(dx, dz);
        if (dist < 0.6) { d.meta = null; d.espera = azar(1, 7); }
        else {
          d.vel = Math.min(dist, dj < 6 ? 1.6 : 2.4);
          const nx = c.x + dx/dist*d.vel*dt, nz = c.z + dz/dist*d.vel*dt;
          const y = suelo(nx, c.y + 0.8, nz);
          if (y == null || y - c.y > 0.45) { d.meta = null; d.espera = azar(0.5, 2); }        // un muro o escalón alto: cambia de idea
          else { c.set(nx, y, nz); d.g.rotation.y = Math.atan2(-dz, dx); }
        }
      }
      d.fase += dt*(d.vel > 0 ? d.vel*5 : 0);
      d.patas.forEach((p, k) => { p.rotation.z = d.vel > 0 ? Math.sin(d.fase + (k === 0 || k === 3 ? 0 : Math.PI))*0.5 : 0; });
      d.cola.rotation.y = Math.sin(performance.now()/120)*(dj < 5 ? 0.7 : 0.25);
      d.cabeza.position.y = 0.66 + (d.vel === 0 ? Math.sin(performance.now()/700 + c.x)*0.02 : 0);
    }
  }

  // ---------------------------------------------------------------- palomas
  const N_PALOMAS = 36;
  const geoPaloma = (() => {
    const cuerpo = new THREE.SphereGeometry(0.11, 7, 5); cuerpo.scale(1.5, 0.9, 0.9); cuerpo.translate(0, 0.12, 0);
    const cabeza = new THREE.SphereGeometry(0.06, 6, 4); cabeza.translate(0.15, 0.22, 0);
    const ala = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0.05, 0.15, 0, -0.12, 0.15, 0, -0.02, 0.16, 0.3, 0.05, 0.15, 0, -0.02, 0.16, -0.3, -0.12, 0.15, 0], 3));
    ala.computeVertexNormals();
    return [cuerpo, cabeza, ala];
  })();
  const matPaloma = new THREE.MeshStandardMaterial({ color: '#8d93a0', roughness: 0.8, side: THREE.DoubleSide });
  const palomasIM = geoPaloma.map((g) => { const im = new THREE.InstancedMesh(g, matPaloma, N_PALOMAS); im.frustumCulled = false; scene.add(im); return im; });
  const lugaresPalomas = [[plaza[0], plaza[2]]];
  const constitucion = datos.instancias.SM_Asta_Bandera?.[0];
  if (constitucion) lugaresPalomas.push([constitucion[0], constitucion[2] + 12]);
  const palomas = Array.from({ length: N_PALOMAS }, (_, i) => {
    const [cx, cz] = lugaresPalomas[i % lugaresPalomas.length];
    const x = cx + azar(-12, 12), z = cz + azar(-12, 12);
    return { x, z, y: suelo(x, 5, z) ?? 0.15, giro: azar(0, 6.28), estado: 'suelo', t: azar(0, 5), vx: 0, vy: 0, vz: 0, base: [cx, cz] };
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eje = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), uno = new THREE.Vector3(1, 1, 1);
  const qa = new THREE.Quaternion(), ejeX = new THREE.Vector3(1, 0, 0);
  function actualizarPalomas(dt, t) {
    palomas.forEach((p, i) => {
      const dj = Math.hypot(jugador.x - p.x, jugador.z - p.z);
      if (p.estado === 'suelo') {
        p.t -= dt;
        if (dj < 3.2 || (p.t < 0 && Math.random() < 0.002)) {
          // ¡a volar! todas las cercanas se espantan juntas
          p.estado = 'vuelo'; p.t = azar(4, 9);
          p.vx = (p.x - jugador.x)/Math.max(dj, 0.5)*4 + azar(-2, 2); p.vz = (p.z - jugador.z)/Math.max(dj, 0.5)*4 + azar(-2, 2); p.vy = azar(3, 5);
          if (dj < 3.2) sonido?.aleteo?.([p.x, p.y + 0.5, p.z]);
        } else if (p.t < 0) { p.giro += azar(-1.2, 1.2); p.t = azar(0.6, 2.5); const nx = p.x + Math.cos(p.giro)*0.25, nz = p.z - Math.sin(p.giro)*0.25; p.x = nx; p.z = nz; }
      } else {
        p.t -= dt;
        p.vy += (p.t > 2 ? 0.6 : -2.5)*dt;
        if (p.t < 2) { const [bx, bz] = p.base; p.vx += ((bx + azar(-10, 10)) - p.x)*0.3*dt; p.vz += ((bz + azar(-10, 10)) - p.z)*0.3*dt; }
        p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt;
        p.giro = Math.atan2(-p.vz, p.vx);
        const piso = suelo(p.x, p.y + 1, p.z) ?? 0.15;
        if (p.t < 0 && p.y <= piso + 0.05) { p.y = piso; p.estado = 'suelo'; p.t = azar(1, 4); }
        if (p.y < piso) p.y = piso;
      }
      const pica = p.estado === 'suelo' ? Math.max(0, Math.sin(t*3 + i))*0.25 : 0;
      m4.compose(v.set(p.x, p.y, p.z), q.setFromAxisAngle(eje, p.giro).multiply(qa.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -pica)), uno);
      palomasIM[0].setMatrixAt(i, m4); palomasIM[1].setMatrixAt(i, m4);
      const aleta = p.estado === 'vuelo' ? Math.sin(t*28 + i)*0.9 : 0;
      m4.compose(v.set(p.x, p.y, p.z), q.setFromAxisAngle(eje, p.giro).multiply(qa.setFromAxisAngle(ejeX, aleta)), uno);
      palomasIM[2].setMatrixAt(i, m4);
    });
    for (const im of palomasIM) im.instanceMatrix.needsUpdate = true;
  }

  // ---------------------------------------------------------------- lluvia
  const N_GOTAS = 2600;
  const geoLluvia = new THREE.BufferGeometry();
  const posL = new Float32Array(N_GOTAS*6);
  geoLluvia.setAttribute('position', new THREE.BufferAttribute(posL, 3));
  const lluvia = new THREE.LineSegments(geoLluvia, new THREE.LineBasicMaterial({ color: '#aab4c0', transparent: true, opacity: 0.45 }));
  lluvia.frustumCulled = false;
  lluvia.visible = false;
  scene.add(lluvia);
  const gotas = Array.from({ length: N_GOTAS }, () => [azar(-30, 30), azar(0, 25), azar(-30, 30)]);
  let clima = 'despejado', paraLluvia = null;
  function actualizarLluvia(dt) {
    if (!lluvia.visible) return;
    const c = camera.position;
    gotas.forEach((g, i) => {
      g[1] -= dt*18;
      if (g[1] < -2) { g[0] = azar(-30, 30); g[1] = azar(18, 25); g[2] = azar(-30, 30); }
      const x = c.x + g[0], y = c.y + g[1] - 6, z = c.z + g[2];
      posL.set([x, y, z, x - 0.05, y + 0.55, z], i*6);
    });
    geoLluvia.attributes.position.needsUpdate = true;
  }

  // ---------------------------------------------------------------- pregones de los vendedores (audios grabados con la voz de la IA)
  const buffers = {};
  let tPregon = 3;
  async function cargarPregones() {
    for (const n of PREGONES) {
      try { buffers[n] = await (await fetch(`datos/pregones/${n}.mp3`)).arrayBuffer(); } catch { /* sin audio */ }
    }
  }
  cargarPregones();
  function pregonar(dt) {
    if ((tPregon -= dt) > 0) return;
    tPregon = azar(7, 16);
    // un vendedor o suplementero cercano pregona lo suyo
    const cerca = agentes.cercanos(jugador.x, jugador.z, 30).filter((a) => /Vendedora|Nino/.test(a.asset));
    if (!cerca.length) return;
    const a = cerca[Math.floor(Math.random()*cerca.length)];
    const opciones = /Nino/.test(a.asset) ? ['diarios'] : ['mote', 'flores', 'empanadas', 'motemei', 'agua', 'tortillas'];
    const n = opciones[Math.floor(Math.random()*opciones.length)];
    if (buffers[n]) sonido?.voz(buffers[n].slice(0), [a.x, a.y, a.z], /Nino/.test(a.asset) ? 1.15 : 1).catch(() => {});
  }

  // ---------------------------------------------------------------- banda en la glorieta
  const glorieta = datos.instancias.SM_Glorieta?.[0];
  let tBanda = 0;

  return {
    clima(c) {
      clima = c;
      lluvia.visible = c === 'lluvia';
      paraLluvia?.(); paraLluvia = null;
      if (c === 'lluvia') paraLluvia = sonido?.lluvia?.() || null;
      return c;
    },
    climaActual: () => clima,
    // bajo techo no se ve la lluvia
    techo(adentro) { lluvia.visible = clima === 'lluvia' && !adentro; },
    actualizar(dt, t) {
      actualizarPerros(dt);
      actualizarPalomas(dt, t);
      actualizarLluvia(dt);
      if (clima !== 'lluvia') pregonar(dt);
      if (glorieta && clima !== 'lluvia') {
        tBanda -= dt;
        const d = Math.hypot(jugador.x - glorieta[0], jugador.z - glorieta[2]);
        if (d < 70 && tBanda <= 0) { tBanda = sonido?.banda?.([glorieta[0], glorieta[1] + 2, glorieta[2]]) ?? 30; }
      }
    },
  };
}
