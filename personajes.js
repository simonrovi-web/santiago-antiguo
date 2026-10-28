// Personajes de Santiago Antiguo: cada transeúnte tiene nombre, oficio y carácter de 1912,
// y conversa con el jugador a través de la IA (Cloudflare Worker santiago-ia).
import * as THREE from 'three';
import { elegirVoz, crearHablante, crearOido } from './voces.js';

const IA = 'https://santiago-ia.simonrovi.workers.dev';
const DISTANCIA = 3.2;          // metros para poder hablarle a alguien

const HOMBRES = ['Juan de Dios', 'José Miguel', 'Manuel', 'Ramón', 'Pedro Pablo', 'Luis Alberto', 'Francisco', 'Arturo', 'Ignacio',
  'Domingo', 'Belisario', 'Eleodoro', 'Clodomiro', 'Exequiel', 'Rosendo', 'Abelardo', 'Hipólito', 'Tomás', 'Víctor', 'Segundo'];
const MUJERES = ['María Luisa', 'Rosalía', 'Carmela', 'Mercedes', 'Teresa', 'Amelia', 'Javiera', 'Clotilde', 'Eulalia', 'Isidora',
  'Rosa Elvira', 'Filomena', 'Dolores', 'Matilde', 'Herminia', 'Leonor', 'Elena', 'Inés', 'Delfina', 'Brígida'];
const NINOS = ['Panchito', 'Lucho', 'Perico', 'Juanito', 'Toño', 'Manuelito', 'Chumingo', 'Polo'];
// apellidos de familias acomodadas y de gente de trabajo, según el oficio
const APELLIDOS_ALTOS = ['Errázuriz', 'Larraín', 'Valdés', 'Echeverría', 'Ossandón', 'Undurraga', 'Aránguiz', 'Fuenzalida', 'Subercaseaux', 'Edwards'];
const APELLIDOS = ['Contreras', 'Rojas', 'Muñoz', 'Soto', 'Pérez', 'Garcés', 'Vergara', 'Tapia', 'Cifuentes', 'Morales', 'Silva',
  'Lagos', 'González', 'Díaz', 'Reyes', 'Jara', 'Catalán', 'Quiroz'];

const OFICIOS = {
  caballero: ['abogado de los tribunales', 'comerciante de géneros de la calle Ahumada', 'periodista de El Mercurio',
    'médico del Hospital San Vicente de Paul', 'empleado del Ministerio de Hacienda', 'profesor del Instituto Nacional',
    'corredor de la Bolsa de Comercio', 'joyero de los Portales'],
  dama: ['señora de sociedad que vuelve de la tienda Gath y Chaves', 'profesora normalista', 'modista de la calle Estado',
    'profesora de piano', 'dueña de una pensión en la calle Merced', 'sombrerera de la calle Huérfanos'],
  manto: ['señora devota que va a misa a la Catedral', 'viuda que vive en la calle Santo Domingo', 'beata que reza el rosario cada tarde'],
  huaso: ['huaso de Melipilla que vino a vender caballos', 'arriero que bajó de la cordillera', 'inquilino de un fundo de Pirque de paso en la capital',
    'cochero de un coche de punto'],
  vendedora: ['florista de la Plaza de Armas', 'vendedora de mote con huesillo', 'frutera de La Vega', 'vendedora de empanadas',
    'dulcera que vende alfajores y chilenitos', 'lavandera que lleva la ropa a una casa del centro'],
  nino: ['suplementero que vende El Mercurio y Las Últimas Noticias', 'lustrabotas', 'alumno del Instituto Nacional', 'mandadero de un almacén'],
};
const CARACTER = [
  ['alegre y parlanchín', 'alegre y parlanchina'],
  ['serio y algo desconfiado con los forasteros', 'seria y algo desconfiada con los forasteros'],
  ['curioso: le pregunta al forastero de dónde viene', 'curiosa: le pregunta al forastero de dónde viene'],
  ['nostálgico, recuerda el Santiago de antes', 'nostálgica, recuerda el Santiago de antes'],
  ['orgulloso de su ciudad y de su oficio', 'orgullosa de su ciudad y de su oficio'],
  ['bromista y pícaro', 'bromista y pícara'],
  ['tímido pero muy servicial', 'tímida pero muy servicial'],
  ['chismoso, conoce todos los rumores del barrio', 'chismosa, conoce todos los rumores del barrio'],
];

// generador pseudoaleatorio estable: la misma persona tiene siempre la misma identidad
function azar(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s*1664525 + 1013904223) >>> 0; return s/4294967296; };
}
const hash = (txt) => [...txt].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
const elegir = (r, lista) => lista[Math.floor(r()*lista.length)];

function zona(x, z) {
  if (Math.hypot(x, z) < 27) return 'la Plaza de Armas';
  if (x < -20 && x > -62 && Math.abs(z) < 26) return 'la vereda frente a la Catedral Metropolitana';
  if (Math.abs(x) < 27 && z > 18 && z < 34) return 'los Portales, frente a la Plaza de Armas';
  if (z > 105) return 'la Plaza de la Constitución, frente al Palacio de La Moneda';
  if (z < -95) return 'la ribera del Mapocho, junto a la Estación Mapocho';
  return 'una calle del centro, a pocas cuadras de la Plaza de Armas';
}

function ficha(asset, i, [x, , z]) {
  const m = asset.match(/^SM_Peaton_(Sentado_)?([A-Za-z]+)/);
  const sentado = !!m[1];
  const tipo = m[2].toLowerCase();
  const r = azar(hash(asset) + i*7919);
  const mujer = ['dama', 'manto', 'vendedora'].includes(tipo);
  const lugar = zona(x, z);
  let oficio = elegir(r, OFICIOS[tipo] || OFICIOS.caballero);
  if (tipo === 'caballero' && lugar.includes('Moneda') && r() < 0.6) oficio = 'funcionario del gobierno en La Moneda';
  if (tipo === 'caballero' && lugar.includes('Mapocho') && r() < 0.6) oficio = 'viajero que acaba de llegar en tren desde Valparaíso';
  if (tipo === 'huaso' && lugar.includes('Mapocho') && r() < 0.6) oficio = 'cargador de equipajes de la Estación Mapocho';
  if (tipo === 'vendedora' && lugar.includes('Plaza de Armas') && r() < 0.5) oficio = 'florista de la Plaza de Armas';
  const acomodado = /abogado|médico|Bolsa|señora de sociedad|funcionario|Hacienda/.test(oficio);
  const nombre = tipo === 'nino' ? elegir(r, NINOS) : `${elegir(r, mujer ? MUJERES : HOMBRES)} ${elegir(r, acomodado ? APELLIDOS_ALTOS : APELLIDOS)}`;
  const edad = tipo === 'nino' ? `${10 + Math.floor(r()*5)} años` : `${22 + Math.floor(r()*50)} años`;
  return {
    nombre, oficio, edad, tipo, mujer,
    lugar: sentado ? `${lugar}, sentad${mujer ? 'a' : 'o'} en una banca` : lugar,
    caracter: elegir(r, CARACTER)[mujer ? 1 : 0],
    voz: elegirVoz(r, { mujer, tipo, edad }),
  };
}

const SALUDOS = ['¿Quién es usted?', '¿Qué hay que ver por aquí?', '¿Qué noticias hay en la ciudad?', '¿A qué se dedica?'];
// preguntas sugeridas para seguir la conversación (todas, para el modo sin escritura libre)
const PREGUNTAS = ['¿Cuánto gana al mes?', '¿Cómo es su casa?', '¿Qué come en un día normal?', '¿Fue a la escuela?', '¿Quién gobierna Chile?',
  '¿Qué hacen los niños de su edad?', '¿Cómo se divierte la gente?', '¿Qué opina de los conventillos?', '¿Las mujeres pueden votar?',
  '¿Qué es el salitre?', '¿Cómo viaja a otras ciudades?', '¿Qué cosas modernas han llegado?'];
const SALUDO_OCULTO = '(El forastero se le acerca y le saluda.)';

export function crearPersonajes({ datos, agentes, jugador, sonido, alAbrir, alCerrar }) {
  // todas las personas del juego, con su identidad
  const gente = [];
  for (const [asset, lista] of Object.entries(datos.instancias)) {
    if (!asset.startsWith('SM_Peaton_')) continue;
    lista.forEach((pos, i) => gente.push({ asset, i, ficha: ficha(asset, i, pos), historia: [], ag: agentes.agente(asset, i) || { x: pos[0], y: pos[1], z: pos[2] } }));
  }
  const hablante = crearHablante({ sonido });

  // ---- interfaz
  const boton = document.createElement('button');
  boton.id = 'hablar';
  document.body.append(boton);
  const panel = document.createElement('div');
  panel.id = 'charla';
  panel.innerHTML = `
    <header><div><b></b><small></small></div>
      <button class="manos" title="Conversar con la voz: después de cada respuesta, el micrófono se abre solo">🗣️</button>
      <button class="voz" title="Escuchar las respuestas">🔊</button><button class="cerrar" title="Cerrar">✕</button></header>
    <div class="mensajes"></div>
    <div class="sugerencias"></div>
    <form><button type="button" class="mic" title="Hablarle con la voz">🎤</button><input maxlength="300" placeholder="Escríbale o tóquele el micrófono…" autocomplete="off" enterkeyhint="send"><button>Decir</button></form>`;
  document.body.append(panel);
  const $ = (s) => panel.querySelector(s);
  const mensajes = $('.mensajes'), entrada = $('input'), mic = $('.mic'), manos = $('.manos');

  let cerca = null, actual = null, ocupado = false, voz = true;
  let manosLibres = false;
  try { manosLibres = localStorage.getItem('santiago_manos_libres') === '1'; } catch { /* sin almacenamiento */ }
  const pintarManos = () => manos.classList.toggle('activo', manosLibres);
  pintarManos();

  function burbuja(rol, texto) {
    const d = document.createElement('p');
    d.className = rol;
    d.textContent = texto;
    mensajes.append(d);
    mensajes.scrollTop = mensajes.scrollHeight;
    return d;
  }

  // ---- oído: lo que dice el jugador por el micrófono
  const oido = crearOido({
    alParcial: (t) => { entrada.value = t; },
    alFinal: (t) => enviar(t),
    alEstado: (e) => {
      mic.className = 'mic ' + e;
      entrada.placeholder = e === 'escuchando' ? 'Le escucho…' : e === 'pensando' ? 'Entendiendo…' : 'Escríbale o tóquele el micrófono…';
      if (e === 'sin-permiso') { burbuja('nota', 'Para hablarle con la voz, permita el uso del micrófono en el navegador.'); manosLibres = false; pintarManos(); }
    },
  });
  if (!oido.disponible) { mic.style.display = 'none'; manos.style.display = 'none'; }
  let libre = true, escucha = null;
  function pintarSugerencias(lista) {
    const caja = $('.sugerencias');
    caja.innerHTML = '';
    for (const s of lista) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = s;
      b.onclick = () => enviar(s);
      caja.append(b);
    }
  }

  // la persona se detiene y mira al jugador mientras conversan (lo maneja agentes.js)
  const mirar = (p, alJugador) => { p.ag.hablando = alJugador; };

  function abrir(p, opciones = {}) {
    actual = p;
    p.opciones = opciones;
    const f = p.ficha;
    $('header b').textContent = f.nombre;
    $('header small').textContent = f.oficio;
    mensajes.innerHTML = '';
    for (const m of p.historia) if (!(m.role === 'user' && m.content.startsWith('('))) burbuja(m.role === 'user' ? 'yo' : 'ella', m.content);
    pintarSugerencias(SALUDOS);
    panel.classList.add('abierto');
    boton.style.display = 'none';
    mirar(p, true);
    alAbrir?.();
    // la primera vez, la persona saluda; si se conversa con la voz, el micrófono se abre al terminar
    if (opciones.saludo) enviar(opciones.saludo, true);
    else if (!p.historia.length) enviar(SALUDO_OCULTO, true);
    else if (manosLibres) oido.escuchar();
    else if (!matchMedia('(pointer: coarse)').matches) entrada.focus();
  }

  function cerrar() {
    if (!actual) return;
    mirar(actual, false);
    actual = null;
    panel.classList.remove('abierto');
    hablante.callar();
    oido.cancelar();
    entrada.blur();
    alCerrar?.();
  }

  async function enviar(texto, oculto = false) {
    texto = texto.trim();
    if (!texto || ocupado || !actual) return;
    const p = actual;
    ocupado = true;
    hablante.callar();
    $('.sugerencias').innerHTML = '';
    entrada.value = '';
    if (!oculto) burbuja('yo', texto);
    p.historia.push({ role: 'user', content: texto });
    const b = burbuja('ella escribiendo', '…');
    let respuesta = '', dicho = 0;
    const posicion = () => [p.ag.x, p.ag.y, p.ag.z];
    // cada frase completa se manda a la voz mientras el resto se sigue escribiendo
    const decirHasta = (fin) => {
      // sin acotaciones como (sonríe) o *lee la carta*: solo lo que se dice en voz alta
      const frase = respuesta.slice(dicho, fin).replace(/\([^)]*\)|\*[^*]*\*/g, ' ');
      dicho = fin;
      if (voz && actual === p) hablante.decir(frase, p.ficha, posicion);
    };
    const frasesListas = () => {
      const re = /[.!?…](?=\s)/g;
      re.lastIndex = dicho;
      let m;
      while ((m = re.exec(respuesta))) if (m.index + 1 - dicho >= 14) { decirHasta(m.index + 1); re.lastIndex = dicho; }
    };
    try {
      const r = await fetch(IA, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaje: p.ficha, messages: p.historia.slice(-12) }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Error ${r.status}`);
      const lector = r.body.getReader(), dec = new TextDecoder();
      let resto = '';
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        resto += dec.decode(value, { stream: true });
        const lineas = resto.split('\n');
        resto = lineas.pop();
        for (const l of lineas) {
          if (!l.startsWith('data: ') || l.includes('[DONE]')) continue;
          try { respuesta += JSON.parse(l.slice(6)).response || ''; } catch { /* trozo incompleto */ }
        }
        if (respuesta) { b.textContent = respuesta; b.classList.remove('escribiendo'); mensajes.scrollTop = mensajes.scrollHeight; frasesListas(); }
      }
      respuesta = respuesta.trim() || '…';
      b.textContent = respuesta;
      b.classList.remove('escribiendo');
      decirHasta(respuesta.length);
      p.historia.push({ role: 'assistant', content: respuesta });
      p.opciones?.alResponder?.(respuesta);
      escucha?.(p, respuesta, texto);
      // conversación con la voz: cuando la persona termina de hablar, se vuelve a escuchar al jugador
      hablante.terminado().then(() => { if (manosLibres && actual === p && !ocupado) oido.escuchar(); });
    } catch (e) {
      p.historia.pop();
      b.className = 'nota';
      b.textContent = `(${p.ficha.nombre} no le escuchó bien: ${e.message})`;
    }
    ocupado = false;
    if (actual === p) pintarSugerencias([...PREGUNTAS].sort(() => Math.random() - 0.5).slice(0, 4));
  }

  $('form').onsubmit = (e) => { e.preventDefault(); enviar(entrada.value); };
  $('.cerrar').onclick = cerrar;
  $('.voz').onclick = () => { voz = !voz; $('.voz').style.opacity = voz ? 1 : 0.4; if (!voz) hablante.callar(); };
  mic.onclick = () => {
    if (oido.escuchando()) return oido.detener();
    hablante.callar();               // interrumpirle para hablar
    oido.escuchar();
  };
  manos.onclick = () => {
    manosLibres = !manosLibres;
    try { localStorage.setItem('santiago_manos_libres', manosLibres ? '1' : '0'); } catch { /* sin almacenamiento */ }
    pintarManos();
    if (manosLibres && !ocupado) { hablante.callar(); oido.escuchar(); } else if (!manosLibres) oido.cancelar();
  };
  boton.onclick = (e) => { e.stopPropagation(); if (cerca) abrir(cerca); };
  addEventListener('keydown', (e) => {
    if (e.target === entrada) { if (e.code === 'Escape') { cerrar(); e.stopImmediatePropagation(); } return; }
    if ((e.code === 'KeyE' || e.code === 'Enter') && cerca && !actual) { e.preventDefault(); abrir(cerca); }
    else if (e.code === 'KeyV' && actual) { e.preventDefault(); mic.onclick(); }
    else if (e.code === 'Escape' && actual) { cerrar(); e.stopImmediatePropagation(); }
  });
  window.speechSynthesis?.getVoices();     // Chrome carga las voces del sistema de forma diferida

  const v = new THREE.Vector2();
  return {
    abierto: () => !!actual,
    // conversación con alguien que no es un transeúnte (personajes de las misiones)
    conversar: (p, opciones) => { if (actual) cerrar(); abrir(p, opciones); },
    // opciones del menú: { activa, volumen (0..1), velocidad (0.6..1.5) }
    voz({ activa, volumen, velocidad }) {
      if (activa !== undefined) { voz = activa; $('.voz').style.opacity = voz ? 1 : 0.4; }
      hablante.opciones({ activa, vol: volumen, vel: velocidad });
    },
    // las aventuras se enteran de cada respuesta (el reportero cuenta sus entrevistas)
    escuchar(fn) { escucha = fn; },
    // modo clase: sin escritura ni micrófono, solo las preguntas sugeridas
    permitirTexto(v) {
      libre = v;
      $('form').style.display = v ? '' : 'none';
      manos.style.display = v && oido.disponible ? '' : 'none';
      if (!v) { oido.cancelar(); manosLibres = false; pintarManos(); }
    },
    // busca a la persona más cercana para ofrecer conversar
    actualizar() {
      if (actual) {
        if (Math.hypot(jugador.x - actual.ag.x, jugador.z - actual.ag.z) > DISTANCIA*2.5) cerrar();
        return;
      }
      let mejor = null, dmin = DISTANCIA;
      for (const p of gente) {
        const d = v.set(jugador.x - p.ag.x, jugador.z - p.ag.z).length();
        if (d < dmin && Math.abs(jugador.y - p.ag.y - 1.45) < 2.5) { dmin = d; mejor = p; }
      }
      if (mejor !== cerca) {
        cerca = mejor;
        boton.style.display = cerca ? 'block' : 'none';
        if (cerca) boton.innerHTML = `💬 Hablar con <b>${cerca.ficha.nombre}</b><small>${cerca.ficha.oficio}</small>`;
      }
    },
  };
}
