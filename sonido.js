// Sonidos de Santiago Antiguo, sintetizados en vivo con Web Audio (sin archivos que descargar).
// Ambiente de ciudad y viento, pileta, río Mapocho, pájaros en los árboles, caballos de los coches,
// campanas de la Catedral, silbato y vapor de las locomotoras, campanilla del tranvía y pasos.

export function crearSonido(datos, movil) {
  let ctx = null, maestro = null, ruidoBlanco = null, ruidoCafe = null, activo = true, noche = false, grillos = null;
  // canales con su propio volumen (los faders del menú): general y cada grupo de sonidos
  const niveles = { general: 0.9, ambiente: 1, naturaleza: 1, ciudad: 1, pasos: 1, voces: 1 };
  let vozActual = null;
  const canales = {};
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

  function panner([x, y, z], ref, max = 400, canal = 'ciudad') {
    const p = ctx.createPanner();
    p.panningModel = movil ? 'equalpower' : 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = ref; p.maxDistance = max; p.rolloffFactor = 1.2;
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z);
    p.connect(canales[canal]);
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
    cadena(fuenteRuido(ruidoCafe), filtro('lowpass', 500), filtro('highpass', 90), murmullo, canales.ambiente);
    lfo(murmullo.gain, 0.07, 0.02);
    // viento suave entre los edificios
    const viento = ganancia(0.025), banda = filtro('bandpass', 700, 0.6);
    cadena(fuenteRuido(ruidoBlanco), banda, viento, canales.ambiente);
    lfo(banda.frequency, 0.05, 300);
    lfo(viento.gain, 0.11, 0.018);
    // pileta de la Plaza de Armas y pila de La Moneda
    for (const pos of [...lugares('SM_Pileta'), ...lugares('SM_Pila_')]) {
      cadena(fuenteRuido(ruidoBlanco), filtro('highpass', 500), filtro('peaking', 2500, 1), ganancia(0.5), panner([pos[0], pos[1] + 1, pos[2]], 3, 400, 'naturaleza'));
    }
    // río Mapocho: rumor grave a lo largo del cauce
    const rio = lugares('SM_Rio_Mapocho')[0];
    const zRio = datos.meta ? -(datos.meta.YR0 + datos.meta.YR1)/2 : -120.6;
    if (rio) for (let x = -135; x <= 135; x += 45) {
      cadena(fuenteRuido(ruidoCafe), filtro('lowpass', 900), ganancia(0.9), panner([x, -1, zRio], 14, 400, 'naturaleza'));
    }
    // vapor de las locomotoras detenidas
    for (const pos of lugares('SM_Locomotora_Vapor')) {
      const g = ganancia(0.18);
      cadena(fuenteRuido(ruidoBlanco), filtro('highpass', 3000), g, panner([pos[0], 2, pos[2]], 4));
      lfo(g.gain, 0.3, 0.12);
    }
    // grillos de noche: chirrido agudo pulsado, sin posición
    grillos = ganancia(noche ? 0.012 : 0);
    const chirrido = ctx.createOscillator(), pulso = ctx.createOscillator(), pg = ganancia(0.5);
    chirrido.frequency.value = 4400; pulso.type = 'square'; pulso.frequency.value = 5.5;
    const vca = ganancia(0.5);
    pulso.connect(pg).connect(vca.gain);
    cadena(chirrido, filtro('bandpass', 4400, 8), vca, grillos, canales.naturaleza);
    chirrido.start(); pulso.start();
  }

  // ---------------------------------------------------------------- sonidos puntuales
  function pajaro(pos) {
    const p = panner(pos, 6, 400, 'naturaleza'), t = ctx.currentTime, notas = 2 + Math.floor(Math.random()*5), base = azar(2600, 5200);
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
      maestro.gain.value = niveles.general;
      maestro.connect(ctx.destination);
      for (const c of ['ambiente', 'naturaleza', 'ciudad', 'pasos', 'voces']) {
        canales[c] = ganancia(niveles[c]);
        canales[c].connect(maestro);
      }
      ruidoBlanco = bufferRuido('blanco');
      ruidoCafe = bufferRuido('cafe');
      ambiente();
      cada(1.5, 5, () => { if (noche) return; const c = cerca(arboles, 45); if (c.length) { const a = c[Math.floor(Math.random()*c.length)]; pajaro([a[0], a[1] + azar(4, 8), a[2]]); } });
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

    // un casco sobre los adoquines (los coches en movimiento lo piden al ritmo del trote)
    casco(pos) {
      if (!ctx || !activo) return;
      golpe(panner(pos, 4), ctx.currentTime, azar(900, 1400), 0.06, 0.8, 4);
    },

    // crepitar de un incendio en un lugar; devuelve la función para apagarlo
    fuego(pos) {
      if (!ctx) return () => {};
      const p = panner(pos, 6, 200, 'ciudad'), g = ganancia(0.5), s = fuenteRuido(ruidoBlanco);
      const f = filtro('bandpass', 1800, 0.8);
      s.connect(f).connect(g).connect(p);
      lfo(g.gain, 7, 0.35);
      const s2 = fuenteRuido(ruidoCafe), g2 = ganancia(0.9);
      s2.connect(filtro('lowpass', 300)).connect(g2).connect(p);
      return () => { try { s.stop(); s2.stop(); } catch { /* ya detenido */ } };
    },

    // ladrido de perro: dos golpes de voz que caen de tono
    ladrido(pos) {
      if (!ctx || !activo) return;
      const p = panner(pos, 3, 120, 'ciudad'), t = ctx.currentTime;
      for (const d of [0, 0.22]) {
        const o = ctx.createOscillator(), g = ganancia(0), f = filtro('bandpass', 900, 2);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(azar(380, 460), t + d);
        o.frequency.exponentialRampToValueAtTime(azar(170, 220), t + d + 0.13);
        g.gain.linearRampToValueAtTime(0.3, t + d + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.15);
        o.connect(f).connect(g).connect(p); o.start(t + d); o.stop(t + d + 0.17);
        golpe(p, t + d, 1500, 0.08, 0.25, 1);
      }
    },

    // aleteo de palomas que se espantan
    aleteo(pos) {
      if (!ctx || !activo) return;
      const p = panner(pos, 4, 80, 'naturaleza'), t = ctx.currentTime;
      for (let i = 0; i < 14; i++) golpe(p, t + i*0.055 + Math.random()*0.02, azar(1800, 3200), 0.04, 0.35, 1.2);
    },

    // lluvia continua (y un rumor grave); devuelve la función para detenerla
    lluvia() {
      if (!ctx) return () => {};
      const g = ganancia(0);
      g.gain.setTargetAtTime(0.32, ctx.currentTime, 1.5);
      const s = fuenteRuido(ruidoBlanco), s2 = fuenteRuido(ruidoCafe);
      cadena(s, filtro('highpass', 900), filtro('lowpass', 7000), g, canales.naturaleza);
      const g2 = ganancia(0.4);
      cadena(s2, filtro('lowpass', 400), g2, g);
      return () => { g.gain.setTargetAtTime(0, ctx.currentTime, 0.8); setTimeout(() => { try { s.stop(); s2.stop(); } catch { /* ya detenido */ } }, 3000); };
    },

    // retreta de la banda en la glorieta: una marcha breve (composición propia) con metales, bajo y tambor.
    // Devuelve cuántos segundos esperar antes de volver a tocar.
    banda(pos) {
      if (!ctx || !activo) return 30;
      const p = panner(pos, 10, 300, 'ciudad'), t0 = ctx.currentTime + 0.1, negra = 60/112;
      const midi = (n) => 440*2**((n - 69)/12);
      const melodia = [[67, 1], [72, 1], [76, 1], [79, 1], [76, 2], [72, 1], [74, 1], [76, 1], [74, 1], [72, 1], [69, 1], [67, 3], [0, 1],
        [69, 1], [71, 1], [72, 1], [74, 1], [76, 1], [77, 1], [79, 2], [81, 1], [79, 1], [77, 1], [74, 1], [72, 3], [0, 1]];
      const bajos = [[48, 55], [48, 55], [48, 55], [43, 50], [41, 48], [48, 55], [43, 50], [48, 55]];
      const nota = (n, t, dur, tipo, vol, corte) => {
        const o = ctx.createOscillator(), g = ganancia(0), f = filtro('lowpass', corte, 1);
        o.type = tipo; o.frequency.value = midi(n);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.03);
        g.gain.setValueAtTime(vol*0.8, t + dur*0.7);
        g.gain.linearRampToValueAtTime(0, t + dur*0.95);
        o.connect(f).connect(g).connect(p); o.start(t); o.stop(t + dur);
      };
      let total = 0;
      for (let rep = 0; rep < 2; rep++) {
        let t = t0 + rep*32*negra;
        for (const [n, b] of melodia) {
          if (n) { nota(n, t, b*negra, 'sawtooth', 0.07, 2200); nota(n - 12, t, b*negra, 'square', 0.025, 1400); }
          t += b*negra;
        }
        bajos.forEach(([a, b], k) => {
          for (let pulso = 0; pulso < 4; pulso++) {
            const tt = t0 + rep*32*negra + (k*4 + pulso)*negra;
            if (pulso % 2 === 0) nota(pulso === 0 ? a - 12 : b - 12, tt, negra*0.8, 'triangle', 0.18, 600);
            else golpe(p, tt, 1800, 0.09, 0.35, 0.7);
          }
        });
        total = (rep + 1)*32*negra;
      }
      return total + 40;
    },

    // campanas de alarma de incendio: toque rápido y repetido
    alarma() {
      if (!ctx || !activo) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 14; i++) campana(canales.ciudad, t + i*0.42, i % 2 ? 620 : 700, 0.06, 1.2);
    },

    // puerta de madera: chirrido de bisagra al abrir, golpe y pestillo al cerrar
    puerta(pos, abrir) {
      if (!ctx || !activo) return;
      const p = panner(pos, 3, 80, 'ciudad'), t = ctx.currentTime;
      if (abrir) {
        const o = ctx.createOscillator(), g = ganancia(0), f = filtro('bandpass', 900, 6);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(azar(160, 220), t);
        o.frequency.linearRampToValueAtTime(azar(320, 420), t + 0.55);
        g.gain.linearRampToValueAtTime(0.05, t + 0.08);
        g.gain.linearRampToValueAtTime(0.0, t + 0.6);
        o.connect(f).connect(g).connect(p); o.start(t); o.stop(t + 0.65);
        golpe(p, t, 2200, 0.03, 0.25, 3);
      } else {
        golpe(p, t + 0.45, 160, 0.18, 0.9, 1.5);
        golpe(p, t + 0.47, 2600, 0.04, 0.3, 4);
      }
    },

    // un paso sobre adoquines o baldosas (fuerte: aterrizaje de un salto)
    paso(fuerte = false) {
      if (!ctx || !activo) return;
      const t = ctx.currentTime;
      golpe(canales.pasos, t, azar(250, 420), fuerte ? 0.16 : 0.09, fuerte ? 0.5 : 0.22, 1.2);
      golpe(canales.pasos, t + 0.012, azar(1800, 2600), 0.04, fuerte ? 0.12 : 0.06, 1);
    },

    // voz de un personaje: audio (mp3) que sale desde donde está la persona; la promesa termina al callar
    async voz(datosAudio, pos, ritmo = 1) {
      if (!ctx) throw new Error('audio sin iniciar');
      if (ctx.state === 'suspended') await ctx.resume();
      const buf = await ctx.decodeAudioData(datosAudio);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = ritmo;
      const p = panner([pos[0], pos[1] + 1.55, pos[2]], 1.6, 60, 'voces');
      p.rolloffFactor = 0.8;
      src.connect(p);
      vozActual = src;
      return new Promise((listo) => { src.onended = () => { if (vozActual === src) vozActual = null; p.disconnect(); listo(); }; src.start(); });
    },
    callarVoz() { try { vozActual?.stop(); } catch { /* ya terminó */ } vozActual = null; },
    hablandoVoz: () => !!vozActual,

    // volumen de un canal (0..1); se recuerda aunque el audio aún no haya partido
    volumen(canal, v) {
      niveles[canal] = v;
      const nodo = canal === 'general' ? maestro : canales[canal];
      if (nodo) nodo.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    },

    // de noche callan los pájaros y cantan los grillos
    nocturno(siEsNoche) {
      noche = siEsNoche;
      if (grillos) grillos.gain.setTargetAtTime(noche ? 0.012 : 0, ctx.currentTime, 1.5);
    },

    alternar() {
      activo = !activo;
      if (ctx) activo ? ctx.resume() : ctx.suspend();
      return activo;
    },
  };
}
