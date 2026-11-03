// Esperamos a que la página esté cargada del todo antes de ejecutar nada
$(document).ready(function () {
  cargarNoticias();
});

// Pide las noticias al archivo JSON mediante Ajax y las pinta en la página
function cargarNoticias() {
  $.ajax({
    url: "datos/noticias.json", // archivo externo con las noticias
    method: "GET",              // solo queremos leer datos
    dataType: "json",           // le decimos que la respuesta es JSON

    // Si todo va bien, "noticias" es ya un array de objetos JavaScript
    success: function (noticias) {
      const $lista = $("#lista-noticias");
      $lista.empty(); // quitamos el texto "Cargando noticias…"

      // Ordenamos de la más reciente a la más antigua
      noticias.sort(function (a, b) {
        return new Date(b.fecha) - new Date(a.fecha);
      });

      // Por cada noticia creamos una tarjeta HTML y la añadimos
      noticias.forEach(function (noticia) {
        const tarjeta = `
          <article class="noticia">
            <span class="noticia__categoria">${noticia.categoria}</span>
            <h3>${noticia.titulo}</h3>
            <time datetime="${noticia.fecha}">${formatearFecha(noticia.fecha)}</time>
            <p>${noticia.resumen}</p>
          </article>`;
        $lista.append(tarjeta);
      });
    },

    // Si algo falla (archivo no encontrado, página abierta sin servidor…)
    error: function () {
      $("#lista-noticias").html(
        '<p class="error">No se han podido cargar las noticias.</p>'
      );
    }
  });
}

// Convierte "2026-10-15" en "15 de octubre de 2026"
function formatearFecha(textoFecha) {
  const fecha = new Date(textoFecha);
  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}
