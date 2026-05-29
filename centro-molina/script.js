// ===========================
// PRECIOS
// ===========================
const precios = {
  impresion_bn: {
    carta:       [{ max: 49, precio: 1.00 }, { max: 99, precio: 0.75 }, { max: Infinity, precio: 0.50 }],
    oficio:      [{ max: 49, precio: 1.50 }, { max: 99, precio: 1.00 }, { max: Infinity, precio: 0.85 }],
    doble_carta: [{ max: 49, precio: 2.50 }, { max: 99, precio: 2.00 }, { max: Infinity, precio: 1.50 }],
  },
  copia_bn: {
    carta:       [{ max: 10, precio: 1.00 }, { max: 49, precio: 0.50 }, { max: 99, precio: 0.45 }, { max: 299, precio: 0.40 }, { max: Infinity, precio: 0.35 }],
    oficio:      [{ max: 10, precio: 1.50 }, { max: 49, precio: 1.00 }, { max: 99, precio: 0.85 }, { max: 299, precio: 0.70 }, { max: Infinity, precio: 0.60 }],
    doble_carta: [{ max: 10, precio: 2.00 }, { max: 49, precio: 1.70 }, { max: 99, precio: 1.50 }, { max: 299, precio: 1.25 }, { max: Infinity, precio: 1.00 }],
  }
};

const preciosColor = {
  carta: [
    { minPct: 1,  maxPct: 10,  precio: 3.50 },
    { minPct: 11, maxPct: 25,  precio: 4.00 },
    { minPct: 26, maxPct: 50,  precio: 6.00 },
    { minPct: 51, maxPct: 75,  precio: 7.00 },
    { minPct: 76, maxPct: 100, precio: 8.00 },
  ],
  oficio: [
    { minPct: 1,  maxPct: 10,  precio: 4.00 },
    { minPct: 11, maxPct: 25,  precio: 4.50 },
    { minPct: 26, maxPct: 50,  precio: 7.00 },
    { minPct: 51, maxPct: 75,  precio: 8.00 },
    { minPct: 76, maxPct: 100, precio: 9.00 },
  ],
  doble_carta: [
    { minPct: 1,  maxPct: 10,  precio: 5.00  },
    { minPct: 11, maxPct: 25,  precio: 6.00  },
    { minPct: 26, maxPct: 50,  precio: 10.00 },
    { minPct: 51, maxPct: 75,  precio: 13.00 },
    { minPct: 76, maxPct: 100, precio: 15.00 },
  ],
};

const nombresServicio = {
  impresion_bn:    'Impresión blanco y negro',
  copia_bn:        'Copias blanco y negro',
  impresion_color: 'Impresión a color',
};

const nombresTamano = {
  carta:       'Carta',
  oficio:      'Oficio',
  doble_carta: 'Doble carta',
};

function formatoMXN(valor) {
  return valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

// ===========================
// MODAL
// ===========================
function abrirModal() {
  document.getElementById('modalOverlay').classList.add('abierto');
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('abierto');
  document.body.style.overflow = '';
}

function cerrarModalFuera(event) {
  if (event.target === document.getElementById('modalOverlay')) cerrarModal();
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') cerrarModal();
});

// ===========================
// CAMBIO DE SERVICIO
// ===========================
function cambiarServicio() {
  const servicio = document.getElementById('servicio').value;
  const esColor  = servicio === 'impresion_color';

  document.getElementById('grupo-cantidad').style.display    = esColor ? 'none' : 'flex';
  document.getElementById('color-upload-zone').style.display = esColor ? 'block' : 'none';
  document.getElementById('resultado').classList.remove('visible');
  document.getElementById('error-archivo').classList.remove('visible');

  actualizar();
}

// ===========================
// ARCHIVO
// ===========================
let archivoActual = null;

function archivoSeleccionado(event) {
  const file = event.target.files[0];
  if (!file) return;
  archivoActual = file;
  document.getElementById('archivo-nombre').textContent = file.name;
  document.getElementById('archivo-info').style.display = 'flex';
  document.getElementById('upload-box').style.display   = 'none';
  document.getElementById('error-archivo').classList.remove('visible');
  actualizarPasos(
    document.getElementById('servicio').value,
    document.getElementById('tamano').value,
    1
  );
}

function quitarArchivo() {
  archivoActual = null;
  document.getElementById('archivo-color').value = '';
  document.getElementById('archivo-info').style.display = 'none';
  document.getElementById('upload-box').style.display   = 'block';
  document.getElementById('resultado').classList.remove('visible');
  actualizarPasos(
    document.getElementById('servicio').value,
    document.getElementById('tamano').value,
    NaN
  );
}

// ===========================
// PRECIO COLOR POR %
// ===========================
function precioColorPorPct(tamano, pct) {
  const rangos = preciosColor[tamano];
  for (const r of rangos) {
    if (pct >= r.minPct && pct <= r.maxPct) return r.precio;
  }
  return rangos[0].precio;
}

// ===========================
// ANÁLISIS VÍA BACKEND
// ===========================
async function analizarArchivoConBackend(file) {
  const base64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('No se pudo leer el archivo'));
    r.readAsDataURL(file);
  });

  const mediaType = 'application/pdf';

  const response = await fetch('/api/analizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mediaType })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error del servidor');
  }

  return await response.json();
}

// ===========================
// PASOS
// ===========================
function obtenerPrecio(servicio, tamano, cantidad) {
  const rangos = precios[servicio][tamano];
  for (let rango of rangos) {
    if (cantidad <= rango.max) return rango.precio;
  }
  return null;
}

function obtenerRangoTexto(servicio, tamano, cantidad) {
  const rangos = precios[servicio][tamano];
  for (let i = 0; i < rangos.length; i++) {
    if (cantidad <= rangos[i].max) {
      const desde = i === 0 ? 1 : rangos[i - 1].max + 1;
      const hasta  = rangos[i].max === Infinity ? 'en adelante' : rangos[i].max;
      return `Rango: ${desde} – ${hasta === 'en adelante' ? hasta : hasta + ' hojas'}`;
    }
  }
  return '';
}

function actualizarPasos(servicio, tamano, cantidad) {
  document.getElementById('paso1').classList.toggle('activo', !!servicio);
  document.getElementById('paso2').classList.toggle('activo', !!(servicio && tamano));
  document.getElementById('paso3').classList.toggle('activo', !!(servicio && tamano && cantidad >= 1));
  document.getElementById('paso4').classList.toggle('activo', false);
}

function actualizar() {
  const servicio = document.getElementById('servicio').value;
  const tamano   = document.getElementById('tamano').value;
  const cantidad = parseInt(document.getElementById('cantidad').value);
  actualizarPasos(servicio, tamano, cantidad);
}

// ===========================
// COTIZAR
// ===========================
async function cotizar() {
  const servicio = document.getElementById('servicio').value;
  const tamano   = document.getElementById('tamano').value;
  const errorEl  = document.getElementById('error-cantidad');
  const resEl    = document.getElementById('resultado');

  // --- IMPRESIÓN A COLOR ---
  if (servicio === 'impresion_color') {
    const errorArch = document.getElementById('error-archivo');
    if (!tamano) {
      errorArch.textContent = 'Por favor selecciona el tamaño de papel.';
      errorArch.classList.add('visible');
      return;
    }
    if (!archivoActual) {
      errorArch.textContent = 'Por favor selecciona un archivo PDF.';
      errorArch.classList.add('visible');
      return;
    }
    errorArch.classList.remove('visible');

    document.getElementById('btn-cotizar').style.display       = 'none';
    document.getElementById('analizando-estado').style.display = 'flex';
    resEl.classList.remove('visible');

    try {
      const resultado = await analizarArchivoConBackend(archivoActual);
      const paginas   = resultado.paginas;

      let totalGeneral = 0;
      const desglose = paginas.map(p => {
        const precio = precioColorPorPct(tamano, p.pct);
        totalGeneral += precio;
        return { num: p.num, pct: p.pct, precio };
      });

      document.getElementById('res-servicio').textContent = nombresServicio[servicio];
      document.getElementById('res-tamano').textContent   = nombresTamano[tamano];
      document.getElementById('res-cantidad').textContent = `${paginas.length} páginas`;
      document.getElementById('linea-unitario').style.display = 'none';

      const listaEl = document.getElementById('desglose-lista');
      listaEl.innerHTML = desglose.map(p => `
        <div class="desglose-item">
          <span class="desglose-pagina">Página ${p.num}</span>
          <span class="desglose-pct">${p.pct}% color</span>
          <span class="desglose-precio">${formatoMXN(p.precio)}</span>
        </div>
      `).join('');
      document.getElementById('desglose-color').style.display = 'block';

      document.getElementById('res-rango').textContent = `Archivo: ${archivoActual.name}`;
      document.getElementById('res-total').textContent = formatoMXN(totalGeneral);

      document.getElementById('paso4').classList.add('activo');
      resEl.classList.add('visible');

    } catch (err) {
      console.error(err);
      const errorArch2 = document.getElementById('error-archivo');
      errorArch2.textContent = 'Ocurrió un error al analizar el archivo. Intenta de nuevo.';
      errorArch2.classList.add('visible');
    } finally {
      document.getElementById('btn-cotizar').style.display       = 'inline-block';
      document.getElementById('analizando-estado').style.display = 'none';
    }
    return;
  }

  // --- BLANCO Y NEGRO ---
  const cantidad = parseInt(document.getElementById('cantidad').value);
  if (!servicio || !tamano || isNaN(cantidad) || cantidad < 1) {
    errorEl.classList.add('visible');
    resEl.classList.remove('visible');
    return;
  }
  errorEl.classList.remove('visible');

  document.getElementById('linea-unitario').style.display = 'flex';
  document.getElementById('desglose-color').style.display = 'none';

  const precioUnitario = obtenerPrecio(servicio, tamano, cantidad);
  const total          = precioUnitario * cantidad;
  const rangoTexto     = obtenerRangoTexto(servicio, tamano, cantidad);

  document.getElementById('res-servicio').textContent = nombresServicio[servicio];
  document.getElementById('res-tamano').textContent   = nombresTamano[tamano];
  document.getElementById('res-cantidad').textContent = `${cantidad} hojas`;
  document.getElementById('res-unitario').textContent = `${formatoMXN(precioUnitario)} / hoja`;
  document.getElementById('res-rango').textContent    = rangoTexto;
  document.getElementById('res-total').textContent    = formatoMXN(total);

  document.getElementById('paso4').classList.add('activo');
  resEl.classList.add('visible');
}
