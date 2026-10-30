// Mapa de la ciudad (tecla M o botón 🗺): una vista cenital de la ciudad, sacada una sola vez con la
// propia escena 3D, con los nombres de las calles, los lugares, los protagonistas, el objetivo de la misión
// y la posición del jugador. Se arrastra para moverlo, se acerca con la rueda o con dos dedos, y al tocar
// un lugar se puede marcar en la brújula (o, en el paseo libre, ir directamente).

const NOMBRE_CALLE = { SantoDomingo: 'Santo Domingo' };

export function crearMapa({ datos, sitios, jugador, rumbo, capturar, protagonistas, objetivo, puedeIr, irA, marcar, alAbrir }) {
  // ---- extensión del mapa: todo lo que está instanciado, con un margen
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const lista of Object.values(datos.instancias)) for (const [x, , z] of lista) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  x0 -= 20; x1 += 20; z0 -= 20; z1 += 20;
  const limites = { x0, x1, z0, z1 };

  // ---- nombres de las calles (las placas están en las esquinas; giro 0 = calle oriente-poniente)
  const calles = [];
  for (const [asset, lista] of Object.entries(datos.instancias)) {
    const m = asset.match(/^SM_Placa_Calle_(.+)$/);
    if (!m || lista.length < 2) continue;
    const nombre = NOMBRE_CALLE[m[1]] || m[1];
    const ordenadas = [...lista].sort((a, b) => (a[3] === 0 ? a[0] - b[0] : a[2] - b[2]));
    const k = Math.floor((ordenadas.length - 1)/2);
    const [a, b] = [ordenadas[k], ordenadas[k + 1]];
    calles.push({ nombre, x: (a[0] + b[0])/2, z: (a[2] + b[2])/2, vertical: Math.abs(a[3]) > 0.7 });
  }
  const { meta } = datos;
  const rotulos = [
    { nombre: 'Río Mapocho', x: -40, z: -(meta.YR0 + meta.YR1)/2, agua: true },
    { nombre: 'Alameda de las Delicias', x: -110, z: (sitios.find((s) => s.id === 'pergola')?.pos?.z ?? 390) - 8 },
    { nombre: 'La Chimba', x: 120, z: -(meta.YR1 + 25) },
  ];

  // ---- interfaz
  const caja = document.createElement('div');
  caja.id = 'mapa';
  caja.innerHTML = `<canvas></canvas>
    <div class="controles"><button data-a="mas" title="Acercar">＋</button><button data-a="menos" title="Alejar">－</button>
      <button data-a="centrar" title="Centrar en mí">⌖</button><button data-a="cerrar" title="Cerrar (M)">✕</button></div>
    <div class="leyenda"><span>➤ tú</span><span class="l-lugar">● lugares</span><span class="l-prota">★ protagonistas</span><span class="l-meta">◎ objetivo</span></div>
    <div class="info"></div>
    <p class="cargando">Dibujando el mapa…</p>`;
  document.body.append(caja);
  const lienzo = caja.querySelector('canvas'), ctx = lienzo.getContext('2d');
  const info = caja.querySelector('.info');
  let base = null, escala = 1, cx = 0, cz = 0, intervalo = null, seleccion = null, marca = null;

  const abierto = () => caja.classList.contains('abierto');
  const aPantalla = (x, z) => [lienzo.width/2 + (x - cx)*escala, lienzo.height/2 + (z - cz)*escala];
  const aMundo = (px, py) => [cx + (px - lienzo.width/2)/escala, cz + (py - lienzo.height/2)/escala];
  const dpr = () => Math.min(devicePixelRatio || 1, 2);
  const escalaMin = () => Math.min(lienzo.width/(x1 - x0), lienzo.height/(z1 - z0))*0.95;
  const acotar = () => {
    escala = Math.min(Math.max(escala, escalaMin()), 12*dpr());
    cx = Math.min(Math.max(cx, x0), x1); cz = Math.min(Math.max(cz, z0), z1);
  };

  function puntos() {
    const lista = [];
    for (const s of sitios) if (s.pos) lista.push({ tipo: 'lugar', id: s.id, nombre: s.nombre, x: s.pos.x, z: s.pos.z, texto: s.dato });
    for (const p of protagonistas?.lista() || []) lista.push({ tipo: 'prota', id: p.id, nombre: p.nombre, x: p.x, z: p.z, conocido: p.conocido || p.hecho,
      texto: `${p.oficio}. Tema: ${p.tema}.${p.ficcion ? ' (Personaje de ficción.)' : ''}` });
    return lista;
  }

  // rótulos ya dibujados en este cuadro: uno que se encime con otro anterior no se escribe
  let ocupados = [];
  function texto(t, x, y, { tam = 13, color = '#2b2620', borde = '#f3ead8cc', italica = false, angulo = 0, negrita = false, evitar = false } = {}) {
    const k = dpr();
    ctx.font = `${italica ? 'italic ' : ''}${negrita ? 'bold ' : ''}${tam*k}px Georgia, serif`;
    if (evitar) {
      const w = ctx.measureText(t).width/2 + 3*k, h = tam*k*0.6;
      const r = angulo ? [x - h, y - w, x + h, y + w] : [x - w, y - h, x + w, y + h];
      if (ocupados.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1])) return;
      ocupados.push(r);
    }
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angulo);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5*k; ctx.strokeStyle = borde; ctx.lineJoin = 'round';
    ctx.strokeText(t, 0, 0);
    ctx.fillStyle = color; ctx.fillText(t, 0, 0);
    ctx.restore();
  }

  function dibujar() {
    if (!abierto()) return;
    const k = dpr(), w = lienzo.width, h = lienzo.height;
    ctx.fillStyle = '#d9cdb2'; ctx.fillRect(0, 0, w, h);
    if (base) {
      const [ax, ay] = aPantalla(x0, z0);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(base, ax, ay, (x1 - x0)*escala, (z1 - z0)*escala);
      // tono de papel antiguo sobre la foto
      ctx.fillStyle = '#c9a45c1f'; ctx.fillRect(0, 0, w, h);
    }
    // primero los símbolos; después los nombres por importancia (lugares, protagonistas, río y calles)
    ocupados = [];
    const meta = objetivo();
    const nombres = [];
    for (const p of puntos()) {
      const [px, py] = aPantalla(p.x, p.z);
      if (px < -50 || py < -50 || px > w + 50 || py > h + 50) continue;
      const sel = seleccion && seleccion.tipo === p.tipo && seleccion.id === p.id;
      if (p.tipo === 'lugar') {
        ctx.fillStyle = sel ? '#9a2a1e' : '#6b4a1f';
        ctx.beginPath(); ctx.arc(px, py, (sel ? 7 : 5.5)*k, 0, Math.PI*2); ctx.fill();
        ctx.lineWidth = 2*k; ctx.strokeStyle = '#f3ead8'; ctx.stroke();
        nombres.push([sel ? 0 : 1, p.nombre, px, py - 14*k, { tam: 13, negrita: true, color: '#2b1d0e' }]);
      } else {
        texto('★', px, py, { tam: sel ? 24 : 20, color: p.conocido ? '#8a8172' : '#c98a10', borde: '#2b2620' });
        if (escala/k > 1.6 || sel) nombres.push([sel ? 0 : 2, p.nombre, px, py + 16*k, { tam: 12, color: '#3b2a10' }]);
      }
    }
    for (const r of rotulos) {
      const [px, py] = aPantalla(r.x, r.z);
      nombres.push([3, r.nombre, px, py, { tam: 15, italica: true, color: r.agua ? '#1f4f7a' : '#4a3418', negrita: true }]);
    }
    const tamCalle = Math.min(13, Math.max(9, escala/k*6));
    if (escala/k > 0.9) for (const c of calles) {
      const [px, py] = aPantalla(c.x, c.z);
      nombres.push([4, c.nombre, px, py, { tam: tamCalle, italica: true, color: '#3b2f22', angulo: c.vertical ? -Math.PI/2 : 0 }]);
    }
    nombres.sort((a, b) => a[0] - b[0]);
    for (const [, t, px, py, o] of nombres) texto(t, px, py, { ...o, evitar: true });
    if (marca) { const [px, py] = aPantalla(marca.x, marca.z); texto('📍', px, py - 10*k, { tam: 22, borde: '#0000' }); }
    // objetivo de la misión: anillo que late
    if (meta) {
      const [px, py] = aPantalla(meta.x, meta.z);
      const t = (performance.now()/600) % 1;
      ctx.strokeStyle = `rgba(201,50,30,${1 - t})`; ctx.lineWidth = 3*k;
      ctx.beginPath(); ctx.arc(px, py, (10 + 16*t)*k, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = '#c9321e'; ctx.beginPath(); ctx.arc(px, py, 9*k, 0, Math.PI*2); ctx.stroke();
    }
    // el jugador: flecha en la dirección en que mira (arriba es el norte)
    const [jx, jy] = aPantalla(jugador.x, jugador.z);
    ctx.save();
    ctx.translate(jx, jy); ctx.rotate(-rumbo());
    ctx.fillStyle = '#1d6fd1'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5*k;
    ctx.beginPath(); ctx.moveTo(0, -13*k); ctx.lineTo(9*k, 10*k); ctx.lineTo(0, 5*k); ctx.lineTo(-9*k, 10*k); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    // rosa de los vientos
    texto('N ▲', w - 34*k, h - 30*k, { tam: 14, negrita: true, color: '#9a2a1e' });
  }

  function mostrarInfo(p) {
    seleccion = p;
    if (!p) { info.style.display = 'none'; dibujar(); return; }
    const ir = puedeIr();
    info.innerHTML = `<b>${p.tipo === 'prota' ? '★ ' : p.tipo === 'marca' ? '📍 ' : ''}${p.nombre}</b>${p.texto ? `<p>${p.texto}</p>` : ''}
      <div><button data-a="brujula">🧭 Marcar en la brújula</button>${ir ? '<button data-a="ir">Ir allí</button>' : ''}<button data-a="nada">✕</button></div>`;
    info.style.display = 'block';
    info.querySelector('[data-a=brujula]').onclick = () => {
      marca = { x: p.x, z: p.z, nombre: p.nombre };
      marcar(marca);
      if (p.tipo === 'prota') protagonistas?.fijar(p.id);
      cerrar();
    };
    const b = info.querySelector('[data-a=ir]');
    if (b) b.onclick = () => {
      // de pie a unos metros, mirando hacia el lugar
      const dx = jugador.x - p.x, dz = jugador.z - p.z, d = Math.hypot(dx, dz) || 1;
      const r = p.tipo === 'prota' ? 2.3 : (sitios.find((s) => s.id === p.id)?.radio || 10) + 4;
      irA({ pos: [p.x + dx/d*r, 1.8, p.z + dz/d*r], mira: [p.x, 1.8, p.z] });
      cerrar();
    };
    info.querySelector('[data-a=nada]').onclick = () => mostrarInfo(null);
    dibujar();
  }

  function tocar(px, py) {
    const k = dpr();
    let mejor = null, dmin = 24*k;
    for (const p of puntos()) {
      const [sx, sy] = aPantalla(p.x, p.z);
      const d = Math.hypot(sx - px, sy - py);
      if (d < dmin) { dmin = d; mejor = p; }
    }
    if (mejor) return mostrarInfo(mejor);
    const [x, z] = aMundo(px, py);
    mostrarInfo({ tipo: 'marca', id: 'marca', nombre: 'Este punto', x, z });
  }

  // ---- arrastrar, acercar con la rueda y pellizcar
  const dedos = new Map();
  let movido = 0, pellizco = null;
  lienzo.addEventListener('pointerdown', (e) => {
    lienzo.setPointerCapture?.(e.pointerId);
    dedos.set(e.pointerId, { x: e.offsetX*dpr(), y: e.offsetY*dpr() });
    movido = 0;
    if (dedos.size === 2) { const [a, b] = [...dedos.values()]; pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), escala }; }
  });
  lienzo.addEventListener('pointermove', (e) => {
    const previo = dedos.get(e.pointerId);
    if (!previo) return;
    const ahora = { x: e.offsetX*dpr(), y: e.offsetY*dpr() };
    dedos.set(e.pointerId, ahora);
    if (dedos.size === 2 && pellizco) {
      const [a, b] = [...dedos.values()];
      escala = pellizco.escala*Math.hypot(a.x - b.x, a.y - b.y)/pellizco.d;
      movido += 10;
    } else {
      cx -= (ahora.x - previo.x)/escala; cz -= (ahora.y - previo.y)/escala;
      movido += Math.abs(ahora.x - previo.x) + Math.abs(ahora.y - previo.y);
    }
    acotar(); dibujar();
  });
  const soltar = (e) => {
    if (dedos.has(e.pointerId) && dedos.size === 1 && movido < 8*dpr()) tocar(e.offsetX*dpr(), e.offsetY*dpr());
    dedos.delete(e.pointerId);
    if (dedos.size < 2) pellizco = null;
  };
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', (e) => { dedos.delete(e.pointerId); pellizco = null; });
  lienzo.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [mx, mz] = aMundo(e.offsetX*dpr(), e.offsetY*dpr());
    escala *= Math.exp(-e.deltaY*0.0015);
    acotar();
    // acercar hacia donde apunta el mouse
    const [nx, nz] = aMundo(e.offsetX*dpr(), e.offsetY*dpr());
    cx += mx - nx; cz += mz - nz;
    acotar(); dibujar();
  }, { passive: false });
  caja.querySelector('.controles').onclick = (e) => {
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'mas') escala *= 1.5;
    if (a === 'menos') escala /= 1.5;
    if (a === 'centrar') { cx = jugador.x; cz = jugador.z; }
    if (a === 'cerrar') return cerrar();
    acotar(); dibujar();
  };

  function ajustar() {
    lienzo.width = Math.round(innerWidth*dpr());
    lienzo.height = Math.round(innerHeight*dpr());
    acotar();
  }

  function abrir() {
    caja.classList.add('abierto');
    alAbrir?.();
    document.exitPointerLock?.();
    const primera = !base;
    ajustar();
    cx = jugador.x; cz = jugador.z; escala = 1.4*dpr(); acotar();
    mostrarInfo(null);
    if (primera) {
      // la foto cenital se saca una sola vez (tarda un momento)
      caja.classList.add('sin-base');
      setTimeout(() => { base = capturar(limites); caja.classList.remove('sin-base'); dibujar(); }, 30);
    }
    dibujar();
    clearInterval(intervalo);
    intervalo = setInterval(dibujar, 120);
  }
  function cerrar() {
    caja.classList.remove('abierto');
    clearInterval(intervalo);
    info.style.display = 'none';
  }
  addEventListener('resize', () => { if (abierto()) { ajustar(); dibujar(); } });

  return {
    abrir, cerrar, abierto,
    alternar: () => (abierto() ? cerrar() : abrir()),
    quitarMarca() { marca = null; },
    marca: () => marca,
    limites,
  };
}
