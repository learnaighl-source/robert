<script>
(function() {
  let userStates = {};

  // Fetch current user states from database
  async function loadUserStates() {
    try {
      const response = await fetch('/api/get-users');
      const data = await response.json();
      if (data.users) {
        userStates = {};
        data.users.forEach(user => {
          userStates[user.name] = user.checked;
        });
        updateUI();
      }
    } catch (error) {
      console.error('Failed to load user states:', error);
    }
  }

  // Update UI based on current user states
  function updateUI() {
    document.querySelectorAll('span.h-4').forEach(span => {
      const userName = getUserNameFromSpan(span);
      if (userName && userStates.hasOwnProperty(userName)) {
        const shouldBeChecked = userStates[userName];
        const isCurrentlyChecked = span.querySelector('svg') !== null;
        
        if (shouldBeChecked !== isCurrentlyChecked) {
          // Update the checkbox visual state
          if (shouldBeChecked) {
            if (!span.querySelector('svg')) {
              span.innerHTML = '<svg>...</svg>'; // Add your actual SVG here
            }
          } else {
            const svg = span.querySelector('svg');
            if (svg) svg.remove();
          }
        }
      }
    });
  }

  function getUserNameFromSpan(span) {
    const parent = span.parentElement;
    if (!parent) return null;
    const titleSpan = parent.querySelector('span[title]');
    if (titleSpan) return titleSpan.innerText.trim();
    const next = parent.querySelector('span.text-left') || parent.querySelector('span:not(.h-4)');
    return next ? next.innerText.trim() : null;
  }

  // Load initial states
  loadUserStates();

  // Refresh every 5 seconds to sync with database
  setInterval(loadUserStates, 5000);

  console.log('Real-time UI sync initialized');
})();
</script>