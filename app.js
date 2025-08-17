const SHEETDB_ARTICULOS = 'https://sheetdb.io/api/v1/q95fbg5almox4';
const SHEETDB_COMBINADO = 'https://sheetdb.io/api/v1/met275r8atidi';
const APPSCRIPT_RESERVA = 'https://script.google.com/macros/s/AKfycbyPXpoQB-22Y1BSAIvLPfpID9lv85vPngvksd_2wA1wq7d_iPx_XTfQ27436R19eDkZ/exec';

let HABITACIONES = [];
let selectedHabitacion = null;

// Carrusel automático
let carruselTimeoutId = null;
function cargarDatosCombinados() {
  fetch(SHEETDB_COMBINADO)
    .then(res => res.json())
    .then(datos => {
      const carrusel = datos.filter(d => d.Tipo === 'Carrusel');
      const promociones = datos.filter(d => d.Tipo === 'Promocion');
      renderCarrusel(carrusel);
      renderPromos(promociones);
    });
}
function renderCarrusel(carrusel) {
  const carruselDiv = document.getElementById('carrusel');
  let idx = 0;
  function show(idxLocal) {
    idx = idxLocal;
    carruselDiv.innerHTML = `
      <img class="carrusel-img" src="${carrusel[idx].Imagen}" alt="Foto hotel" />
      <div class="carrusel-controls">
        ${carrusel.map((_, j) => `<button ${j===idx?'class="active"':''} onclick="window.setCarrusel(${j})">${j+1}</button>`).join('')}
      </div>
      ${carrusel[idx]['Texto Carrusel'] ? `<div class="carrusel-text">${carrusel[idx]['Texto Carrusel']}</div>` : ''}
    `;
    window.setCarrusel = (i) => { clearTimeout(carruselTimeoutId); show(i); autoAdvance(); };
  }
  function autoAdvance() {
    carruselTimeoutId = setTimeout(() => {
      let next = (idx + 1) % carrusel.length;
      show(next);
      autoAdvance();
    }, 4000);
  }
  show(0);
  autoAdvance();
}
function renderPromos(promociones) {
  const promoDiv = document.getElementById('promociones');
  promoDiv.innerHTML = '<h2>Promociones</h2><div class="cards-row">' +
    promociones.map(promo => `
      <div class="promo-card">
        <img src="${promo.Imagen}" class="promo-img" alt="Promo" />
        <div class="promo-title">${promo['Título Promo']}</div>
        <div class="promo-detail">${promo['Detalle Promo']}</div>
        ${promo.Vigencia ? `<div class="promo-vigencia">Válido hasta: ${promo.Vigencia}</div>` : ''}
      </div>
    `).join('') + '</div>';
}
cargarDatosCombinados();

// Habitaciones cards fila 4
async function cargarHabitaciones() {
  const res = await fetch(SHEETDB_ARTICULOS + '/search?Estado=Activo');
  const articulos = await res.json();
  HABITACIONES = articulos.filter(
    art => art['Tipo articulo'] && art['Tipo articulo'].trim().toLowerCase() === 'habitacion'
  );
  const div = document.getElementById('habitaciones');
  div.innerHTML = '<h2>Habitaciones</h2><div class="cards-row">' +
    HABITACIONES.map((hab, idx) => `
      <div class="habitacion-card">
        <img src="${hab.Url_imagen || hab.Imagen}" class="habitacion-img" alt="Habitación" />
        <div class="habitacion-title">${hab.Descripcion}</div>
        <div class="habitacion-precio">L. ${parseFloat(hab['Precio Und']).toFixed(2)} / noche</div>
        <div class="habitacion-capacidad">Capacidad: ${hab['Unidades caja'] || 1} personas</div>
        <div class="habitacion-recargo">
          Recargo adicional: ${parseFloat(hab.Recargo || 0)}% por persona extra
        </div>
        <p style="font-size:0.97em;color:#8b5a2b;">${hab.Catalago || ''}</p>
        <button class="btn-reservar" onclick="seleccionarHabitacion('${hab.Codigo}')">Reservar</button>
      </div>
    `).join('') + '</div>';
}
cargarHabitaciones();

// Botón Reservar en cada card
window.seleccionarHabitacion = function(codigo) {
  selectedHabitacion = HABITACIONES.find(h => h.Codigo === codigo);
  window.scrollTo({top: document.getElementById('reservar').offsetTop - 50, behavior: 'smooth'});
  renderReservaForm();
};

// Formulario solo para la habitación seleccionada
function renderReservaForm() {
  const div = document.getElementById('reservar');
  if (!selectedHabitacion) {
    div.innerHTML = `
      <div class="form-card">
        <h2 style="text-align:center;color:#378a31;margin-bottom:1em;"><span>📝</span> Reserva tu habitación</h2>
        <p>Selecciona primero una habitación para reservar.</p>
      </div>
    `;
    return;
  }
  div.innerHTML = `
    <div class="form-card">
      <h2 style="text-align:center;color:#378a31;margin-bottom:1em;"><span>📝</span> Reserva tu habitación</h2>
      <form id="formReserva" autocomplete="off">
        <div style="text-align:center;margin-bottom:1em">
          <img src="${selectedHabitacion.Url_imagen || selectedHabitacion.Imagen}" style="width:120px;height:100px;object-fit:cover;border-radius:10px;box-shadow:0 2px 8px #8b5a2b44;"><br>
          <span style="font-size:1.1em;font-weight:bold;color:#378a31;">${selectedHabitacion.Descripcion}</span>
        </div>
        <label><span>👤</span> Nombre completo:</label>
        <input required name="nombre" placeholder="Ingresa tu nombre completo" />
        <label><span>📱</span> Teléfono:</label>
        <input required name="telefono" placeholder="Ej: +504 9XXX-XXXX" />
        <label><span>✉️</span> Email:</label>
        <input required name="email" placeholder="Tu correo electrónico" type="email" />
        <hr class="form-separator" />
        <label><span>📅</span> Fecha de entrada:</label>
        <input type="date" required name="fecha_entrada" />
        <label><span>⏰</span> Hora de entrada:</label>
        <input type="time" required name="hora_entrada" />
        <label><span>📅</span> Fecha de salida:</label>
        <input type="date" required name="fecha_salida" />
        <label><span>⏰</span> Hora de salida:</label>
        <input type="time" required name="hora_salida" />
        <hr class="form-separator" />
        <div>
          <label>Cantidad de habitaciones:</label>
          <input type="number" min="1" max="5" name="cantidad" value="1" style="width:80px;" />
          <label>Personas por habitación:</label>
          <input type="number" min="1" name="personas" value="1" style="width:70px;" />
          <span style="font-size:0.95em;color:#8b5a2b;">
            Capacidad máxima: ${selectedHabitacion['Unidades caja'] || 1} personas.
            Recargo: ${parseFloat(selectedHabitacion.Recargo || 0)}% por cada persona adicional.
          </span>
        </div>
        <div id="totalReserva"></div>
        <div id="resumenReserva"></div>
        <button type="submit"><span>🔒</span> Reservar ahora</button>
      </form>
    </div>
  `;
  document.getElementById('formReserva').onsubmit = enviarReserva;
  calcularTotalReserva();
  document.querySelectorAll('#formReserva input[name="cantidad"], #formReserva input[name="personas"]').forEach(inp => {
    inp.addEventListener('input', calcularTotalReserva);
  });
}

// Resumen visual y total para la habitación seleccionada
function calcularTotalReserva() {
  if (!selectedHabitacion) return;
  const cantidad = +document.querySelector('#formReserva [name="cantidad"]')?.value || 1;
  const personas = +document.querySelector('#formReserva [name="personas"]')?.value || 1;
  const capacidad = parseInt(selectedHabitacion['Unidades caja']) || 1;
  const precioBase = cantidad * parseFloat(selectedHabitacion['Precio Und']);
  const personasExtra = personas > capacidad ? (personas - capacidad) : 0;
  const recargoPct = parseFloat(selectedHabitacion.Recargo || 0) / 100;
  const recargo = precioBase * recargoPct * personasExtra;
  const total = precioBase + recargo;
  document.getElementById('totalReserva').innerHTML =
    `<div>Total estimado: <span style="color:#8b5a2b;">L. ${total.toFixed(2)}</span></div>`;
  document.getElementById('resumenReserva').innerHTML =
    `<div class="form-summary-card"><h4>Tu selección</h4>
      <ul>
        <li><b>${selectedHabitacion.Descripcion}</b> (${cantidad} habitación${cantidad>1?'es':''}, ${personas} personas/hab)
          <br>Subtotal: L. ${precioBase.toFixed(2)}, Recargo: L. ${recargo.toFixed(2)}
        </li>
      </ul>
    </div>`;
  return total;
}

// Enviar reserva a Google Sheets + WhatsApp
async function enviarReserva(e) {
  e.preventDefault();
  if (!selectedHabitacion) return;
  const form = e.target;
  const cantidad = +form.cantidad.value || 1;
  const personas = +form.personas.value || 1;
  const capacidad = parseInt(selectedHabitacion['Unidades caja']) || 1;
  const precioBase = cantidad * parseFloat(selectedHabitacion['Precio Und']);
  const personasExtra = personas > capacidad ? (personas - capacidad) : 0;
  const recargoPct = parseFloat(selectedHabitacion.Recargo || 0) / 100;
  const recargo = precioBase * recargoPct * personasExtra;
  const total = precioBase + recargo;

  const reserva = {
    nombre: form.nombre.value,
    telefono: form.telefono.value,
    email: form.email.value,
    fecha_entrada: form.fecha_entrada.value,
    hora_entrada: form.hora_entrada.value,
    fecha_salida: form.fecha_salida.value,
    hora_salida: form.hora_salida.value,
    habitaciones: [{
      codigo: selectedHabitacion.Codigo,
      descripcion: selectedHabitacion.Descripcion,
      cantidad,
      personas,
      precio: parseFloat(selectedHabitacion['Precio Und']),
      recargo: recargo
    }],
    total: total
  };

  // Generar No Venta
  const now = new Date();
  const nventa = "RES" + now.getFullYear() + (now.getMonth()+1) + now.getDate() + now.getHours() + now.getMinutes() + now.getSeconds();

  // Enviar a AppScript
  await fetch(APPSCRIPT_RESERVA, {
    method: 'POST',
    body: JSON.stringify({ reserva, nventa }),
    headers: { 'Content-Type': 'application/json' }
  });

  // WhatsApp Admin
  let msg = `¡Nueva Reserva!\nCliente: ${reserva.nombre}\nTel: ${reserva.telefono}\nEmail: ${reserva.email}\nEntrada: ${reserva.fecha_entrada} ${reserva.hora_entrada}\nSalida: ${reserva.fecha_salida} ${reserva.hora_salida}\nHabitaciones:\n`;
  reserva.habitaciones.forEach(h => {
    msg += `- ${h.descripcion} (${h.cantidad} hab) ${h.personas} personas\n`;
  });
  msg += `Total: L. ${reserva.total.toFixed(2)}\nReserva ID: ${nventa}`;
  window.open(`https://wa.me/50493605881?text=${encodeURIComponent(msg)}`, '_blank');
  alert('Reserva enviada correctamente. Pronto recibirá confirmación.');
  form.reset();
  selectedHabitacion = null;
  renderReservaForm();
}

// Inicializa el formulario vacío al cargar
window.onload = function() {
  renderReservaForm();
};
