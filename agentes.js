// Vida en las calles: peatones que recorren las veredas y cruzan en las esquinas, coches y carretas
// que dan vuelta a la manzana, tranvías de sangre que van y vuelven por su línea.
// Una pequeña IA de comportamiento decide qué hace cada uno (caminar, detenerse, cruzar, esperar,
// mirar al forastero, conversar) y un shader anima piernas, brazos, faldas y patas al paso.
import * as THREE from 'three';

const PASO = 54.4;            // distancia entre centros de manzanas (igual que el generador)
const RADIO = 1;              // manzanas a cada lado de la plaza en la versión web
const TAU = Math.PI*2;

// ---------------------------------------------------------------- recorrido cuadrado alrededor de una manzana
// s recorre el perímetro (largo 8r) partiendo de la esquina (-r, -r) hacia +x
function punto(c, r, s, out) {
  const L = 8*r;
  s = ((s % L) + L) % L;
  const u = s % (2*r), lado = Math.floor(s/(2*r));
  if (lado === 0) out.set(c.x - r + u, c.y - r);
  else if (lado === 1) out.set(c.x + r, c.y - r + u);
  else if (lado === 2) out.set(c.x + r - u, c.y + r);
  else out.set(c.x - r, c.y + r - u);
  return out;
}

function parametro(c, r, x, z) {
  const lx = x - c.x, lz = z - c.y, cl = (v) => Math.min(2*r, Math.max(0, v));
  const opciones = [
    [Math.abs(lz + r), cl(lx + r)],
    [Math.abs(lx - r), 2*r + cl(lz + r)],
    [Math.abs(lz - r), 4*r + cl(r - lx)],
    [Math.abs(lx + r), 6*r + cl(r - lz)],
  ];
  opciones.sort((a, b) => a[0] - b[0]);
  return opciones[0][1];
}

const enGrilla = (c) => Math.abs(Math.round(c.x/PASO)) <= RADIO && Math.abs(Math.round(c.y/PASO)) <= RADIO;

// ---------------------------------------------------------------- animación en el shader
const GLSL_COMUN = /* glsl */`
attribute vec2 aAnim;          // x: fase del paso (radianes), y: marcha (0 quieto .. 1 caminando)
uniform vec4 uP;
uniform vec4 uQ;
vec2 girar(vec2 d, float a) { float c = cos(a), s = sin(a); return vec2(d.x*c - d.y*s, d.x*s + d.y*c); }
vec3 pata(vec3 p, float xh, float zh, float f, float m) {
  float dz = p.z - zh;
  if (p.y < 0.66 && abs(p.x - xh) < 0.9 && abs(abs(dz) - 0.17) < 0.1) {
    bool delante = p.x > xh;
    float px = xh + (delante ? 0.58 : -0.68);
    float a = 0.4*m*sin(f + ((delante == (dz > 0.0)) ? 0.0 : 3.14159));
    p.xy = vec2(px, 1.1) + girar(p.xy - vec2(px, 1.1), a);
  }
  if (p.x > xh + 0.95 && p.y > 1.3 && abs(dz) < 0.3) p.y += sin(2.0*f)*0.035*m;
  return p;
}`;

// persona: uP = (cadera, corte de piernas, escala, amplitud); uQ = (piernas, brazos, falda, hombro)
const GLSL_PERSONA = /* glsl */`
{
  float f = aAnim.x, m = aAnim.y, e = uP.z;
  if (m > 0.001) {
    vec3 p = transformed;
    if (uQ.x > 0.5 && p.y < uP.y && abs(p.z) > 0.02*e && abs(p.z) < 0.2*e && p.x > -0.12*e && p.x < 0.22*e)
      p.xy = vec2(0.0, uP.x) + girar(p.xy - vec2(0.0, uP.x), uP.w*m*sin(f + (p.z > 0.0 ? 3.14159 : 0.0)));
    if (uQ.y > 0.5 && p.y > 0.95*e && p.y < 1.36*e && abs(p.z) > 0.165*e && abs(p.z) < 0.3*e && p.x > -0.08*e && p.x < 0.2*e)
      p.xy = vec2(0.0, uQ.w) + girar(p.xy - vec2(0.0, uQ.w), -0.6*uP.w*m*sin(f + (p.z > 0.0 ? 3.14159 : 0.0)));
    if (uQ.z > 0.5 && p.y < 0.95) { float k = 1.0 - p.y/0.95; p.x += sin(f)*0.035*m*k; p.z += cos(f*2.0)*0.012*m*k; }
    p.y += abs(cos(f))*0.03*e*m;
    transformed = p;
  }
}`;

// carro tirado por caballos: uP = (x del caballo, z caballo 1, z caballo 2, cantidad)
const GLSL_CABALLOS = /* glsl */`
{
  float f = aAnim.x, m = aAnim.y;
  if (m > 0.001) {
    transformed = pata(transformed, uP.x, uP.y, f, m);
    if (uP.w > 1.5) transformed = pata(transformed, uP.x, uP.z, f + 1.3, m);
    transformed.y += abs(sin(f))*0.012*m;
  }
}`;

function animarMallas(lista, n, tipo, uP, uQ = [0, 0, 0, 0]) {
  const anim = new THREE.InstancedBufferAttribute(new Float32Array(n*2), 2);
  anim.setUsage(THREE.DynamicDrawUsage);
  for (const im of lista) {
    im.geometry.setAttribute('aAnim', anim);
    im.frustumCulled = false;                       // se mueven fuera de su esfera original
    const mat = im.material.clone();
    const u = { uP: { value: new THREE.Vector4(...uP) }, uQ: { value: new THREE.Vector4(...uQ) } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n' + GLSL_COMUN)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (tipo === 'persona' ? GLSL_PERSONA : GLSL_CABALLOS));
    };
    mat.customProgramCacheKey = () => 'anim-' + tipo;
    im.material = mat;
  }
  return anim;
}

// ---------------------------------------------------------------- agentes
export function crearAgentes({ datos, mallas, jugador, sonido }) {
  const agentes = [];
  const porClave = new Map();
  const azar = (a, b) => a + Math.random()*(b - a);
  const tmp = new THREE.Vector2(), tmp2 = new THREE.Vector2();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eje = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3(), uno = new THREE.Vector3(1, 1, 1);

  function nuevo(asset, i, [x, y, z, g], extra) {
    const a = { asset, i, x, y, z, giro: g, giroBase: g, x0: x, z0: z, fase: Math.random()*TAU, marcha: 0, vel: 0, ...extra };
    agentes.push(a);
    porClave.set(asset + '#' + i, a);
    return a;
  }

  // ---- peatones
  const PERSONAS = {
    Caballero: { uP: [0.88, 0.5, 1, 0.42], uQ: [1, 1, 0, 1.4] },
    Nino: { uP: [0.6, 0.34, 0.68, 0.5], uQ: [1, 1, 0, 0.95] },
    Huaso: { uP: [0.88, 0.5, 1, 0.4], uQ: [1, 0, 0, 1.32] },
    Dama: { uP: [0.88, 0.5, 1, 0.3], uQ: [0, 1, 1, 1.38] },
    Vendedora: { uP: [0.88, 0.5, 1, 0.3], uQ: [0, 1, 1, 1.38] },
    Manto: { uP: [0.88, 0.5, 1, 0.3], uQ: [0, 0, 1, 1.38] },
  };
  const anims = {};
  for (const [asset, lista] of Object.entries(datos.instancias)) {
    const m = asset.match(/^SM_Peaton_([A-Za-z]+)_\d+$/);
    if (!m || !PERSONAS[m[1]] || !mallas[asset]) continue;
    anims[asset] = animarMallas(mallas[asset], lista.length, 'persona', PERSONAS[m[1]].uP, PERSONAS[m[1]].uQ);
    lista.forEach((pos, i) => {
      const c = new THREE.Vector2(Math.round(pos[0]/PASO)*PASO, Math.round(pos[2]/PASO)*PASO);
      const r = Math.max(Math.abs(pos[0] - c.x), Math.abs(pos[2] - c.y));
      const camina = enGrilla(c) && r > 16 && r < 23.5 && Math.random() < 0.7;
      const a = nuevo(asset, i, pos, { clase: 'peaton', modo: camina ? 'vereda' : 'quieto', c, r, lat: 0,
        rapidez: (m[1] === 'Nino' ? 1.25 : m[1] === 'Manto' ? 0.85 : 1.05)*azar(0.9, 1.15), zancada: m[1] === 'Nino' ? 1.0 : 1.4 });
      if (camina) {
        a.s = parametro(c, r, pos[0], pos[2]);
        a.dir = Math.random() < 0.5 ? 1 : -1;
        a.lado = Math.floor(((a.s % (8*r)) + 8*r) % (8*r)/(2*r));
        a.enfriar = 3;
      }
    });
  }

  // ---- coches, carretas y tranvías
  const VEHICULOS = {
    SM_Coche_Caballos: { uP: [3.2, 0, 0, 1], largo: [-1.6, 4.2], ancho: 0.95, rapidez: 3.6, zancada: 2.4 },
    SM_Carreta: { uP: [3.3, 0, 0, 1], largo: [-1.7, 4.3], ancho: 1.0, rapidez: 2.6, zancada: 2.2 },
    SM_Tranvia_Sangre: { uP: [4.9, 0.42, -0.42, 2], largo: [-2.8, 6.0], ancho: 1.1, rapidez: 2.8, zancada: 2.4 },
  };
  for (const [asset, cfg] of Object.entries(VEHICULOS)) {
    const lista = datos.instancias[asset];
    if (!lista || !mallas[asset]) continue;
    anims[asset] = animarMallas(mallas[asset], lista.length, 'caballos', cfg.uP);
    lista.forEach((pos, i) => {
      const c = new THREE.Vector2(Math.round(pos[0]/PASO)*PASO, Math.round(pos[2]/PASO)*PASO);
      const r = Math.max(Math.abs(pos[0] - c.x), Math.abs(pos[2] - c.y));
      const a = nuevo(asset, i, pos, { clase: 'vehiculo', cfg, rapidez: cfg.rapidez*azar(0.9, 1.1), zancada: cfg.zancada, modo: 'quieto' });
      if (asset === 'SM_Tranvia_Sangre') {
        // dos líneas que terminan en la Plaza de Armas: el tranvía va y vuelve, girando en cada terminal
        Object.assign(a, { modo: 'linea', x0l: pos[0] < 10 ? -80 : 18, x1l: pos[0] < 10 ? -8 : 80, sentido: Math.cos(pos[3]) > 0 ? 1 : -1, espera: 0 });
      } else if (enGrilla(c) && r > 22 && r < 32) {
        Object.assign(a, { modo: 'vuelta', c, r, s: parametro(c, r, pos[0], pos[2]) });
        // sentido de la vuelta: el que coincide con hacia dónde mira el caballo (+x local)
        const fx = Math.cos(pos[3]), fz = -Math.sin(pos[3]);
        punto(c, r, a.s + 1, tmp); punto(c, r, a.s - 1, tmp2);
        a.dir = (tmp.x - tmp2.x)*fx + (tmp.y - tmp2.y)*fz >= 0 ? 1 : -1;
      }
    });
  }

  // ---- decisiones de cada agente
  function delante(a, ax, az, dist, cono = 0.35) {
    // ¿hay algo en (ax, az) delante del agente, a menos de dist?
    const dx = ax - a.x, dz = az - a.z, d = Math.hypot(dx, dz);
    if (d > dist || d < 1e-3) return false;
    const fx = Math.cos(a.giro), fz = -Math.sin(a.giro);
    return (dx*fx + dz*fz)/d > cono;
  }

  function hayAlguienDelante(a, dist) {
    if (delante(a, jugador.x, jugador.z, a.clase === 'vehiculo' ? dist + 2 : dist)) return true;
    for (const b of agentes) {
      if (b === a || b.clase !== a.clase || Math.abs(b.x - a.x) > dist || Math.abs(b.z - a.z) > dist) continue;
      // estorba si está parado, va más lento en el mismo sentido, o viene de frente (peatones)
      if (delante(a, b.x, b.z, dist, 0.6) && (b.vel < 0.1 || (Math.cos(b.giro - a.giro) > 0.3 && (a.clase === 'vehiculo' || b.vel < a.vel - 0.05))
          || (a.clase === 'peaton' && Math.cos(b.giro - a.giro) < -0.3))) return true;
    }
    return false;
  }

  function girarHacia(a, objetivo, dt, rapidez = 4) {
    let d = objetivo - a.giro;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    a.giro += d*Math.min(1, rapidez*dt);
  }

  function rumbo(a, c, r, s, dir, mira) {
    punto(c, r, s + dir*mira, tmp); punto(c, r, s - dir*mira, tmp2);
    return Math.atan2(-(tmp.y - tmp2.y), tmp.x - tmp2.x);
  }

  function peaton(a, dt) {
    const dj = Math.hypot(jugador.x - a.x, jugador.z - a.z);
    if (a.hablando) {
      a.vel = 0;
      girarHacia(a, Math.atan2(-(jugador.z - a.z), jugador.x - a.x), dt, 6);
      return;
    }
    if (a.modo === 'quieto' || a.modo === 'pausa') {
      a.vel = 0;
      // la gente parada mira al forastero cuando se le acerca
      const objetivo = dj < 4.5 ? Math.atan2(-(jugador.z - a.z), jugador.x - a.x) : a.giroBase;
      girarHacia(a, objetivo, dt, 2.5);
      if (a.modo === 'pausa' && (a.espera -= dt) <= 0) a.modo = a.modoPrevio;
      return;
    }
    // solo se detiene si el forastero le corta el paso; a la gente parada o más lenta la adelanta
    // por el lado de la calzada
    const frena = delante(a, jugador.x, jugador.z, 0.9);
    const esquiva = !frena && (delante(a, jugador.x, jugador.z, 2.2) || hayAlguienDelante(a, 1.8));
    a.vel += ((frena ? 0 : a.rapidez) - a.vel)*Math.min(1, 5*dt);
    if (a.modo === 'vereda') {
      a.lat += ((esquiva ? 0.8 : 0) - a.lat)*Math.min(1, 2.5*dt);
      a.s += a.dir*a.vel*dt;
      punto(a.c, a.r, a.s, tmp);
      // desplazamiento lateral hacia la calle (eje dominante desde el centro de la manzana)
      const lx = tmp.x - a.c.x, lz = tmp.y - a.c.y;
      const nx = Math.abs(lx) >= Math.abs(lz) ? Math.sign(lx) : 0, nz = Math.abs(lz) > Math.abs(lx) ? Math.sign(lz) : 0;
      a.x = tmp.x + nx*a.lat; a.z = tmp.y + nz*a.lat;
      girarHacia(a, rumbo(a, a.c, a.r, a.s, a.dir, 0.9), dt, 8);
      a.enfriar -= a.vel*dt;
      const L = 8*a.r, lado = Math.floor(((a.s % L) + L) % L/(2*a.r));
      if (lado !== a.lado) {
        a.lado = lado;
        if (a.enfriar <= 0 && a.lat < 0.2) {
          a.enfriar = 4;
          // en la esquina: seguir derecho cruzando la calle, o doblar con la vereda
          const ang = rumbo(a, a.c, a.r, a.s - a.dir*1.0, a.dir, 0.5);
          const t = new THREE.Vector2(Math.round(Math.cos(ang)), Math.round(-Math.sin(ang)));
          const vecina = a.c.clone().addScaledVector(t, PASO);
          if (enGrilla(vecina) && Math.random() < 0.35) {
            punto(a.c, a.r, Math.round(a.s/(2*a.r))*2*a.r, tmp);
            a.modo = 'cruce';
            a.desde = tmp.clone();
            a.hasta = tmp.clone().addScaledVector(t, PASO - 2*a.r);
            a.t = 0; a.vecina = vecina; a.rumboCruce = Math.atan2(-t.y, t.x);
          } else if (Math.random() < 0.12) {
            a.modoPrevio = 'vereda'; a.modo = 'pausa'; a.espera = azar(3, 9);
            a.giroBase = a.giro + (Math.random() < 0.5 ? 1 : -1)*Math.PI/2;     // se queda mirando una vitrina
          }
        }
      }
    } else if (a.modo === 'cruce') {
      const largo = a.desde.distanceTo(a.hasta);
      a.t += a.vel*dt/largo;
      tmp.lerpVectors(a.desde, a.hasta, Math.min(1, a.t));
      a.x = tmp.x; a.z = tmp.y;
      girarHacia(a, a.rumboCruce, dt, 8);
      if (a.t >= 1) {
        a.c = a.vecina;
        a.s = parametro(a.c, a.r, a.x, a.z);
        punto(a.c, a.r, a.s + 1, tmp);
        const fx = Math.cos(a.rumboCruce), fz = -Math.sin(a.rumboCruce);
        a.dir = (tmp.x - a.x)*fx + (tmp.y - a.z)*fz > 0.3 ? 1 : -1;
        const L = 8*a.r;
        a.lado = Math.floor(((a.s + a.dir*0.01) % L + L) % L/(2*a.r));
        a.s += a.dir*0.01;
        a.modo = 'vereda'; a.enfriar = 4;
      }
    }
  }

  function vehiculo(a, dt) {
    if (a.modo === 'quieto') { a.vel = 0; return; }
    if (a.modo === 'linea') {
      if (a.espera > 0) {
        a.vel = 0; a.espera -= dt;
        girarHacia(a, a.sentido > 0 ? 0 : Math.PI, dt, 0.8);
        return;
      }
      const frena = hayAlguienDelante(a, a.cfg.largo[1] + 2.5);
      a.vel += ((frena ? 0 : a.rapidez) - a.vel)*Math.min(1, 1.5*dt);
      a.x += a.sentido*a.vel*dt;
      if ((a.sentido > 0 && a.x > a.x1l) || (a.sentido < 0 && a.x < a.x0l)) { a.sentido *= -1; a.espera = 9; }
      return;
    }
    const frena = hayAlguienDelante(a, a.cfg.largo[1] + 3);
    a.vel += ((frena ? 0 : a.rapidez) - a.vel)*Math.min(1, (frena ? 3 : 1.2)*dt);
    a.s += a.dir*a.vel*dt;
    punto(a.c, a.r, a.s, tmp);
    a.x = tmp.x; a.z = tmp.y;
    girarHacia(a, rumbo(a, a.c, a.r, a.s, a.dir, 3.5), dt, 3);
  }

  // ---- empujar al jugador fuera de personas y vehículos (no están en la malla de colisión)
  const seg = new THREE.Line3(), pa = new THREE.Vector3(), pj = new THREE.Vector3();
  function empujar() {
    for (const a of agentes) {
      if (Math.abs(a.x - jugador.x) > 8 || Math.abs(a.z - jugador.z) > 8) continue;
      if (a.clase === 'peaton') {
        const dx = jugador.x - a.x, dz = jugador.z - a.z, d = Math.hypot(dx, dz), min = 0.65;
        if (d < min && d > 1e-4) { jugador.x = a.x + dx/d*min; jugador.z = a.z + dz/d*min; }
      } else {
        const fx = Math.cos(a.giro), fz = -Math.sin(a.giro);
        seg.start.set(a.x + fx*a.cfg.largo[0], 0, a.z + fz*a.cfg.largo[0]);
        seg.end.set(a.x + fx*a.cfg.largo[1], 0, a.z + fz*a.cfg.largo[1]);
        pj.set(jugador.x, 0, jugador.z);
        seg.closestPointToPoint(pj, true, pa);
        const d = pa.distanceTo(pj), min = a.cfg.ancho + 0.35;
        if (d < min && d > 1e-4) { pj.sub(pa).multiplyScalar(min/d).add(pa); jugador.x = pj.x; jugador.z = pj.z; }
      }
    }
  }

  return {
    // la persona que conversa con el jugador se detiene y lo mira
    agente: (asset, i) => porClave.get(asset + '#' + i),
    empujar,
    actualizar(dt) {
      dt = Math.min(dt, 0.1);
      const sucios = new Set();
      for (const a of agentes) {
        const antes = a.fase;
        if (a.clase === 'peaton') peaton(a, dt); else vehiculo(a, dt);
        a.fase += a.vel*dt*TAU/a.zancada;
        const objetivo = a.vel > 0.15 ? Math.min(1, a.vel/(a.rapidez*0.6)) : 0;
        a.marcha += (objetivo - a.marcha)*Math.min(1, 6*dt);
        // cascos al trote, cerca del jugador
        if (a.clase === 'vehiculo' && a.vel > 0.5 && Math.floor(a.fase/Math.PI) !== Math.floor(antes/Math.PI)
            && Math.hypot(a.x - jugador.x, a.z - jugador.z) < 45) sonido?.casco([a.x + Math.cos(a.giro)*a.cfg.uP[0], 0.3, a.z - Math.sin(a.giro)*a.cfg.uP[0]]);
        if (a.vel === 0 && a.marcha < 0.002 && a.quieto && a.giro === a.giroVisto) continue;
        a.quieto = a.vel === 0 && a.marcha < 0.002;
        a.giroVisto = a.giro;
        m4.compose(v3.set(a.x, a.y, a.z), q.setFromAxisAngle(eje, a.giro), uno);
        for (const im of mallas[a.asset]) im.setMatrixAt(a.i, m4);
        const anim = anims[a.asset];
        anim.setXY(a.i, a.fase % (TAU*64), a.marcha);
        sucios.add(a.asset);
      }
      for (const asset of sucios) {
        for (const im of mallas[asset]) im.instanceMatrix.needsUpdate = true;
        anims[asset].needsUpdate = true;
      }
    },
  };
}
