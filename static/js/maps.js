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
    mapId: "c2c7ec2d8b2c125e",
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
  const searchArea = document.getElementById("search-area");
  const resulting_address = document.createElement("p");

  button.addEventListener("click", () => {
    const inputValue = input.value.trim();
    console.log(inputValue);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: inputValue }, function (results, status) {
      if (status == "OK") {
        resulting_address.textContent = "";

        const searchPlace = results[0].geometry.location;
        findCourts(searchPlace);

        resulting_address.textContent = `Showing results near: ${results[0].formatted_address}`;
        searchArea.append(resulting_address);
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

async function saveCourt(court) {
  const data = {
    court_name: court.displayName,
    google_maps_place_id: court.id,
    address: court.formattedAddress,
    google_maps_url: court.googleMapsURI
  };

  try {
    const response = await axios.post("/save_court", data, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("Server response:", response.data);
  } catch (error) {
    console.error("Error:", error);
  }
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
    const { LatLngBounds } = await google.maps.importLibrary("core");
    const bounds = new LatLngBounds();

    // Loop through and get all results, with custom markers.
    places.forEach((court, i) => {
      // Custom pin, with basketball emoji.
      const pin = new PinElement({
        glyph: "🏀",
        background: "white",
        borderColor: "black",
        scale: 1.5,
      });
      const marker = new AdvancedMarkerElement({
        map,
        position: court.location,
        title: `${i + 1}. ${court.displayName}`,
        content: pin.element,
        gmpClickable: true,
      });

      bounds.extend(court.location);

      // Add a click listener for each marker, and set up the info window.
      marker.addListener("click", ({ domEvent, latLng }) => {
        const { target } = domEvent;

        const infoWindowContent = document.createElement("div");
        infoWindowContent.classList.add("info-window");

        const infoWindowAddress = document.createElement("p");
        infoWindowAddress.classList.add("info-window-address");
        infoWindowAddress.textContent = court.formattedAddress;

        const infoWindowMapsLink = document.createElement("a");
        infoWindowMapsLink.href = court.googleMapsURI;
        infoWindowMapsLink.target = "_blank";
        infoWindowMapsLink.textContent = "View on Google Maps";
        infoWindowMapsLink.classList.add("info-window-maps-link");

        const infoWindowSave = document.createElement("button");
        infoWindowSave.setAttribute("type", "button");
        infoWindowSave.ariaLabel = "Save Court"
        infoWindowSave.classList.add("text-light", "mx-3", "info-window-unsaved")
        infoWindowSave.innerHTML = "<i class='fa-regular fa-heart'></i>"
        infoWindowSave.addEventListener("click", (event) => {
          event.preventDefault();
          saveCourt(court);
        })

        infoWindowContent.append(infoWindowAddress, infoWindowMapsLink, infoWindowSave);
        infoWindow.close();

        const headerDiv = document.createElement("div");
        headerDiv.classList.add("info-window-header");
        headerDiv.innerText = court.displayName;

        infoWindow.setHeaderContent(headerDiv);
        infoWindow.setContent(infoWindowContent);
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
