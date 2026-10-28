// Sonidos de Santiago Antiguo, sintetizados en vivo con Web Audio (sin archivos que descargar).
// Ambiente de ciudad y viento, pileta, río Mapocho, pájaros en los árboles, caballos de los coches,
// campanas de la Catedral, silbato y vapor de las locomotoras, campanilla del tranvía y pasos.

export function crearSonido(datos, movil) {
  let ctx = null, maestro = null, ruidoBlanco = null, ruidoCafe = null, activo = true;
  const temporizadores = [];
  const lugares = (prefijo) => Object.entries(datos.instancias)
    .filter(([k]) => k.startsWith(prefijo)).flatMap(([, v]) => v.map(([x, y, z]) => [x, y, z]));

  const azar = (a, b) => a + Math.random()*(b - a);

  function bufferRuido(tipo) {
    const n = ctx.sampleRate*4, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random()*2 - 1;
      if (tipo === 'cafe') { ultimo = (ultimo + 0.02*w)/1.02; d[i] = ultimo*3.5; } else d[i] = w;
    }
    return buf;
  }

  function fuenteRuido(buf) {
    const s = ctx.createBufferSource();
    s.buffer = buf; s.loop = true;
    s.loopStart = Math.random()*2; s.start(0, Math.random()*3);
    return s;
  }

  function panner([x, y, z], ref, max = 400) {
    const p = ctx.createPanner();
    p.panningModel = movil ? 'equalpower' : 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = ref; p.maxDistance = max; p.rolloffFactor = 1.2;
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z);
    p.connect(maestro);
    return p;
  }

  function filtro(tipo, f, q = 0.7) {
    const b = ctx.createBiquadFilter();
    b.type = tipo; b.frequency.value = f; b.Q.value = q;
    return b;
  }

  function ganancia(v) { const g = ctx.createGain(); g.gain.value = v; return g; }

  // cadena: nodos conectados en orden, devuelve el primero
  function cadena(...nodos) { for (let i = 0; i < nodos.length - 1; i++) nodos[i].connect(nodos[i + 1]); return nodos[0]; }

  // modula lentamente un parámetro (olas de murmullo, ráfagas de viento)
  function lfo(param, frec, prof) {
    const o = ctx.createOscillator(), g = ganancia(prof);
    o.frequency.value = frec; o.connect(g).connect(param); o.start();
  }

  // ---------------------------------------------------------------- fondos continuos
  function ambiente() {
    // murmullo lejano de la ciudad
    const murmullo = ganancia(0.05);
    cadena(fuenteRuido(ruidoCafe), filtro('lowpass', 500), filtro('highpass', 90), murmullo, maestro);
    lfo(murmullo.gain, 0.07, 0.02);
    // viento suave entre los edificios
    const viento = ganancia(0.025), banda = filtro('bandpass', 700, 0.6);
    cadena(fuenteRuido(ruidoBlanco), banda, viento, maestro);
    lfo(banda.frequency, 0.05, 300);
    lfo(viento.gain, 0.11, 0.018);
    // pileta de la Plaza de Armas y pila de La Moneda
    for (const pos of [...lugares('SM_Pileta'), ...lugares('SM_Pila_')]) {
      cadena(fuenteRuido(ruidoBlanco), filtro('highpass', 500), filtro('peaking', 2500, 1), ganancia(0.5), panner([pos[0], pos[1] + 1, pos[2]], 3));
    }
    // río Mapocho: rumor grave a lo largo del cauce
    const rio = lugares('SM_Rio_Mapocho')[0];
    if (rio) for (let x = -90; x <= 90; x += 45) {
      cadena(fuenteRuido(ruidoCafe), filtro('lowpass', 900), ganancia(0.9), panner([x, -1, -120.6], 14));
    }
    // vapor de las locomotoras detenidas
    for (const pos of lugares('SM_Locomotora_Vapor')) {
      const g = ganancia(0.18);
      cadena(fuenteRuido(ruidoBlanco), filtro('highpass', 3000), g, panner([pos[0], 2, pos[2]], 4));
      lfo(g.gain, 0.3, 0.12);
    }
  }

  // ---------------------------------------------------------------- sonidos puntuales
  function pajaro(pos) {
    const p = panner(pos, 6), t = ctx.currentTime, notas = 2 + Math.floor(Math.random()*5), base = azar(2600, 5200);
    for (let i = 0; i < notas; i++) {
      const o = ctx.createOscillator(), g = ganancia(0), t0 = t + i*azar(0.08, 0.16);
      o.type = 'sine';
      o.frequency.setValueAtTime(base*azar(0.9, 1.15), t0);
      o.frequency.exponentialRampToValueAtTime(base*azar(1.2, 1.6), t0 + 0.06);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
      o.connect(g).connect(p); o.start(t0); o.stop(t0 + 0.1);
    }
  }

  function golpe(destino, t, frec, dur, vol, q = 2) {
    const s = ctx.createBufferSource(), g = ganancia(0);
    s.buffer = ruidoBlanco;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(filtro('bandpass', frec, q)).connect(g).connect(destino);
    s.start(t, Math.random()*3); s.stop(t + dur + 0.02);
  }

  function cascos(pos) {
    const p = panner([pos[0], 0.3, pos[2]], 5), t = ctx.currentTime, n = 2 + Math.floor(Math.random()*4);
    for (let i = 0; i < n; i++) golpe(p, t + i*azar(0.18, 0.32), azar(900, 1400), 0.07, 0.9, 4);
    if (Math.random() < 0.3) {     // resoplido
      const g = ganancia(0), t0 = t + n*0.3;
      g.gain.linearRampToValueAtTime(0.25, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
      const s = fuenteRuido(ruidoBlanco);
      s.connect(filtro('bandpass', 600, 1.5)).connect(g).connect(p);
      s.stop(t0 + 0.7);
    }
  }

  function campana(destino, t, frec, vol, dur) {
    // parciales inarmónicos de una campana de bronce
    for (const [r, a] of [[0.5, 0.5], [1, 1], [1.19, 0.6], [1.5, 0.45], [2, 0.35], [2.5, 0.2], [3.0, 0.15]]) {
      const o = ctx.createOscillator(), g = ganancia(0);
      o.frequency.value = frec*r;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol*a, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur*(1.2 - r*0.25));
      o.connect(g).connect(destino); o.start(t); o.stop(t + dur);
    }
  }

  function campanasCatedral() {
    const cat = lugares('SM_Catedral_Metropolitana')[0];
    if (!cat) return;
    const p = panner([cat[0], 30, cat[2]], 30, 1000), t = ctx.currentTime;
    for (let i = 0; i < 6; i++) campana(p, t + i*1.6, i % 2 ? 330 : 392, 0.12, 5);
  }

  function silbato() {
    const locos = lugares('SM_Locomotora_Vapor');
    if (!locos.length) return;
    const pos = locos[Math.floor(Math.random()*locos.length)];
    const p = panner([pos[0], 4, pos[2]], 20, 1500), t = ctx.currentTime, dur = azar(1.2, 2.4);
    const g = ganancia(0);
    g.gain.linearRampToValueAtTime(0.12, t + 0.15);
    g.gain.setValueAtTime(0.12, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0, t + dur);
    const banda = filtro('bandpass', 1200, 3);
    banda.connect(g).connect(p);
    for (const f of [440, 554, 659]) {           // acorde de tres tubos
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f;
      o.frequency.linearRampToValueAtTime(f*0.97, t + dur);
      o.connect(banda); o.start(t); o.stop(t + dur);
    }
    const s = fuenteRuido(ruidoBlanco), gs = ganancia(0.05);
    s.connect(filtro('highpass', 2500)).connect(gs).connect(g); s.stop(t + dur);
  }

  function campanillaTranvia() {
    const ts = lugares('SM_Tranvia_Sangre');
    if (!ts.length) return;
    const pos = ts[Math.floor(Math.random()*ts.length)];
    const p = panner([pos[0], 2.5, pos[2]], 6), t = ctx.currentTime;
    campana(p, t, 1320, 0.08, 1.2);
    campana(p, t + 0.35, 1320, 0.08, 1.2);
  }

  // repite una función cada [min, max] segundos, solo si el jugador está cerca de alguna de sus fuentes
  function cada(min, max, fn) {
    const id = setTimeout(() => { if (activo) fn(); cada(min, max, fn); }, azar(min, max)*1000);
    temporizadores.push(id);
  }

  let oyente = [0, 0, 0];
  const cerca = (lista, r) => lista.filter((p) => Math.hypot(p[0] - oyente[0], p[2] - oyente[2]) < r);
  const arboles = lugares('SM_Arbol_');
  const coches = lugares('SM_Coche_Caballos');

  return {
    // debe llamarse dentro de un gesto del usuario (requisito de iOS / Chrome)
    iniciar() {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      maestro = ctx.createGain();
      maestro.gain.value = 0.9;
      maestro.connect(ctx.destination);
      ruidoBlanco = bufferRuido('blanco');
      ruidoCafe = bufferRuido('cafe');
      ambiente();
      cada(1.5, 5, () => { const c = cerca(arboles, 45); if (c.length) { const a = c[Math.floor(Math.random()*c.length)]; pajaro([a[0], a[1] + azar(4, 8), a[2]]); } });
      cada(4, 11, () => { const c = cerca(coches, 50); if (c.length) cascos(c[Math.floor(Math.random()*c.length)]); });
      cada(25, 40, campanillaTranvia);
      cada(50, 90, silbato);
      temporizadores.push(setTimeout(campanasCatedral, 12000));
      cada(110, 160, campanasCatedral);
      // iOS suspende el audio al cambiar de pestaña: reanudar al volver
      document.addEventListener('visibilitychange', () => { if (!document.hidden && activo) ctx.resume(); });
    },

    actualizar(camara) {
      if (!ctx) return;
      const l = ctx.listener, p = camara.position, t = ctx.currentTime;
      oyente = [p.x, p.y, p.z];
      const f = camara.getWorldDirection(camara.userData.dir || (camara.userData.dir = p.clone()));
      if (l.positionX) {
        l.positionX.setTargetAtTime(p.x, t, 0.02); l.positionY.setTargetAtTime(p.y, t, 0.02); l.positionZ.setTargetAtTime(p.z, t, 0.02);
        l.forwardX.setTargetAtTime(f.x, t, 0.02); l.forwardY.setTargetAtTime(f.y, t, 0.02); l.forwardZ.setTargetAtTime(f.z, t, 0.02);
        l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
      } else {
        l.setPosition(p.x, p.y, p.z);
        l.setOrientation(f.x, f.y, f.z, 0, 1, 0);
      }
    },

    // un paso sobre adoquines o baldosas (fuerte: aterrizaje de un salto)
    paso(fuerte = false) {
      if (!ctx || !activo) return;
      const t = ctx.currentTime;
      golpe(maestro, t, azar(250, 420), fuerte ? 0.16 : 0.09, fuerte ? 0.5 : 0.22, 1.2);
      golpe(maestro, t + 0.012, azar(1800, 2600), 0.04, fuerte ? 0.12 : 0.06, 1);
    },

    alternar() {
      activo = !activo;
      if (ctx) activo ? ctx.resume() : ctx.suspend();
      return activo;
    },
  };
}
