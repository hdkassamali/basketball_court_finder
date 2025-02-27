// Disclaimer Modal Click Functionality
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

// Initialize global variables and saved court mapping.
let map;
let infoWindow;
let markers = [];
const savedCourtMapping = {};
savedCourts.forEach((sc) => {
  savedCourtMapping[sc.google_maps_place_id] = sc.id;
});

/**
 * Initializes the Google Map and its UI components.
 *
 * This asynchronous function imports the necessary map libraries, creates a map centered
 * on the United States with a hybrid map type, sets up an info window shared among markers,
 * and initializes the search bar.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the map is fully initialized.
 */
async function initMap() {
  const center = { lat: 39.8283, lng: -98.5795 };

  try {
    const { Map, InfoWindow } = await google.maps.importLibrary("maps");
    map = new Map(document.getElementById("map"), {
      zoom: 4,
      center,
      mapId: "c2c7ec2d8b2c125e",
      mapTypeId: "hybrid",
    });

    infoWindow = new InfoWindow();
    initSearchBar();
  } catch (error) {
    showError(
      "Daily request limit for Google Maps API reached. Sorry for the inconvenience! Please try again tomorrow. (READ THE DISCLAIMER AT THE BOTTOM).",
      "warning",
      7000
    );
  }
}

/**
 * Displayes a feedback message to user within the specified search area.
 *
 * @param {HTMLElement} searchArea - The container element where the feedback should be displayed.
 * @param {string} message - The feedback message to display
 * @param {string} [type="error"] - The type of message (e.g., "error" or "info") that influences styling.
 * @param {number} [delay="3000"] - The length of time a message stays on the screen.
 */
function displaySearchFeedback(searchArea, message, type = "error", delay = 3000) {
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
    }, delay);
  }
}

/**
 * Performs a geocoding search based on user input and displays search feedback.
 *
 * This function retrieves the search term from the input element, uses the Geocoder to get location details, and then calls FindCourts to locate basketball courts near the search location.
 *
 * @async
 * @param {object} Geocoder - The geocoding module imported from Google Maps.
 * @param {HTMLElement} searchArea - The container where search feedback messages will be displayed.
 * @param {HTMLInputElement} searchInput - The input element containing the search term.
 * @returns {Promise<void>}
 */
async function performSearch(Geocoder, searchArea, searchInput) {
  const inputValue = searchInput.value.trim();
  if (inputValue.length < 1) {
    displaySearchFeedback(searchArea, "Please enter a search term.");
    return;
  }

  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: inputValue }, async (results, status) => {
    if (status === "OK") {
      const searchPlace = results[0].geometry.location;
      const amountOfCourts = await findCourts(searchPlace);
      displaySearchFeedback(
        searchArea,
        `Showing ${amountOfCourts} results near: ${results[0].formatted_address}`,
        "info"
      );
    } else if (status === "ZERO_RESULTS") {
      displaySearchFeedback(
        searchArea,
        "No results found. Please check the address and try again."
      );
    } else if (status === "OVER_QUERY_LIMIT") {
      displaySearchFeedback(
        searchArea,
        "Daily request limit for Google Maps API reached. Sorry for the inconvenience! Please try again tomorrow. (READ THE DISCLAIMER AT THE BOTTOM).",
        "error",
        7000
      );
    } else {
      displaySearchFeedback(
        searchArea,
        "Something went wrong, please try again!"
      );
    }
  });
  searchInput.value = "";
}

/**
 * Initializes the search bar functionality by importing the Geocoder library
 * and setting up the event listener on the search button.
 *
 * @async
 * @returns {Promise<void>}
 */
async function initSearchBar() {
  const { Geocoder } = await google.maps.importLibrary("geocoding");
  const searchArea = document.getElementById("search-area");
  const searchInput = document.getElementById("search-bar-input");
  const searchButton = document.getElementById("search-bar-btn");

  searchButton.addEventListener("click", () => {
    performSearch(Geocoder, searchArea, searchInput);
  });
}

function clearMarkers() {
  markers.forEach((marker) => {
    try {
      marker.map = null;
      if (marker.setMap) marker.setMap(null);
      if (marker.unbindAll) marker.unbindAll();
    } catch (e) {
      showError("Error removing marker!");
    }
  });
  markers = [];
}

/**
 * Saves the provided court data to the server and updates local savedCourts data.
 *
 * @async
 * @param {object} court - The court object containing details like displayName, id, formattedAddress, and googleMapsURI.
 * @returns {Promise<void>}
 */
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

    const newCourtId = response.data.id;
    savedCourts.push({
      google_maps_place_id: court.id,
      id: newCourtId,
    });
    savedCourtMapping[court.id] = newCourtId;
  } catch (e) {
    showError("An error occurred while saving the court. Please try again.");
  }
}

/**
 * Removes a saved court from the server and updates local savedCourts data.
 *
 * @async
 * @param {object} court - The court object representing the court to remove.
 * @returns {Promise<void>}
 */
async function removeCourt(court) {
  const savedCourtId = savedCourtMapping[court.id];
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
  } catch (e) {
    showError("An error occurred while removing the court. Please try again.");
  }
}

/**
 * Toggles the saved state of a court.
 *
 * Updates the UI and calls saveCourt or removeCourt based on the current state.
 *
 * @param {Event} event - The click event triggered on the save button.
 * @param {object} court - The court object.
 * @param {HTMLElement} infoWindowSave - The button element in the info window.
 */
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

/**
 * Creates and displays an info window for a marker. Adds click event to infoWindowSave button.
 *
 * @param {object} court - The court object containing display information.
 * @param {object} marker - The marker on which to display the info window.
 */
function createMarkerInfoWindow(court, marker) {
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
}

/**
 * Creates a custom pin element for markers.
 *
 * @param {Function} PinElement - The google maps constructor for creating a pin element.
 * @returns {object} The created pin element.
 */
function createPinElement(PinElement) {
  const pin = new PinElement({
    glyph: "🏀",
    background: "white",
    borderColor: "black",
    scale: 1.5,
  });
  return pin;
}

/**
 * Creates a marker element for a given court.
 *
 * @param {object} court - The court object with location and display details.
 * @param {number} index - The index of the court in the results.
 * @param {Function} AdvancedMarkerElement - The google maps constructor for creating an advanced marker element.
 * @param {object} pin - The pin element to use as the marker's content.
 * @returns {object} - The created marker element.
 */
function createMarkerElement(court, index, AdvancedMarkerElement, pin) {
  const marker = new AdvancedMarkerElement({
    map,
    position: court.location,
    title: `${index + 1}. ${court.displayName}`,
    content: pin.element,
    gmpClickable: true,
  });
  return marker;
}

/**
 * Searches for basketball courts near a given location, creates markers for each result,
 * and adjusts the map view.
 *
 * @async
 * @param {object} searchPlace - The location to search around.
 * @returns {Promise<number|undefined>} A promise that resolves to the number of courts found,
 *                                      or undefined if no results.
 */
async function findCourts(searchPlace) {
  // Empty markers from previous search;
  clearMarkers();

  const { Place } = await google.maps.importLibrary("places");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker"
  );

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

  let places;
  try {
    const result = await Place.searchByText(requestCourts);
    places = result.places;
  } catch (error) {
    const errorStr = error.toString();
    if (errorStr.includes("RESOURCE_EXHAUSTED")) {
      showError(
        "The daily request limit for Google Maps API may have been reached. Sorry for the inconvenience! Please try again tomorrow. (READ THE DISCLAIMER AT THE BOTTOM).",
        "warning",
        7000
      );
    } else {
      showError(
        "Something went wrong with the Google Maps API. Please try again!",
        "warning",
        7000
      );
    }
    return;
  }

  if (places && places.length) {
    const { LatLngBounds } = await google.maps.importLibrary("core");
    const bounds = new LatLngBounds();

    places.forEach((court, index) => {
      const pin = createPinElement(PinElement);
      const marker = createMarkerElement(court, index, AdvancedMarkerElement, pin);

      bounds.extend(court.location);

      marker.addListener("gmp-click", () => {
        createMarkerInfoWindow(court, marker);
      });
      markers.push(marker);
    });
    map.fitBounds(bounds);
    return places.length;
  } else {
    showError("No results! Please try again.", "warning");
  }
}

initMap();