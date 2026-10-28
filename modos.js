// Modalidades de juego, puntaje, diploma y álbum de saberes.
//  - Paseo libre: recorrer y conversar.
//  - El cartero del Centenario: la misión con personajes históricos (misiones.js).
//  - Búsqueda del tesoro: pistas que llevan a lugares de la ciudad; en cada uno, un dato y una pregunta.
//  - Telegrama urgente: contrarreloj llevando telegramas de un lugar a otro.
// El puntaje y los récords se guardan en el navegador; al final se puede descargar un diploma.

const CLAVE = 'santiago_juego_v1';

// lugares de la ciudad con su pista, el dato histórico y una pregunta (ancla: asset junto al que hay que llegar)
export const SITIOS = [
  { id: 'plaza', hoy: 'Sigue siendo el centro de Santiago. Tiene la estatua ecuestre de Pedro de Valdivia, pintores, músicos y ajedrecistas, y el Museo Histórico Nacional ocupa el antiguo Palacio de la Real Audiencia. Bajo ella pasa el Metro.', nombre: 'Plaza de Armas', ancla: 'SM_Pileta', radio: 9,
    pista: 'Busca el agua que canta en el corazón de la ciudad, donde todo comenzó en 1541.',
    dato: 'Pedro de Valdivia fundó Santiago el 12 de febrero de 1541, al pie del cerro Huelén. El alarife Pedro de Gamboa trazó la ciudad como un damero de manzanas cuadradas y la Plaza de Armas quedó al centro.',
    pregunta: { texto: '¿En qué año se fundó Santiago?', opciones: ['1492', '1541', '1810'], correcta: 1 } },
  { id: 'catedral', hoy: 'Sigue siendo la iglesia principal de Santiago y sede del arzobispado. Fue restaurada después del terremoto de 2010.', nombre: 'Catedral Metropolitana', ancla: 'SM_Catedral_Metropolitana', radio: 14,
    pista: 'Ve al templo mayor, en el costado poniente de la plaza, cuyas torres llaman a misa.',
    dato: 'La Catedral actual se empezó a construir en 1748. El arquitecto italiano Joaquín Toesca diseñó buena parte de su fachada, y también La Moneda. Sus campanas marcaban el ritmo de la ciudad.',
    pregunta: { texto: '¿Qué arquitecto italiano trabajó en la Catedral y diseñó La Moneda?', opciones: ['Lucien Hénault', 'Joaquín Toesca', 'Pedro de Gamboa'], correcta: 1 } },
  { id: 'correo', hoy: 'Sigue funcionando como oficina de Correos de Chile y alberga el Museo Postal y Telegráfico.', nombre: 'Correo Central', ancla: 'SM_Correo_Central', radio: 14,
    pista: 'Busca el reloj que mira la plaza desde el norte: allí llegan las cartas de todo Chile.',
    dato: 'El Correo Central ocupa el antiguo Palacio de los Gobernadores, donde vivieron los gobernadores de la Colonia y los primeros presidentes, hasta que en 1846 el gobierno se trasladó a La Moneda. Fue remodelado en 1908.',
    pregunta: { texto: '¿A qué edificio se trasladó el gobierno en 1846?', opciones: ['A La Moneda', 'Al Congreso', 'A la Catedral'], correcta: 0 } },
  { id: 'portales', hoy: 'El Portal Fernández Concha conserva su comercio y sus fuentes de soda, famosas por los completos y los sándwiches.', nombre: 'Los Portales', ancla: 'SM_Portales_40m', radio: 14,
    pista: 'Bajo los arcos del costado sur de la plaza se compra, se vende y se conversa.',
    dato: 'Bajo los portales había sombrererías, dulcerías, cigarrerías y vendedores ambulantes. Era el centro del comercio y del paseo. En 1912 se pagaba con pesos y centavos.',
    pregunta: { texto: '¿Qué moneda se usaba en Chile en 1912?', opciones: ['El escudo', 'El peso', 'El real'], correcta: 1 } },
  { id: 'teatro', hoy: 'Sigue siendo el principal escenario de ópera, ballet y conciertos de Chile.', nombre: 'Teatro Municipal', ancla: 'SM_Teatro_Municipal', radio: 16,
    pista: 'Encuentra el palacio de la música, con columnas pareadas y mansarda de zinc.',
    dato: 'El Teatro Municipal se inauguró en 1857, se incendió en 1870 y reabrió en 1873. Allí la alta sociedad escuchaba ópera y conciertos, y se lucía en los palcos.',
    pregunta: { texto: '¿Qué espectáculo era el más famoso del Teatro Municipal?', opciones: ['El cine sonoro', 'La ópera', 'El fútbol'], correcta: 1 } },
  { id: 'congreso', hoy: 'Desde 1990 el Congreso sesiona en Valparaíso. Este edificio, el ex Congreso Nacional, se usa para actividades del Senado y la Cámara, y sus jardines son un paseo público.', nombre: 'Congreso Nacional', ancla: 'SM_Congreso_Nacional', radio: 16,
    pista: 'Seis columnas corintias y un jardín con reja: allí se hacen las leyes, una cuadra al poniente de la Catedral.',
    dato: 'El palacio del Congreso se inauguró en 1876 y se reconstruyó tras el incendio de 1895. Allí sesionan la Cámara de Diputados y el Senado.',
    pregunta: { texto: '¿Cuántas cámaras tenía el Congreso Nacional?', opciones: ['Una', 'Dos: Diputados y Senado', 'Tres'], correcta: 1 } },
  { id: 'moneda', hoy: 'Sigue siendo la sede del Presidente de la República. Fue bombardeada el 11 de septiembre de 1973 y restaurada; bajo la Plaza de la Ciudadanía funciona el Centro Cultural La Moneda.', nombre: 'Palacio de La Moneda', ancla: 'SM_Moneda_AlaNorte', radio: 18,
    pista: 'Camina hacia el sur hasta el palacio blanco donde gobierna el Presidente.',
    dato: 'La Moneda fue construida entre 1784 y 1805 por Joaquín Toesca como Real Casa de Moneda, para acuñar monedas. Desde 1846 es la casa de gobierno.',
    pregunta: { texto: '¿Para qué se construyó originalmente La Moneda?', opciones: ['Para fabricar monedas', 'Para cuartel militar', 'Para ser catedral'], correcta: 0 } },
  { id: 'estacion', hoy: 'Dejó de recibir trenes en 1987. Hoy es el Centro Cultural Estación Mapocho, con ferias del libro, conciertos y exposiciones.', nombre: 'Estación Mapocho', ancla: 'SM_Estacion_Mapocho', radio: 22,
    pista: 'Al norte, cruzando el río, la nueva estación de fierro y vidrio espera los trenes de Valparaíso.',
    dato: 'La Estación Mapocho se inauguró en 1912, diseñada por el arquitecto Emilio Jéquier, con una gran nave de estructura metálica traída de Europa.',
    pregunta: { texto: '¿Qué arquitecto diseñó la Estación Mapocho?', opciones: ['Ignacio Cremonesi', 'Emilio Jéquier', 'Joaquín Toesca'], correcta: 1 } },
  { id: 'cerro', hoy: 'Es un parque público. Desde el cerro se dispara un cañonazo cada día a las 12 del mediodía, y el Castillo Hidalgo y la Terraza Neptuno siguen en pie.', nombre: 'Cerro Santa Lucía', lugar: 'Cerro Santa Lucía', radio: 18,
    pista: 'Sube al cerro de las terrazas, al oriente, donde Valdivia levantó su campamento.',
    dato: 'Los indígenas lo llamaban Huelén. Valdivia fundó Santiago a sus pies, y en 1872 el intendente Benjamín Vicuña Mackenna lo transformó en un paseo con jardines, escaleras y miradores.',
    pregunta: { texto: '¿Cómo llamaban los indígenas al cerro Santa Lucía?', opciones: ['Manquehue', 'Huelén', 'San Cristóbal'], correcta: 1 } },
  { id: 'mercado', hoy: 'Sigue vendiendo pescados y mariscos, y es famoso por sus restaurantes de comida chilena.', nombre: 'Mercado Central', ancla: 'SM_Mercado_Central', radio: 30,
    pista: 'Junto al río, bajo un techo de fierro forjado, se venden pescados, frutas y verduras.',
    dato: 'El Mercado Central se inauguró en 1872. Su estructura de fierro se fabricó en Gran Bretaña y se armó en Santiago.',
    pregunta: { texto: '¿De dónde se trajo la estructura de fierro del Mercado Central?', opciones: ['De Gran Bretaña', 'De Argentina', 'Se fundió en Valparaíso'], correcta: 0 } },
  { id: 'universidad', hoy: 'La Casa Central sigue siendo la sede de la rectoría. Frente a ella está la estación Universidad de Chile del Metro, que corre bajo la Alameda desde 1975.', nombre: 'Universidad de Chile', ancla: 'SM_Universidad_de_Chile', radio: 18,
    pista: 'Por la Alameda, busca la casa del saber con frontón y columnas dóricas.',
    dato: 'La Universidad de Chile se fundó en 1842 y su primer rector fue Andrés Bello. Su Casa Central de la Alameda se terminó en 1872.',
    pregunta: { texto: '¿Quién fue el primer rector de la Universidad de Chile?', opciones: ['Andrés Bello', 'Domingo F. Sarmiento', "Bernardo O'Higgins"], correcta: 0 } },
  { id: 'bellas', hoy: 'Sigue siendo el Museo Nacional de Bellas Artes, con su gran hall bajo la cúpula de vidrio, y comparte el edificio con el Museo de Arte Contemporáneo.', nombre: 'Palacio de Bellas Artes', ancla: 'SM_Bellas_Artes', radio: 20,
    pista: 'Junto al río, en el Parque Forestal, busca el palacio del arte con su gran cúpula de vidrio.',
    dato: 'El Palacio de Bellas Artes, diseñado por Emilio Jéquier, se inauguró en 1910 para celebrar el Centenario de la Independencia. Su cúpula de fierro y vidrio se fabricó en Bélgica.',
    pregunta: { texto: '¿Para qué celebración se inauguró el Palacio de Bellas Artes?', opciones: ['La llegada del ferrocarril', 'El Centenario de la Independencia', 'El fin de la Guerra del Pacífico'], correcta: 1 } },
  { id: 'vega', hoy: 'Sigue siendo el gran mercado de frutas y verduras de Santiago, en el barrio de Recoleta, con sus galpones llenos de puestos y cocinerías.', nombre: 'Vega Central', ancla: 'SM_Vega_Central', radio: 26,
    pista: 'Cruza el río hacia la Chimba: bajo galpones de zinc se venden las frutas y verduras que llegan del campo en carreta.',
    dato: 'La Vega Central funciona desde 1895 en la Chimba, al norte del Mapocho. Allí llegaban cada madrugada carretas del campo con frutas, verduras, papas y legumbres para abastecer a Santiago.',
    pregunta: { texto: '¿Qué se vendía principalmente en la Vega Central?', opciones: ['Ganado y caballos', 'Frutas y verduras', 'Telas y ropa'], correcta: 1 } },
  { id: 'pergola', hoy: 'Las floristas se trasladaron a fines de los años veinte a la ribera norte del Mapocho: hoy están en la Pérgola de las Flores, en Recoleta, y su historia inspiró la comedia musical «La pérgola de las flores» de Isidora Aguirre (1960).', nombre: 'Floristas de la Alameda', ancla: 'SM_Pergola_Flores', radio: 14,
    pista: 'En la Alameda, frente a una iglesia muy antigua de piedra, los toldos a rayas esconden claveles y rosas.',
    dato: 'En 1912 las floristas vendían sus flores en puestos sobre la Alameda, frente a la Iglesia de San Francisco, la más antigua de Santiago (su construcción empezó en 1572).',
    pregunta: { texto: '¿Dónde vendían flores las floristas de Santiago en 1912?', opciones: ['En la Estación Mapocho', 'En la Alameda, frente a San Francisco', 'En el Cerro Santa Lucía'], correcta: 1 } },
  { id: 'bomberos', hoy: 'Los bomberos de Chile siguen siendo voluntarios: no reciben sueldo por apagar incendios ni por rescatar personas.', nombre: 'Cuartel de Bomberos', ancla: 'SM_Cuartel_Bomberos', radio: 14,
    pista: 'Encuentra el cuartel rojo donde duerme la bomba a vapor de los voluntarios.',
    dato: 'El Cuerpo de Bomberos de Santiago se fundó en 1863, después del incendio de la Iglesia de la Compañía, en el que murieron cerca de dos mil personas. Sus bomberos son voluntarios.',
    pregunta: { texto: '¿Qué tragedia llevó a crear el Cuerpo de Bomberos de Santiago?', opciones: ['Un terremoto', 'El incendio de la Iglesia de la Compañía', 'Una inundación del Mapocho'], correcta: 1 } },
];

export const MODOS = [
  { id: 'paseo', nombre: 'Paseo libre', icono: '🚶', texto: 'Recorre la ciudad, entra a los edificios y conversa con quien quieras.' },
  { id: 'cartero', nombre: 'El cartero del Centenario', icono: '✉', texto: 'Entrega 6 cartas a personajes de 1912: el Presidente, el Arzobispo, un diputado… y aprende con cada uno.' },
  { id: 'tesoro', nombre: 'Búsqueda del tesoro', icono: '🗺', texto: 'Sigue 6 pistas por la ciudad. En cada lugar descubres su historia y respondes una pregunta.' },
  { id: 'telegrama', nombre: 'Telegrama urgente', icono: '⏱', texto: 'Contrarreloj: lleva 5 telegramas antes de que se acabe el tiempo. ¡Corre!' },
  { id: 'visita', nombre: 'La visita del Centenario', icono: '🎩', texto: 'Guía a un periodista francés por la ciudad: te sigue, pregunta y compara todo con París.', aventura: true },
  { id: 'reportero', nombre: 'El reportero de Zig-Zag', icono: '📰', texto: 'Entrevista a tres santiaguinos, toma una fotografía y publica tu propia portada de 1912.', aventura: true },
  { id: 'conventillo', nombre: 'Un día en el conventillo', icono: '🧺', texto: 'Ayuda a una familia obrera y descubre cómo se vivía en una sola pieza.', aventura: true },
  { id: 'incendio', nombre: '¡Incendio!', icono: '🚒', texto: 'Suenan las campanas: corre al cuartel y apaga el fuego con la bomba a vapor.', aventura: true },
];

export const MOMENTOS = [['Mañana', 9], ['Mediodía', 12.5], ['Tarde', 17], ['Atardecer', 19.6], ['Noche', 22]];

export function crearModos({ datos, jugador, suelo, toast, misiones, alCambiarModo }) {
  let guardado = { nombre: '', records: {}, album: {} };
  try { Object.assign(guardado, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch { /* sin almacenamiento */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(guardado)); } catch { /* sin almacenamiento */ } };

  // posición de cada sitio en el mundo
  for (const s of SITIOS) {
    if (s.lugar) {
      const l = datos.lugares.find((x) => x.nombre === s.lugar);
      if (l) s.pos = { x: l.pos[0], z: l.pos[2] };
    } else {
      const i = datos.instancias[s.ancla]?.[0];
      if (i) s.pos = { x: i[0], z: i[2] };
    }
  }
  const disponibles = SITIOS.filter((s) => s.pos);

  // ---- marcador de puntaje y tiempo
  const marcador = document.createElement('div');
  marcador.id = 'marcador';
  document.body.append(marcador);
  const reto = document.createElement('div');
  reto.id = 'reto';
  document.body.append(reto);
  const tarjeta = document.createElement('div');
  tarjeta.id = 'leccion';                 // misma hoja de papel antiguo que las lecciones del cartero
  tarjeta.className = 'modo';
  document.body.append(tarjeta);

  let modo = 'paseo', puntos = 0, tiempo = 0, juego = null, aventuras = null;

  function pintarMarcador() {
    if (modo === 'paseo') { marcador.style.display = 'none'; return; }
    marcador.style.display = 'block';
    const lim = aventuras?.limite();
    if (lim != null) juego = { ...(juego || {}), limite: lim };
    const reloj = juego?.limite != null ? `⏱ ${Math.max(0, Math.ceil(juego.limite))} s` : juego ? `⏱ ${Math.floor(tiempo/60)}:${String(Math.floor(tiempo % 60)).padStart(2, '0')}` : '';
    marcador.innerHTML = `<b>${MODOS.find((m) => m.id === modo).icono} ${puntos} pts</b>${reloj ? `<span class="${juego?.limite != null && juego.limite < 10 ? 'urgente' : ''}">${reloj}</span>` : ''}`;
  }

  function desbloquear(id, titulo, texto) {
    if (!guardado.album[id]) { guardado.album[id] = { titulo, texto }; guardar(); toast(`📚 Nueva página en tu álbum: ${titulo}`); }
  }

  function mostrarPregunta(s, alResponder) {
    const q = s.pregunta;
    tarjeta.innerHTML = `<div class="hoja"><h3>📍 ${s.nombre}</h3><p>${s.dato}</p>
      <h4>Pregunta</h4><p>${q.texto}</p><div class="opciones">${q.opciones.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>
      <p class="resultado"></p><button class="seguir" hidden>Seguir</button></div>`;
    tarjeta.classList.add('abierto');
    document.exitPointerLock?.();
    tarjeta.querySelectorAll('.opciones button').forEach((b) => {
      b.onclick = () => {
        const bien = +b.dataset.i === q.correcta;
        tarjeta.querySelectorAll('.opciones button').forEach((x) => { x.disabled = true; x.classList.toggle('correcta', +x.dataset.i === q.correcta); });
        if (!bien) b.classList.add('mala');
        tarjeta.querySelector('.resultado').innerHTML = (bien ? '✅ <b>¡Correcto! +50 puntos</b>' : '❌ <b>No era esa.</b> La correcta está marcada.')
          + (s.hoy ? `<span class="hoy"><b>🏙 ¿Y hoy?</b> ${s.hoy}</span>` : '');
        const seguir = tarjeta.querySelector('.seguir');
        seguir.hidden = false;
        seguir.onclick = () => { tarjeta.classList.remove('abierto'); alResponder(bien); };
      };
    });
    desbloquear('sitio_' + s.id, s.nombre, s.dato + (s.hoy ? ` Hoy: ${s.hoy}` : ''));
  }

  const mezclar = (l) => [...l].sort(() => Math.random() - 0.5);

  // ---- búsqueda del tesoro
  function iniciarTesoro() {
    juego = { lista: mezclar(disponibles).slice(0, 6), paso: 0, tPaso: 0, pista: false };
    anunciar();
    function anunciar() {
      const s = juego.lista[juego.paso];
      juego.tPaso = 0; juego.pista = false;
      reto.innerHTML = `<b>Pista ${juego.paso + 1} de ${juego.lista.length}</b><p>${s.pista}</p><button class="ayuda">🧭 Mostrar en la brújula (−25)</button>`;
      reto.style.display = 'block';
      reto.querySelector('.ayuda').onclick = (e) => { e.stopPropagation(); if (!juego.pista) { juego.pista = true; puntos = Math.max(0, puntos - 25); reto.querySelector('.ayuda').disabled = true; } };
    }
    juego.actualizar = (dt) => {
      const s = juego.lista[juego.paso];
      juego.tPaso += dt;
      if (juego.enPregunta) return;
      if (Math.hypot(jugador.x - s.pos.x, jugador.z - s.pos.z) < s.radio) {
        juego.enPregunta = true;
        const bono = Math.max(0, Math.round(120 - juego.tPaso));
        puntos += 100 + bono;
        toast(`📍 ¡Encontraste ${s.nombre}! +${100 + bono}`);
        mostrarPregunta(s, (bien) => {
          if (bien) puntos += 50;
          juego.enPregunta = false;
          juego.paso++;
          if (juego.paso >= juego.lista.length) terminar(true);
          else anunciar();
        });
      }
    };
    juego.objetivo = () => (juego.pista ? { x: juego.lista[juego.paso].pos.x, z: juego.lista[juego.paso].pos.z, nombre: '?' } : null);
  }

  // ---- telegrama urgente (contrarreloj)
  function iniciarTelegrama() {
    juego = { lista: mezclar(disponibles.filter((s) => Math.hypot(s.pos.x, s.pos.z) < 260)).slice(0, 5), paso: 0, limite: 0 };
    const preparar = () => {
      const s = juego.lista[juego.paso];
      const d = Math.hypot(jugador.x - s.pos.x, jugador.z - s.pos.z);
      juego.limite = Math.round(d/4.2 + 25);
      reto.innerHTML = `<b>Telegrama ${juego.paso + 1} de ${juego.lista.length}</b><p>¡Urgente! Llévalo a <b>${s.nombre}</b>. Sigue la brújula y corre (Shift o arrastra lejos la palanca).</p>`;
      reto.style.display = 'block';
    };
    preparar();
    juego.actualizar = (dt) => {
      const s = juego.lista[juego.paso];
      juego.limite -= dt;
      if (juego.limite <= 0) { toast('⌛ ¡Se acabó el tiempo!'); terminar(false); return; }
      if (Math.hypot(jugador.x - s.pos.x, jugador.z - s.pos.z) < s.radio) {
        const bono = Math.round(juego.limite*10);
        puntos += 100 + bono;
        toast(`✅ Telegrama entregado en ${s.nombre}: +${100 + bono}`);
        desbloquear('sitio_' + s.id, s.nombre, s.dato + (s.hoy ? ` Hoy: ${s.hoy}` : ''));
        juego.paso++;
        if (juego.paso >= juego.lista.length) terminar(true); else preparar();
      }
    };
    juego.objetivo = () => { const s = juego.lista[juego.paso]; return s ? { x: s.pos.x, z: s.pos.z, nombre: s.nombre } : null; };
  }

  // ---- fin de una partida: récord y diploma
  function terminar(completo) {
    if (modo === 'paseo') return;
    const m = modo, total = puntos;
    juego = null;
    reto.style.display = 'none';
    const previo = guardado.records[m] || 0;
    if (total > previo) guardado.records[m] = total;
    guardar();
    tarjeta.innerHTML = `<div class="hoja"><h3>${completo ? '🏆 ¡Lo lograste!' : '⌛ Fin de la partida'}</h3>
      <p>Modalidad: <b>${MODOS.find((x) => x.id === m).nombre}</b><br>Puntaje: <b>${total}</b> · Récord: <b>${Math.max(previo, total)}</b>${total > previo ? ' 🎉 ¡nuevo récord!' : ''}</p>
      <label class="nombre">Tu nombre para el diploma <input maxlength="40" value="${(guardado.nombre || '').replace(/"/g, '')}"></label>
      <div class="opciones"><button class="diploma">📜 Descargar diploma</button><button class="otra">🔁 Jugar de nuevo</button><button class="salir">🚶 Volver al paseo</button></div></div>`;
    tarjeta.classList.add('abierto');
    document.exitPointerLock?.();
    const inp = tarjeta.querySelector('input');
    inp.onchange = () => { guardado.nombre = inp.value.trim(); guardar(); };
    tarjeta.querySelector('.diploma').onclick = () => { guardado.nombre = inp.value.trim(); guardar(); diploma(m, total, completo); };
    tarjeta.querySelector('.otra').onclick = () => { tarjeta.classList.remove('abierto'); empezar(m); };
    tarjeta.querySelector('.salir').onclick = () => { tarjeta.classList.remove('abierto'); empezar('paseo'); };
  }

  // diploma en papel antiguo (imagen PNG que se descarga)
  function diploma(m, total, completo) {
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 1130;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(800, 560, 200, 800, 560, 1000);
    g.addColorStop(0, '#f6eedb'); g.addColorStop(1, '#d9c6a0');
    x.fillStyle = g; x.fillRect(0, 0, 1600, 1130);
    x.strokeStyle = '#8a6a32'; x.lineWidth = 10; x.strokeRect(40, 40, 1520, 1050);
    x.lineWidth = 3; x.strokeRect(62, 62, 1476, 1006);
    x.fillStyle = '#4a3418'; x.textAlign = 'center';
    x.font = '42px Georgia, serif'; x.fillText('SANTIAGO ANTIGUO · 1912', 800, 170);
    x.font = 'bold 92px Georgia, serif'; x.fillText('Diploma', 800, 290);
    x.font = '36px Georgia, serif'; x.fillText('Se otorga el presente reconocimiento a', 800, 390);
    x.font = 'italic bold 78px Georgia, serif'; x.fillText(guardado.nombre || 'Viajero del tiempo', 800, 500);
    x.strokeStyle = '#8a6a32'; x.lineWidth = 2; x.beginPath(); x.moveTo(380, 530); x.lineTo(1220, 530); x.stroke();
    x.font = '36px Georgia, serif';
    const titulo = { cartero: 'por servir como Cartero Mayor de Santiago', tesoro: 'por descubrir los tesoros históricos de la ciudad',
      telegrama: 'por entregar los telegramas más urgentes de la capital', visita: 'por guiar con maestría a un visitante extranjero',
      reportero: 'por su primer reportaje en la revista Zig-Zag', conventillo: 'por su solidaridad con una familia obrera',
      incendio: 'por su valor junto a los bomberos voluntarios' }[m];
    x.fillText(titulo, 800, 610);
    x.fillText(`en la modalidad «${MODOS.find((y) => y.id === m).nombre}», con ${total} puntos.`, 800, 665);
    const paginas = Object.keys(guardado.album).length;
    x.font = '30px Georgia, serif'; x.fillText(`Páginas del álbum de saberes reunidas: ${paginas}`, 800, 745);
    x.font = '28px Georgia, serif';
    x.fillText(new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }), 800, 960);
    // sello
    x.save(); x.translate(1300, 900); x.rotate(-0.25);
    x.strokeStyle = completo ? '#9a2a1e' : '#6b5a3a'; x.lineWidth = 8; x.beginPath(); x.arc(0, 0, 105, 0, Math.PI*2); x.stroke();
    x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 88, 0, Math.PI*2); x.stroke();
    x.fillStyle = x.strokeStyle; x.font = 'bold 26px Georgia, serif'; x.fillText('CORREOS', 0, -20); x.fillText('DE CHILE', 0, 14); x.font = '22px Georgia, serif'; x.fillText('1912', 0, 48);
    x.restore();
    const a = document.createElement('a');
    a.download = `diploma-santiago-antiguo-${m}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }

  // ---- álbum de saberes
  function album() {
    const paginas = Object.values(guardado.album);
    tarjeta.innerHTML = `<div class="hoja"><h3>📚 Álbum de saberes (${paginas.length})</h3>
      ${paginas.length ? paginas.map((p) => `<h4>${p.titulo}</h4><p>${p.texto}</p>`).join('') : '<p>Todavía está vacío: juega la búsqueda del tesoro, los telegramas o la misión del cartero para llenarlo.</p>'}
      <div class="opciones"><button class="cerrar">Cerrar</button></div></div>`;
    tarjeta.classList.add('abierto');
    document.exitPointerLock?.();
    tarjeta.querySelector('.cerrar').onclick = () => tarjeta.classList.remove('abierto');
  }

  function empezar(id) {
    modo = id; puntos = 0; tiempo = 0; juego = null;
    reto.style.display = 'none';
    misiones.activar(id === 'cartero');
    aventuras?.detener();
    if (MODOS.find((m) => m.id === id)?.aventura) aventuras?.iniciar(id);
    if (id === 'tesoro') iniciarTesoro();
    if (id === 'telegrama') iniciarTelegrama();
    if (id === 'cartero') toast('✉ Ve al Correo Central (sigue la brújula) y preséntate ante el jefe de la oficina.', 6000);
    alCambiarModo?.(id);
    pintarMarcador();
  }

  // hoja de papel con contenido libre (la usan las aventuras)
  function hojaLibre(html, alAbrir) {
    tarjeta.innerHTML = `<div class="hoja">${html}</div>`;
    tarjeta.classList.add('abierto');
    document.exitPointerLock?.();
    alAbrir?.(tarjeta, () => tarjeta.classList.remove('abierto'));
  }

  let tMarcador = 0;
  return {
    empezar, album,
    conectarAventuras(a) { aventuras = a; },
    preguntar: mostrarPregunta,
    tarjeta: hojaLibre,
    modo: () => modo,
    guardado: () => guardado,
    nombre: (n) => { if (n !== undefined) { guardado.nombre = n; guardar(); } return guardado.nombre; },
    // los puntos del cartero se suman desde misiones.js
    sumar(p, motivo) { puntos += p; if (motivo) toast(`⭐ +${p} ${motivo}`); pintarMarcador(); },
    desbloquear,
    terminar,
    objetivo: () => juego?.objetivo?.() ?? aventuras?.objetivo() ?? null,
    actualizar(dt) {
      if (modo === 'paseo') return;
      tiempo += dt;
      if (!aventuras?.limite() && juego?.actualizar) juego.actualizar(dt);
      if ((tMarcador -= dt) <= 0) { tMarcador = 0.25; pintarMarcador(); }
    },
  };
}
