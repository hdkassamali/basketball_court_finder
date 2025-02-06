// Initialize and add the map
let map;
let infoWindow;
let markers = [];

async function initMap() {
  // The center of the United States. Zoomed out.
  const center = { lat: 39.8283, lng: -98.5795 };

  // Request map libraries.
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");

  // The map, centered at the center of the US.
  map = new Map(document.getElementById("map"), {
    zoom: 4,
    center,
    mapId: "DEMO_MAP_ID",
    mapTypeId: "hybrid",
  });

  // Create an info window to share between markers.
  infoWindow = new InfoWindow();

  initSearchBar();
}

async function initSearchBar() {
  const { Geocoder } = await google.maps.importLibrary("geocoding");
  const input = document.getElementById("search-bar-input");
  const button = document.getElementById("search-bar-btn");

  button.addEventListener("click", () => {
    const inputValue = input.value.trim();
    console.log(inputValue);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: inputValue }, function (results, status) {
      if (status == "OK") {
        const searchPlace = results[0].geometry.location;
        findCourts(searchPlace);
      } else if (status == "ZERO_RESULTS") {
        alert(
          "No results for your search. You may have entered an invalid address. Please try again!"
        );
      } else {
        alert("Something went wrong, please try again!");
      }
    });
    input.value = "";
  });
}

function clearMarkers() {
  markers.forEach((marker) => {
    try {
      marker.map = null;
      if (marker.setMap) marker.setMap(null);
      if (marker.unbindAll) marker.unbindAll();
    } catch (e) {
      console.warn("Error removing marker:", e);
    }
  });
  markers = [];
}

async function findCourts(searchPlace) {
  // Empty markers from previous search;
  clearMarkers();

  // Request needed libraries.
  const { Place } = await google.maps.importLibrary("places");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker"
  );

  // Set the request parameters.
  const requestCourts = {
    textQuery: "Basketball Court",
    fields: ["displayName", "location", "formattedAddress", "googleMapsURI"],
    includedType: "park",
    locationBias: searchPlace,
    language: "en-US",
    maxResultCount: 100,
    region: "us",
    useStrictTypeFiltering: false,
  };

  const { places } = await Place.searchByText(requestCourts);

  if (places.length) {
    console.log(places);

    const { LatLngBounds } = await google.maps.importLibrary("core");
    const bounds = new LatLngBounds();

    // Loop through and get all results, with custom markers.
    places.forEach((place, i) => {
      // Custom pin, with basketball emoji.
      const pin = new PinElement({
        glyph: "🏀",
        background: "white",
        borderColor: "black",
        scale: 1.5,
      });
      const marker = new AdvancedMarkerElement({
        map,
        position: place.location,
        title: `${i + 1}. ${place.displayName}`,
        content: pin.element,
        gmpClickable: true,
      });

      bounds.extend(place.location);

      // Add a click listener for each marker, and set up the info window.
      marker.addListener("click", ({ domEvent, latLng }) => {
        const { target } = domEvent;

        infoWindow.close();
        infoWindow.setContent(marker.title);
        infoWindow.open(marker.map, marker);
      });
      markers.push(marker);
    });
    map.fitBounds(bounds);
  } else {
    console.log("No Results");
  }
}

initMap();
