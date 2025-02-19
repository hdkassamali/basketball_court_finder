const disclaimerLink = document.getElementById("disclaimerLink");
if (disclaimerLink) {
  disclaimerLink.addEventListener("click", function (event) {
    event.preventDefault();
    const disclaimerModalEl = document.getElementById("disclaimerModal");
    if (disclaimerModalEl) {
      const disclaimerModal = new bootstrap.Modal(disclaimerModalEl);
      disclaimerModal.show();
    }
  });
}
// Initialize and add the map
let map;
let infoWindow;
let markers = [];
const savedCourtMapping = {};
savedCourts.forEach((sc) => {
  savedCourtMapping[sc.google_maps_place_id] = sc.id;
});

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

function displaySearchFeedback(searchArea, message, type = "error") {
  let existingMessage = document.getElementById("feedback-message");
  if (existingMessage) {
    existingMessage.remove();
  }
  if (message.trim() === "") return;

  const messageElement = document.createElement("div");
  messageElement.id = "feedback-message";
  messageElement.textContent = message;
  messageElement.classList.add("feedback", type);
  searchArea.appendChild(messageElement);

  if (type !== "info") {
    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }
}

async function initSearchBar() {
  const { Geocoder } = await google.maps.importLibrary("geocoding");
  const input = document.getElementById("search-bar-input");
  const button = document.getElementById("search-bar-btn");
  const searchArea = document.getElementById("search-area");

  button.addEventListener("click", async () => {
    const inputValue = input.value.trim();
    console.log(inputValue);
    if (inputValue.length < 1) {
      displaySearchFeedback(searchArea, "Please enter a search term.");
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: inputValue }, async function (results, status) {
      if (status === "OK") {
        const searchPlace = results[0].geometry.location;
        const resultAmount = await findCourts(searchPlace);
        displaySearchFeedback(
          searchArea,
          `Showing ${resultAmount} results near: ${results[0].formatted_address}`,
          "info"
        );
      } else if (status === "ZERO_RESULTS") {
        displaySearchFeedback(
          searchArea,
          "No results found. Please check the address and try again."
        );
      } else {
        displaySearchFeedback(
          searchArea,
          "Something went wrong, please try again!"
        );
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
    google_maps_url: court.googleMapsURI,
  };

  try {
    const response = await axios.post("/save_court", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Server response:", response.data);

    const newCourtId = response.data.id;
    savedCourts.push({
      google_maps_place_id: court.id,
      id: newCourtId,
    });
    savedCourtMapping[court.id] = newCourtId;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function removeCourt(court) {
  const savedCourtId = savedCourtMapping[court.id];
  console.log("Removing court with data:", savedCourtId);
  const data = {
    court_id: savedCourtId,
  };

  try {
    const response = await axios.post("/remove_court", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    delete savedCourtMapping[court.id];
    savedCourts = savedCourts.filter(
      (sc) => sc.google_maps_place_id !== court.id
    );
    console.log("Server response:", response.data);
  } catch (error) {
    console.error("Error:", error);
  }
}

function toggleCourtSave(event, court, infoWindowSave) {
  event.preventDefault();

  infoWindowSave.disabled = true;

  const iconElement = infoWindowSave.querySelector("i");

  if (iconElement.classList.contains("fa-solid")) {
    removeCourt(court);
    infoWindowSave.innerHTML = "<i class='fa-regular fa-heart'></i>";
  } else {
    saveCourt(court);
    infoWindowSave.innerHTML = "<i class='fa-solid fa-heart'></i>";
  }

  setTimeout(() => {
    infoWindowSave.disabled = false;
  }, 250);
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
        infoWindowSave.ariaLabel = "Save Court";
        infoWindowSave.classList.add("info-window-save-btn");

        const isSaved = savedCourts.some(
          (savedCourt) => savedCourt.google_maps_place_id === court.id
        );
        if (isSaved) {
          infoWindowSave.innerHTML = "<i class='fa-solid fa-heart'></i>";
        } else {
          infoWindowSave.innerHTML = "<i class='fa-regular fa-heart'></i>";
        }

        infoWindowSave.addEventListener("click", (event) =>
          toggleCourtSave(event, court, infoWindowSave)
        );

        infoWindowContent.append(
          infoWindowAddress,
          infoWindowMapsLink,
          infoWindowSave
        );
        infoWindow.close();

        const headerDiv = document.createElement("div");
        headerDiv.classList.add("info-window-header", "text-center");
        headerDiv.innerText = court.displayName;

        infoWindow.setHeaderContent(headerDiv);
        infoWindow.setContent(infoWindowContent);
        infoWindow.open(marker.map, marker);
      });
      markers.push(marker);
    });
    map.fitBounds(bounds);
    return places.length;
  } else {
    console.log("No Results");
  }
}

initMap();
