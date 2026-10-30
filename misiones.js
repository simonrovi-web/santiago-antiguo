// Misión "El cartero del Centenario" (Santiago, 1912): el jugador recibe la valija en el Correo Central y
// entrega cartas a personas de la época. Cada entrega es una conversación con la IA en el papel del
// destinatario, una lección breve sobre la sociedad, la política o la economía de 1912 y una pregunta
// que se premia con un sello. Los personajes marcados como "ficción" son inventados pero verosímiles.
import * as THREE from 'three';

const CLAVE = 'santiago_mision_cartero_v1';

// ancla: asset junto al que está la persona; local: posición en las coordenadas del asset (Blender: x, y, z),
// con la fachada en y=0 mirando a -y; mira: hacia dónde mira la persona en esas coordenadas (radianes).
export const JEFE = {
  id: 'jefe', ancla: 'SM_Correo_Central', local: [0, 15.5, 0.03], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_02',
  nombre: 'Rosendo Vergara', oficio: 'jefe de la Oficina Central de Correos', edad: '58 años', ficcion: true,
  caracter: 'ordenado, puntilloso y orgulloso de su servicio; trata al cartero con paternal exigencia',
  biografia: 'Jefe de la Oficina Central de Correos de Santiago, en el antiguo Palacio de los Gobernadores al norte de la Plaza de Armas, remodelado en 1908 por el arquitecto Ignacio Cremonesi, que le agregó el tercer piso y la claraboya del gran hall. Chile pertenece a la Unión Postal Universal desde 1881. El correo y el telégrafo son la forma de comunicarse entre ciudades; el teléfono es escaso. Los carteros reparten a pie con su valija de cuero y uniforme con gorra.',
};

export const ENTREGAS = [
  {
    id: 'presidente', ancla: 'SM_Moneda_AlaNorte', local: [2.0, -1.8, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_01', adorno: 'banda',
    nombre: 'Ramón Barros Luco', oficio: 'Presidente de la República', edad: '77 años', destino: 'Palacio de La Moneda',
    caracter: 'tranquilo, conciliador, de humor seco y muy pausado; prefiere no apurar las decisiones',
    biografia: 'Ramón Barros Luco nació en Santiago en 1835. Abogado, fue diputado, senador, presidente de la Cámara y varias veces ministro. Asumió la Presidencia el 23 de diciembre de 1910, elegido a los 75 años como candidato de consenso de los partidos. Gobierna en la República Parlamentaria, nacida tras la guerra civil de 1891, en la que el Congreso domina y los gabinetes caen seguido (la rotativa ministerial). Se le atribuye la frase de que hay dos clases de problemas, los que se resuelven solos y los que no tienen solución. Le gusta el sándwich de carne con queso derretido que pide en la cantina del Congreso. Este año 1912 se inaugura la Estación Mapocho, parte de las obras del Centenario.',
    carta: 'una carta del Intendente de Tarapacá sobre la exportación de salitre y las quejas de los obreros de las oficinas salitreras',
    leccion: {
      titulo: 'La República Parlamentaria (1891-1925)',
      puntos: [
        'Tras la guerra civil de 1891 el Congreso pasó a dominar al Presidente: podía censurar a los ministros y negarles el presupuesto.',
        'Los gabinetes cambiaban tan seguido que se habló de la "rotativa ministerial".',
        'Gobernaba una élite de grandes familias y partidos (Conservador, Liberal, Radical, Liberal Democrático); el cohecho (comprar votos) era común.',
        'Barros Luco asumió en 1910, a los 75 años, como candidato de consenso; el sándwich de carne y queso lleva su nombre.',
      ],
    },
    pregunta: { texto: '¿Qué régimen político tenía Chile en 1912?', opciones: ['Una República Parlamentaria, con un Congreso muy poderoso', 'Una monarquía constitucional', 'Una dictadura militar'], correcta: 0,
      explicacion: 'Entre 1891 y 1925 el Congreso controlaba a los ministros: por eso se habla de República Parlamentaria.' },
  },
  {
    id: 'arzobispo', ancla: 'SM_Catedral_Metropolitana', local: [2.5, -2.6, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_03', adorno: 'sotana',
    nombre: 'Juan Ignacio González Eyzaguirre', oficio: 'Arzobispo de Santiago', edad: '68 años', destino: 'Catedral Metropolitana',
    caracter: 'bondadoso, sereno y culto; habla con calma y cita a veces a los santos',
    biografia: 'Juan Ignacio González Eyzaguirre nació en Santiago en 1844, fue sacerdote, profesor de teología y canónigo, y es Arzobispo de Santiago desde 1908. La Iglesia y el Estado están unidos: la Constitución de 1833 declara la religión católica como oficial, aunque las leyes laicas de la década de 1880 crearon el registro civil, el matrimonio civil y los cementerios laicos. Le preocupa la cuestión social: la miseria de los conventillos, la alta mortalidad infantil, el alcoholismo y la falta de escuelas, y apoya las obras de caridad y los patronatos católicos.',
    carta: 'una carta del párroco de una parroquia popular de Santiago que pide ayuda para las familias de los conventillos',
    leccion: {
      titulo: 'La Iglesia y la cuestión social',
      puntos: [
        'La Iglesia y el Estado estaban unidos desde la Constitución de 1833; se separaron recién en 1925.',
        'Las leyes laicas de 1883-1884 crearon los cementerios laicos, el matrimonio civil y el registro civil.',
        'La "cuestión social": conventillos insalubres, epidemias y una mortalidad infantil altísima (cerca de un tercio de los niños moría antes de cumplir un año).',
        'Iglesia, sociedades de beneficencia y mutuales obreras intentaban paliar la pobreza.',
      ],
    },
    pregunta: { texto: '¿Hasta qué año estuvieron unidos la Iglesia y el Estado en Chile?', opciones: ['Hasta 1810', 'Hasta 1925', 'Hasta 1891'], correcta: 1,
      explicacion: 'La Constitución de 1925 separó la Iglesia del Estado; hasta entonces el catolicismo era la religión oficial.' },
  },
  {
    id: 'diputado', ancla: 'SM_Congreso_Nacional', local: [2.5, 3.0, 1.4], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_02',
    nombre: 'Arturo Alessandri Palma', oficio: 'diputado liberal por Curicó', edad: '44 años', destino: 'Congreso Nacional',
    caracter: 'apasionado, gran orador, gesticula al hablar y se entusiasma con las reformas',
    biografia: 'Arturo Alessandri Palma nació en Longaví en 1868, es abogado de la Universidad de Chile y diputado del Partido Liberal por Curicó desde 1897. Fue ministro de Industria y Obras Públicas en 1898. Es un orador vehemente que denuncia el cohecho y se interesa por la cuestión social y los problemas del salitre. El Congreso funciona en el palacio neoclásico de la calle Catedral, reconstruido tras el incendio de 1895; aquí sesionan la Cámara de Diputados y el Senado.',
    carta: 'una carta de electores de Curicó con peticiones para su provincia y una invitación a una concentración liberal',
    leccion: {
      titulo: 'El Congreso y las elecciones',
      puntos: [
        'El Congreso tenía dos cámaras: Diputados y Senado. Sesionaban en este palacio, inaugurado en 1876 y reconstruido tras el incendio de 1895.',
        'Votaban los hombres de 21 años o más que supieran leer y escribir; las mujeres no podían votar (recién lo hicieron en todas las elecciones desde 1949).',
        'El cohecho (pagar por los votos) y la intervención de los hacendados sobre sus inquilinos eran habituales.',
        'Partidos principales: Conservador, Liberal, Radical, Liberal Democrático (balmacedistas) y Demócrata, de los artesanos.',
      ],
    },
    pregunta: { texto: '¿Quiénes podían votar en 1912?', opciones: ['Todas las personas mayores de 18 años', 'Hombres y mujeres que tuvieran propiedades', 'Hombres de 21 años o más que supieran leer y escribir'], correcta: 2,
      explicacion: 'Era un voto restringido: solo hombres alfabetizados de 21 años o más. Las mujeres votaron en todas las elecciones recién en 1949.' },
  },
  {
    id: 'rector', ancla: 'SM_Universidad_de_Chile', local: [2.2, -3.2, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_01',
    nombre: 'Domingo Amunátegui Solar', oficio: 'Rector de la Universidad de Chile', edad: '52 años', destino: 'Universidad de Chile, en la Alameda',
    caracter: 'erudito, metódico y amable; le encanta la historia de Chile y la educación pública',
    biografia: 'Domingo Amunátegui Solar nació en Santiago en 1860, es historiador y educador, y Rector de la Universidad de Chile desde 1911. Es hijo de Miguel Luis Amunátegui, el ministro de Instrucción que firmó en 1877 el decreto que permitió a las mujeres rendir exámenes para entrar a la universidad; gracias a él, Eloísa Díaz se tituló de médica en 1887, la primera de Chile. Defiende la educación pública, los liceos de niñas y la formación de profesores en el Instituto Pedagógico, fundado en 1889. Cerca de la mitad de los chilenos no sabe leer ni escribir y la enseñanza primaria todavía no es obligatoria.',
    carta: 'una carta de una joven profesora de un liceo de niñas de provincia que quiere estudiar en el Instituto Pedagógico',
    leccion: {
      titulo: 'Educación y mujeres en 1912',
      puntos: [
        'La Universidad de Chile (1842) dirigía la enseñanza del país; el Instituto Pedagógico (1889) formaba a los profesores de liceo.',
        'El Decreto Amunátegui de 1877 permitió que las mujeres entraran a la universidad.',
        'Eloísa Díaz fue la primera médica de Chile (1887); Ernestina Pérez se tituló poco después.',
        'Cerca de la mitad de la población era analfabeta; la educación primaria obligatoria llegó con la ley de 1920.',
      ],
    },
    pregunta: { texto: '¿Quién fue la primera mujer en titularse de médica en Chile?', opciones: ['Eloísa Díaz', 'Gabriela Mistral', 'Javiera Carrera'], correcta: 0,
      explicacion: 'Eloísa Díaz se tituló en 1887, gracias al Decreto Amunátegui de 1877 que abrió la universidad a las mujeres.' },
  },
  {
    id: 'estacion', ancla: 'SM_Estacion_Mapocho', local: [54.5, 36.0, 0], mira: 0, cuerpo: 'SM_Peaton_Huaso_01', ficcion: true,
    nombre: 'Exequiel Fernández', oficio: 'jefe de la Estación Mapocho de los Ferrocarriles del Estado', edad: '50 años', destino: 'Estación Mapocho',
    caracter: 'práctico, apurado y amante de los horarios; saca seguido su reloj de bolsillo',
    biografia: 'Jefe de la Estación Mapocho, inaugurada este año 1912 junto al río Mapocho, con su gran nave de fierro traída de Europa, para los trenes a Valparaíso y Los Andes. El ferrocarril de Santiago a Valparaíso funciona desde 1863 y el Ferrocarril Trasandino une Los Andes con Mendoza desde 1910. Conoce bien la economía: el salitre del Norte Grande (Tarapacá y Antofagasta, ganados en la Guerra del Pacífico) se exporta a Europa como abono, y sus derechos de exportación pagan cerca de la mitad del presupuesto del Estado; el trigo y los productos del campo bajan en tren al puerto.',
    carta: 'un telegrama de Valparaíso que avisa que en el tren de la tarde llega un cargamento de maquinaria inglesa',
    leccion: {
      titulo: 'La economía del salitre y los ferrocarriles',
      puntos: [
        'El salitre de Tarapacá y Antofagasta, ganados en la Guerra del Pacífico (1879-1884), era el gran producto de exportación.',
        'Sus impuestos de exportación financiaban cerca de la mitad del presupuesto del Estado.',
        'Los ferrocarriles unían el país: Santiago-Valparaíso (1863), Trasandino a Mendoza (1910) y la nueva Estación Mapocho (1912).',
        'Gran parte de las salitreras, bancos y ferrocarriles privados eran de capitales británicos.',
      ],
    },
    pregunta: { texto: '¿Qué producto pagaba buena parte de los gastos del Estado chileno en 1912?', opciones: ['El cobre', 'El salitre', 'El trigo'], correcta: 1,
      explicacion: 'Los derechos de exportación del salitre llegaban a cerca de la mitad de los ingresos fiscales.' },
  },
  {
    id: 'obrera', ancla: 'SM_Portales_40m', local: [6.0, -1.6, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Vendedora_02', ficcion: true,
    nombre: 'Rosa Elvira Jara', oficio: 'obrera cigarrera y dirigente de una sociedad mutual de obreras', edad: '31 años', destino: 'los Portales, frente a la Plaza de Armas',
    caracter: 'franca, valiente y combativa, pero cálida; habla claro de las injusticias',
    biografia: 'Obrera de una fábrica de cigarrillos de Santiago y dirigente de una sociedad de socorros mutuos de obreras. Vive en un conventillo de una sola pieza con su madre y sus hermanos. Conoce las jornadas de más de diez horas sin descanso dominical, el trabajo de los niños, los bajos salarios pagados a veces en fichas, la matanza de la Escuela Santa María de Iquique en 1907, la huelga de la carne de 1905 en Santiago, y que este año 1912 Luis Emilio Recabarren fundó en Iquique el Partido Obrero Socialista. Las mutuales ayudan con médicos, entierros y escuelas nocturnas.',
    carta: 'una carta de su hermano, que trabaja en una oficina salitrera de Tarapacá',
    leccion: {
      titulo: 'Los trabajadores y la cuestión social',
      puntos: [
        'Jornadas de 10 a 12 horas, trabajo infantil y salarios pagados en fichas que solo valían en la pulpería de la salitrera.',
        'Las sociedades de socorros mutuos y las mancomunales eran la forma de organizarse y ayudarse.',
        'Huelgas reprimidas con dureza: la "huelga de la carne" en Santiago (1905) y la matanza de la Escuela Santa María de Iquique (1907).',
        'En 1912 Luis Emilio Recabarren fundó en Iquique el Partido Obrero Socialista.',
      ],
    },
    pregunta: { texto: '¿Qué partido fundó Luis Emilio Recabarren en 1912?', opciones: ['El Partido Conservador', 'El Partido Radical', 'El Partido Obrero Socialista'], correcta: 2,
      explicacion: 'El Partido Obrero Socialista se fundó en Iquique en junio de 1912; años después daría origen al Partido Comunista.' },
  },
];

// ---- utilidades compartidas con otras misiones
// ubica a una persona junto a su edificio (ancla + posición local en coordenadas de Blender)
export function ubicarEnAsset(datos, suelo, p) {
  const inst = datos.instancias[p.ancla]?.[0];
  if (!inst) return null;
  const [ix, iy, iz, g] = inst;
  const [lx, ly, lz] = p.local;
  // de coordenadas del asset (Blender, z arriba) a mundo glTF (y arriba, z = -y de Blender)
  const bx = ix + lx*Math.cos(g) - ly*Math.sin(g), by = -iz + lx*Math.sin(g) + ly*Math.cos(g);
  const x = bx, z = -by;
  const y = suelo(x, iy + lz + 2.5, z) ?? iy + lz;
  return { x, y, z, giro: g + p.mira };
}

const TINTE = { sotana: '#3d1f4a' };
export function crearCuerpo(ciudad, scene, p, pos) {
  const nodo = ciudad.scene.getObjectByName(p.cuerpo);
  const g = new THREE.Group();
  if (nodo) {
    nodo.traverse((m) => {
      if (!m.isMesh) return;
      let mat = m.material;
      if (p.adorno === 'sotana' && /Ropa|Vestido/.test(mat.name)) { mat = mat.clone(); mat.color.set(TINTE.sotana); }
      const malla = new THREE.Mesh(m.geometry, mat);
      malla.castShadow = true;
      g.add(malla);
    });
  }
  if (p.adorno === 'banda') {        // banda presidencial tricolor cruzada sobre el pecho
    const colores = ['#1d3e8a', '#f2f2f2', '#c8202a'];
    colores.forEach((c, k) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.75, 0.42), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
      b.position.set(0.215 + k*0.004, 1.15, (k - 1)*0.035);
      b.rotation.x = 0.75;
      g.add(b);
    });
  }
  if (p.adorno === 'sotana') {       // pectoral de oro
    const cruz = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.03), new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.8, roughness: 0.3 }));
    cruz.position.set(0.215, 1.18, 0);
    const brazo = cruz.clone(); brazo.scale.set(1, 0.45, 2.6); brazo.position.y = 1.21;
    g.add(cruz, brazo);
  }
  g.position.set(pos.x, pos.y, pos.z);
  g.rotation.y = pos.giro;
  scene.add(g);
  return g;
}

// marcador flotante (sobre de carta) encima de quien espera al jugador
export function crearMarcador(scene, simbolo = '✉') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#c9a45c'; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI*2); x.fill();
  x.fillStyle = '#2b2620'; x.font = '72px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(simbolo, 64, 70);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
  s.scale.set(0.8, 0.8, 0.8);
  s.renderOrder = 10;
  scene.add(s);
  return s;
}


// ---------------------------------------------------------------- creación de la misión en el juego
export function crearMisiones({ datos, ciudad, scene, suelo, jugador, personajes, toast }) {
  let estado = { fase: 'inicio', entregadas: {}, sellos: {} };
  let activa = false, modos = null;        // la misión solo corre en la modalidad del cartero
  try { Object.assign(estado, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch { /* sin almacenamiento */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin almacenamiento */ } };

  const ubicar = (p) => ubicarEnAsset(datos, suelo, p);
  const cuerpo = (p, pos) => crearCuerpo(ciudad, scene, p, pos);
  const marcador = () => crearMarcador(scene);

  const actores = [JEFE, ...ENTREGAS].map((p) => {
    const pos = ubicar(p);
    if (!pos) return null;
    const ag = { x: pos.x, y: pos.y, z: pos.z, hablando: false };
    const ficha = {
      nombre: p.nombre, oficio: p.oficio, edad: p.edad, caracter: p.caracter, biografia: p.biografia,
      lugar: p.destino || 'el gran hall del Correo Central', tipo: p.cuerpo.includes('Vendedora') ? 'vendedora' : 'caballero',
      mujer: p.cuerpo.includes('Vendedora'),
      voz: { genero: p.cuerpo.includes('Vendedora') ? 'mujer' : 'hombre', aura: p.id === 'presidente' ? 'sirio' : p.id === 'diputado' ? 'aquila' : p.id === 'obrera' ? 'celeste' : 'javier',
        azure: p.cuerpo.includes('Vendedora') ? 'es-CL-CatalinaNeural' : 'es-CL-LorenzoNeural',
        tono: parseInt(p.edad, 10) > 65 ? -10 : parseInt(p.edad, 10) > 45 ? -4 : 2, ritmo: parseInt(p.edad, 10) > 65 ? -12 : 0, reproduccion: 1 },
    };
    return { def: p, pos, ag, ficha, historia: [], grupo: cuerpo(p, pos), marca: marcador() };
  }).filter(Boolean);
  const actor = (id) => actores.find((a) => a.def.id === id);

  // ---- interfaz: botón de acción, panel de la misión, lección y sello
  const accion = document.createElement('button');
  accion.id = 'entregar';
  document.body.append(accion);
  const panel = document.createElement('div');
  panel.id = 'mision';
  document.body.append(panel);
  const leccion = document.createElement('div');
  leccion.id = 'leccion';
  document.body.append(leccion);

  const pendientes = () => ENTREGAS.filter((e) => !estado.entregadas[e.id]);
  function objetivo() {
    if (!activa) return null;
    if (estado.fase === 'inicio') return { texto: 'Ve al Correo Central, al norte de la Plaza de Armas, y habla con el jefe de la oficina.', a: actor('jefe') };
    if (estado.fase === 'reparto') {
      const fijado = estado.fijado && !estado.entregadas[estado.fijado] ? actor(estado.fijado) : null;
      if (fijado) return { texto: `Entrega la carta a ${fijado.def.nombre} (${fijado.def.destino}).`, a: fijado };
      // el destinatario pendiente más cercano
      let mejor = null, dmin = Infinity;
      for (const e of pendientes()) {
        const a = actor(e.id); if (!a) continue;
        const d = Math.hypot(a.pos.x - jugador.x, a.pos.z - jugador.z);
        if (d < dmin) { dmin = d; mejor = a; }
      }
      return mejor ? { texto: `Entrega la carta a ${mejor.def.nombre} (${mejor.def.destino}).`, a: mejor } : null;
    }
    if (estado.fase === 'regreso') return { texto: 'Vuelve al Correo Central a rendir cuentas con don Rosendo.', a: actor('jefe') };
    return null;
  }

  function pintarPanel() {
    const o = objetivo();
    const n = Object.keys(estado.entregadas).length;
    const sellos = Object.values(estado.sellos).filter((s) => s === 'oro').length;
    panel.innerHTML = `<header><b>📜 El cartero del Centenario</b><button class="cerrar">✕</button></header>
      <p class="obj">${o ? o.texto : '¡Misión cumplida! Eres Cartero Mayor de Santiago.'}</p>
      <p class="prog">Cartas entregadas: ${n} de ${ENTREGAS.length} · Sellos de oro: ${sellos}</p>
      <ul>${ENTREGAS.map((e) => `<li class="${estado.entregadas[e.id] ? 'hecha' : ''}" data-id="${e.id}">
        <span>${estado.entregadas[e.id] ? (estado.sellos[e.id] === 'oro' ? '🏅' : '✔') : '✉'}</span>
        <div><b>${e.nombre}</b><small>${e.oficio} · ${e.destino}${e.ficcion ? ' · personaje de ficción' : ''}</small></div></li>`).join('')}</ul>
      <p class="pie">${estado.fase === 'reparto' ? 'Toca una carta para que la brújula te guíe hasta su destinatario.' : ''}</p>
      <button class="reiniciar">Empezar la misión de nuevo</button>`;
    panel.querySelector('.cerrar').onclick = () => panel.classList.remove('abierto');
    panel.querySelector('.reiniciar').onclick = () => {
      if (!confirm('¿Empezar de nuevo la misión del cartero?')) return;
      estado = { fase: 'inicio', entregadas: {}, sellos: {} };
      actores.forEach((a) => { a.historia = []; });
      guardar(); pintarPanel();
    };
    panel.querySelectorAll('li[data-id]').forEach((li) => {
      li.onclick = () => { if (!estado.entregadas[li.dataset.id]) { estado.fijado = li.dataset.id; guardar(); pintarPanel(); toast(`Brújula apuntando a ${actor(li.dataset.id)?.def.nombre}`); } };
    });
  }

  function mostrarLeccion(e, alTerminar) {
    const q = e.pregunta;
    leccion.innerHTML = `<div class="hoja"><h3>📖 ${e.leccion.titulo}</h3><ul>${e.leccion.puntos.map((p) => `<li>${p}</li>`).join('')}</ul>
      <h4>Pregunta para el sello</h4><p>${q.texto}</p><div class="opciones">${q.opciones.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>
      <p class="resultado"></p><button class="seguir" hidden>Seguir conversando</button></div>`;
    leccion.classList.add('abierto');
    leccion.querySelectorAll('.opciones button').forEach((b) => {
      b.onclick = () => {
        const bien = +b.dataset.i === q.correcta;
        leccion.querySelectorAll('.opciones button').forEach((x) => { x.disabled = true; x.classList.toggle('correcta', +x.dataset.i === q.correcta); });
        if (!bien) b.classList.add('mala');
        leccion.querySelector('.resultado').innerHTML = `${bien ? '🏅 <b>¡Sello de oro!</b>' : '✔ <b>Carta entregada.</b> La respuesta correcta está marcada.'} ${q.explicacion}`;
        leccion.querySelector('.seguir').hidden = false;
        alTerminar(bien);
      };
    });
    leccion.querySelector('.seguir').onclick = () => leccion.classList.remove('abierto');
  }

  // ---- conversar con un personaje de la misión
  function hablarCon(a) {
    const id = a.def.id;
    if (id === 'jefe' && activa) {
      if (estado.fase === 'inicio') {
        a.ficha.encargo = 'El cartero se presenta a su primer día de trabajo. Tú le entregas la valija con seis cartas: para el Presidente Ramón Barros Luco en La Moneda, el Arzobispo González Eyzaguirre en la Catedral, el diputado Arturo Alessandri en el Congreso, el rector Domingo Amunátegui Solar en la Universidad de Chile, el jefe de la Estación Mapocho y la obrera Rosa Elvira Jara en los Portales. Explícale con orgullo cómo funciona el correo en 1912 y despídelo deseándole suerte.';
        personajes.conversar(a, { saludo: '(El nuevo cartero se presenta ante usted para su primer día de trabajo.)', alResponder: () => {
          if (estado.fase !== 'inicio') return;
          estado.fase = 'reparto'; guardar(); pintarPanel();
          toast('📜 Recibiste la valija con 6 cartas. Abre «Misión» para ver a quién entregarlas.');
        } });
      } else if (estado.fase === 'regreso') {
        const oro = Object.values(estado.sellos).filter((s) => s === 'oro').length;
        a.ficha.encargo = `El cartero vuelve tras entregar las seis cartas y conseguir ${oro} sellos de oro de seis. Felicítalo, nómbralo Cartero Mayor de Santiago y recuérdale, en una frase, algo de lo que aprendió sobre el Chile de 1912.`;
        personajes.conversar(a, { saludo: '(El cartero vuelve con la valija vacía y le rinde cuentas.)', alResponder: () => {
          if (estado.fase !== 'regreso') return;
          estado.fase = 'fin'; guardar(); pintarPanel();
          toast(`🏅 ¡Misión cumplida! Cartero Mayor de Santiago · ${oro} de 6 sellos de oro.`, 8000);
          setTimeout(() => modos?.terminar(true), 9000);
        } });
      } else {
        a.ficha.encargo = 'El cartero está en medio del reparto; respóndele con amabilidad y apúralo un poco.';
        personajes.conversar(a);
      }
      return;
    }
    const e = a.def;
    if (activa && estado.fase === 'reparto' && !estado.entregadas[id]) {
      a.ficha.encargo = `Te trae ${e.carta}.`;
      personajes.conversar(a, { saludo: '(El cartero le saluda y le entrega una carta en la mano.)', alResponder: () => {
        if (estado.entregadas[id]) return;
        mostrarLeccion(e, (bien) => {
          modos?.sumar(bien ? 150 : 100, bien ? 'carta entregada con sello de oro' : 'carta entregada');
          modos?.desbloquear('leccion_' + id, e.leccion.titulo, e.leccion.puntos.join(' '));
          estado.entregadas[id] = true;
          estado.sellos[id] = bien ? 'oro' : 'simple';
          if (estado.fijado === id) delete estado.fijado;
          if (!pendientes().length) { estado.fase = 'regreso'; toast('✉ ¡Todas las cartas entregadas! Vuelve al Correo Central.', 6000); }
          guardar(); pintarPanel();
        });
      } });
    } else {
      a.ficha.encargo = estado.entregadas[id] ? `El cartero ya te entregó ${e.carta}; conversa con él de lo que quiera.` : '';
      personajes.conversar(a);
    }
  }

  let cerca = null;
  accion.onclick = (ev) => { ev.stopPropagation(); if (cerca) hablarCon(cerca); };
  addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'INPUT' || personajes.abierto()) return;
    if ((ev.code === 'KeyE' || ev.code === 'Enter') && cerca) { ev.preventDefault(); ev.stopImmediatePropagation(); hablarCon(cerca); }
  }, true);
  pintarPanel();

  return {
    // al empezar la modalidad, la misión parte de cero
    activar(v) {
      activa = v;
      if (!v) panel.classList.remove('abierto');
      // se retoma la misión guardada; si ya se había terminado, empieza de nuevo
      if (v && estado.fase === 'fin') { estado = { fase: 'inicio', entregadas: {}, sellos: {} }; actores.forEach((a) => { a.historia = []; }); guardar(); }
      if (v) pintarPanel();
    },
    conectar(m) { modos = m; },
    alternarPanel() { pintarPanel(); panel.classList.toggle('abierto'); },
    objetivo,
    actualizar(t) {
      const o = objetivo();
      // marcadores: solo sobre quien espera algo del cartero
      for (const a of actores) {
        const activo = o && o.a === a;
        a.marca.visible = !!activo;
        if (activo) a.marca.position.set(a.pos.x, a.pos.y + 2.35 + Math.sin(t*2.5)*0.08, a.pos.z);
        // mirar al jugador cuando se acerca
        const d = Math.hypot(jugador.x - a.pos.x, jugador.z - a.pos.z);
        const meta = d < 5 ? Math.atan2(-(jugador.z - a.pos.z), jugador.x - a.pos.x) : a.pos.giro;
        let dg = meta - a.grupo.rotation.y; dg = Math.atan2(Math.sin(dg), Math.cos(dg));
        a.grupo.rotation.y += dg*0.08;
      }
      // botón de acción junto al personaje más cercano
      let mejor = null, dmin = 3.0;
      for (const a of actores) {
        const d = Math.hypot(jugador.x - a.pos.x, jugador.z - a.pos.z);
        if (d < dmin && Math.abs(jugador.y - a.pos.y - 1.45) < 2.5) { dmin = d; mejor = a; }
      }
      if (personajes.abierto()) mejor = null;
      if (mejor !== cerca) {
        cerca = mejor;
        accion.style.display = cerca ? 'block' : 'none';
        if (cerca) {
          const id = cerca.def.id;
          const verbo = !activa ? '💬 Hablar con' : id !== 'jefe' && estado.fase === 'reparto' && !estado.entregadas[id] ? '✉ Entregar la carta a' : id === 'jefe' && estado.fase !== 'reparto' ? '📜 Presentarse ante' : '💬 Hablar con';
          accion.innerHTML = `${verbo} <b>${cerca.def.nombre}</b><small>${cerca.def.oficio}</small>`;
        }
      }
      return cerca;
    },
  };
}
