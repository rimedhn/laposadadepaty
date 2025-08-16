// Configura tus endpoints de SheetDB y AppScript aquí
const SHEETDB_ARTICULOS = 'https://sheetdb.io/api/v1/YOUR_ARTICULOS_ID';
const SHEETDB_CARRUSEL = 'https://sheetdb.io/api/v1/YOUR_CARRUSEL_ID';
const SHEETDB_PROMOS = 'https://sheetdb.io/api/v1/YOUR_PROMOS_ID';
const APPSCRIPT_RESERVA = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// Cargar Carrusel desde Google Sheets
async function cargarCarrusel() {
  const res = await fetch(SHEETDB_CARRUSEL);
  const carrusel = await res.json();
  const carruselDiv = document.getElementById('carrusel');
  let idx = 0;
  function renderCarrusel(i) {
    carruselDiv.innerHTML = `
      <img class="carrusel-img" src="${carrusel[i].Imagen}" alt="Foto hotel" />
      <div class="carrusel-controls">
        ${carrusel.map((_, j) => `<button ${j===i?'class="active"':''} onclick="window.setCarrusel(${j})">${j+1}</button>`).join('')}
      </div>
      ${carrusel[i].Texto ? `<div class="carrusel-text">${carrusel[i].Texto}</div>` : ''}
    `;
    window.setCarrusel = renderCarrusel;
  }
  renderCarrusel(0);
}
cargarCarrusel();

// Cargar Habitaciones desde Google Sheets
async function cargarHabitaciones() {
  const res = await fetch(SHEETDB_ARTICULOS + '?search=Tipo articulo,Habitacion&search=Estado,Activo');
  const habitaciones = await res.json();
  const div = document.getElementById('habitaciones');
  div.innerHTML = '<h2>Habitaciones</h2>' + habitaciones.map(hab => `
    <div class="habitacion-card">
      <img src="${hab.Url_imagen || hab.Imagen}" class="habitacion-img" alt="Habitación" />
      <div class="habitacion-details">
        <div class="habitacion-title">${hab.Descripcion}</div>
        <div class="habitacion-precio">L. ${parseFloat(hab['Precio Und']).toFixed(2)} / noche</div>
        <div class="habitacion-capacidad">Capacidad: ${hab.Unidades} personas</div>
        <div class="habitacion-recargo">Recargo por persona adicional: L. ${parseFloat(hab.Recargo || 0).toFixed(2)}</div>
        <p>${hab.Catalago || ''}</p>
      </div>
    </div>
  `).join('');
  window.HABITACIONES = habitaciones;
}
cargarHabitaciones();

// Cargar Promociones
async function cargarPromos() {
  const res = await fetch(SHEETDB_PROMOS);
  const promos = await res.json();
  const div = document.getElementById('promociones');
  div.innerHTML = '<h2>Promociones</h2>' + promos.map(promo => `
    <div class="promo-card">
      <img src="${promo.Imagen}" class="promo-img" alt="Promo" />
      <div>
        <h3>${promo.Titulo}</h3>
        <p>${promo.Detalle}</p>
        ${promo.Vigencia ? `<p class="vigencia">Válido hasta: ${promo.Vigencia}</p>` : ''}
      </div>
    </div>
  `).join('');
}
cargarPromos();

// Formulario de Reserva
function renderReservaForm() {
  const div = document.getElementById('reservar');
  div.innerHTML = `
    <h2>Reservar habitación</h2>
    <form id="formReserva">
      <label>Nombre completo:</label> <input required name="nombre" /><br>
      <label>Teléfono:</label> <input required name="telefono" /><br>
      <label>Email:</label> <input required name="email" /><br>
      <label>Fecha de entrada:</label> <input type="date" required name="fecha_entrada" /><br>
      <label>Hora de entrada:</label> <input type="time" required name="hora_entrada" /><br>
      <label>Fecha de salida:</label> <input type="date" required name="fecha_salida" /><br>
      <label>Hora de salida:</label> <input type="time" required name="hora_salida" /><br>
      <div id="habitacionesReserva"></div>
      <button type="submit">Reservar ahora</button>
    </form>
    <div id="totalReserva"></div>
  `;
  renderHabitacionesReserva();
  document.getElementById('formReserva').onsubmit = enviarReserva;
}
function renderHabitacionesReserva() {
  const habs = window.HABITACIONES || [];
  const div = document.getElementById('habitacionesReserva');
  div.innerHTML = `<h3>Habitaciones</h3>` + habs.map((hab, idx) => `
    <div>
      <label>${hab.Descripcion} (L. ${parseFloat(hab['Precio Und']).toFixed(2)})</label>
      <input type="number" min="0" max="5" name="hab${hab.Codigo}_cant" placeholder="Cantidad" value="0" />
      <label>Personas por habitación:</label>
      <input type="number" min="1" max="${hab.Unidades}" name="hab${hab.Codigo}_pers" value="1" />
    </div>
  `).join('');
}
window.onload = renderReservaForm;

// Calcular total
function calcularTotalReserva() {
  const habs = window.HABITACIONES || [];
  let total = 0;
  habs.forEach(hab => {
    const cant = +document.querySelector(`[name="hab${hab.Codigo}_cant"]`)?.value || 0;
    const pers = +document.querySelector(`[name="hab${hab.Codigo}_pers"]`)?.value || 1;
    if (cant > 0) {
      total += cant * parseFloat(hab['Precio Und']);
      if (pers > hab.Unidades) {
        total += (pers-hab.Unidades) * parseFloat(hab.Recargo || 0) * cant;
      }
    }
  });
  document.getElementById('totalReserva').innerText = `Total estimado: L. ${total.toFixed(2)}`;
  return total;
}
document.addEventListener('input', () => calcularTotalReserva());

// Enviar reserva a Google Sheets + Notificar por WhatsApp
async function enviarReserva(e) {
  e.preventDefault();
  const form = e.target;
  const habs = window.HABITACIONES || [];
  const reserva = {
    nombre: form.nombre.value, telefono: form.telefono.value, email: form.email.value,
    fecha_entrada: form.fecha_entrada.value, hora_entrada: form.hora_entrada.value,
    fecha_salida: form.fecha_salida.value, hora_salida: form.hora_salida.value,
    habitaciones: [],
    total: calcularTotalReserva()
  };
  habs.forEach(hab => {
    const cant = +form[`hab${hab.Codigo}_cant`]?.value || 0;
    const pers = +form[`hab${hab.Codigo}_pers`]?.value || 1;
    if (cant > 0) {
      reserva.habitaciones.push({
        codigo: hab.Codigo,
        descripcion: hab.Descripcion,
        cantidad: cant,
        personas: pers,
        precio: parseFloat(hab['Precio Und']),
        recargo: pers > hab.Unidades ? (pers - hab.Unidades) * parseFloat(hab.Recargo || 0) : 0
      });
    }
  });

  // Generar No Venta: RES + fecha + hora (solo números)
  const now = new Date();
  const nventa = "RES" + now.getFullYear() + (now.getMonth()+1) + now.getDate() + now.getHours() + now.getMinutes() + now.getSeconds();
  // Enviar a AppScript/SheetDB
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
