// Your working GHL tracker script
(function () {
  document.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const checkbox = button.querySelector("span.h-4.w-4");
    const nameSpan = button.querySelector("span[title]");

    if (checkbox && nameSpan) {
      e.preventDefault();
      e.stopPropagation();

      const isChecked = checkbox.querySelector("svg");
      const name = nameSpan.getAttribute("title");

      if (isChecked) {
        checkbox.innerHTML = "";
        checkbox.style.border = "1.5px solid rgba(0, 0, 0, 0.5)";
        checkbox.style.backgroundColor = "";
        console.log(`Unchecked: ${name}`);

        fetch("https://robert-ruby.vercel.app/api/user-selection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, checked: false }),
        })
          .then((r) => console.log("API response:", r.status))
          .catch((e) => console.error("API error:", e));
      } else {
        checkbox.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true" style="color: rgb(0, 78, 235);"><path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"></path></svg>`;
        checkbox.style.border = "1.5px solid rgb(0, 78, 235)";
        checkbox.style.backgroundColor = "rgba(0, 78, 235, 0.098)";
        console.log(`Checked: ${name}`);

        fetch("https://robert-ruby.vercel.app/api/user-selection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, checked: true }),
        })
          .then((r) => console.log("API response:", r.status))
          .catch((e) => console.error("API error:", e));
      }
    }
  });
})();
