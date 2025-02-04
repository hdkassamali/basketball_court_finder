// Initialize and add the map
let map;
let infoWindow;
let title;
let results;
let input;
let token;
let markers = [];
let request = {
  input: "",
  locationRestriction: {
    west: -122.44,
    north: 37.8,
    east: -122.39,
    south: 37.78,
  },
  language: "en-US",
  region: "us",
};

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
  const { Place } = await google.maps.importLibrary("places");
  token = new google.maps.places.AutocompleteSessionToken();
  title = document.getElementById("search-title");
  results = document.getElementById("search-results");
  input = document.querySelector("input");
  input.addEventListener("input", makeAcRequest);
  request = refreshToken(request);
}

async function makeAcRequest(input) {
  if (input.target.value == "") {
    title.innerText = "";
    results.replaceChildren();
    return;
  }
  request.input = input.target.value;

  const { suggestions } =
    await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
      request
    );
  title.innerText = 'Predictions for "' + request.input + '"';
  results.replaceChildren();

  for (const suggestion of suggestions) {
    const placePrediction = suggestion.placePrediction;
    const a = document.createElement("a");

    a.addEventListener("click", () => {
        onPlaceSelected(placePrediction.toPlace());
    });
    a.innerText = placePrediction.text.toString();

    const li = document.createElement("li");
    li.appendChild(a);
    results.appendChild(li);
  }
}

async function onPlaceSelected(searchPlace) {
    await searchPlace.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
        sessionToken: token,
    });
    let searchText = document.createTextNode(
        searchPlace.displayName + ": " + searchPlace.formattedAddress + ". " + searchPlace.location,
    );
    results.replaceChildren(searchText);
    title.innerText = "Selected Place:";
    findCourts(searchPlace)
    input.value = "";
    refreshToken(request);
}

async function refreshToken(request) {
  token = new google.maps.places.AutocompleteSessionToken();
  request.sessionToken = token;
  return request;
}

function clearMarkers() {
    markers.forEach(marker => {
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
    fields: [
      "displayName",
      "location",
      "primaryType",
      "formattedAddress",
      "googleMapsURI",
      "rating",
    ],
    includedType: "park",
    locationBias: searchPlace.location,
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
