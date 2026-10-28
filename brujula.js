// Brújula en la parte de arriba de la pantalla: muestra hacia dónde se mira (N, NE, E, …) y, si hay un
// objetivo, una marca con su distancia. El norte del juego es -z (hacia el río Mapocho y el cerro San Cristóbal).

const PUNTOS = [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SO', 225], ['O', 270], ['NO', 315]];
const CAMPO = 160;            // grados visibles en la tira

export function crearBrujula() {
  const caja = document.createElement('div');
  caja.id = 'brujula';
  caja.innerHTML = `<div class="tira"></div><div class="centro"></div><div class="meta"><span>✉</span><small></small></div><div class="grados"></div>`;
  document.body.append(caja);
  const tira = caja.querySelector('.tira'), meta = caja.querySelector('.meta'), etiqueta = meta.querySelector('small'), grados = caja.querySelector('.grados');
  const marcas = [];
  for (let g = 0; g < 360; g += 15) {
    const m = document.createElement('i');
    const p = PUNTOS.find(([, a]) => a === g);
    m.className = p ? (p[0].length === 1 ? 'card' : 'inter') : 'raya';
    m.textContent = p ? p[0] : '';
    tira.append(m);
    marcas.push([m, g]);
  }
  const relativo = (a, b) => ((a - b + 540) % 360) - 180;

  return {
    // rumbo: grados desde el norte en sentido horario; objetivo: { x, z, nombre } o null
    actualizar(rumbo, jugador, objetivo) {
      rumbo = (rumbo + 360) % 360;
      const ancho = caja.clientWidth || 300;
      for (const [m, g] of marcas) {
        const r = relativo(g, rumbo);
        const visible = Math.abs(r) < CAMPO/2;
        m.style.display = visible ? 'block' : 'none';
        if (visible) m.style.transform = `translateX(${(r/CAMPO + 0.5)*ancho}px)`;
      }
      grados.textContent = `${Math.round(rumbo)}°`;
      if (!objetivo) { meta.style.display = 'none'; return; }
      const dx = objetivo.x - jugador.x, dz = objetivo.z - jugador.z;
      const dist = Math.hypot(dx, dz);
      const r = relativo((Math.atan2(dx, -dz)*180/Math.PI + 360) % 360, rumbo);
      const dentro = Math.abs(r) < CAMPO/2;
      const x = dentro ? (r/CAMPO + 0.5)*ancho : (r < 0 ? 10 : ancho - 10);
      meta.style.display = 'flex';
      meta.style.transform = `translateX(${x}px)`;
      meta.classList.toggle('fuera', !dentro);
      meta.classList.toggle('izq', !dentro && r < 0);
      etiqueta.textContent = dist < 1000 ? `${Math.round(dist)} m` : `${(dist/1000).toFixed(1)} km`;
      meta.title = objetivo.nombre || '';
    },
  };
}
