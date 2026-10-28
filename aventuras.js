// Misiones cortas, cada una una modalidad de juego:
//  - La visita del Centenario: guiar a un periodista francés por la ciudad (te sigue y comenta cada lugar).
//  - El reportero de Zig-Zag: entrevistar a tres santiaguinos, fotografiar la ciudad y publicar la portada.
//  - Un día en el conventillo: ayudar a una familia obrera y aprender cómo vivía.
//  - ¡Incendio!: correr al cuartel de bomberos y apagar el fuego con la bomba a vapor.
// Los personajes de estas misiones son de ficción (verosímiles); los datos históricos están revisados.
import * as THREE from 'three';
import { ubicarEnAsset, crearCuerpo, crearMarcador } from './misiones.js';
import { SITIOS } from './modos.js';

const vozHombre = (aura, tono = 0, ritmo = 0) => ({ genero: 'hombre', aura, azure: 'es-CL-LorenzoNeural', tono, ritmo, reproduccion: 1 });
const vozMujer = (aura, tono = 0, ritmo = 0) => ({ genero: 'mujer', aura, azure: 'es-CL-CatalinaNeural', tono, ritmo, reproduccion: 1 });

const LECCIONES = {
  conventillo: {
    titulo: 'Vivir en un conventillo',
    puntos: [
      'Miles de familias obreras de Santiago vivían en conventillos: una sola pieza por familia, a lo largo de un patio angosto.',
      'Compartían la pileta para lavar y un excusado para decenas de personas; las epidemias (viruela, tifus) eran frecuentes.',
      'La Ley de Habitaciones Obreras de 1906 creó consejos para mejorar o demoler los conventillos insalubres.',
      'Muchos niños trabajaban como suplementeros, lustrabotas o en fábricas: la escuela primaria obligatoria llegó recién con la ley de 1920.',
    ],
    pregunta: { texto: '¿Qué ley de 1906 buscó mejorar las viviendas de los obreros?', opciones: ['La Ley de Instrucción Primaria', 'La Ley de Habitaciones Obreras', 'La Ley de la Silla'], correcta: 1 },
  },
  incendio: {
    titulo: 'Los bomberos voluntarios',
    puntos: [
      'El Cuerpo de Bomberos de Santiago nació en 1863, tras el incendio de la Iglesia de la Compañía, donde murieron cerca de dos mil personas.',
      'Sus bomberos son voluntarios: no reciben sueldo y se organizan en compañías, varias formadas por colectividades de inmigrantes.',
      'En 1912 usaban bombas a vapor tiradas por caballos, escalas de madera y mangueras de cuero y lona; la alarma se daba con campanas.',
      'Los incendios eran temibles: casas de adobe con techos de madera, braseros, velas y lámparas a parafina.',
    ],
    pregunta: { texto: '¿Qué caracteriza a los bomberos de Chile desde su fundación?', opciones: ['Son militares', 'Son voluntarios', 'Son funcionarios municipales con sueldo'], correcta: 1 },
  },
  reportero: {
    titulo: 'La prensa en 1912',
    puntos: [
      'Diarios como El Mercurio (en Santiago desde 1900), El Diario Ilustrado y Las Últimas Noticias informaban a la ciudad.',
      'La revista Zig-Zag (1905) fue pionera en usar fotografías e ilustraciones en color.',
      'Los suplementeros vendían los diarios a gritos por las calles.',
      'Como cerca de la mitad de la población no sabía leer, muchas noticias se compartían leyéndolas en voz alta.',
    ],
  },
};

export function crearAventuras({ datos, ciudad, scene, suelo, jugador, personajes, toast, sonido, modos, fotografiar }) {
  let actual = null;                        // aventura en curso
  const cosas = [];                         // objetos de la escena que hay que limpiar al terminar

  function persona(def, pos) {
    const grupo = crearCuerpo(ciudad, scene, def, pos);
    const ag = { x: pos.x, y: pos.y, z: pos.z, hablando: false };
    const p = { def, pos, ag, grupo, historia: [], ficha: { ...def.ficha, voz: def.voz } };
    cosas.push(grupo);
    return p;
  }
  function marca(simbolo) { const m = crearMarcador(scene, simbolo); cosas.push(m); return m; }
  function limpiar() { for (const c of cosas) { scene.remove(c); c.material?.map?.dispose?.(); } cosas.length = 0; actual?.alLimpiar?.(); }

  // botón de acción propio de las aventuras
  const accion = document.createElement('button');
  accion.id = 'aventura';
  document.body.append(accion);
  let alAccion = null;
  accion.onclick = (e) => { e.stopPropagation(); alAccion?.(); };
  function ofrecer(texto, fn) {
    if (!fn) { accion.style.display = 'none'; alAccion = null; return; }
    accion.innerHTML = texto; accion.style.display = 'block'; alAccion = fn;
  }
  const distancia = (a) => Math.hypot(jugador.x - a.x, jugador.z - a.z);
  const sitiosCerca = () => SITIOS.filter((s) => s.pos && Math.hypot(s.pos.x, s.pos.z) < 260);
  const mezclar = (l) => [...l].sort(() => Math.random() - 0.5);

  // ------------------------------------------------------------- la visita del Centenario
  function visita() {
    const def = { cuerpo: 'SM_Peaton_Caballero_03', mira: 0,
      ficha: { nombre: 'Henri Lefèvre', oficio: 'periodista francés de visita en Santiago', edad: '38 años', lugar: 'las calles de Santiago',
        caracter: 'curioso, entusiasta y galante; habla un español correcto con algunas palabras en francés (oui, magnifique, mon ami)',
        biografia: 'Periodista de una revista ilustrada de París, llegado a Chile para escribir sobre las repúblicas sudamericanas después de las fiestas del Centenario de 1910. Compara todo con París y pregunta mucho. Es un personaje de ficción.' },
      voz: vozHombre('javier', 2, 4) };
    const p = persona(def, { x: jugador.x + 2, y: jugador.y - 1.6, z: jugador.z + 1.5, giro: 0 });
    const ruta = mezclar(sitiosCerca()).slice(0, 4);
    let paso = 0, conversando = false;
    const m = marca('★');
    toast('🎩 Monsieur Lefèvre te seguirá: llévalo a los lugares que pide. La brújula marca el destino.', 6000);
    personajes.conversar(p, { saludo: `(El joven guía se presenta. Usted quiere conocer, en este orden: ${ruta.map((s) => s.nombre).join(', ')}. Pídale que lo lleve primero a ${ruta[0].nombre}.)` });
    actual = {
      objetivo: () => ruta[paso] ? { x: ruta[paso].pos.x, z: ruta[paso].pos.z, nombre: ruta[paso].nombre } : null,
      actualizar(dt, t) {
        // el visitante sigue al jugador a unos pasos
        const dx = jugador.x - p.ag.x, dz = jugador.z - p.ag.z, d = Math.hypot(dx, dz);
        if (!p.ag.hablando && d > 2.6) {
          const v = Math.min(d - 2.6, (d > 8 ? 7 : 3.5)*dt);
          p.ag.x += dx/d*v; p.ag.z += dz/d*v;
          p.ag.y = suelo(p.ag.x, jugador.y + 1, p.ag.z) ?? p.ag.y;
          p.grupo.rotation.y = Math.atan2(-dz, dx);
          p.grupo.position.y = p.ag.y + Math.abs(Math.sin(t*9))*0.04;
        } else p.grupo.position.y = p.ag.y;
        if (d > 25) { p.ag.x = jugador.x - 2; p.ag.z = jugador.z - 2; }
        p.grupo.position.x = p.ag.x; p.grupo.position.z = p.ag.z;
        m.position.set(p.ag.x, p.ag.y + 2.35 + Math.sin(t*2.5)*0.08, p.ag.z);
        const s = ruta[paso];
        if (!s || conversando || personajes.abierto()) return;
        if (Math.hypot(jugador.x - s.pos.x, jugador.z - s.pos.z) < s.radio) {
          conversando = true;
          p.ficha.encargo = `Acaban de llegar a ${s.nombre}. Lo que se sabe de este lugar: ${s.dato} Comenta con asombro lo que ves, compáralo con París y hazle una pregunta al guía.`;
          personajes.conversar(p, { saludo: `(Llegan a ${s.nombre}.)`, alResponder: () => {
            if (!conversando) return;
            modos.preguntar(s, (bien) => {
              modos.sumar(bien ? 200 : 120, `por mostrar ${s.nombre}`);
              paso++; conversando = false;
              if (paso >= ruta.length) {
                p.ficha.encargo = 'El recorrido terminó. Agradece al guía con entusiasmo y dile qué fue lo que más te gustó de Santiago.';
                personajes.conversar(p, { saludo: '(Terminan el recorrido.)', alResponder: () => setTimeout(() => terminar(true), 6000) });
              } else toast(`Próximo destino: ${ruta[paso].nombre}`);
            });
          } });
        }
      },
    };
  }

  // ------------------------------------------------------------- el reportero de Zig-Zag
  function reportero() {
    const temas = ['la carestía de la vida y el precio de la carne', 'los nuevos tranvías eléctricos', 'la recién inaugurada Estación Mapocho', 'las elecciones y el cohecho', 'la vida en los conventillos'];
    const tema = temas[Math.floor(Math.random()*temas.length)];
    const def = { ancla: 'SM_Portales_40m', local: [-8.0, -1.6, 0], mira: -Math.PI/2, cuerpo: 'SM_Peaton_Caballero_01',
      ficha: { nombre: 'Ernesto Rojas', oficio: 'jefe de redacción de la revista Zig-Zag', edad: '46 años', lugar: 'los Portales, frente a la Plaza de Armas',
        caracter: 'exigente, rápido y con olfato de periodista; fuma y mira la hora',
        biografia: 'Jefe de redacción de Zig-Zag, la revista ilustrada fundada en 1905, famosa por sus fotografías y caricaturas. Es un personaje de ficción.',
        encargo: `Le das al joven reportero su primera tarea: una nota sobre ${tema}. Debe entrevistar a tres personas distintas en la calle (por ejemplo un caballero, una vendedora y un niño), sacar una fotografía y volver con el material.` },
      voz: vozHombre('aquila', -3, 6) };
    const pos = ubicarEnAsset(datos, suelo, def);
    if (!pos) { toast('No se encontró la redacción.'); return terminar(false); }
    const editor = persona(def, pos);
    const m = marca('📰');
    const entrevistas = new Map();
    let foto = null, fase = 'encargo';
    personajes.escuchar((pp, respuesta, pregunta) => {
      if (fase !== 'calle' || !pp.asset || !pregunta || pregunta.startsWith('(')) return;
      if (!entrevistas.has(pp)) {
        entrevistas.set(pp, { nombre: pp.ficha.nombre, oficio: pp.ficha.oficio, cita: respuesta.split(/(?<=[.!?])\s/)[0].slice(0, 160) });
        modos.sumar(100, `entrevista a ${pp.ficha.nombre}`);
        if (entrevistas.size === 3) toast('📷 Tienes tres entrevistas. Saca una fotografía y vuelve donde don Ernesto, en los Portales.', 6000);
      }
    });
    personajes.conversar(editor, { saludo: '(El nuevo reportero se presenta en la redacción.)', alResponder: () => { if (fase === 'encargo') { fase = 'calle'; toast(`📝 Tema: ${tema}. Entrevista a 3 personas (acércate y pregúntales) y saca una foto con 📷.`, 7000); } } });
    const btnFoto = document.createElement('button');
    btnFoto.id = 'btn-foto'; btnFoto.textContent = '📷 Fotografiar';
    document.body.append(btnFoto);
    btnFoto.onclick = (e) => { e.stopPropagation(); foto = fotografiar(); sonido?.casco?.([jugador.x, jugador.y, jugador.z]); modos.sumar(foto && !actual.fotoContada ? 50 : 0, foto && !actual.fotoContada ? 'fotografía' : ''); actual.fotoContada = true; toast('📷 ¡Fotografía tomada!'); };
    actual = {
      alLimpiar: () => { btnFoto.remove(); personajes.escuchar(null); },
      objetivo: () => (fase === 'calle' && entrevistas.size >= 3 && foto ? { x: pos.x, z: pos.z, nombre: 'Redacción' } : fase === 'encargo' ? { x: pos.x, z: pos.z, nombre: 'Redacción' } : null),
      actualizar(dt, t) {
        m.visible = fase === 'encargo' || (entrevistas.size >= 3 && !!foto);
        m.position.set(pos.x, pos.y + 2.35 + Math.sin(t*2.5)*0.08, pos.z);
        if (personajes.abierto()) { ofrecer(null); return; }
        if (distancia(pos) < 3 && fase === 'calle' && entrevistas.size >= 3 && foto) ofrecer('📰 <b>Entregar la nota a don Ernesto</b>', publicar);
        else ofrecer(null);
      },
    };
    function publicar() {
      ofrecer(null);
      fase = 'portada';
      const citas = [...entrevistas.values()];
      modos.tarjeta(`<h3>📰 Tu portada de Zig-Zag</h3><p>Tema: ${tema}.</p>
        <label class="nombre">Titular <input class="titular" maxlength="70" value="Santiago opina sobre ${tema.replace(/^(la|los|las|el) /, '')}"></label>
        <p>Citas de tus entrevistados:</p><ul>${citas.map((c) => `<li><b>${c.nombre}</b>, ${c.oficio}: «${c.cita}»</li>`).join('')}</ul>
        <div class="opciones"><button class="publicar">🗞 Publicar y descargar la portada</button></div>`, (hoja, cerrar) => {
        hoja.querySelector('.publicar').onclick = () => {
          portada(hoja.querySelector('.titular').value.trim() || 'Noticias de Santiago', citas, foto, tema);
          modos.sumar(200, 'portada publicada');
          modos.desbloquear('leccion_prensa', LECCIONES.reportero.titulo, LECCIONES.reportero.puntos.join(' '));
          cerrar();
          terminar(true);
        };
      });
    }
  }

  // portada de la revista (imagen PNG): cabecera, fecha, titular, fotografía en sepia y citas
  function portada(titular, citas, foto, tema) {
    const c = document.createElement('canvas');
    c.width = 1200; c.height = 1700;
    const x = c.getContext('2d');
    x.fillStyle = '#efe6d2'; x.fillRect(0, 0, 1200, 1700);
    x.fillStyle = '#1c1712'; x.textAlign = 'center';
    x.font = 'bold 150px Georgia, serif'; x.fillText('ZIG-ZAG', 600, 170);
    x.font = '28px Georgia, serif'; x.fillText('REVISTA SEMANAL ILUSTRADA · SANTIAGO DE CHILE', 600, 215);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hoy = new Date();
    x.font = 'italic 26px Georgia, serif'; x.fillText(`Santiago, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de 1912 · Precio: 20 centavos`, 600, 255);
    x.fillRect(60, 275, 1080, 5); x.fillRect(60, 285, 1080, 2);
    // titular en varias líneas
    x.font = 'bold 64px Georgia, serif';
    const palabras = titular.split(' ');
    let linea = '', y = 370;
    for (const w of palabras) {
      if (x.measureText(linea + w).width > 1040) { x.fillText(linea.trim(), 600, y); y += 72; linea = ''; }
      linea += w + ' ';
    }
    x.fillText(linea.trim(), 600, y);
    y += 40;
    const dibujarFoto = (img) => {
      const w = 1040, h = Math.round(w*img.height/img.width*0.8);
      x.save();
      x.filter = 'sepia(0.85) contrast(1.1) brightness(0.95)';
      x.drawImage(img, 0, img.height*0.1, img.width, img.height*0.8, 80, y, w, h);
      x.restore();
      x.strokeStyle = '#1c1712'; x.lineWidth = 4; x.strokeRect(80, y, w, h);
      y += h + 40;
      x.font = 'italic 24px Georgia, serif'; x.fillText(`Fotografía de nuestro reportero: ${tema}.`, 600, y); y += 50;
      x.textAlign = 'left';
      for (const ci of citas) {
        x.font = 'italic 30px Georgia, serif';
        const texto = `«${ci.cita}»`;
        let l = '';
        for (const w2 of texto.split(' ')) {
          if (x.measureText(l + w2).width > 1000) { x.fillText(l.trim(), 100, y); y += 38; l = ''; }
          l += w2 + ' ';
        }
        x.fillText(l.trim(), 100, y); y += 38;
        x.font = '24px Georgia, serif'; x.fillText(`— ${ci.nombre}, ${ci.oficio}`, 140, y); y += 56;
      }
      x.textAlign = 'center';
      x.font = '26px Georgia, serif'; x.fillText(`Reportaje de ${modos.nombre() || 'nuestro reportero'}`, 600, 1640);
      const a = document.createElement('a');
      a.download = 'portada-zig-zag-1912.png'; a.href = c.toDataURL('image/png'); a.click();
    };
    if (foto) { const img = new Image(); img.onload = () => dibujarFoto(img); img.src = foto; }
  }

  // ------------------------------------------------------------- un día en el conventillo
  function conventillo() {
    const madre = { ancla: 'SM_Conventillo', local: [0.9, 12.0, 0.02], mira: Math.PI, cuerpo: 'SM_Peaton_Vendedora_01',
      ficha: { nombre: 'Clorinda Soto', oficio: 'lavandera que vive en el conventillo La Esperanza', edad: '36 años', lugar: 'el patio del conventillo La Esperanza',
        caracter: 'cansada pero cariñosa y con mucho humor; trabaja sin parar',
        biografia: 'Lavandera viuda con cuatro hijos, vive en una sola pieza del conventillo La Esperanza. Lava ropa ajena en la pileta común desde el amanecer y la entrega en casas del centro. Paga el arriendo por semana. Su hijo Manuelito vende diarios. Es un personaje de ficción.',
        encargo: 'Pídele al forastero que te ayude a entregar un atado de ropa limpia en una casa grande del centro (la brújula le mostrará cuál), porque no alcanzas a ir y debes seguir lavando.' },
      voz: vozMujer('celeste', 0, 0) };
    const hijo = { ancla: 'SM_Conventillo', local: [-0.9, 20.0, 0.02], mira: 0, cuerpo: 'SM_Peaton_Nino_01',
      ficha: { nombre: 'Manuelito Soto', oficio: 'suplementero de 11 años', edad: '11 años', lugar: 'el patio del conventillo La Esperanza', tipo: 'nino',
        caracter: 'pícaro, despierto y bueno para la talla; sueña con ir a la escuela',
        biografia: 'Hijo de Clorinda; vende El Mercurio y Las Últimas Noticias desde las seis de la mañana para ayudar en la casa. Fue a la escuela solo un año. Es un personaje de ficción.',
        encargo: 'El forastero ayudó a tu mamá. Cuéntale cómo es un día tuyo de trabajo y cómo viven en el conventillo.' },
      voz: { genero: 'hombre', aura: 'sirio', azure: 'es-MX-MarinaNeural', tono: 12, ritmo: 6, reproduccion: 1.17 } };
    const pm = ubicarEnAsset(datos, suelo, madre), ph = ubicarEnAsset(datos, suelo, hijo);
    if (!pm || !ph) { toast('No se encontró el conventillo.'); return terminar(false); }
    const a = persona(madre, pm), b = persona(hijo, ph);
    // una casa de dos pisos del centro como destino de la ropa
    const casas = Object.entries(datos.instancias).filter(([k]) => /CasaDosPisos/.test(k)).flatMap(([, v]) => v)
      .filter(([x, , z]) => Math.hypot(x, z) < 110).sort(() => Math.random() - 0.5);
    const casa = casas[0] ? { x: casas[0][0], z: casas[0][2] } : { x: 0, z: 30 };
    const m = marca('🧺');
    let fase = 'llegar';
    toast('🧺 Ve al conventillo La Esperanza (sigue la brújula) y entra por el zaguán.', 6000);
    actual = {
      objetivo: () => (fase === 'llegar' || fase === 'volver' ? { x: pm.x, z: pm.z, nombre: 'Conventillo' } : fase === 'ropa' ? { ...casa, nombre: 'Casa' } : fase === 'hijo' ? { x: ph.x, z: ph.z, nombre: 'Manuelito' } : null),
      actualizar(dt, t) {
        const quien = fase === 'hijo' ? ph : fase === 'ropa' ? null : pm;
        m.visible = !!quien || fase === 'ropa';
        const mp = quien || { x: casa.x, y: 3, z: casa.z };
        m.position.set(mp.x, (mp.y ?? 0) + 2.35 + Math.sin(t*2.5)*0.08, mp.z);
        if (personajes.abierto()) { ofrecer(null); return; }
        if ((fase === 'llegar' || fase === 'volver') && distancia(pm) < 3) ofrecer(`💬 Hablar con <b>Clorinda Soto</b>`, () => {
          ofrecer(null);
          if (fase === 'llegar') personajes.conversar(a, { saludo: '(El forastero entra al patio y saluda.)', alResponder: () => { if (fase === 'llegar') { fase = 'ropa'; toast('🧺 Llevas el atado de ropa. Sigue la brújula hasta la casa.'); } } });
          else { a.ficha.encargo = 'El forastero ya entregó la ropa y te trae el pago. Agradécele y pídele que converse con tu hijo Manuelito, al fondo del patio.'; personajes.conversar(a, { saludo: '(El forastero vuelve con el pago de la ropa.)', alResponder: () => { if (fase === 'volver') { fase = 'hijo'; modos.sumar(150, 'ropa entregada'); } } }); }
        });
        else if (fase === 'ropa' && Math.hypot(jugador.x - casa.x, jugador.z - casa.z) < 6) { fase = 'volver'; toast('✔ Ropa entregada; la señora te pagó 40 centavos. Vuelve al conventillo.'); }
        else if (fase === 'hijo' && distancia(ph) < 3) ofrecer(`💬 Hablar con <b>Manuelito</b>`, () => {
          ofrecer(null);
          personajes.conversar(b, { saludo: '(El forastero se acerca a saludar al niño.)', alResponder: () => {
            if (fase !== 'hijo') return;
            fase = 'leccion';
            leccion('conventillo', () => terminar(true));
          } });
        });
        else ofrecer(null);
      },
    };
  }

  // ------------------------------------------------------------- ¡incendio!
  function incendio() {
    const cuartel = datos.instancias.SM_Cuartel_Bomberos?.[0];
    const casas = Object.entries(datos.instancias).filter(([k]) => /^SM_Casa/.test(k)).flatMap(([, v]) => v)
      .filter(([x, , z]) => Math.hypot(x, z) < 120 && cuartel && Math.hypot(x - cuartel[0], z - cuartel[2]) > 60).sort(() => Math.random() - 0.5);
    if (!cuartel || !casas.length) { toast('No hay incendios hoy.'); return terminar(false); }
    const [hx, hy, hz, hg] = casas[0];
    // el fuego, en la fachada de la casa (que mira hacia -y local: en glTF, hacia (sin g, cos g))
    const fx = hx + Math.sin(hg)*0.5, fz = hz + Math.cos(hg)*0.5;
    const fuego = new THREE.Group();
    const tex = (c1, c2) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
      gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    };
    const tFuego = tex('rgba(255,230,140,1)', 'rgba(255,80,0,0)'), tHumo = tex('rgba(60,55,50,0.7)', 'rgba(60,55,50,0)');
    const llamas = [], humos = [];
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tFuego, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.userData = { fase: Math.random()*6, dx: (Math.random() - 0.5)*6, alto: 2 + Math.random()*4 };
      fuego.add(s); llamas.push(s);
    }
    for (let i = 0; i < 18; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tHumo, depthWrite: false, transparent: true }));
      s.userData = { fase: Math.random()*10, dx: (Math.random() - 0.5)*5 };
      fuego.add(s); humos.push(s);
    }
    const luz = new THREE.PointLight('#ff7a2a', 30, 25, 1.5);
    luz.position.set(0, 4, 0);
    fuego.add(luz);
    fuego.position.set(fx, hy, fz);
    fuego.rotation.y = hg;
    scene.add(fuego); cosas.push(fuego);
    const paraCrepitar = sonido?.fuego?.([fx, hy + 3, fz]);
    let fase = 'alarma', fuerza = 1, limite = 0, bombeos = 0;
    const cpos = { x: cuartel[0], z: cuartel[2] };
    sonido?.alarma?.();
    toast('🔔 ¡Suenan las campanas! Hay un incendio. Corre al cuartel de bomberos (sigue la brújula).', 7000);
    const panel = document.createElement('button');
    panel.id = 'bombear';
    panel.textContent = '💦 ¡Bombear!';
    document.body.append(panel);
    panel.onclick = (e) => { e.stopPropagation(); if (fase === 'apagar') { bombeos++; fuerza = Math.max(0, fuerza - 0.035); sonido?.paso?.(true); } };
    actual = {
      alLimpiar: () => { panel.remove(); paraCrepitar?.(); },
      objetivo: () => (fase === 'alarma' ? { ...cpos, nombre: 'Cuartel de Bomberos' } : fase === 'correr' || fase === 'apagar' ? { x: fx, z: fz, nombre: 'Incendio' } : null),
      limite: () => (fase === 'correr' || fase === 'apagar' ? limite : null),
      actualizar(dt, t) {
        // animación del fuego según su fuerza
        for (const s of llamas) {
          const u = s.userData; u.fase += dt*(2 + Math.random());
          const k = (u.fase % 1);
          s.position.set(u.dx*fuerza, 1 + k*u.alto*fuerza, 0.5);
          const e = (1 - k)*fuerza*2.2 + 0.2*fuerza;
          s.scale.set(e, e, e);
          s.material.opacity = (1 - k)*fuerza;
        }
        for (const s of humos) {
          const u = s.userData; u.fase += dt*0.35;
          const k = u.fase % 1;
          s.position.set(u.dx + k*2, 4 + k*14, 0.5);
          const e = 2 + k*6;
          s.scale.set(e, e, e);
          s.material.opacity = (1 - k)*0.6*Math.max(fuerza, 0.25);
        }
        luz.intensity = (20 + Math.random()*20)*fuerza;
        if (fase === 'alarma' && Math.hypot(jugador.x - cpos.x, jugador.z - cpos.z) < 14) {
          fase = 'correr';
          limite = Math.round(Math.hypot(fx - cpos.x, fz - cpos.z)/4.5 + 30);
          toast('🚒 ¡La bomba a vapor ya salió! Corre al incendio antes que se propague.', 5000);
        }
        if (fase === 'correr' || fase === 'apagar') {
          limite -= dt;
          if (fase === 'apagar') fuerza = Math.min(1, fuerza + dt*0.05);
          if (fase === 'correr' && Math.hypot(jugador.x - fx, jugador.z - fz) < 12) {
            fase = 'apagar';
            panel.style.display = 'block';
            toast('💦 ¡Bombea agua! Toca el botón (o la barra espaciadora) muchas veces.', 5000);
          }
          if (fase === 'apagar' && fuerza <= 0.02) {
            fase = 'fin'; panel.style.display = 'none';
            modos.sumar(300 + Math.round(limite*10), '¡incendio apagado!');
            paraCrepitar?.(); scene.remove(fuego);
            leccion('incendio', () => terminar(true));
          } else if (limite <= 0) {
            fase = 'fin'; panel.style.display = 'none';
            toast('🔥 El fuego fue más rápido esta vez…');
            leccion('incendio', () => terminar(false));
          }
        }
      },
      tecla(e) { if (e.code === 'Space' && fase === 'apagar') { panel.onclick(e); return true; } return false; },
    };
  }

  function leccion(id, despues) {
    const l = LECCIONES[id];
    modos.desbloquear('leccion_' + id, l.titulo, l.puntos.join(' '));
    modos.preguntar({ nombre: l.titulo, dato: `<ul>${l.puntos.map((p) => `<li>${p}</li>`).join('')}</ul>`, pregunta: l.pregunta, id }, (bien) => {
      if (bien) modos.sumar(100, 'respuesta correcta');
      despues();
    });
  }

  function terminar(completo) {
    limpiar();
    ofrecer(null);
    actual = null;
    modos.terminar(completo);
  }

  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (actual?.tecla?.(e)) { e.preventDefault(); e.stopImmediatePropagation(); }
    else if (e.code === 'KeyE' && alAccion && !personajes.abierto()) { e.preventDefault(); e.stopImmediatePropagation(); alAccion(); }
  }, true);

  const INICIOS = { visita, reportero, conventillo, incendio };
  return {
    iniciar(id) { if (actual) { limpiar(); actual = null; } ofrecer(null); INICIOS[id]?.(); },
    detener() { if (actual) { limpiar(); actual = null; } ofrecer(null); },
    objetivo: () => actual?.objetivo?.() ?? null,
    limite: () => actual?.limite?.() ?? null,
    actualizar(dt, t) { actual?.actualizar(dt, t); },
  };
}
