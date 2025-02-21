document.addEventListener('DOMContentLoaded', function() {
    function createLoadingIndicator(url, index) {
        return `
            <div class="card bg-dark border-secondary mb-3">
                <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-muted">URL ${index + 1}: ${url}</h6>
                    <div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm text-secondary me-2" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span class="text-muted">Processing...</span>
                    </div>
                </div>
            </div>
        `;
    }

    function createResultCard(url, index, response, data) {
        if (!response.ok) {
            return `
                <div class="card bg-dark border-danger border-3 mb-3">
                    <div class="card-body">
                        <p class="text-danger mb-0">${url}</p>
                        <p class="text-danger mb-0">Error: ${data.error || 'Failed to fetch URL'}</p>
                    </div>
                </div>
            `;
        }

        const canonicalUrl = data.canonical_data?.canonical_url;
        const normalizeUrl = (url) => url.replace(/\/$/, '')
                                        .replace('sandbox.portfoliopilot.com', 'portfoliopilot.com');
        const isMatched = canonicalUrl && (normalizeUrl(canonicalUrl) === normalizeUrl(url));
        const borderClass = isMatched ? 'border-success' : 'border-danger';

        return `
            <div class="card bg-dark ${borderClass} border-3 mb-3">
                <div class="card-body">
                    <div class="mb-1">
                        <div class="d-flex gap-3">
                            <div class="text-light small">URL: ${url}</div>
                            ${canonicalUrl ? `<div class="text-light small">→ ${canonicalUrl}</div>` : 
                                             '<div class="text-warning small">No canonical URL found</div>'}
                        </div>
                    </div>
                    ${(data.title || data.description) ? `
                        <div class="ps-2 border-start border-secondary">
                            ${data.title ? `<div class="text-muted">${data.title}</div>` : ''}
                            ${data.description ? `<div class="text-muted">${data.description}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function createErrorCard(url, index, error) {
        return `
            <div class="card bg-dark border-secondary mb-3">
                <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-muted">URL ${index + 1}: ${url}</h6>
                    <p class="text-danger">Error: ${error.message}</p>
                </div>
            </div>
        `;
    }

    async function processUrl(url, index, resultDiv) {
        try {
            const formData = new FormData();
            formData.append('url', url);
            
            const response = await fetch('/get-preview', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            resultDiv.innerHTML = createResultCard(url, index, response, data);
        } catch (error) {
            resultDiv.innerHTML = createErrorCard(url, index, error);
        }
    }
    const form = document.getElementById('urlForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const sandboxSwitch = document.getElementById('sandboxSwitch');
    const urlTextarea = document.getElementById('urlTextarea');
    const resultsContainer = document.getElementById('results-container');

    function clearAllResults() {
        resultsContainer.innerHTML = '';
    }

    function updateUrls(useSandbox) {
        const urls = urlTextarea.value.split('\n');
        const updatedUrls = urls.map(url => {
            if (useSandbox) {
                return url.replace('portfoliopilot.com', 'sandbox.portfoliopilot.com');
            } else {
                return url.replace('sandbox.portfoliopilot.com', 'portfoliopilot.com');
            }
        });
        urlTextarea.value = updatedUrls.join('\n');
        // Clear results when URLs are updated
        clearAllResults();
    }

    sandboxSwitch.addEventListener('change', function() {
        updateUrls(this.checked);
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllResults();

        const urls = urlTextarea.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url !== '');

        if (urls.length === 0) {
            alert('Please enter at least one URL');
            return;
        }

        // Create result containers with loading indicators for all URLs
        urls.forEach((url, index) => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-container mb-3';
            resultDiv.innerHTML = createLoadingIndicator(url, index);
            resultsContainer.appendChild(resultDiv);
        });

        // Process all URLs in parallel
        const resultDivs = document.querySelectorAll('.result-container');
        const promises = urls.map((url, index) => 
            processUrl(url, index, resultDivs[index])
        );

        // Wait for all requests to complete (but results will show as they arrive)
        await Promise.allSettled(promises);
    });
});