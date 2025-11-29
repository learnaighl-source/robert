<script>
(function() {
    console.log('GHL Script loaded and running');
    
    document.addEventListener('click', (e) => {
        console.log('Click detected on:', e.target);
        
        const button = e.target.closest('button');
        if (!button) {
            console.log('No button found');
            return;
        }
        
        console.log('Button found:', button);
        
        const checkbox = button.querySelector('span.h-4.w-4');
        const nameSpan = button.querySelector('span[title]');
        
        console.log('Checkbox:', checkbox);
        console.log('NameSpan:', nameSpan);
        
        if (checkbox && nameSpan) {
            e.preventDefault();
            e.stopPropagation();
            
            const isChecked = checkbox.querySelector('svg');
            const name = nameSpan.getAttribute('title');
            
            console.log('User interaction detected:', { name, isChecked: !!isChecked });
            
            if (isChecked) {
                checkbox.innerHTML = '';
                checkbox.style.border = '1.5px solid rgba(0, 0, 0, 0.5)';
                checkbox.style.backgroundColor = '';
                console.log(`Unchecked: ${name}`);
                
                // API call for unchecked
                fetch('http://localhost:3000/api/user-selection', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        checked: false
                    })
                })
                .then(response => {
                    console.log('API Response (unchecked):', response.status);
                    return response.json();
                })
                .then(data => console.log('API Data (unchecked):', data))
                .catch(err => console.error('API Error (unchecked):', err));
                
            } else {
                checkbox.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true" style="color: rgb(0, 78, 235);"><path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"></path></svg>`;
                checkbox.style.border = '1.5px solid rgb(0, 78, 235)';
                checkbox.style.backgroundColor = 'rgba(0, 78, 235, 0.098)';
                console.log(`Checked: ${name}`);
                
                // API call for checked
                fetch('http://localhost:3000/api/user-selection', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        checked: true
                    })
                })
                .then(response => {
                    console.log('API Response (checked):', response.status);
                    return response.json();
                })
                .then(data => console.log('API Data (checked):', data))
                .catch(err => console.error('API Error (checked):', err));
            }
        } else {
            console.log('Checkbox or nameSpan not found');
        }
    })
})()
</script>
