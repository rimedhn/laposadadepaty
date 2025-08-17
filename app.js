document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('formReserva');
  if (form) {
    form.addEventListener('submit', enviarReserva);
  }
  document.getElementById('addHabitacionBtn').addEventListener('click', agregarHabitacion);

  agregarHabitacion(); // Primera habitación por defecto

  document.getElementById('habitacionesContainer').addEventListener('input', calcularTotalReserva);
  calcularTotalReserva();
});

function agregarHabitacion() {
  const container = document.getElementById('habitacionesContainer');
  const idx = container.children.length;
  const div = document.createElement('div');
  div.className = 'habitacion-block';
  div.innerHTML = `
    <hr class="form-separator"/>
    <label>Habitación ${idx + 1}:</label>
    <select name="habitacion" class="habitacion-select" required>
      <option value="" disabled selected>Selecciona una habitación</option>
      <option value="HAB1" data-descripcion="Sencilla" data-precio="500" data-personas="1" data-recargo="100">Sencilla (L.500, 1 persona, recargo L.100 por extra)</option>
      <option value="HAB2" data-descripcion="Doble" data-precio="800" data-personas="2" data-recargo="150">Doble (L.800, 2 personas, recargo L.150 por extra)</option>
      <option value="HAB3" data-descripcion="Triple" data-precio="1100" data-personas="3" data-recargo="200">Triple (L.1100, 3 personas, recargo L.200 por extra)</option>
      <option value="HAB4" data-descripcion="Cuádruple" data-precio="1400" data-personas="4" data-recargo="250">Cuádruple (L.1400, 4 personas, recargo L.250 por extra)</option>
    </select>
    <label>Cantidad de habitaciones:</label>
    <input name="cantidad" type="number" min="1" value="1" required />
    <label>Total de personas:</label>
    <input name="personas" type="number" min="1" value="1" required />
    <button type="button" class="removeHabitacionBtn">Eliminar</button>
  `;
  container.appendChild(div);

  div.querySelector('.removeHabitacionBtn').addEventListener('click', function() {
    div.remove();
    calcularTotalReserva();
  });

  calcularTotalReserva();
}

function calcularTotalReserva() {
  let total = 0;
  document.querySelectorAll('#habitacionesContainer .habitacion-block').forEach(block => {
    const habitacionSelect = block.querySelector('.habitacion-select');
    const option = habitacionSelect.options[habitacionSelect.selectedIndex];
    const cantidad = Number(block.querySelector('input[name="cantidad"]').value || 1);
    const personas = Number(block.querySelector('input[name="personas"]').value || 1);
    const precio = Number(option?.getAttribute('data-precio') || 0);
    const incluidas = Number(option?.getAttribute('data-personas') || 1);
    const recargo = Number(option?.getAttribute('data-recargo') || 0);

    let personasExtrasPorHab = Math.max(0, personas - cantidad * incluidas);
    let totalRecargo = personasExtrasPorHab * recargo;
    total += cantidad * precio + totalRecargo;
  });
  const totalReservaDiv = document.getElementById('totalReserva');
  totalReservaDiv.textContent = "Total a pagar: L." + total.toLocaleString();
}

function obtenerHabitacionesSeleccionadas() {
  return Array.from(document.querySelectorAll('#habitacionesContainer .habitacion-block')).map(block => {
    const habitacionSelect = block.querySelector('.habitacion-select');
    const option = habitacionSelect.options[habitacionSelect.selectedIndex];
    return {
      codigo: option?.value,
      descripcion: option?.getAttribute('data-descripcion'),
      cantidad: Number(block.querySelector('input[name="cantidad"]').value),
      precio: Number(option?.getAttribute('data-precio')),
      personas: Number(block.querySelector('input[name="personas"]').value),
      recargo: Math.max(0, Number(block.querySelector('input[name="personas"]').value) - Number(block.querySelector('input[name="cantidad"]').value) * Number(option?.getAttribute('data-personas'))) * Number(option?.getAttribute('data-recargo'))
    };
  });
}

function enviarReserva(event) {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const email = document.getElementById('email').value.trim();
  const fechaEntrada = document.getElementById('fecha_entrada').value;
  const fechaSalida = document.getElementById('fecha_salida').value;
  const habitaciones = obtenerHabitacionesSeleccionadas();

  const reserva = {
    nombre: nombre,
    telefono: telefono,
    email: email,
    fecha_entrada: fechaEntrada,
    fecha_salida: fechaSalida,
    habitaciones: habitaciones
  };

  const endpoint = "https://script.google.com/macros/s/AKfycbyPXpoQB-22Y1BSAIvLPfpID9lv85vPngvksd_2wA1wq7d_iPx_XTfQ27436R19eDkZ/exec";
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ reserva })
  })
  .then(res => res.text())
  .then(data => {
    alert("¡Reserva enviada con éxito! Nos pondremos en contacto contigo.");
    document.getElementById('formReserva').reset();
    document.getElementById('habitacionesContainer').innerHTML = "";
    agregarHabitacion();
    calcularTotalReserva();
  })
  .catch(error => {
    alert("Error al enviar la reserva. Por favor intenta de nuevo.");
    console.error(error);
  });
}
