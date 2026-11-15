const formulario = document.querySelector('#formulario-busqueda');
const campoNombre = document.querySelector('#nombre');
const campoTemporada = document.querySelector('#temporada');
const botonBuscar = document.querySelector('#boton-buscar');
const mensaje = document.querySelector('#mensaje');
const rejilla = document.querySelector('#resultados');
const claveGuardada = 'tp-episodios-busqueda';

const obtenerCriterios = () => ({
  nombre: campoNombre.value.trim(),
  temporada: campoTemporada.value
});

const guardarCriterios = (criterios) => {
  localStorage.setItem(claveGuardada, JSON.stringify(criterios));
};

const restaurarCriterios = () => {
  let guardado = null;
  try {
    guardado = JSON.parse(localStorage.getItem(claveGuardada));
  } catch {
    return null;
  }
  if (!guardado || typeof guardado !== 'object') {
    return null;
  }
  const criterios = {
    nombre: typeof guardado.nombre === 'string' ? guardado.nombre : '',
    temporada: typeof guardado.temporada === 'string' ? guardado.temporada : ''
  };
  campoNombre.value = criterios.nombre;
  campoTemporada.value = criterios.temporada;
  return criterios;
};

const mostrarMensaje = (texto, clase = '') => {
  mensaje.textContent = texto;
  mensaje.className = clase ? `mensaje mensaje--${clase}` : 'mensaje';
};

const limpiarResultados = () => {
  rejilla.replaceChildren();
};

const valorODesconocido = (valor) => {
  const texto = typeof valor === 'string' ? valor.trim() : String(valor ?? '');
  if (texto === '' || texto.toLowerCase() === 'unknown') {
    return 'Desconocido';
  }
  return texto;
};

const crearTarjeta = (episodio) => {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';

  const nombre = document.createElement('h3');
  nombre.className = 'tarjeta__nombre';
  nombre.textContent = valorODesconocido(episodio.name);

  const codigo = document.createElement('p');
  codigo.className = 'tarjeta__codigo';
  codigo.textContent = valorODesconocido(episodio.episode);

  const fecha = document.createElement('p');
  fecha.className = 'tarjeta__fecha';
  fecha.textContent = `Estreno: ${valorODesconocido(episodio.air_date)}`;

  const cantidad = document.createElement('p');
  cantidad.className = 'tarjeta__personajes';
  cantidad.textContent = Array.isArray(episodio.characters)
    ? `Personajes: ${episodio.characters.length}`
    : 'Personajes: Desconocido';

  tarjeta.append(nombre, codigo, fecha, cantidad);
  return tarjeta;
};

const pintarResultados = (episodios) => {
  limpiarResultados();
  episodios.forEach((episodio) => rejilla.append(crearTarjeta(episodio)));
};

const pedirEpisodios = async (criterios) => {
  const url = new URL('https://rickandmortyapi.com/api/episode');
  if (criterios.nombre) {
    url.searchParams.set('name', criterios.nombre);
  }
  if (criterios.temporada) {
    url.searchParams.set('episode', criterios.temporada);
  }
  const respuesta = await fetch(url);
  if (respuesta.status === 404) {
    return [];
  }
  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status}`);
  }
  const datos = await respuesta.json();
  return Array.isArray(datos.results) ? datos.results : [];
};

const buscar = async (criterios) => {
  if (!criterios.nombre && !criterios.temporada) {
    mostrarMensaje('Escribí un nombre o elegí una temporada para buscar.', 'aviso');
    return;
  }
  guardarCriterios(criterios);
  botonBuscar.disabled = true;
  botonBuscar.textContent = 'Buscando...';
  mostrarMensaje('Buscando...', 'buscando');
  try {
    const episodios = await pedirEpisodios(criterios);
    if (episodios.length === 0) {
      limpiarResultados();
      mostrarMensaje('Sin resultados para esa búsqueda.', 'vacio');
    } else {
      pintarResultados(episodios);
      const plural = episodios.length === 1 ? 'episodio' : 'episodios';
      mostrarMensaje(`Se encontraron ${episodios.length} ${plural}.`, 'ok');
    }
  } catch {
    limpiarResultados();
    mostrarMensaje('Ocurrió un error al buscar. Intentá de nuevo.', 'error');
  } finally {
    botonBuscar.disabled = false;
    botonBuscar.textContent = 'Buscar';
  }
};

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  buscar(obtenerCriterios());
});

const restaurarBusqueda = () => {
  const criterios = restaurarCriterios();
  if (criterios && (criterios.nombre || criterios.temporada)) {
    buscar(criterios);
  }
};

restaurarBusqueda();