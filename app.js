// Configura tus endpoints aquí
const SHEETDB_ARTICULOS = 'https://sheetdb.io/api/v1/q95fbg5almox4';
const SHEETDB_COMBINADO = 'https://sheetdb.io/api/v1/met275r8atidi';
const APPSCRIPT_RESERVA = 'https://script.google.com/macros/s/AKfycbya4ZxFq1rNzUyRzes4lOfLQ6PwE9DC8xd_ZuNXoWlg_6nlggu4E7ekNKJmeguvz4Zq/exec';

// Carrusel y Promociones
async function cargarDatosCombinados() {
  const res = await fetch(SHEETDB_COMBINADO);
  const datos = await res.json();

  const carrusel = datos.filter(d => d.Tipo === 'Carrusel');
  const promociones = datos.filter(d => d.Tipo === 'Promocion');

  // Carrusel
  const carruselDiv = document.getElementById('carrusel');
  function renderCarrusel(i) {
    carruselDiv.innerHTML = `
      <img class="carrusel-img" src="${carrusel[i].Imagen}" alt="Foto hotel" />
      <div class="carrusel-controls">
        ${carrusel.map((_, j) => `<button ${j===i?'class="active"':''} onclick="window.setCarrusel(${j})">${j+1}</button>`).join('')}
      </div>
      ${carrusel[i]['Texto Carrusel'] ? `<div class="carrusel-text">${carrusel[i]['Texto Carrusel']}</div>` : ''}
    `;
    window.setCarrusel = renderCarrusel;
  }
  if (carrusel.length > 0) renderCarrusel(0);

  // Promociones (con imagen siempre)
  const promoDiv = document.getElementById('promociones');
  promoDiv.innerHTML = '<h2>Promociones</h2>' + promociones.map(promo => `
    <div class="promo-card">
      <img src="${promo.Imagen}" class="promo-img" alt="Promo" />
      <div>
        <h3>${promo['Título Promo']}</h3>
        <p>${promo['Detalle Promo']}</p>
        ${promo.Vigencia ? `<p class="vigencia">Válido hasta: ${promo.Vigencia}</p>` : ''}
      </div>
    </div>
  `).join('');
}
cargarDatosCombinados();

// Habitaciones: filtro en el frontend
async function cargarHabitaciones() {
  // Trae todos los productos activos
  const res = await fetch(SHEETDB_ARTICULOS + '/search?Estado=Activo');
  const articulos = await res.json();

  // Filtra solo las habitaciones activas
  const habitaciones = articulos.filter(
    art => art['Tipo articulo'] && art['Tipo articulo'].trim().toLowerCase() === 'habitacion'
  );

  const div = document.getElementById('habitaciones');
  div.innerHTML = '<h2>Habitaciones</h2>' + habitaciones.map(hab => `
    <div class="habitacion-card">
      <img src="${hab.Url_imagen || hab.Imagen}" class="habitacion-img" alt="Habitación" />
      <div class="habitacion-details">
        <div class="habitacion-title">${hab.Descripcion}</div>
        <div class="habitacion-precio">L. ${parseFloat(hab['Precio Und']).toFixed(2)} / noche</div>
        <div class="habitacion-capacidad">Capacidad: ${hab.Unidades || 1} personas</div>
        <div class="habitacion-recargo">Recargo por persona adicional: L. ${parseFloat(hab.Recargo || 0).toFixed(2)}</div>
        <p>${hab.Catalago || ''}</p>
      </div>
    </div>
  `).join('');
  window.HABITACIONES = habitaciones;
}
cargarHabitaciones();

// Formulario atractivo de reserva
function renderReservaForm() {
  const div = document.getElementById('reservar');
  div.innerHTML = `
    <div class="form-card">
      <h2 style="text-align:center;color:#378a31;margin-bottom:1em;"><span>📝</span> Reserva tu habitación</h2>
      <form id="formReserva" autocomplete="off">
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
        <div id="habitacionesReserva"></div>
        <div id="totalReserva"></div>
        <div id="resumenReserva"></div>
        <button type="submit"><span>🔒</span> Reservar ahora</button>
      </form>
    </div>
  `;
  renderHabitacionesReserva();
  document.getElementById('formReserva').onsubmit = enviarReserva;
}

function renderHabitacionesReserva() {
  const habs = window.HABITACIONES || [];
  const div = document.getElementById('habitacionesReserva');
  div.innerHTML = `<h3 style="color:#8b5a2b;">Habitaciones</h3>` +
    habs.map((hab, idx) => `
      <div class="form-habitacion-row">
        <img src="${hab.Url_imagen || hab.Imagen}" class="form-habitacion-img" alt="Hab" />
        <div class="form-habitacion-details">
          <label>${hab.Descripcion} <span style="color:#378a31;">(L. ${parseFloat(hab['Precio Und']).toFixed(2)})</span></label>
          <span style="font-size:0.95em;color:#378a31;">Capacidad: ${hab.Unidades || 1} personas</span>
          <br>
          <span style="font-size:0.9em;color:#8b5a2b;">Recargo pers. adicional: L. ${parseFloat(hab.Recargo || 0).toFixed(2)}</span>
          <br>
          <input type="number" min="0" max="5" name="hab${hab.Codigo}_cant" placeholder="Cantidad" value="0" style="width:80px;" />
          <label style="font-size:0.95em;">Personas por habitación:</label>
          <input type="number" min="1" max="${hab.Unidades || 1}" name="hab${hab.Codigo}_pers" value="1" style="width:70px;" />
        </div>
      </div>
    `).join('');
}

// Resumen visual y total
function calcularTotalReserva() {
  const habs = window.HABITACIONES || [];
  let total = 0;
  let resumen = [];
  habs.forEach(hab => {
    const cant = +document.querySelector(`[name="hab${hab.Codigo}_cant"]`)?.value || 0;
    const pers = +document.querySelector(`[name="hab${hab.Codigo}_pers"]`)?.value || 1;
    const capacidad = parseInt(hab.Unidades) || 1;
    if (cant > 0) {
      const subtotal = cant * parseFloat(hab['Precio Und']);
      const recargo = pers > capacidad ? (pers-capacidad) * parseFloat(hab.Recargo || 0) * cant : 0;
      total += subtotal + recargo;
      resumen.push(`<li><b>${hab.Descripcion}</b> (${cant} habitación${cant>1?'es':''}, ${pers} personas/hab)
        <br>Subtotal: L. ${subtotal.toFixed(2)}, Recargo: L. ${recargo.toFixed(2)}
        </li>`);
    }
  });
  document.getElementById('totalReserva').innerHTML =
    `<div>Total estimado: <span style="color:#8b5a2b;">L. ${total.toFixed(2)}</span></div>`;
  document.getElementById('resumenReserva').innerHTML = resumen.length
    ? `<div class="form-summary-card"><h4>Tu selección</h4><ul>${resumen.join('')}</ul></div>`
    : '';
  return total;
}
document.addEventListener('input', () => calcularTotalReserva());

// Cargar el formulario al inicio
window.onload = renderReservaForm;

// Enviar reserva a Google Sheets + WhatsApp
async function enviarReserva(e) {
  e.preventDefault();
  const form = e.target;
  const habs = window.HABITACIONES || [];
  const reserva = {
    nombre: form.nombre.value,
    telefono: form.telefono.value,
    email: form.email.value,
    fecha_entrada: form.fecha_entrada.value,
    hora_entrada: form.hora_entrada.value,
    fecha_salida: form.fecha_salida.value,
    hora_salida: form.hora_salida.value,
    habitaciones: [],
    total: calcularTotalReserva()
  };
  habs.forEach(hab => {
    const cant = +form[`hab${hab.Codigo}_cant`]?.value || 0;
    const pers = +form[`hab${hab.Codigo}_pers`]?.value || 1;
    const capacidad = parseInt(hab.Unidades) || 1;
    if (cant > 0) {
      reserva.habitaciones.push({
        codigo: hab.Codigo,
        descripcion: hab.Descripcion,
        cantidad: cant,
        personas: pers,
        precio: parseFloat(hab['Precio Und']),
        recargo: pers > capacidad ? (pers - capacidad) * parseFloat(hab.Recargo || 0) : 0
      });
    }
  });

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
  renderHabitacionesReserva();
  calcularTotalReserva();
}
