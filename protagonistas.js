// Protagonistas de la historia de Chile que el jugador puede encontrar en la ciudad de 1912 y entrevistar
// con la IA. Están en la calle en cualquier modalidad (una ★ sobre la cabeza mientras no se les conoce) y
// la modalidad "Los protagonistas" pide encontrarlos a todos y responder una pregunta tras cada entrevista.
// Cada uno trae temas de los Objetivos de Aprendizaje de Historia, Geografía y Ciencias Sociales
// (6° básico OA 4 y 6; 1° medio OA 5, 13, 16 y 17; 2° medio OA 5). Los marcados "ficcion" son inventados
// pero verosímiles; "visita" indica un encuentro imaginado (la persona existió, pero no consta que
// estuviera ese día en Santiago).
import { ubicarEnAsset, crearCuerpo, crearMarcador } from './misiones.js';

const CLAVE = 'santiago_protagonistas_v1';

export const PROTAGONISTAS = [
  {
    id: 'eloisa', ancla: 'SM_Universidad_de_Chile', local: [-6.0, -3.2, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Dama_01', mujer: true,
    nombre: 'Eloísa Díaz Insunza', oficio: 'médica, inspectora del servicio médico escolar de Santiago', edad: '46 años',
    caracter: 'enérgica, cálida y muy práctica; le preocupan la salud de los niños pobres y la educación de las mujeres',
    biografia: 'Eloísa Díaz nació en Santiago en 1866. Gracias al Decreto Amunátegui de 1877, que permitió a las mujeres rendir los exámenes para entrar a la universidad, estudió medicina en la Universidad de Chile y se tituló en enero de 1887: fue la primera médica de Chile y de Sudamérica; poco después se tituló Ernestina Pérez. Desde 1898 es médica inspectora de las escuelas de Santiago: revisa la salud de los escolares, promueve la vacunación contra la viruela, la higiene, los desayunos escolares y la lucha contra la tuberculosis y el alcoholismo. Conoce de cerca la alta mortalidad infantil y la pobreza de los conventillos.',
    tema: 'Mujeres, educación y salud', oa: '6° básico OA 4 · 1° medio OA 5',
    dato: 'Eloísa Díaz se tituló de médica en 1887, la primera de Chile y de Sudamérica, gracias al Decreto Amunátegui de 1877 que abrió la universidad a las mujeres. Como médica escolar luchó por la vacunación, la higiene y la alimentación de los niños.',
    hoy: 'Hoy más de la mitad de quienes estudian medicina en Chile son mujeres, y la alimentación escolar (JUNAEB) llega a millones de estudiantes.',
    pregunta: { texto: '¿Qué permitió el Decreto Amunátegui de 1877?', opciones: ['Que las mujeres votaran', 'Que las mujeres entraran a la universidad', 'Que la educación fuera gratuita'], correcta: 1 },
    voz: { aura: 'estrella', tono: 0 },
  },
  {
    id: 'manquilef', ancla: 'SM_Universidad_de_Chile', local: [9.5, -3.2, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_02', visita: true,
    nombre: 'Manuel Manquilef González', oficio: 'profesor normalista mapuche, de visita en Santiago', edad: '25 años',
    caracter: 'sereno, culto y firme; orgulloso de su pueblo, explica con paciencia y sin rencor, pero no calla las injusticias',
    biografia: 'Manuel Manquilef nació en 1887 cerca de Temuco, hijo de un lonko mapuche. Estudió en el Liceo de Temuco y es profesor normalista. Colaboró con el lingüista Rodolfo Lenz y en 1911 publicó en Santiago "Comentarios del pueblo araucano", donde describe las costumbres, la lengua y la vida social mapuche. En 1910 participó en la fundación de la Sociedad Caupolicán Defensora de la Araucanía. Conoce la ocupación de la Araucanía por el Estado chileno (1861-1883), la fundación de fuertes y ciudades como Temuco (1881), la llegada de colonos chilenos y europeos, la entrega de tierras en remate y el arrinconamiento de las comunidades en reducciones con títulos de merced, y los abusos que sufren por parte de algunos colonos y especuladores de tierras.',
    tema: 'Pueblo mapuche y ocupación de la Araucanía', oa: '1° medio OA 13 y 16',
    dato: 'Entre 1861 y 1883 el Estado chileno ocupó militarmente la Araucanía. Las tierras se remataron a colonos chilenos y europeos y las comunidades mapuche fueron reducidas a una pequeña parte de su territorio, con títulos de merced.',
    hoy: 'La recuperación de tierras y el reconocimiento de los pueblos originarios siguen siendo debates centrales en Chile.',
    pregunta: { texto: '¿Qué ocurrió con las tierras mapuche después de la ocupación de la Araucanía?', opciones: ['Se mantuvieron intactas', 'Se remataron a colonos y las comunidades quedaron en reducciones', 'Se convirtieron en parques nacionales'], correcta: 1 },
    voz: { aura: 'sirio', tono: 4 },
  },
  {
    id: 'mistral', ancla: 'SM_Teatro_Municipal', local: [7.0, -4.5, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Dama_02', mujer: true, visita: true,
    nombre: 'Lucila Godoy Alcayaga', oficio: 'profesora del Liceo de Los Andes que firma sus poemas como Gabriela Mistral', edad: '23 años',
    caracter: 'tímida al principio, profunda y apasionada cuando habla de la escuela rural, de los niños y de la poesía',
    biografia: 'Lucila Godoy nació en Vicuña, en el valle de Elqui, en 1889. Se hizo maestra trabajando en escuelas rurales de la zona de La Serena (La Compañía Baja, La Cantera) y en 1910 rindió en Santiago los exámenes que la habilitaron como profesora. En 1912 es inspectora y profesora en el Liceo de Niñas de Los Andes. Publica poemas y prosa en diarios y revistas con el seudónimo de Gabriela Mistral. Cree en la educación pública para los hijos de los campesinos y los obreros, y conoce la pobreza de las escuelas de provincia.',
    tema: 'Educación pública y escuela rural', oa: '6° básico OA 4 · 1° medio OA 17',
    dato: 'En 1912 Gabriela Mistral era una joven profesora del Liceo de Los Andes que había enseñado en escuelas rurales del valle de Elqui. La educación pública se expandió con la riqueza del salitre, pero cerca de la mitad de los chilenos no sabía leer.',
    hoy: 'Gabriela Mistral recibió el Premio Nobel de Literatura en 1945, el primero para un autor latinoamericano. Su rostro está en el billete de 5.000 pesos.',
    pregunta: { texto: '¿A qué se dedicaba Gabriela Mistral en 1912?', opciones: ['Era profesora en un liceo de Los Andes', 'Era ministra de Educación', 'Era diputada'], correcta: 0 },
    voz: { aura: 'selena', tono: 4 },
  },
  {
    id: 'recabarren', ancla: 'SM_Mercado_Central', local: [8.0, -4.0, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_03', visita: true,
    nombre: 'Luis Emilio Recabarren', oficio: 'tipógrafo y dirigente obrero, de paso por Santiago', edad: '36 años',
    caracter: 'convencido, austero y apasionado; habla con claridad a los trabajadores y cree en la educación obrera',
    biografia: 'Luis Emilio Recabarren nació en Valparaíso en 1876 y trabaja como tipógrafo desde niño. Funda y dirige periódicos obreros, porque cree que los trabajadores deben leer, organizarse y educarse. Militó en el Partido Demócrata y en 1906 fue elegido diputado por Antofagasta, pero la Cámara no le permitió asumir. Estuvo preso y exiliado en Argentina. Conoce la vida en las oficinas salitreras: jornadas agotadoras, pago en fichas que solo valen en la pulpería, falta de seguridad, y la matanza de la Escuela Santa María de Iquique (diciembre de 1907). En junio de 1912 fundó en Iquique el Partido Obrero Socialista y dirige el diario El Despertar de los Trabajadores.',
    tema: 'Movimiento obrero y cuestión social', oa: '6° básico OA 6 · 1° medio OA 5 · 2° medio OA 5',
    dato: 'La "cuestión social" fue el conjunto de problemas de los trabajadores a comienzos del siglo XX: salarios bajos pagados en fichas, viviendas insalubres y jornadas extenuantes. Los obreros se organizaron en mutuales, mancomunales y partidos como el Partido Obrero Socialista (1912).',
    hoy: 'Hoy existen el Código del Trabajo, la jornada laboral limitada y el derecho a sindicalizarse, conquistas que comenzaron con estas luchas.',
    pregunta: { texto: '¿Qué eran las "fichas" de las salitreras?', opciones: ['Monedas que solo servían en la pulpería de la oficina', 'Boletos del tren', 'Entradas para el teatro'], correcta: 0 },
    voz: { aura: 'aquila', tono: 0 },
  },
  {
    id: 'jequier', ancla: 'SM_Bellas_Artes', local: [-8.0, -5.0, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_01',
    nombre: 'Emilio Jéquier', oficio: 'arquitecto del Palacio de Bellas Artes y de la Estación Mapocho', edad: '46 años',
    caracter: 'elegante, detallista y orgulloso de sus obras; mezcla palabras francesas al hablar',
    biografia: 'Emilio Jéquier nació en Santiago en 1866, hijo de padres franceses, y se formó como arquitecto en París. Volvió a Chile y proyectó obras para el Centenario de la Independencia de 1910: el Palacio de Bellas Artes, inaugurado en 1910 junto al nuevo Parque Forestal, con su cúpula de fierro y vidrio fabricada en Bélgica, y la Estación Mapocho, de estructura metálica traída de Europa, que se abre en 1912. Santiago se modernizaba con el dinero del salitre: canalización del Mapocho, Parque Forestal, edificios públicos de estilo francés. Admira a París y cree que la arquitectura educa a los ciudadanos.',
    tema: 'El Centenario y la modernización de Santiago', oa: '1° medio OA 17 · 2° medio OA 5',
    dato: 'Para el Centenario de la Independencia (1910) el Estado, enriquecido por el salitre, construyó grandes obras en Santiago: el Palacio de Bellas Artes, el Parque Forestal y la Estación Mapocho, muchas con estructuras de fierro traídas de Europa.',
    hoy: 'El Palacio de Bellas Artes alberga el Museo Nacional de Bellas Artes y la Estación Mapocho es un centro cultural.',
    pregunta: { texto: '¿Qué permitió financiar las grandes obras del Centenario?', opciones: ['Las exportaciones de cobre', 'La riqueza del salitre', 'Préstamos de Argentina'], correcta: 1 },
    voz: { aura: 'javier', tono: -2 },
  },
  {
    id: 'inmigrante', ancla: 'SM_Portales_40m', local: [-9.0, -1.6, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_01', ficcion: true,
    nombre: 'Giacomo Ferretti', oficio: 'inmigrante italiano, dueño de un almacén de abarrotes', edad: '41 años',
    caracter: 'conversador, trabajador y nostálgico de Génova; mezcla palabras italianas y bromea mucho',
    biografia: 'Llegó en barco a Valparaíso en 1890 desde Génova y se instaló en Santiago, donde abrió un almacén de abarrotes. En Chile hay inmigrantes italianos, españoles, franceses, alemanes y británicos; los alemanes colonizaron Valdivia y Llanquihue desde mediados del siglo XIX, los británicos dominan el comercio de Valparaíso y el salitre, y hace pocos años empezaron a llegar árabes de Palestina, Siria y el Líbano, a quienes la gente llama "turcos", que se dedican al comercio de telas. Los inmigrantes fueron pocos comparados con Argentina, pero muy influyentes en el comercio, la industria y las escuelas.',
    tema: 'Inmigración y comercio', oa: '1° medio OA 13',
    dato: 'A fines del siglo XIX llegaron a Chile inmigrantes europeos (alemanes al sur, británicos a Valparaíso, italianos, españoles y franceses a las ciudades) y, desde comienzos del siglo XX, árabes de Palestina, Siria y el Líbano. Fueron pocos, pero muy activos en el comercio y la industria.',
    hoy: 'Chile sigue recibiendo inmigrantes, hoy sobre todo de Venezuela, Perú, Haití, Colombia y Bolivia.',
    pregunta: { texto: '¿Dónde se establecieron los colonos alemanes en el siglo XIX?', opciones: ['En Valdivia y Llanquihue', 'En Antofagasta', 'En Isla de Pascua'], correcta: 0 },
    voz: { aura: 'javier', tono: 3 },
  },
  {
    id: 'inquilino', ancla: 'SM_Vega_Central', local: [-4.0, -3.5, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Huaso_03', ficcion: true,
    nombre: 'Clodomiro Catalán', oficio: 'inquilino de un fundo de Colina que trae verduras a la Vega', edad: '52 años',
    caracter: 'humilde, socarrón y desconfiado de la ciudad; sabe mucho del campo y de los patrones',
    biografia: 'Inquilino de un gran fundo de Colina, al norte de Santiago. A cambio de un rancho, un pedazo de tierra y raciones, trabaja para el patrón con su familia; cuando hace falta, el patrón también contrata peones y gañanes que van de fundo en fundo. Muchos jóvenes del campo se van a Santiago o a las salitreras del norte buscando mejor paga, y terminan viviendo en conventillos. Viene de madrugada en carreta a la Vega Central, que funciona desde 1895, a vender papas, porotos, choclos y zapallos. En el campo casi nadie sabe leer y los patrones influyen en cómo votan sus inquilinos.',
    tema: 'El campo, la hacienda y la migración a la ciudad', oa: '1° medio OA 5 y 16',
    dato: 'En 1912 la mayoría de los chilenos vivía en el campo, en grandes haciendas donde los inquilinos trabajaban para el patrón a cambio de tierra y vivienda. Muchos migraban a Santiago o al norte salitrero, y las ciudades crecían con conventillos.',
    hoy: 'Hoy cerca del 88 % de los chilenos vive en ciudades; la reforma agraria de los años sesenta terminó con el sistema de inquilinaje.',
    pregunta: { texto: '¿Qué recibía un inquilino a cambio de trabajar para la hacienda?', opciones: ['Un sueldo alto y vacaciones', 'Un rancho, un pedazo de tierra y raciones', 'Acciones del fundo'], correcta: 1 },
    voz: { aura: 'aquila', tono: -6, ritmo: -6 },
  },
];

export function crearProtagonistas({ datos, ciudad, scene, suelo, jugador, personajes, toast }) {
  let conocidos = {};
  try { conocidos = JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch { /* sin almacenamiento */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(conocidos)); } catch { /* sin almacenamiento */ } };
  let modos = null, mision = null;      // mision: { hechos: {id: true}, fijado } mientras corre la modalidad

  const actores = PROTAGONISTAS.map((p) => {
    const pos = ubicarEnAsset(datos, suelo, p);
    if (!pos) return null;
    const ficha = {
      nombre: p.nombre, oficio: p.oficio, edad: p.edad, caracter: p.caracter, biografia: p.biografia,
      lugar: `frente al edificio ${({ SM_Universidad_de_Chile: 'de la Universidad de Chile, en la Alameda', SM_Teatro_Municipal: 'del Teatro Municipal',
        SM_Mercado_Central: 'del Mercado Central, junto al Mapocho', SM_Bellas_Artes: 'del Palacio de Bellas Artes, en el Parque Forestal',
        SM_Portales_40m: 'de los Portales, frente a la Plaza de Armas', SM_Vega_Central: 'de la Vega Central, en la Chimba' })[p.ancla] || 'del centro'}`,
      tipo: p.mujer ? 'dama' : 'caballero', mujer: !!p.mujer,
      voz: { genero: p.mujer ? 'mujer' : 'hombre', aura: p.voz.aura, azure: p.mujer ? 'es-CL-CatalinaNeural' : 'es-CL-LorenzoNeural',
        tono: p.voz.tono || 0, ritmo: p.voz.ritmo || 0, reproduccion: 1 },
    };
    return { def: p, pos, ag: { x: pos.x, y: pos.y, z: pos.z, hablando: false }, ficha, historia: [],
      grupo: crearCuerpo(ciudad, scene, p, pos), marca: crearMarcador(scene, '★') };
  }).filter(Boolean);

  const accion = document.createElement('button');
  accion.id = 'protagonista';
  accion.className = 'accion-personaje';
  document.body.append(accion);

  function objetivo() {
    if (!mision) return null;
    const pend = actores.filter((a) => !mision.hechos[a.def.id]);
    const fijado = pend.find((a) => a.def.id === mision.fijado);
    if (fijado) return fijado;
    let mejor = null, dmin = Infinity;
    for (const a of pend) { const d = Math.hypot(a.pos.x - jugador.x, a.pos.z - jugador.z); if (d < dmin) { dmin = d; mejor = a; } }
    return mejor;
  }

  function hablarCon(a) {
    const p = a.def;
    const primera = !a.historia.length;
    a.ficha.encargo = '';
    personajes.conversar(a, { alResponder: () => {
      if (!conocidos[p.id]) {
        conocidos[p.id] = true; guardar();
        modos?.desbloquear('protagonista_' + p.id, `${p.nombre} · ${p.tema}`, p.dato + ` Hoy: ${p.hoy}`);
      }
      // en la modalidad, tras la primera respuesta viene la pregunta (cuando se cierra la conversación)
      if (mision && !mision.hechos[p.id] && !mision.pendiente) {
        mision.pendiente = p.id;
        toast(`★ Conociste a ${p.nombre}. Sigue conversando; al despedirte (✕) viene la pregunta.`, 6000);
      }
    } });
    if (primera && p.visita) setTimeout(() => toast('ℹ️ Encuentro imaginado: este personaje existió, pero no consta que estuviera aquí en 1912.', 6000), 400);
    if (p.ficcion) setTimeout(() => toast('ℹ️ Personaje de ficción, inspirado en la vida de la época.', 5000), 400);
  }

  function preguntar(id) {
    const p = PROTAGONISTAS.find((x) => x.id === id);
    mision.pendiente = null;
    modos.preguntar({ id: 'prot_' + id, nombre: `${p.nombre} · ${p.tema}`, dato: p.dato, hoy: p.hoy, pregunta: p.pregunta }, (bien) => {
      mision.hechos[id] = true;
      if (mision.fijado === id) mision.fijado = null;
      modos.sumar(bien ? 150 : 100, bien ? 'entrevista y respuesta correcta' : 'entrevista');
      const faltan = actores.filter((a) => !mision.hechos[a.def.id]).length;
      if (!faltan) modos.terminar(true);
      else toast(`★ Te faltan ${faltan} protagonistas. Búscalos en el mapa (M).`);
    });
  }

  let cerca = null;
  accion.onclick = (e) => { e.stopPropagation(); if (cerca) hablarCon(cerca); };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || personajes.abierto()) return;
    if ((e.code === 'KeyE' || e.code === 'Enter') && cerca) { e.preventDefault(); e.stopImmediatePropagation(); hablarCon(cerca); }
  }, true);

  return {
    lista: () => actores.map((a) => ({ id: a.def.id, nombre: a.def.nombre, oficio: a.def.oficio, tema: a.def.tema, x: a.pos.x, z: a.pos.z,
      conocido: !!conocidos[a.def.id], hecho: !!mision?.hechos[a.def.id], ficcion: !!a.def.ficcion })),
    conectar(m) { modos = m; },
    // modalidad "Los protagonistas"
    iniciar() { mision = { hechos: {}, fijado: null, pendiente: null }; actores.forEach((a) => { a.historia = []; }); },
    detener() { mision = null; },
    fijar(id) { if (mision) mision.fijado = id; },
    progreso: () => (mision ? { hechos: Object.keys(mision.hechos).length, total: actores.length } : null),
    objetivo() { const a = objetivo(); return a ? { x: a.pos.x, z: a.pos.z, nombre: a.def.nombre } : null; },
    actualizar(t) {
      const meta = objetivo();
      for (const a of actores) {
        // ★ sobre quien todavía no conoces (o sobre el próximo de la modalidad)
        const ver = mision ? !mision.hechos[a.def.id] : !conocidos[a.def.id];
        a.marca.visible = ver;
        if (ver) {
          a.marca.position.set(a.pos.x, a.pos.y + 2.35 + Math.sin(t*2.5 + a.pos.x)*0.08, a.pos.z);
          a.marca.material.opacity = !mision || meta === a ? 1 : 0.55;
        }
        const d = Math.hypot(jugador.x - a.pos.x, jugador.z - a.pos.z);
        const giro = d < 5 ? Math.atan2(-(jugador.z - a.pos.z), jugador.x - a.pos.x) : a.pos.giro;
        let dg = giro - a.grupo.rotation.y; dg = Math.atan2(Math.sin(dg), Math.cos(dg));
        a.grupo.rotation.y += dg*0.08;
      }
      // la pregunta llega cuando termina la conversación
      if (mision?.pendiente && !personajes.abierto()) preguntar(mision.pendiente);
      let mejor = null, dmin = 3.0;
      for (const a of actores) {
        const d = Math.hypot(jugador.x - a.pos.x, jugador.z - a.pos.z);
        if (d < dmin && Math.abs(jugador.y - a.pos.y - 1.45) < 2.5) { dmin = d; mejor = a; }
      }
      if (personajes.abierto()) mejor = null;
      if (mejor !== cerca) {
        cerca = mejor;
        accion.style.display = cerca ? 'block' : 'none';
        if (cerca) accion.innerHTML = `★ Conversar con <b>${cerca.def.nombre}</b><small>${cerca.def.oficio}</small>`;
      }
    },
  };
}
