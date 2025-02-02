// Initialize and add the map
let map;
let infoWindow;


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
};

async function initSearchBar() {
  // Request search bar libary.
  const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");

  // Create the place autocomplete search bar.
  const placeAutocomplete = new PlaceAutocompleteElement();
  placeAutocomplete.id = "place-autocomplete-input";

  const card = document.createElement("div")
  card.id = "place-autocomplete-card";

  const searchBarText = document.createElement("p")
  searchBarText.textContent = "Search for a place here 🏀👇"
  searchBarText.classList.add("text-center", "text-custom-accent")

  card.appendChild(searchBarText)
  card.appendChild(placeAutocomplete);

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

  // Generate a new session token.
  let sessionToken = new google.maps.places.AutocompleteSessionToken();

  // Event listener to handle user search.
  placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location"],
      sessionToken: sessionToken,
    });
    findCourts(place);

    // After the place is selected, generate a new session token for the next session.
    sessionToken = new google.maps.places.AutocompleteSessionToken();
  });

}

async function findCourts(place) {
  // Request needed libraries.
  const { Place } = await google.maps.importLibrary("places");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker"
  );

  // Set the request parameters.
  const request = {
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
    locationBias: place.location,
    language: "en-US",
    maxResultCount: 100,
    region: "us",
    useStrictTypeFiltering: false,
  };

  const { places } = await Place.searchByText(request);

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
    });
    map.fitBounds(bounds);
  } else {
    console.log("No Results");
  }
}

initMap();
