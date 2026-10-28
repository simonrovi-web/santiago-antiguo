// Personajes de Santiago Antiguo: cada transeúnte tiene nombre, oficio y carácter de 1912,
// y conversa con el jugador a través de la IA (Cloudflare Worker santiago-ia).
import * as THREE from 'three';

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
  };
}

const SALUDOS = ['¿Quién es usted?', '¿Qué hay que ver por aquí?', '¿Qué noticias hay en la ciudad?', '¿A qué se dedica?'];

export function crearPersonajes({ datos, mallas, matrizInstancia, jugador, alAbrir, alCerrar }) {
  // todas las personas del juego, con su identidad
  const gente = [];
  for (const [asset, lista] of Object.entries(datos.instancias)) {
    if (!asset.startsWith('SM_Peaton_')) continue;
    lista.forEach((pos, i) => gente.push({ asset, i, pos, ficha: ficha(asset, i, pos), historia: [] }));
  }

  // ---- interfaz
  const boton = document.createElement('button');
  boton.id = 'hablar';
  document.body.append(boton);
  const panel = document.createElement('div');
  panel.id = 'charla';
  panel.innerHTML = `
    <header><div><b></b><small></small></div><button class="voz" title="Leer en voz alta">🔊</button><button class="cerrar" title="Cerrar">✕</button></header>
    <div class="mensajes"></div>
    <div class="sugerencias"></div>
    <form><input maxlength="300" placeholder="Escríbale algo…" autocomplete="off" enterkeyhint="send"><button>Decir</button></form>`;
  document.body.append(panel);
  const $ = (s) => panel.querySelector(s);
  const mensajes = $('.mensajes'), entrada = $('input');

  let cerca = null, actual = null, ocupado = false;
  let voz = !!window.speechSynthesis;
  $('.voz').style.opacity = voz ? 1 : 0.4;

  function burbuja(rol, texto) {
    const d = document.createElement('p');
    d.className = rol;
    d.textContent = texto;
    mensajes.append(d);
    mensajes.scrollTop = mensajes.scrollHeight;
    return d;
  }

  function hablarEnVoz(texto, f) {
    if (!voz || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    const voces = speechSynthesis.getVoices();
    u.voice = voces.find((v) => v.lang === 'es-CL') || voces.find((v) => v.lang === 'es-419' || v.lang === 'es-US' || v.lang === 'es-MX')
      || voces.find((v) => v.lang.startsWith('es')) || null;
    u.lang = u.voice?.lang || 'es-CL';
    u.pitch = f.tipo === 'nino' ? 1.6 : f.mujer ? 1.15 : 0.85;
    u.rate = 1.0;
    speechSynthesis.speak(u);
  }

  // gira a la persona para que mire al jugador (o la devuelve a su pose)
  function mirar(p, alJugador) {
    const [x, y, z, g] = p.pos;
    const giro = alJugador ? Math.atan2(-(jugador.z - z), jugador.x - x) : g;
    const mx = matrizInstancia(x, y, z, giro);
    for (const im of mallas[p.asset] || []) { im.setMatrixAt(p.i, mx); im.instanceMatrix.needsUpdate = true; }
  }

  function abrir(p) {
    actual = p;
    const f = p.ficha;
    $('header b').textContent = f.nombre;
    $('header small').textContent = f.oficio;
    mensajes.innerHTML = '';
    if (!p.historia.length) burbuja('nota', `Se acerca a ${f.nombre}. Pregúntele lo que quiera: vive en el Santiago de 1912.`);
    for (const m of p.historia) burbuja(m.role === 'user' ? 'yo' : 'ella', m.content);
    $('.sugerencias').innerHTML = '';
    for (const s of SALUDOS) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = s;
      b.onclick = () => enviar(s);
      $('.sugerencias').append(b);
    }
    panel.classList.add('abierto');
    boton.style.display = 'none';
    mirar(p, true);
    alAbrir?.();
    if (!matchMedia('(pointer: coarse)').matches) entrada.focus();
  }

  function cerrar() {
    if (!actual) return;
    mirar(actual, false);
    actual = null;
    panel.classList.remove('abierto');
    window.speechSynthesis?.cancel();
    entrada.blur();
    alCerrar?.();
  }

  async function enviar(texto) {
    texto = texto.trim();
    if (!texto || ocupado || !actual) return;
    const p = actual;
    ocupado = true;
    $('.sugerencias').innerHTML = '';
    entrada.value = '';
    burbuja('yo', texto);
    p.historia.push({ role: 'user', content: texto });
    const b = burbuja('ella escribiendo', '…');
    let respuesta = '';
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
        if (respuesta) { b.textContent = respuesta; b.classList.remove('escribiendo'); mensajes.scrollTop = mensajes.scrollHeight; }
      }
      respuesta = respuesta.trim() || '…';
      b.textContent = respuesta;
      b.classList.remove('escribiendo');
      p.historia.push({ role: 'assistant', content: respuesta });
      if (actual === p) hablarEnVoz(respuesta, p.ficha);
    } catch (e) {
      p.historia.pop();
      b.className = 'nota';
      b.textContent = `(${p.ficha.nombre} no le escuchó bien: ${e.message})`;
    }
    ocupado = false;
  }

  $('form').onsubmit = (e) => { e.preventDefault(); enviar(entrada.value); };
  $('.cerrar').onclick = cerrar;
  $('.voz').onclick = () => { voz = !voz; $('.voz').style.opacity = voz ? 1 : 0.4; if (!voz) speechSynthesis?.cancel(); };
  boton.onclick = (e) => { e.stopPropagation(); if (cerca) abrir(cerca); };
  addEventListener('keydown', (e) => {
    if (e.target === entrada) { if (e.code === 'Escape') cerrar(); return; }
    if ((e.code === 'KeyE' || e.code === 'Enter') && cerca && !actual) { e.preventDefault(); abrir(cerca); }
    else if (e.code === 'Escape') cerrar();
  });
  window.speechSynthesis?.getVoices();     // Chrome carga las voces de forma diferida

  const v = new THREE.Vector2();
  return {
    abierto: () => !!actual,
    // busca a la persona más cercana para ofrecer conversar
    actualizar() {
      if (actual) {
        const [x, , z] = actual.pos;
        if (Math.hypot(jugador.x - x, jugador.z - z) > DISTANCIA*2.5) cerrar();
        return;
      }
      let mejor = null, dmin = DISTANCIA;
      for (const p of gente) {
        const d = v.set(jugador.x - p.pos[0], jugador.z - p.pos[2]).length();
        if (d < dmin && Math.abs(jugador.y - p.pos[1] - 1.45) < 2.5) { dmin = d; mejor = p; }
      }
      if (mejor !== cerca) {
        cerca = mejor;
        boton.style.display = cerca ? 'block' : 'none';
        if (cerca) boton.innerHTML = `💬 Hablar con <b>${cerca.ficha.nombre}</b><small>${cerca.ficha.oficio}</small>`;
      }
    },
  };
}
