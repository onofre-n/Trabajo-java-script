// =====================================================
// FORMULARIO DE PRESUPUESTO
//   Parte A: validación de los datos de contacto
//   Parte B: cálculo automático del presupuesto
//   Parte C: validación de producto, plazo y condiciones
//   Parte D: envío y borrado del formulario
// =====================================================


// =====================================================
// PARTE A · VALIDACIÓN DE LOS DATOS DE CONTACTO
// =====================================================

// 1) REGLAS DE CADA CAMPO
// Cada regla tiene:
//   - patron: una expresión regular (regex) que describe qué se permite
//   - mensaje: el texto que se muestra si el dato no es válido
//
// Letras permitidas: a-z, A-Z y las letras españolas con tilde, ñ y ü.
// Se permiten espacios ENTRE palabras (para "José Luis" o "García López"),
// pero no al principio ni al final.
const LETRAS = "A-Za-zÁÉÍÓÚáéíóúÑñÜü";

const reglas = {
  nombre: {
    // ^ = empieza   $ = termina   + = una o más   * = cero o más
    patron: new RegExp("^[" + LETRAS + "]+( [" + LETRAS + "]+)*$"),
    maximo: 15,
    mensaje: "El nombre solo puede contener letras (máximo 15)."
  },
  apellidos: {
    patron: new RegExp("^[" + LETRAS + "]+( [" + LETRAS + "]+)*$"),
    maximo: 40,
    mensaje: "Los apellidos solo pueden contener letras (máximo 40)."
  },
  telefono: {
    // \d = un dígito (0-9)   {1,9} = entre 1 y 9 veces
    patron: /^\d{1,9}$/,
    maximo: 9,
    mensaje: "El teléfono solo puede contener números (máximo 9 dígitos)."
  },
  email: {
    // usuario  @  dominio  .  extensión de al menos 2 letras
    // Ejemplo válido: nnnnn_nnn@zzzzz.xxx
    patron: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
    mensaje: "Escribe un correo válido, por ejemplo: nombre_apellido@correo.com"
  }
};

// Muestra u oculta el error de un campo y le pinta el borde.
// La usan TODAS las validaciones del formulario, para no repetir código.
function marcarCampo(campo, idError, mensaje) {
  document.getElementById(idError).textContent = mensaje;
  campo.classList.toggle("campo--mal", mensaje !== "");
  campo.classList.toggle("campo--bien", mensaje === "");
  return mensaje === ""; // true = correcto
}

// 2) FUNCIÓN QUE VALIDA UN CAMPO DE CONTACTO
// Recibe el id del campo, comprueba su valor y muestra u oculta el error.
// Devuelve true si es válido y false si no lo es.
function validarCampo(id) {
  const campo = document.getElementById(id);
  const regla = reglas[id];
  const valor = campo.value.trim(); // trim() quita espacios del principio y del final

  let mensaje = "";

  if (valor === "") {
    mensaje = "Este campo es obligatorio.";
  } else if (regla.maximo && valor.length > regla.maximo) {
    mensaje = regla.mensaje;
  } else if (!regla.patron.test(valor)) {
    // test() devuelve true si el texto cumple el patrón
    mensaje = regla.mensaje;
  }

  return marcarCampo(campo, "error-" + id, mensaje);
}

// 3) VALIDACIÓN MIENTRAS EL USUARIO ESCRIBE
// Cuando el usuario sale de un campo (evento "blur") lo validamos.
// Y si ya tenía un error, lo volvemos a comprobar al escribir ("input"),
// para que el mensaje desaparezca en cuanto lo corrija.
Object.keys(reglas).forEach(function (id) {
  const campo = document.getElementById(id);

  campo.addEventListener("blur", function () {
    validarCampo(id);
  });

  campo.addEventListener("input", function () {
    if (campo.classList.contains("campo--mal")) {
      validarCampo(id);
    }
  });
});


// =====================================================
// PARTE B · CÁLCULO AUTOMÁTICO DEL PRESUPUESTO
// =====================================================

const formulario = document.getElementById("form-presupuesto");
const selectProducto = document.getElementById("producto");
const inputPlazo = document.getElementById("plazo");
const casillasExtras = document.querySelectorAll('input[name="extras"]');
const casillaPrivacidad = document.getElementById("privacidad");
const mensajeFinal = document.getElementById("mensaje-final");

// Devuelve el porcentaje de descuento según los días de plazo
function calcularDescuento(dias) {
  if (dias >= 60) return 15;
  if (dias >= 30) return 10;
  if (dias >= 15) return 5;
  return 0;
}

// Convierte un número en texto con formato de euros: 1234.5 → "1.234,50 €"
function formatearEuros(cantidad) {
  return cantidad.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR"
  });
}

// Lee todas las elecciones, calcula y escribe el resultado en pantalla
function calcularPresupuesto() {
  // 1. Precio del producto: lo leemos del data-precio de la opción elegida
  const opcionElegida = selectProducto.options[selectProducto.selectedIndex];
  const precioProducto = Number(opcionElegida.dataset.precio);

  // 2. Extras: sumamos el data-precio de cada casilla marcada
  let precioExtras = 0;
  casillasExtras.forEach(function (casilla) {
    if (casilla.checked) {
      precioExtras += Number(casilla.dataset.precio);
    }
  });

  // 3. Descuento: se aplica sobre la suma de producto + extras
  const dias = Number(inputPlazo.value) || 0; // si está vacío, cuenta como 0
  const porcentaje = calcularDescuento(dias);
  const subtotal = precioProducto + precioExtras;
  const descuento = subtotal * porcentaje / 100;
  const total = subtotal - descuento;

  // 4. Mostramos cada línea del resumen
  document.getElementById("res-producto").textContent = formatearEuros(precioProducto);
  document.getElementById("res-extras").textContent = formatearEuros(precioExtras);
  document.getElementById("res-porcentaje").textContent = "(" + porcentaje + " %)";
  document.getElementById("res-descuento").textContent = "−" + formatearEuros(descuento);
  document.getElementById("total").value = formatearEuros(total);
}

// Recalculamos con CUALQUIER cambio, sin botones ni recargar la página:
//   - "change" salta al elegir otra opción del select o marcar una casilla
//   - "input" salta en cada tecla que se escribe en el plazo
selectProducto.addEventListener("change", calcularPresupuesto);
inputPlazo.addEventListener("input", calcularPresupuesto);
casillasExtras.forEach(function (casilla) {
  casilla.addEventListener("change", calcularPresupuesto);
});


// =====================================================
// PARTE C · VALIDACIÓN DE PRODUCTO, PLAZO Y CONDICIONES
// =====================================================

function validarProducto() {
  const mensaje = selectProducto.value === "" ? "Elige un producto o servicio." : "";
  return marcarCampo(selectProducto, "error-producto", mensaje);
}

function validarPlazo() {
  const valor = inputPlazo.value.trim();
  const dias = Number(valor);
  let mensaje = "";

  if (valor === "") {
    mensaje = "Indica en cuántos días lo necesitas.";
  } else if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
    // Number.isInteger() comprueba que no tenga decimales
    mensaje = "Escribe un número entero de días entre 1 y 365.";
  }

  return marcarCampo(inputPlazo, "error-plazo", mensaje);
}

function validarPrivacidad() {
  const mensaje = casillaPrivacidad.checked
    ? ""
    : "Debes aceptar la política de privacidad para enviar el formulario.";
  return marcarCampo(casillaPrivacidad, "error-privacidad", mensaje);
}

// También validamos estos campos al cambiarlos, como los de contacto
selectProducto.addEventListener("change", validarProducto);
inputPlazo.addEventListener("blur", validarPlazo);
inputPlazo.addEventListener("input", function () {
  if (inputPlazo.classList.contains("campo--mal")) validarPlazo();
});
casillaPrivacidad.addEventListener("change", validarPrivacidad);


// =====================================================
// PARTE D · ENVÍO Y BORRADO DEL FORMULARIO
// =====================================================

// Vale true solo justo después de un envío correcto (ver evento "reset")
let borradoTrasEnvio = false;

// Quita todos los errores y bordes de color
function limpiarMarcas() {
  document.querySelectorAll(".campo--mal, .campo--bien").forEach(function (c) {
    c.classList.remove("campo--mal", "campo--bien");
  });
  document.querySelectorAll(".campo__error").forEach(function (e) {
    e.textContent = "";
  });
}

formulario.addEventListener("submit", function (evento) {
  // Evitamos que la página se recargue al enviar
  evento.preventDefault();

  // Validamos TODOS los campos (aunque uno falle, revisamos el resto
  // para que el usuario vea todos los errores a la vez)
  let todoCorrecto = true;
  Object.keys(reglas).forEach(function (id) {
    if (!validarCampo(id)) todoCorrecto = false;
  });
  if (!validarProducto()) todoCorrecto = false;
  if (!validarPlazo()) todoCorrecto = false;
  if (!validarPrivacidad()) todoCorrecto = false;

  if (todoCorrecto) {
    const nombre = document.getElementById("nombre").value.trim();
    const total = document.getElementById("total").value;
    mensajeFinal.textContent =
      "¡Gracias, " + nombre + "! Hemos recibido tu solicitud de presupuesto por " +
      total + ". Te contestaremos pronto.";
    mensajeFinal.className = "mensaje-final mensaje-final--ok";
    borradoTrasEnvio = true; // avisamos al evento "reset" de que no borre el mensaje
    formulario.reset();      // esto dispara el evento "reset" de abajo
  } else {
    mensajeFinal.textContent = "Revisa los campos marcados en rojo.";
    mensajeFinal.className = "mensaje-final mensaje-final--error";
    // Llevamos el cursor al primer campo con error
    document.querySelector(".campo--mal").focus();
  }
});

// Botón "Borrar formulario" (type="reset").
// El navegador vacía los campos él solo, pero hay que poner el total a 0
// y quitar los errores. Usamos setTimeout(…, 0) para esperar a que el
// navegador haya terminado de vaciar los campos antes de recalcular.
formulario.addEventListener("reset", function () {
  // Guardamos ahora si el borrado viene de un envío correcto, porque dentro
  // del setTimeout ya habremos vuelto a poner la variable a false
  const conservarMensaje = borradoTrasEnvio;
  borradoTrasEnvio = false;

  setTimeout(function () {
    calcularPresupuesto();
    limpiarMarcas();
    // Si el usuario ha pulsado "Borrar" a mano, quitamos también el mensaje final.
    // Si venimos de un envío correcto, dejamos el "¡Gracias!" a la vista.
    if (!conservarMensaje) {
      mensajeFinal.textContent = "";
      mensajeFinal.className = "mensaje-final";
    }
  }, 0);
});
