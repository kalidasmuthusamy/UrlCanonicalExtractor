document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('urlForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const sandboxSwitch = document.getElementById('sandboxSwitch');
    const addInputBtn = document.getElementById('addInputBtn');
    const urlInputsContainer = form.querySelector('.url-inputs');

    addInputBtn.addEventListener('click', function() {
        const newInputPair = document.createElement('div');
        newInputPair.className = 'input-result-pair mb-3';
        newInputPair.innerHTML = `
            <input type="url" class="form-control" name="url[]" placeholder="Enter URL">
            <div class="result-container"></div>
        `;
        urlInputsContainer.appendChild(newInputPair);
        
        // Update the new input if sandbox mode is enabled
        if (sandboxSwitch.checked) {
            const input = newInputPair.querySelector('input');
            input.value = input.value.replace('portfoliopilot.com', 'sandbox.portfoliopilot.com');
        }
    });

    // Function to update URLs based on sandbox setting
    function updateUrls(useSandbox) {
        const urlInputs = form.querySelectorAll('input[name="url[]"]');
        urlInputs.forEach(input => {
            if (useSandbox) {
                input.value = input.value.replace('portfoliopilot.com', 'sandbox.portfoliopilot.com');
            } else {
                input.value = input.value.replace('sandbox.portfoliopilot.com', 'portfoliopilot.com');
            }
        });
    }

    // Handle sandbox switch changes
    sandboxSwitch.addEventListener('change', function() {
        updateUrls(this.checked);
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Reset UI
        document.querySelectorAll('.result-container').forEach(container => {
            container.innerHTML = '';
        });
        loadingSpinner.classList.remove('d-none');

        const urlInputs = form.querySelectorAll('input[name="url[]"]');
        const urls = Array.from(urlInputs)
            .map(input => input.value.trim())
            .filter(url => url !== ''); // Filter out empty URLs

        if (urls.length === 0) {
            alert('Please enter at least one URL');
            loadingSpinner.classList.add('d-none');
            return;
        }

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const inputElement = urlInputs[i]; // Get the corresponding input element
            const resultContainer = inputElement.nextElementSibling; // Get the next sibling as the result container

            const formData = new FormData();
            formData.append('url', url);

            try {
                const response = await fetch('/get-preview', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                // Update the result container with the response
                resultContainer.innerHTML = `
                    <div class="card bg-dark border-secondary mb-3">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">URL ${i + 1}: ${url}</h6>
                            ${response.ok && data.canonical_data ? `
                                <div class="mb-3">
                                    <label class="text-muted mb-2">Canonical URL:</label>
                                    <p class="canonical-url mb-3">${data.canonical_data.canonical_url}</p>
                                </div>
                                <div>
                                    <label class="text-muted mb-2">HTML Tag:</label>
                                    <pre class="tag-html p-3 rounded bg-black border border-secondary">${data.canonical_data.tag_html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                                </div>
                            ` : `
                                <p class="text-danger">
                                    ${data?.error || 'Failed to process URL'}
                                </p>
                            `}
                        </div>
                    </div>
                `;
            } catch (error) {
                resultContainer.innerHTML = `
                    <div class="card bg-dark border-secondary mb-3">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">URL ${i + 1}: ${url}</h6>
                            <p class="text-danger">Error: ${error.message}</p>
                        </div>
                    </div>
                `;
            }
        }

        loadingSpinner.classList.add('d-none');
    });
});