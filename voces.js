// Voces de los personajes y oído del jugador.
// Hablar: cada frase se convierte en voz neural en el Worker (Azure o Deepgram Aura-2, según haya) y suena
// desde donde está la persona; si no hay servicio, se usa la voz del sistema eligiendo una de mujer o de hombre.
// Escuchar: reconocimiento de voz del navegador (es-CL); si el navegador no lo tiene, se graba y se transcribe
// con Whisper en el Worker.

const IA = 'https://santiago-ia.simonrovi.workers.dev';

// ---------------------------------------------------------------- qué voz tiene cada persona
const AZURE_MUJER = ['es-CL-CatalinaNeural', 'es-CL-CatalinaNeural', 'es-AR-ElenaNeural', 'es-PE-CamilaNeural', 'es-UY-ValentinaNeural', 'es-CO-SalomeNeural'];
const AZURE_HOMBRE = ['es-CL-LorenzoNeural', 'es-CL-LorenzoNeural', 'es-AR-TomasNeural', 'es-PE-AlexNeural', 'es-UY-MateoNeural', 'es-CO-GonzaloNeural'];
const AURA_MUJER = ['selena', 'celeste', 'estrella'];
const AURA_HOMBRE = ['aquila', 'javier', 'sirio'];

export function elegirVoz(r, { mujer, tipo, edad }) {
  const anios = parseInt(edad, 10) || 35;
  const nino = tipo === 'nino';
  const elige = (l) => l[Math.floor(r()*l.length)];
  // los mayores hablan más grave y pausado; los niños, agudo y rápido
  const tono = (nino ? 12 : anios > 60 ? -9 : anios > 45 ? -4 : 3) + Math.round((r() - 0.5)*8);
  const ritmo = (nino ? 6 : anios > 60 ? -10 : anios > 45 ? -4 : 0) + Math.round((r() - 0.5)*6);
  return {
    genero: mujer ? 'mujer' : 'hombre',
    azure: nino ? 'es-MX-MarinaNeural' : elige(mujer ? AZURE_MUJER : AZURE_HOMBRE),
    aura: elige(mujer ? AURA_MUJER : AURA_HOMBRE),
    tono, ritmo,
    // Aura no tiene voces de niño ni permite cambiar el tono: se acelera un poco el audio (sube el tono)
    reproduccion: nino ? 1.17 : anios > 60 ? 0.95 : 1,
  };
}

// ---------------------------------------------------------------- voz del sistema (respaldo)
const FEMENINAS = /sabina|helena|laura|elvira|paulina|m[oó]nica|luc[ií]a|elena|camila|catalina|dalia|paloma|marisol|esperanza|isabela|ximena|valentina|salom[eé]|renata|beatriz|female|mujer|google espa[nñ]ol/i;
const MASCULINAS = /pablo|ra[uú]l|jorge|diego|[aá]lvaro|juan|carlos|enrique|lorenzo|tom[aá]s|\balex|gonzalo|mateo|andr[eé]s|federico|male\b|hombre/i;

function vozSistema(genero) {
  const voces = (window.speechSynthesis?.getVoices() || []).filter((v) => v.lang.toLowerCase().startsWith('es'));
  const orden = (v) => (v.lang === 'es-CL' ? 0 : /es-(419|US|MX|AR)/.test(v.lang) ? 1 : 2);
  voces.sort((a, b) => orden(a) - orden(b));
  const patron = genero === 'mujer' ? FEMENINAS : MASCULINAS;
  return { voz: voces.find((v) => patron.test(v.name)), cualquiera: voces[0] };
}

export function crearHablante({ sonido }) {
  let cola = Promise.resolve(), generacion = 0, activo = true, volumen = 1, velocidad = 1, motorUsado = '';

  async function pedirAudio(texto, voz) {
    const r = await fetch(IA, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tarea: 'voz', texto, voz }) });
    if (!r.ok) throw new Error('voz ' + r.status);
    return { datos: await r.arrayBuffer(), motor: r.headers.get('X-Motor-Voz') || '' };
  }

  function decirLocal(texto, ficha) {
    return new Promise((listo) => {
      if (!window.speechSynthesis) return listo();
      const u = new SpeechSynthesisUtterance(texto);
      const { voz, cualquiera } = vozSistema(ficha.voz.genero);
      u.voice = voz || cualquiera || null;
      u.lang = u.voice?.lang || 'es-CL';
      // sin una voz del género correcto, se corrige con el tono
      const ajuste = voz ? 1 : ficha.voz.genero === 'mujer' ? 1.25 : 0.75;
      u.pitch = Math.min(2, Math.max(0.1, ajuste*(1 + ficha.voz.tono/60)));
      u.rate = velocidad*(1 + ficha.voz.ritmo/100);
      u.volume = volumen;
      u.onend = u.onerror = () => listo();
      speechSynthesis.speak(u);
    });
  }

  return {
    // pone una frase en la cola: el audio se pide de inmediato (en paralelo) y suena en orden
    decir(texto, ficha, posicion, alEmpezar) {
      texto = texto.trim();
      if (!activo || !texto) return cola;
      const gen = generacion;
      const pedido = pedirAudio(texto, ficha.voz).catch((e) => ({ error: e }));
      cola = cola.then(async () => {
        if (gen !== generacion) return;
        const a = await pedido;
        if (gen !== generacion) return;
        alEmpezar?.();
        if (a.error) { motorUsado = 'sistema'; return decirLocal(texto, ficha); }
        motorUsado = a.motor;
        const vel = Math.min(1.25, Math.max(0.8, velocidad));
        try { await sonido.voz(a.datos, posicion(), (a.motor === 'aura' ? ficha.voz.reproduccion : 1)*vel); }
        catch { return decirLocal(texto, ficha); }
      });
      return cola;
    },
    callar() {
      generacion++;
      sonido.callarVoz();
      window.speechSynthesis?.cancel();
      cola = Promise.resolve();
    },
    terminado: () => cola,
    motor: () => motorUsado,
    opciones({ activa, vol, vel }) {
      if (activa !== undefined) { activo = activa; if (!activa) this.callar(); }
      if (vol !== undefined) volumen = vol;
      if (vel !== undefined) velocidad = vel;
    },
  };
}

// ---------------------------------------------------------------- oído: lo que dice el jugador
export function crearOido({ alParcial, alFinal, alEstado }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, grabador = null, flujo = null, escuchando = false;

  function terminar(estado) {
    escuchando = false;
    alEstado(estado || 'quieto');
  }

  async function conReconocimiento() {
    rec = new SR();
    rec.lang = 'es-CL';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let final = '';
    rec.onresult = (e) => {
      let parcial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else parcial += e.results[i][0].transcript;
      }
      alParcial((final + ' ' + parcial).trim());
    };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') terminar('sin-permiso'); };
    rec.onend = () => {
      rec = null;
      if (!escuchando) return;
      terminar();
      if (final.trim()) alFinal(final.trim());
    };
    rec.start();
  }

  // respaldo: graba hasta que el jugador calla (o 10 s) y lo transcribe Whisper en el Worker
  async function conGrabacion() {
    flujo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const ctx = new AudioContext(), an = ctx.createAnalyser();
    ctx.createMediaStreamSource(flujo).connect(an);
    const datos = new Uint8Array(an.fftSize);
    const partes = [];
    grabador = new MediaRecorder(flujo);
    grabador.ondataavailable = (e) => partes.push(e.data);
    let hablo = false, silencio = 0, t0 = performance.now();
    const vigilar = setInterval(() => {
      an.getByteTimeDomainData(datos);
      let s = 0;
      for (const v of datos) s += (v - 128)**2;
      const rms = Math.sqrt(s/datos.length);
      if (rms > 6) { hablo = true; silencio = 0; } else silencio += 100;
      if ((hablo && silencio > 1300) || performance.now() - t0 > 10000) grabador?.state === 'recording' && grabador.stop();
    }, 100);
    grabador.onstop = async () => {
      clearInterval(vigilar);
      flujo.getTracks().forEach((t) => t.stop());
      ctx.close();
      grabador = null;
      if (!escuchando || !hablo) return terminar();
      alEstado('pensando');
      try {
        const blob = new Blob(partes, { type: partes[0]?.type || 'audio/webm' });
        const b64 = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
        const r = await fetch(IA, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tarea: 'oir', audio: b64 }) });
        const j = await r.json();
        terminar();
        if (j.texto) alFinal(j.texto);
      } catch { terminar('error'); }
    };
    grabador.start();
  }

  return {
    disponible: !!SR || !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder),
    escuchando: () => escuchando,
    async escuchar() {
      if (escuchando) return;
      escuchando = true;
      alEstado('escuchando');
      try { SR ? await conReconocimiento() : await conGrabacion(); }
      catch { terminar('sin-permiso'); }
    },
    detener() {
      if (!escuchando) return;
      if (rec) rec.stop();               // entrega lo que alcanzó a oír
      else if (grabador?.state === 'recording') grabador.stop();
      else terminar();
    },
    cancelar() {
      escuchando = false;
      try { rec?.abort(); } catch { /* nada */ }
      if (grabador?.state === 'recording') grabador.stop();
      alEstado('quieto');
    },
  };
}
