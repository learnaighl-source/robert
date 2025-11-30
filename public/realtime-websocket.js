<script>
(function() {
  const eventSource = new EventSource('/api/websocket');
  
  eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'userUpdate') {
      updateUserCheckbox(data.userName, data.checked);
    }
  };

  function updateUserCheckbox(userName, checked) {
    document.querySelectorAll('span.h-4').forEach(span => {
      const spanUserName = getUserNameFromSpan(span);
      if (spanUserName === userName) {
        const isCurrentlyChecked = span.querySelector('svg') !== null;
        
        if (checked !== isCurrentlyChecked) {
          if (checked) {
            if (!span.querySelector('svg')) {
              span.innerHTML = '<svg>...</svg>'; // Add your actual SVG
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

  console.log('Real-time WebSocket connection established');
})();
</script>