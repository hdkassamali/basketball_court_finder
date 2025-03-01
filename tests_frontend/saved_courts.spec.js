describe("Saved Courts Functions", () => {
  let axiosPostSpy;
  let showErrorSpy;

  beforeEach(() => {
    // Mock axios.post to prevent actual HTTP requests
    axiosPostSpy = spyOn(axios, "post").and.returnValue(Promise.resolve({}));

    // Mock showError function to prevent actual UI updates
    showErrorSpy = spyOn(window, "showError").and.callThrough();
  });

  describe("removeCourtData", () => {
    it("should call axios.post with correct data", async () => {
      const courtId = 1;
      const data = { court_id: courtId };

      await removeCourtData(courtId);

      expect(axiosPostSpy).toHaveBeenCalledWith("/remove_court", data, {
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should call showError when axios.post fails", async () => {
      axiosPostSpy.and.returnValue(Promise.reject(new Error("Request failed")));

      await removeCourtData(1);

      expect(showErrorSpy).toHaveBeenCalledWith(
        "Error removing court. Please try again!"
      );
    });
  });

  describe("updateCourtRating", () => {
    it("should call axios.post with correct data", async () => {
      const courtId = 1;
      const rating = 4;
      const data = { court_id: courtId, rating: rating };

      await updateCourtRating(courtId, rating);

      expect(axiosPostSpy).toHaveBeenCalledWith("/update_court_rating", data, {
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should call showError when axios.post fails", async () => {
      axiosPostSpy.and.returnValue(Promise.reject(new Error("Request failed")));

      await updateCourtRating(1, 4);

      expect(showErrorSpy).toHaveBeenCalledWith(
        "Error updating rating. Please try again!"
      );
    });
  });

  describe("updateStarUi", () => {
    it("should update the star UI based on the clicked star", () => {
      const courtContainer = document.createElement("div");
      courtContainer.classList.add("court-container");
      courtContainer.dataset.courtId = "1";

      const stars = [
        document.createElement("i"),
        document.createElement("i"),
        document.createElement("i"),
      ];
      stars.forEach((star, index) => {
        star.classList.add("court-rating-icon");
        star.dataset.starValue = (index + 1).toString();
        courtContainer.appendChild(star);
      });

      document.body.appendChild(courtContainer);

      const clickedStar = stars[1];
      const { courtId, rating } = updateStarUi(clickedStar);

      expect(courtId).toBe("1");
      expect(rating).toBe(2);

      stars.forEach((star, index) => {
        if (index <= 1) {
          expect(star.classList.contains("fa-solid")).toBeTrue();
        } else {
          expect(star.classList.contains("fa-regular")).toBeTrue();
        }
      });

      document.body.removeChild(courtContainer);
    });
  });

  describe("removeCourtUi", () => {
    it("should call removeCourtData and remove the court container", async () => {
      const courtContainer = document.createElement("div");
      courtContainer.classList.add("court-container");
      courtContainer.dataset.courtId = "1";

      const removeButton = document.createElement("button");
      removeButton.classList.add("remove-court-btn");
      courtContainer.appendChild(removeButton);

      document.body.appendChild(courtContainer);

      spyOn(courtContainer, "remove").and.callThrough();

      await removeCourtUi({ preventDefault: () => {} }, removeButton);

      expect(axiosPostSpy).toHaveBeenCalledWith(
        "/remove_court",
        { court_id: "1" },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      expect(courtContainer.remove).toHaveBeenCalled();
    });

    it("should call showError when removeCourtData fails", async () => {
      const courtId = "1";
      axiosPostSpy.and.returnValue(Promise.reject(new Error("Request failed")));

      const courtContainer = document.createElement("div");
      courtContainer.classList.add("court-container");
      courtContainer.dataset.courtId = courtId;

      const removeButton = document.createElement("button");
      removeButton.classList.add("remve-court-btn");
      courtContainer.appendChild(removeButton);

      document.body.appendChild(courtContainer);

      await removeCourtUi({ preventDefault: () => {} }, removeButton);

      expect(showErrorSpy).toHaveBeenCalledWith(
        "Error removing court. Please try again!"
      );
    });
  });
});
