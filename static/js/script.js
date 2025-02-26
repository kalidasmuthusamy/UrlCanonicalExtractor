document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

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
        const normalizeUrl = (url) => {
            try {
                // Parse the URL to handle query params properly
                const urlObj = new URL(url);
                
                // Get base URL and path without trailing slash
                let normalized = (urlObj.origin + urlObj.pathname).replace(/\/$/, '');
                
                // Replace sandbox domain
                normalized = normalized.replace('sandbox.portfoliopilot.com', 'portfoliopilot.com');
                
                // Check if it's a security explorer URL
                if (normalized.includes('/explore/security-explorer/')) {
                    // Keep case for security explorer URLs
                    return normalized;
                } else {
                    // Make case insensitive for all other URLs
                    return normalized.toLowerCase();
                }
            } catch (e) {
                // If URL parsing fails, return original URL normalized
                console.warn('URL parsing failed:', e);
                return url.split('?')[0].replace(/\/$/, '').toLowerCase();
            }
        };
        const isMatched = canonicalUrl && (normalizeUrl(canonicalUrl) === normalizeUrl(url));
        const borderClass = isMatched ? 'border-success' : 'border-danger';

        return `
            <div class="card bg-dark ${borderClass} border-3 mb-3">
                <div class="card-body">
                    <div class="mb-1">
                        <div class="d-flex flex-column gap-2">
                            <div class="text-light small">URL: <a href="${url}" target="_blank" class="text-light url-link">${url}</a></div>
                            ${canonicalUrl ? 
                                `<div class="text-light small d-flex flex-column gap-1">
                                    <div class="d-flex align-items-center gap-2">
                                        <div>→ <a href="${canonicalUrl}" target="_blank" class="text-light url-link">${canonicalUrl}</a></div>
                                        ${isMatched ? 
                                            `<i class="bi bi-info-circle text-info" 
                                                data-bs-toggle="tooltip" 
                                                data-bs-placement="right" 
                                                title="URL matching: \n• Case-insensitive (except for security explorer URLs)\n• Ignores query parameters and hash fragments\n• Sandbox URLs are matched with production URLs"></i>` 
                                            : ''}
                                    </div>
                                    <pre class="small bg-dark text-info p-2 mb-0 rounded"><code>&lt;link rel="canonical" href="${canonicalUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}" /&gt;</code></pre>
                                </div>` : 
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
    const resultsTabs = document.getElementById('results-tabs');
    const productionResults = document.getElementById('production-results');
    const sandboxResults = document.getElementById('sandbox-results');
    const productionTab = document.getElementById('production-tab');
    const sandboxTab = document.getElementById('sandbox-tab');
    const downloadButton = document.getElementById('downloadButton');

    sandboxTab.classList.add('d-none');

    // Function to extract data from result cards
    function extractResultData() {
        const data = [];
        const prodCards = productionResults.querySelectorAll('.card');
        const sandboxCards = sandboxResults.querySelectorAll('.card');

        function extractFromCard(card, environment) {
            const urlElement = card.querySelector('.url-link');
            const canonicalElement = card.querySelector('.text-light.small .url-link');
            const titleElement = card.querySelector('.text-muted');
            const descriptionElement = card.querySelector('.text-muted:last-child');
            const isMismatch = card.classList.contains('border-danger');

            if (urlElement) {
                const row = {
                    Environment: environment,
                    URL: urlElement.href,
                    'Canonical URL': canonicalElement ? canonicalElement.href : 'Not found',
                    'Is Mismatch': isMismatch ? 'Yes' : 'No',
                    'Meta Title': titleElement ? titleElement.textContent.trim() : '',
                    'Meta Description': descriptionElement ? descriptionElement.textContent.trim() : ''
                };
                data.push(row);
            }
        }

        prodCards.forEach(card => extractFromCard(card, 'Production'));
        if (sandboxSwitch.checked) {
            sandboxCards.forEach(card => extractFromCard(card, 'Sandbox'));
        }

        return data;
    }

    // Function to convert data to CSV
    function convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    let cell = row[header] || '';
                    // Escape quotes and wrap in quotes if contains comma or newline
                    if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
                        cell = cell.replace(/"/g, '""');
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(',')
            )
        ];
        
        return csvRows.join('\n');
    }

    // Function to download CSV
    function downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Add click handler for download button
    downloadButton.addEventListener('click', function() {
        const data = extractResultData();
        const csv = convertToCSV(data);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadCSV(csv, `canonical-urls-${timestamp}.csv`);
    });

    function clearAllResults() {
        productionResults.innerHTML = '';
        sandboxResults.innerHTML = '';
        resultsTabs.classList.add('d-none');
        downloadButton.classList.add('d-none');
    }

    function getUrlsForEnvironment(urls, isSandbox) {
        return urls.map(url => {
            if (isSandbox) {
                return url.replace('portfoliopilot.com', 'sandbox.portfoliopilot.com');
            } else {
                return url.replace('sandbox.portfoliopilot.com', 'portfoliopilot.com');
            }
        });
    }

    sandboxSwitch.addEventListener('change', function() {
        if (this.checked) {
            sandboxTab.classList.remove('d-none');
            productionTab.classList.add('d-none');
            sandboxTab.click();
        } else {
            sandboxTab.classList.add('d-none');
            productionTab.classList.remove('d-none');
            productionTab.click();
        }
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

        // Show tabs container
        resultsTabs.classList.remove('d-none');

        // Process both production and sandbox URLs
        const prodUrls = getUrlsForEnvironment(urls, false);
        const sandboxUrls = getUrlsForEnvironment(urls, true);

        // Create loading indicators for both environments
        prodUrls.forEach((url, index) => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-container mb-3';
            resultDiv.innerHTML = createLoadingIndicator(url, index);
            productionResults.appendChild(resultDiv);
        });

        if (sandboxSwitch.checked) {
            sandboxUrls.forEach((url, index) => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'result-container mb-3';
                resultDiv.innerHTML = createLoadingIndicator(url, index);
                sandboxResults.appendChild(resultDiv);
            });
        }

        // Process all URLs in parallel for both environments
        const prodResultDivs = productionResults.querySelectorAll('.result-container');
        const sandboxResultDivs = sandboxResults.querySelectorAll('.result-container');

        const prodPromises = prodUrls.map((url, index) => 
            processUrl(url, index, prodResultDivs[index])
        );

        const sandboxPromises = sandboxSwitch.checked ? sandboxUrls.map((url, index) => 
            processUrl(url, index, sandboxResultDivs[index])
        ) : [];

        // Wait for all requests to complete (but results will show as they arrive)
        await Promise.allSettled([...prodPromises, ...sandboxPromises]);

        // Show the appropriate tab based on sandbox switch
        if (sandboxSwitch.checked) {
            sandboxTab.classList.remove('d-none');
            productionTab.classList.add('d-none');
            sandboxTab.click();
        } else {
            sandboxTab.classList.add('d-none');
            productionTab.classList.remove('d-none');
            productionTab.click();
        }
        downloadButton.classList.remove('d-none');
    });
});