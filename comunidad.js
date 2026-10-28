// Comunidad: postales que los jugadores dejan en un lugar de la ciudad para que otros las encuentren.
// Se guardan en el Worker (KV) y pasan por moderación antes de publicarse. Nada de datos personales:
// solo un apodo y un mensaje corto. Cualquiera puede darles un "me gusta" o reportarlas.
import * as THREE from 'three';

const IA = 'https://santiago-ia.simonrovi.workers.dev';
const CLAVE = 'santiago_postales_v1';

async function pedir(cuerpo) {
  const r = await fetch(IA, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
  return j;
}

export function crearComunidad({ scene, jugador, toast, modos, lugarCercano }) {
  let postales = [], visibles = new Map(), mias = {};
  try { mias = JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch { /* sin almacenamiento */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(mias)); } catch { /* sin almacenamiento */ } };

  // dibujo de la postal flotante (una sola textura para todas)
  const cv = document.createElement('canvas');
  cv.width = 96; cv.height = 72;
  const g = cv.getContext('2d');
  g.fillStyle = '#f3ead8'; g.fillRect(4, 4, 88, 64);
  g.strokeStyle = '#8a6a32'; g.lineWidth = 3; g.strokeRect(4, 4, 88, 64);
  g.fillStyle = '#c0392b'; g.fillRect(66, 10, 20, 24);
  g.fillStyle = '#6b5a3a'; for (let y = 22; y < 62; y += 10) g.fillRect(12, y, 46, 2);
  const tex = new THREE.CanvasTexture(cv);
  const matPostal = new THREE.SpriteMaterial({ map: tex, transparent: true });

  async function cargar() {
    try { postales = (await pedir({ tarea: 'postales' })).postales || []; } catch { postales = []; }
    for (const [, s] of visibles) scene.remove(s);
    visibles = new Map();
    for (const p of postales) {
      const s = new THREE.Sprite(matPostal);
      s.scale.set(0.7, 0.52, 1);
      s.position.set(p.x, (p.y ?? 0) + 1.6, p.z);
      s.userData.postal = p;
      scene.add(s);
      visibles.set(p.clave, s);
    }
  }
  cargar();
  setInterval(cargar, 120000);

  // ---- interfaz
  const boton = document.createElement('button');
  boton.id = 'leer-postal';
  document.body.append(boton);
  const hoja = document.createElement('div');
  hoja.id = 'postal';
  document.body.append(hoja);
  const cerrar = () => hoja.classList.remove('abierto');

  function escribir() {
    document.exitPointerLock?.();
    const lugar = lugarCercano?.() || 'una calle de Santiago';
    hoja.innerHTML = `<div class="hoja"><h3>📮 Dejar una postal aquí</h3>
      <p class="nota">Quedará en <b>${lugar}</b> para que otros visitantes la encuentren. Escribe algo amable: un saludo, lo que aprendiste o una pista para otros jugadores.</p>
      <label>Tu apodo <input class="apodo" maxlength="20" placeholder="por ejemplo, Cartero Veloz" value="${(modos.nombre() || '').split(' ')[0].replace(/"/g, '')}"></label>
      <label>Mensaje <textarea class="texto" maxlength="280" rows="4" placeholder="Hola desde 1912…"></textarea></label>
      <p class="reglas">🛡 No escribas tu nombre completo, dirección, teléfono, colegio ni redes sociales. Las postales se revisan automáticamente y cualquiera puede reportarlas.</p>
      <p class="resultado"></p>
      <div class="opciones"><button class="enviar">Dejar la postal</button><button class="cancelar">Cancelar</button></div></div>`;
    hoja.classList.add('abierto');
    hoja.querySelector('.cancelar').onclick = cerrar;
    hoja.querySelector('.enviar').onclick = async () => {
      const btn = hoja.querySelector('.enviar');
      btn.disabled = true; btn.textContent = 'Revisando…';
      try {
        const r = await pedir({ tarea: 'postal', apodo: hoja.querySelector('.apodo').value, texto: hoja.querySelector('.texto').value,
          x: jugador.x, y: jugador.y - 1.65, z: jugador.z, lugar });
        mias[r.postal.clave] = true; guardar();
        r.postal.y = jugador.y - 1.65;
        postales.unshift(r.postal);
        const s = new THREE.Sprite(matPostal); s.scale.set(0.7, 0.52, 1); s.position.set(jugador.x, jugador.y, jugador.z); s.userData.postal = r.postal;
        scene.add(s); visibles.set(r.postal.clave, s);
        modos.sumar?.(25, 'por tu postal');
        cerrar();
        toast('📮 ¡Tu postal quedó en la ciudad!');
      } catch (e) {
        hoja.querySelector('.resultado').textContent = e.message;
        btn.disabled = false; btn.textContent = 'Dejar la postal';
      }
    };
  }

  function leer(p) {
    document.exitPointerLock?.();
    const fecha = new Date(p.t).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
    hoja.innerHTML = `<div class="hoja"><h3>📮 Postal de ${p.apodo}</h3><p class="nota">${p.lugar ? p.lugar + ' · ' : ''}${fecha}</p>
      <p class="mensaje"></p>
      <div class="opciones"><button class="gusta">❤ Me gusta (${p.gusta || 0})</button><button class="reporta">🚩 Reportar</button><button class="cancelar">Cerrar</button></div></div>`;
    hoja.querySelector('.mensaje').textContent = p.texto;          // texto de otro jugador: nunca como HTML
    hoja.classList.add('abierto');
    hoja.querySelector('.cancelar').onclick = cerrar;
    hoja.querySelector('.gusta').onclick = async (e) => {
      e.target.disabled = true;
      try { const r = await pedir({ tarea: 'postal_gusta', clave: p.clave }); p.gusta = r.gusta; e.target.textContent = `❤ ¡Gracias! (${r.gusta})`; } catch { e.target.textContent = '❤ No se pudo'; }
    };
    hoja.querySelector('.reporta').onclick = async (e) => {
      if (!confirm('¿Reportar esta postal por ser inapropiada?')) return;
      e.target.disabled = true;
      try {
        const r = await pedir({ tarea: 'postal_reporta', clave: p.clave });
        if (r.oculta) { scene.remove(visibles.get(p.clave)); visibles.delete(p.clave); }
        e.target.textContent = '🚩 Reportada, gracias';
      } catch { e.target.textContent = '🚩 No se pudo'; }
    };
  }

  let cerca = null, tBusca = 0;
  boton.onclick = (e) => { e.stopPropagation(); if (cerca) leer(cerca); };
  return {
    escribir,
    cantidad: () => postales.length,
    actualizar(dt, t) {
      for (const [, s] of visibles) s.position.y += Math.sin(t*2 + s.position.x)*0.002;
      if ((tBusca -= dt) > 0) return;
      tBusca = 0.3;
      let mejor = null, dmin = 2.6;
      for (const p of postales) {
        const d = Math.hypot(jugador.x - p.x, jugador.z - p.z);
        if (d < dmin) { dmin = d; mejor = p; }
      }
      if (mejor !== cerca) {
        cerca = mejor;
        boton.style.display = cerca ? 'block' : 'none';
        if (cerca) boton.textContent = `📮 Leer la postal de ${cerca.apodo}`;
      }
    },
  };
}
