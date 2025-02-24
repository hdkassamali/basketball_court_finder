/**
 * Async function called by removeCourtUi function. Takes in a courtId and makes a Flask API request to remove the court from the database.
 *
 * @param {number} courtId - the id of the court to remove from the database.
 * @returns {Promise<void>}
 */
async function removeCourtData(courtId) {
  const data = {
    court_id: courtId,
  };

  try {
    const response = await axios.post("/remove_court", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    showError("Error removing court. Please try again!");
  }
}

/**
 * Runs when a star rating is clicked. Takes in a courtId and rating and makes a Flask API request to update the court's rating in the database.
 *
 * @param {number} courtId - the id of the court to update the rating in the database.
 * @param {number} rating - the rating the user selected to add to the court.
 * @returns {Promise<void>}
 */
async function updateCourtRating(courtId, rating) {
  const data = {
    court_id: courtId,
    rating: rating,
  };

  try {
    const response = await axios.post("/update_court_rating", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    showError("Error updating rating. Please try again!");
  }
}

/**
 * Updates the star rating UI for a given court container based on the clicked star.
 *
 * @param {HTMLElement} star - The star element that was clicked.
 * @returns {{courtId: string, rating: number}} An object containing the courtId and the parsed rating.
 */
function updateStarUi(star) {
  const rating = parseInt(star.dataset.starValue, 10);

  const courtContainer = star.closest(".court-container");
  const courtId = courtContainer.dataset.courtId;

  const stars = courtContainer.querySelectorAll(".court-rating-icon");
  stars.forEach((s) => {
    const starValue = parseInt(s.dataset.starValue, 10);
    if (starValue <= rating) {
      s.classList.remove("fa-regular");
      s.classList.add("fa-solid");
    } else {
      s.classList.remove("fa-solid");
      s.classList.add("fa-regular");
    }
  });
  return { courtId, rating };
}

/**
 * Async function that runs when the remove button is clicked. Removes the Court container from the UI and calls removeCourtData function.
 *
 * @param {Event} event - The click event triggered on the remove button.
 * @param {HTMLElement} removeButton - The trash button in the court container.
 * @returns {Promise<void>}
 */
async function removeCourtUi(event, removeButton) {
  event.preventDefault();
  const courtContainer = removeButton.closest(".court-container");
  const courtId = courtContainer.dataset.courtId;
  try {
    await removeCourtData(courtId);
    courtContainer.remove();
  } catch (e) {
    showError("Error deleting court! Please try again");
  }
}

const removeButtons = document.querySelectorAll(".remove-court-btn");
for (const removeButton of removeButtons) {
  removeButton.addEventListener("click", async (event) => {
    removeCourtUi(event, removeButton);
  });
}

const starButtons = document.querySelectorAll(".court-rating-icon");
for (const star of starButtons) {
  star.addEventListener("click", (event) => {
    event.preventDefault();
    const { courtId, rating } = updateStarUi(star);
    updateCourtRating(courtId, rating);
  });
}
