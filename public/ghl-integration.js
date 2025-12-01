// Updated GHL integration script with improved reliability
(function () {
  let eventSource = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  // Get username from span element
  function getUserNameFromSpan(span) {
    const parent = span.parentElement;
    if (!parent) return null;

    const titleSpan = parent.querySelector("span[title]");
    if (titleSpan) return titleSpan.innerText.trim();

    const textSpan =
      parent.querySelector("span.text-left") ||
      parent.querySelector("span:not(.h-4)");
    return textSpan ? textSpan.innerText.trim() : null;
  }

  // Handle checkbox state changes
  function handleStateChange(span, newState) {
    const userName = getUserNameFromSpan(span) || "unknown";
    console.log("Checkbox changed:", { userName, checked: newState });

    // Send update to Next.js API
    fetch("https://robert-ruby.vercel.app/api/update-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName, checked: newState }),
    }).catch((error) => {
      console.error("Failed to update user:", error);
      // Retry after 2 seconds
      setTimeout(() => {
        fetch("https://robert-ruby.vercel.app/api/update-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userName, checked: newState }),
        });
      }, 2000);
    });
  }

  // Connect to SSE with retry logic
  function connectSSE() {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource(
      "https://robert-ruby.vercel.app/api/websocket"
    );

    eventSource.onopen = function () {
      console.log("SSE connected to Next.js");
      reconnectAttempts = 0;
    };

    eventSource.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "userUpdate") {
          updateUserCheckbox(data.userName, data.checked);
        }
      } catch (error) {
        console.error("SSE message error:", error);
      }
    };

    eventSource.onerror = function (error) {
      console.error("SSE error:", error);
      eventSource.close();

      // Retry connection with exponential backoff
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts) * 1000;
        setTimeout(connectSSE, delay);
        reconnectAttempts++;
      }
    };
  }

  // Update checkbox based on SSE data
  function updateUserCheckbox(userName, checked) {
    document.querySelectorAll("span.h-4").forEach((span) => {
      const spanUserName = getUserNameFromSpan(span);
      if (spanUserName === userName) {
        const isCurrentlyChecked = span.querySelector("svg") !== null;

        if (checked !== isCurrentlyChecked) {
          // Force DOM update
          if (checked && !isCurrentlyChecked) {
            // Add checkmark if not present
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg"
            );
            svg.setAttribute("class", "h-3 w-3");
            svg.innerHTML =
              '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6-6M7 7l6-6M7 7l-6 6"/>';
            span.appendChild(svg);
          } else if (!checked && isCurrentlyChecked) {
            // Remove checkmark if present
            const svg = span.querySelector("svg");
            if (svg) svg.remove();
          }
        }
      }
    });
  }

  // Attach observer to checkbox span
  function attachObserverToSpan(span) {
    if (!span || span.__checkboxObserverAttached) return;
    span.__checkboxObserverAttached = true;

    // Store initial state
    span.dataset.__checked = span.querySelector("svg") ? "1" : "0";

    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const hasSvg = span.querySelector("svg") !== null;
          const prevState = span.dataset.__checked === "1";

          if (hasSvg !== prevState) {
            span.dataset.__checked = hasSvg ? "1" : "0";
            handleStateChange(span, hasSvg);
          }
        }
      }
    });

    observer.observe(span, { childList: true, subtree: false });
    span.__checkboxMO = observer;
  }

  // Attach to all existing checkboxes
  function attachToAllExisting() {
    const spans = document.querySelectorAll("span.h-4");
    spans.forEach(attachObserverToSpan);
  }

  // Watch for new checkboxes
  const containerObserver = new MutationObserver(function (mutations) {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;

      mutation.addedNodes.forEach((node) => {
        if (!node || node.nodeType !== 1) return;

        if (node.matches && node.matches("span.h-4")) {
          attachObserverToSpan(node);
        }

        const innerSpans =
          node.querySelectorAll && node.querySelectorAll("span.h-4");
        if (innerSpans && innerSpans.length) {
          innerSpans.forEach(attachObserverToSpan);
        }
      });
    }
  });

  // Initialize
  attachToAllExisting();
  containerObserver.observe(document.body, { childList: true, subtree: true });
  connectSSE();

  // Cleanup function
  window.__cleanupGHLIntegration = function () {
    document.querySelectorAll("span.h-4").forEach((span) => {
      if (span.__checkboxMO) {
        span.__checkboxMO.disconnect();
        delete span.__checkboxMO;
        delete span.__checkboxObserverAttached;
      }
    });

    containerObserver.disconnect();

    if (eventSource) {
      eventSource.close();
    }

    console.log("GHL integration cleaned up");
  };

  console.log("GHL integration initialized with improved reliability");
})();
