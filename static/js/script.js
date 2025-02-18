
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

        try {
            const results = await Promise.all(urls.map(async (url) => {
                const formData = new FormData();
                formData.append('url', url);

                try {
                    const response = await fetch('/get-preview', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    return {
                        url,
                        success: response.ok,
                        data
                    };
                } catch (error) {
                    return {
                        url,
                        success: false,
                        error: error.message
                    };
                }
            }));

            // Display results
            results.forEach((result) => {
                const resultCard = document.createElement('div');
                resultCard.className = 'card bg-dark border-secondary mb-3';
                
                let cardContent = `
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">Source URL: ${result.url}</h6>
                `;

                if (result.success && result.data.canonical_data) {
                    cardContent += `
                        <div class="mb-3">
                            <label class="text-muted mb-2">Canonical URL:</label>
                            <p class="canonical-url mb-3">${result.data.canonical_data.canonical_url}</p>
                        </div>
                        <div>
                            <label class="text-muted mb-2">HTML Tag:</label>
                            <pre class="tag-html p-3 rounded bg-black border border-secondary">${result.data.canonical_data.tag_html}</pre>
                        </div>
                    `;
                } else {
                    cardContent += `
                        <p class="text-danger">
                            ${result.data?.error || 'Failed to process URL'}
                        </p>
                    `;
                }

                cardContent += '</div>';
                resultCard.innerHTML = cardContent;
                resultsContainer.appendChild(resultCard);
            });

            resultsSection.classList.remove('d-none');
        } catch (error) {
            alert('An error occurred while processing the URLs');
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    });
});
