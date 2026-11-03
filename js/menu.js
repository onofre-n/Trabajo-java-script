// =====================================================
// MENÚ DESPLEGABLE PARA EL MÓVIL
// Se carga en TODAS las páginas. En el ordenador el botón ☰ está
// oculto con CSS, así que este código solo se nota en pantallas pequeñas.
// =====================================================

const botonMenu = document.querySelector(".menu-boton");
const menu = document.getElementById("menu");

// Abre o cierra el menú
function alternarMenu() {
  // toggle() añade la clase si no la tiene y la quita si la tiene.
  // Devuelve true si la ha añadido (es decir, si el menú queda abierto)
  const abierto = menu.classList.toggle("abierto");

  botonMenu.textContent = abierto ? "✕" : "☰";
  // aria-expanded avisa a los lectores de pantalla de si el menú está abierto
  botonMenu.setAttribute("aria-expanded", abierto);
  botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
}

botonMenu.addEventListener("click", alternarMenu);

// Al pulsar un enlace del menú, lo cerramos (útil en los enlaces a #secciones)
menu.querySelectorAll("a").forEach(function (enlace) {
  enlace.addEventListener("click", function () {
    if (menu.classList.contains("abierto")) alternarMenu();
  });
});
