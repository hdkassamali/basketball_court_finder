function fadeOutAlert(alertElement, delay = 3000) {
  setTimeout(() => {
    const fadeInterval = setInterval(() => {
      if (!alertElement.style.opacity) {
        alertElement.style.opacity = 0.7;
      }
      if (alertElement.style.opacity > 0) {
        alertElement.style.opacity -= 0.05;
      } else {
        clearInterval(fadeInterval);
        alertElement.remove();
      }
    }, 50);
  }, delay);
}

function showError(message, type = "danger") {
  const container = document.getElementById("flash_container");
  if (!container) return;

  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = "alert";
  alertDiv.innerHTML = `${message}`;
  container.appendChild(alertDiv);

  fadeOutAlert(alertDiv);
}

document.addEventListener("DOMContentLoaded", function () {
    let alerts = document.querySelectorAll(".alert");
    alerts.forEach((alert) => {
        fadeOutAlert(alert);
    });
});
