document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('urlForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('results');
    const resultsContainer = document.getElementById('resultsContainer');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Reset UI
        resultsSection.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';

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
            const resultCard = document.createElement('div');
            resultCard.className = 'card bg-dark border-secondary mb-3';
            resultsContainer.appendChild(resultCard);

            const formData = new FormData();
            formData.append('url', url);


            try {
                const response = await fetch('/get-preview', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                // Update the result card with the response
                resultCard.innerHTML = `
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
                `;
            } catch (error) {
                resultCard.innerHTML = `
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">URL ${i + 1}: ${url}</h6>
                        <p class="text-danger">Error: ${error.message}</p>
                    </div>
                `;
            }
        }

        resultsSection.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
    });
});