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
    console.error("Error:", error);
  }
}

const removeButtons = document.querySelectorAll(".remove-court-btn");
for (const btn of removeButtons) {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const courtContainer = btn.closest(".court-container")
    const courtId = courtContainer.dataset.courtId;
    courtContainer.remove()
    // console.log(courtId)
    removeCourt(courtId);
  });
}
