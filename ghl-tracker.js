// GHL Calendar User Tracker
// This script tracks checkbox changes and sends updates to your API

(function () {
  let isTracking = false;

  function trackUserChanges() {
    if (isTracking) return;
    isTracking = true;

    // Find all user checkboxes in GHL calendar
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", async function (e) {
        const userName = getUserNameFromCheckbox(e.target);
        const isChecked = e.target.checked;

        if (userName) {
          console.log(
            `User ${userName} ${isChecked ? "checked" : "unchecked"}`
          );

          try {
            await fetch("YOUR_NEXTJS_DOMAIN/api/user-selection", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: userName,
                checked: isChecked,
              }),
            });
          } catch (error) {
            console.error("Failed to sync user selection:", error);
          }
        }
      });
    });
  }

  function getUserNameFromCheckbox(checkbox) {
    // Adjust this selector based on GHL's HTML structure
    const userElement =
      checkbox.closest(".user-item") || checkbox.parentElement;
    const nameElement =
      userElement?.querySelector(".user-name") ||
      userElement?.querySelector("label");
    return nameElement?.textContent?.trim();
  }

  // Start tracking when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackUserChanges);
  } else {
    trackUserChanges();
  }

  // Re-track if new elements are added dynamically
  const observer = new MutationObserver(() => {
    isTracking = false;
    trackUserChanges();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
