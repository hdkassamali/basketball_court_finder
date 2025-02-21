async function removeCourt(courtId) {
  const data = {
    court_id: courtId,
  };

  try {
    const response = await axios.post("/remove_court", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Server response:", response.data);
  } catch (error) {
    // TODO: Update this to show user an error message 
    console.error("Error:", error);
  }
}

const removeButtons = document.querySelectorAll(".remove-court-btn");
for (const btn of removeButtons) {
  btn.addEventListener("click", async (event) => {
    event.preventDefault();
    const courtContainer = btn.closest(".court-container");
    const courtId = courtContainer.dataset.courtId;
    try {
      await removeCourt(courtId);
      courtContainer.remove();
    } catch (error) {
      // TODO: Update this to show user an error message
      console.error("Error deleting court:", error);
    }
  });
}

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
    console.log("Rating update response:", response.data);
  } catch (error) {
    // TODO: Update this to show user an error message
    console.error("Error updating rating:", error);
  }
}

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

const starButtons = document.querySelectorAll(".court-rating-icon");
for (const star of starButtons) {
  star.addEventListener("click", (event) => {
    event.preventDefault();
    const { courtId, rating } = updateStarUi(star);
    updateCourtRating(courtId, rating);
  });
}
