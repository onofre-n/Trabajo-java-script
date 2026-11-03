// =====================================================
// MAPA DE CONTACTO CON RUTA HASTA EL CLIENTE
//   Librería: Leaflet (dibuja el mapa)
//   Mapas:    OpenStreetMap (las "baldosas" o imágenes del mapa)
//   APIs:     Nominatim (dirección → coordenadas)
//             OSRM      (calcula la ruta entre dos puntos)
// =====================================================

// Coordenadas del club: [latitud, longitud]
const CLUB = [37.3826, -5.9737];

// Variables donde guardaremos la ruta y el marcador del cliente,
// para poder borrarlos cuando se calcule una ruta nueva
let capaRuta = null;
let marcadorCliente = null;

// ---------- 1. CREAR EL MAPA ----------

// L es el objeto de Leaflet. Creamos el mapa en el div #mapa,
// centrado en el club y con zoom 15 (cuanto más alto, más cerca)
const mapa = L.map("mapa").setView(CLUB, 15);

// Capa de imágenes de OpenStreetMap. La atribución es obligatoria
// según las condiciones de uso de OpenStreetMap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(mapa);

// Icono propio para el club: un círculo con la estrella
const iconoClub = L.divIcon({
  className: "",
  html: '<div class="marcador marcador--club">★</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Marcador del club con su ventanita (popup) abierta
L.marker(CLUB, { icon: iconoClub })
  .addTo(mapa)
  .bindPopup("<strong>CF Estrella del Sur</strong><br>Avenida de la Estrella, 12")
  .openPopup();


// ---------- 2. CALCULAR LA RUTA CON OSRM (AJAX) ----------

// origen = [latitud, longitud] del cliente
function calcularRuta(origen) {
  mostrarInfo("Calculando la ruta…", "");

  // ¡Ojo! OSRM pide las coordenadas al revés: longitud,latitud
  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    origen[1] + "," + origen[0] + ";" + CLUB[1] + "," + CLUB[0] +
    "?overview=full&geometries=geojson";

  $.ajax({
    url: url,
    method: "GET",
    dataType: "json",
    success: function (respuesta) {
      if (respuesta.code !== "Ok" || respuesta.routes.length === 0) {
        mostrarInfo("No se ha encontrado una ruta en coche hasta el club.", "error");
        return;
      }

      const ruta = respuesta.routes[0];
      dibujarRuta(origen, ruta.geometry);

      // OSRM devuelve la distancia en metros y la duración en segundos
      const km = (ruta.distance / 1000).toFixed(1).replace(".", ",");
      const minutos = Math.round(ruta.duration / 60);
      mostrarInfo(
        "🚗 Estás a <strong>" + km + " km</strong> del club: unos <strong>" +
        formatearTiempo(minutos) + "</strong> en coche.",
        "ok"
      );
    },
    error: function () {
      mostrarInfo("No se ha podido calcular la ruta. Inténtalo de nuevo más tarde.", "error");
    }
  });
}

// Dibuja la línea de la ruta y el marcador del cliente en el mapa
function dibujarRuta(origen, geometria) {
  // Si había una ruta anterior, la quitamos
  if (capaRuta) mapa.removeLayer(capaRuta);
  if (marcadorCliente) mapa.removeLayer(marcadorCliente);

  // Leemos el verde de la variable CSS --color-principal (estilos.css),
  // así la ruta usa siempre el color de la paleta del sitio
  const verde = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-principal").trim();

  // La geometría viene en formato GeoJSON, que Leaflet sabe dibujar directamente
  capaRuta = L.geoJSON(geometria, {
    style: { color: verde, weight: 6, opacity: 0.85 }
  }).addTo(mapa);

  const iconoCliente = L.divIcon({
    className: "",
    html: '<div class="marcador marcador--cliente"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
  marcadorCliente = L.marker(origen, { icon: iconoCliente })
    .addTo(mapa)
    .bindPopup("Tu ubicación");

  // Cerramos la ventanita del club para que no tape la ruta
  // (se puede volver a abrir pulsando la estrella)
  mapa.closePopup();

  // Ajustamos el zoom para que se vea la ruta entera, con un margen
  mapa.fitBounds(capaRuta.getBounds(), { padding: [40, 40] });
}


// ---------- 3. OPCIÓN A: EL CLIENTE ESCRIBE SU DIRECCIÓN ----------

// Nominatim convierte un texto ("Plaza Nueva, Sevilla") en coordenadas.
// A esto se le llama "geocodificar"
$("#form-ruta").on("submit", function (evento) {
  evento.preventDefault(); // que no se recargue la página

  const direccion = $("#origen").val().trim();
  if (direccion === "") {
    mostrarInfo("Escribe una dirección o usa tu ubicación actual.", "error");
    $("#origen").focus();
    return;
  }

  mostrarInfo("Buscando la dirección…", "");

  $.ajax({
    url: "https://nominatim.openstreetmap.org/search",
    method: "GET",
    dataType: "json",
    // jQuery convierte este objeto en ?q=...&format=json&limit=1&countrycodes=es
    data: {
      q: direccion,
      format: "json",
      limit: 1,          // solo queremos el resultado más probable
      countrycodes: "es" // buscamos solo en España
    },
    success: function (resultados) {
      if (resultados.length === 0) {
        mostrarInfo("No hemos encontrado esa dirección. Prueba a añadir la ciudad.", "error");
        return;
      }
      // Nominatim devuelve lat y lon como texto: los pasamos a número
      const origen = [Number(resultados[0].lat), Number(resultados[0].lon)];
      calcularRuta(origen);
    },
    error: function () {
      mostrarInfo("No se ha podido buscar la dirección. Inténtalo de nuevo.", "error");
    }
  });
});


// ---------- 4. OPCIÓN B: UBICACIÓN ACTUAL DEL CLIENTE ----------

$("#mi-ubicacion").on("click", function () {
  // No todos los navegadores tienen geolocalización
  if (!navigator.geolocation) {
    mostrarInfo("Tu navegador no permite obtener la ubicación. Escribe tu dirección.", "error");
    return;
  }

  mostrarInfo("Obteniendo tu ubicación…", "");

  // El navegador pedirá permiso al usuario antes de dar su posición
  navigator.geolocation.getCurrentPosition(
    function (posicion) {
      calcularRuta([posicion.coords.latitude, posicion.coords.longitude]);
    },
    function () {
      mostrarInfo("No hemos podido obtener tu ubicación. Escribe tu dirección.", "error");
    }
  );
});


// ---------- 5. FUNCIONES DE AYUDA ----------

// Escribe un mensaje debajo del mapa. tipo = "ok", "error" o ""
function mostrarInfo(html, tipo) {
  $("#info-ruta")
    .html(html)
    .attr("class", "info-ruta" + (tipo ? " info-ruta--" + tipo : ""));
}

// 75 → "1 h 15 min"   ·   20 → "20 min"
function formatearTiempo(minutos) {
  if (minutos < 60) return minutos + " min";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas + " h" + (resto > 0 ? " " + resto + " min" : "");
}
