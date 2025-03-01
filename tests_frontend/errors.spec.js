describe("Error functions", () => {
  let flashContainer;

  beforeEach(() => {
    // Dummy container to create in the DOM to test alerts
    flashContainer = document.createElement("div");
    flashContainer.id = "flash_container";
    document.body.appendChild(flashContainer);
  });

  afterEach(() => {
    // Remove the dummy container
    document.body.removeChild(flashContainer);
  });

  it("should append an alert element when showError is called", () => {
    showError("Test error", "danger", 100);
    const alert = flashContainer.querySelector(".alert");
    expect(alert).not.toBeNull();
    expect(alert.innerHTML).toContain("Test error");
  });

  it("should eventually remove the alert element after fading out", (done) => {
    // Dummy alert element
    const alertElement = document.createElement("div");
    // alertElement.style.opacity = "1";
    flashContainer.appendChild(alertElement);

    fadeOutAlert(alertElement, 100);

    // Wait until fadeOutAlert removes the element
    setTimeout(() => {
      expect(flashContainer.contains(alertElement)).toBe(false);
      done();
    }, 1000);
  });
});


// TRY AND SEE IF I CAN SEE IN BROWSER IF NOT THAN MIGHT NEED ANOTHER CDN.
