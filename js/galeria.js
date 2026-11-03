// Aquí guardamos todas las fotos y las que se ven ahora mismo (según el filtro)
let todasLasFotos = [];
let fotosVisibles = [];
let posicionActual = 0; // qué foto está abierta en el visor

$(document).ready(function () {
  cargarGaleria();
  prepararFiltros();
  prepararVisor();
});

// ---------- 1. CARGAR LAS FOTOS CON AJAX ----------
function cargarGaleria() {
  $.ajax({
    url: "datos/galeria.json",
    method: "GET",
    dataType: "json",
    success: function (fotos) {
      todasLasFotos = fotos;
      mostrarFotos("todas");
    },
    error: function () {
      $("#galeria").html('<p class="error">No se han podido cargar las fotos.</p>');
    }
  });
}

// ---------- 2. PINTAR LAS FOTOS SEGÚN EL FILTRO ----------
function mostrarFotos(categoria) {
  // Si el filtro es "todas", usamos la lista completa; si no, solo las de esa categoría
  if (categoria === "todas") {
    fotosVisibles = todasLasFotos;
  } else {
    fotosVisibles = todasLasFotos.filter(function (foto) {
      return foto.categoria === categoria;
    });
  }

  const $galeria = $("#galeria");

  // Desvanecemos la galería, cambiamos las fotos y la volvemos a mostrar
  $galeria.fadeOut(200, function () {
    $galeria.empty();

    fotosVisibles.forEach(function (foto, indice) {
      // data-indice guarda la posición de la foto para saber cuál abrir en el visor
      const miniatura = `
        <figure class="galeria__item" data-indice="${indice}">
          <img src="${foto.imagen}" alt="${foto.titulo}" loading="lazy">
          <figcaption>
            <span>${foto.categoria}</span>
            ${foto.titulo}
          </figcaption>
        </figure>`;
      $galeria.append(miniatura);
    });

    $galeria.fadeIn(200);
  });
}

// ---------- 3. BOTONES DE FILTRO ----------
function prepararFiltros() {
  $(".filtro").on("click", function () {
    // Marcamos como activo solo el botón pulsado
    $(".filtro").removeClass("activo");
    $(this).addClass("activo");

    // Leemos su atributo data-filtro y mostramos esas fotos
    const categoria = $(this).data("filtro");
    mostrarFotos(categoria);
  });
}

// ---------- 4. VISOR (LIGHTBOX) ----------
function prepararVisor() {
  // Las fotos se crean después de cargar la página, por eso el clic se escucha
  // en #galeria y se "delega" en los .galeria__item que haya dentro
  $("#galeria").on("click", ".galeria__item", function () {
    abrirVisor($(this).data("indice"));
  });

  $(".visor__cerrar").on("click", cerrarVisor);
  $(".visor__flecha--anterior").on("click", function () { moverVisor(-1); });
  $(".visor__flecha--siguiente").on("click", function () { moverVisor(1); });

  // Si se pulsa en el fondo oscuro (no en la foto), también se cierra
  $("#visor").on("click", function (evento) {
    if (evento.target === this) {
      cerrarVisor();
    }
  });

  // Control con el teclado: Esc cierra, flechas cambian de foto
  $(document).on("keydown", function (evento) {
    if (!$("#visor").hasClass("abierto")) return;
    if (evento.key === "Escape") cerrarVisor();
    if (evento.key === "ArrowLeft") moverVisor(-1);
    if (evento.key === "ArrowRight") moverVisor(1);
  });
}

function abrirVisor(indice) {
  posicionActual = indice;
  actualizarVisor();
  $("#visor").addClass("abierto").attr("aria-hidden", "false");
}

function cerrarVisor() {
  $("#visor").removeClass("abierto").attr("aria-hidden", "true");
}

// direccion vale -1 (anterior) o 1 (siguiente)
function moverVisor(direccion) {
  const total = fotosVisibles.length;
  // El % hace que, al pasar de la última, se vuelva a la primera (y al revés)
  posicionActual = (posicionActual + direccion + total) % total;
  actualizarVisor();
}

function actualizarVisor() {
  const foto = fotosVisibles[posicionActual];
  $("#visor-imagen").attr("src", foto.imagen).attr("alt", foto.titulo);
  $("#visor-titulo").text(
    foto.titulo + " (" + (posicionActual + 1) + " de " + fotosVisibles.length + ")"
  );
}
