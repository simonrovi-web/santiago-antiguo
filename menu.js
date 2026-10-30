// Menú de opciones: mezclador de audio con faders, hora del día, imagen, controles y personajes.
// Las preferencias se guardan en el navegador (si se puede) y se aplican al volver.

const CLAVE = 'santiago_opciones_v1';

const hhmm = (h) => { h = ((h % 24) + 24) % 24; const m = Math.round((h % 1)*60) % 60; return `${String(Math.floor(h)).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

// canales del mezclador (faders verticales)
export const CANALES = [
  { id: 'vol_general', etiqueta: 'General', def: 90 },
  { id: 'vol_ambiente', etiqueta: 'Ambiente', ayuda: 'Murmullo y viento', def: 100 },
  { id: 'vol_naturaleza', etiqueta: 'Naturaleza', ayuda: 'Pájaros, agua y grillos', def: 100 },
  { id: 'vol_ciudad', etiqueta: 'Ciudad', ayuda: 'Caballos, campanas, tranvía y tren', def: 100 },
  { id: 'vol_pasos', etiqueta: 'Pasos', def: 100 },
  { id: 'vol_voz', etiqueta: 'Voces', ayuda: 'Personajes leyendo sus respuestas', def: 100 },
];

function secciones(tactil) {
  return [
    { titulo: 'Hora del día y clima', items: [
      { id: 'hora', tipo: 'rango', etiqueta: 'Hora', min: 0, max: 24, paso: 0.25, def: 10.5, formato: hhmm },
      { id: 'ciclo', tipo: 'interruptor', etiqueta: 'El tiempo avanza solo (la noche pasa más rápido)', def: true },
      { id: 'ritmo', tipo: 'opciones', etiqueta: 'Una hora del juego dura', valores: ['rápido', 'normal', 'lento'],
        nombres: { 'rápido': '30 s', normal: '1 min', lento: '2½ min' }, def: 'normal' },
      { id: 'clima', tipo: 'opciones', etiqueta: 'Clima', valores: ['despejado', 'nublado', 'lluvia'], def: 'despejado' },
    ] },
    { titulo: 'Imagen', items: [
      { id: 'calidad', tipo: 'opciones', etiqueta: 'Calidad', valores: ['auto', 'baja', 'media', 'alta'], def: 'auto' },
      { id: 'sombras', tipo: 'interruptor', etiqueta: 'Sombras', def: true },
      { id: 'distancia', tipo: 'rango', etiqueta: 'Distancia de visión', min: 120, max: 700, paso: 10, def: tactil ? 220 : 420, formato: (v) => `${v} m` },
      { id: 'fov', tipo: 'rango', etiqueta: 'Campo de visión', min: 50, max: 95, paso: 1, def: 70, formato: (v) => `${v}°` },
      { id: 'fps', tipo: 'interruptor', etiqueta: 'Mostrar cuadros por segundo', def: false },
    ] },
    { titulo: 'Controles', items: [
      { id: 'sensibilidad', tipo: 'rango', etiqueta: 'Sensibilidad de la mirada', min: 20, max: 250, paso: 5, def: 100, formato: (v) => `${v}%` },
      { id: 'invertir', tipo: 'interruptor', etiqueta: 'Invertir mirada vertical', def: false },
      { id: 'correr', tipo: 'interruptor', etiqueta: 'Correr siempre', def: false },
      { id: 'mira', tipo: 'interruptor', etiqueta: 'Punto de mira al centro', def: true },
    ] },
    { titulo: 'Personajes y ciudad', items: [
      { id: 'voz', tipo: 'interruptor', etiqueta: 'Leer las respuestas en voz alta', def: true },
      { id: 'vel_voz', tipo: 'rango', etiqueta: 'Velocidad de la voz', min: 60, max: 150, paso: 5, def: 100, formato: (v) => `${v}%` },
      { id: 'gente', tipo: 'interruptor', etiqueta: 'Gente, coches y tranvías en movimiento', def: true },
      { id: 'charla_libre', tipo: 'interruptor', etiqueta: 'Escribir o hablar libremente con los personajes (si se apaga, solo preguntas sugeridas)', def: true },
      { id: 'nivel', tipo: 'opciones', etiqueta: 'Curso: los personajes adaptan cómo explican la historia', valores: ['basica', 'media', 'adulto'],
        nombres: { basica: 'Básica', media: 'Media', adulto: 'Adultos' }, def: 'basica' },
    ] },
  ];
}

export function crearMenu({ tactil, aplicar, acciones }) {
  const SECC = secciones(tactil);
  const defs = Object.fromEntries([...CANALES.map((c) => [c.id, c.def]), ['silencio', false],
    ...SECC.flatMap((s) => s.items.map((i) => [i.id, i.def]))]);
  let valores = { ...defs };
  try { Object.assign(valores, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch { /* sin almacenamiento */ }
  // versión 2: el tiempo pasa a avanzar solo por defecto (antes venía apagado y quedó guardado así)
  if (!valores.v2) { valores.ciclo = true; valores.v2 = true; }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(valores)); } catch { /* sin almacenamiento */ } };
  const refrescos = [];
  const poner = (id, v, guarda = true) => { valores[id] = v; aplicar(id, v, valores); if (guarda) guardar(); };

  const panel = document.createElement('div');
  panel.id = 'menu';
  panel.innerHTML = `<div class="hoja" role="dialog" aria-label="Opciones">
    <header><h2>Opciones</h2><button class="cerrar" title="Cerrar">✕</button></header>
    <div class="cuerpo">
      <section><h3>Audio</h3><div class="mezcla"></div>
        <label class="fila"><span>Silenciar todo</span><input type="checkbox" class="silencio"></label></section>
    </div>
    <footer>
      <button data-accion="reanudar" class="principal">Seguir paseando</button>
      <button data-accion="misiones">📜 Misiones (J)</button>
      <button data-accion="mapa">🗺 Mapa (M)</button>
      <button data-accion="plaza">Volver a la Plaza de Armas</button>
      <button data-accion="inicio">Pantalla de inicio</button>
      <button data-accion="restablecer">Restablecer opciones</button>
    </footer></div>`;
  document.body.append(panel);
  const cuerpo = panel.querySelector('.cuerpo');

  // ---- faders verticales del mezclador (hechos a mano: funcionan igual con dedo y mouse)
  const mezcla = panel.querySelector('.mezcla');
  for (const c of CANALES) {
    const tira = document.createElement('div');
    tira.className = 'tira' + (c.id === 'vol_general' ? ' maestra' : '');
    tira.title = c.ayuda || c.etiqueta;
    tira.innerHTML = `<output></output><div class="riel" role="slider" tabindex="0" aria-label="${c.etiqueta}" aria-valuemin="0" aria-valuemax="100">
      <div class="nivel"></div><div class="perilla"></div></div><span>${c.etiqueta}</span>`;
    const riel = tira.querySelector('.riel'), out = tira.querySelector('output');
    const pintar = () => {
      const v = valores[c.id];
      tira.style.setProperty('--v', v/100);
      out.textContent = v;
      riel.setAttribute('aria-valuenow', v);
    };
    const desdePuntero = (e) => {
      const r = riel.getBoundingClientRect();
      const v = Math.round(Math.min(1, Math.max(0, (r.bottom - 12 - e.clientY)/(r.height - 24)))*100);
      poner(c.id, v); pintar();
    };
    let arrastre = false;
    riel.addEventListener('pointerdown', (e) => {
      arrastre = true;
      try { riel.setPointerCapture(e.pointerId); } catch { /* puntero sintético */ }
      desdePuntero(e); e.preventDefault();
    });
    riel.addEventListener('pointermove', (e) => { if (arrastre) desdePuntero(e); });
    for (const fin of ['pointerup', 'pointercancel', 'lostpointercapture']) riel.addEventListener(fin, () => { arrastre = false; });
    riel.addEventListener('dblclick', () => { poner(c.id, c.def); pintar(); });
    riel.addEventListener('keydown', (e) => {
      const d = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5, PageUp: 20, PageDown: -20 }[e.key];
      if (d) { poner(c.id, Math.min(100, Math.max(0, valores[c.id] + d))); pintar(); e.preventDefault(); e.stopPropagation(); }
    });
    refrescos.push(pintar);
    pintar();
    mezcla.append(tira);
  }
  const silencio = panel.querySelector('.silencio');
  silencio.onchange = () => poner('silencio', silencio.checked);
  refrescos.push(() => { silencio.checked = valores.silencio; });

  // ---- resto de las secciones
  for (const s of SECC) {
    const sec = document.createElement('section');
    sec.innerHTML = `<h3>${s.titulo}</h3>`;
    for (const it of s.items) {
      const fila = document.createElement('label');
      fila.className = 'fila';
      if (it.tipo === 'interruptor') {
        fila.innerHTML = `<span>${it.etiqueta}</span><input type="checkbox">`;
        const inp = fila.querySelector('input');
        inp.onchange = () => poner(it.id, inp.checked);
        refrescos.push(() => { inp.checked = valores[it.id]; });
      } else if (it.tipo === 'rango') {
        fila.classList.add('rango');
        fila.innerHTML = `<span>${it.etiqueta}</span><output></output><input type="range" min="${it.min}" max="${it.max}" step="${it.paso}">`;
        const inp = fila.querySelector('input'), out = fila.querySelector('output');
        inp.oninput = () => { out.textContent = it.formato(+inp.value); poner(it.id, +inp.value); };
        refrescos.push(() => { inp.value = valores[it.id]; out.textContent = it.formato(valores[it.id]); });
      } else {
        fila.innerHTML = `<span>${it.etiqueta}</span><div class="botones">${it.valores.map((v) => `<button type="button" data-v="${v}"${it.nombres ? ' class="tal-cual"' : ''}>${it.nombres?.[v] || v}</button>`).join('')}</div>`;
        const bs = [...fila.querySelectorAll('button')];
        bs.forEach((b) => { b.onclick = () => { poner(it.id, b.dataset.v); bs.forEach((x) => x.classList.toggle('activo', x === b)); }; });
        refrescos.push(() => bs.forEach((x) => x.classList.toggle('activo', x.dataset.v === valores[it.id])));
      }
      sec.append(fila);
    }
    cuerpo.append(sec);
  }

  const refrescar = () => refrescos.forEach((f) => f());
  const abrir = () => { refrescar(); panel.classList.add('abierto'); acciones.alAbrir?.(); };
  const cerrar = () => { panel.classList.remove('abierto'); acciones.alCerrar?.(); };
  const abierto = () => panel.classList.contains('abierto');
  panel.querySelector('.cerrar').onclick = cerrar;
  panel.addEventListener('click', (e) => { if (e.target === panel) cerrar(); });
  panel.querySelector('footer').onclick = (e) => {
    const a = e.target.dataset?.accion;
    if (a === 'reanudar') cerrar();
    if (a === 'plaza') { acciones.plaza(); cerrar(); }
    if (a === 'misiones') { cerrar(); acciones.misiones(); }
    if (a === 'mapa') { cerrar(); acciones.mapa(); }
    if (a === 'inicio') { cerrar(); document.dispatchEvent(new Event('santiago-inicio')); }
    if (a === 'restablecer') { valores = { ...defs, v2: true }; for (const [k, v] of Object.entries(valores)) aplicar(k, v, valores); guardar(); refrescar(); }
  };

  // aplica lo guardado al partir
  for (const [k, v] of Object.entries(valores)) aplicar(k, v, valores);
  refrescar();

  return {
    abrir, cerrar, abierto,
    alternar: () => (abierto() ? cerrar() : abrir()),
    valor: (id) => valores[id],
    // cambiar una opción desde el juego (por ejemplo, la hora elegida al empezar)
    poner: (id, v) => { poner(id, v); if (abierto()) refrescar(); },
    // el ciclo del día mueve la hora: se refleja en el menú abierto y se guarda de vez en cuando
    ponerHora: (h, guarda = false) => {
      valores.hora = ((h % 24) + 24) % 24;
      if (abierto()) refrescar();
      if (guarda) guardar();
    },
  };
}
