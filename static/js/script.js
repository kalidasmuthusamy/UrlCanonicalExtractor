document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const previewSection = document.getElementById('previewSection');
    const pageTitle = document.getElementById('pageTitle');
    const pageDescription = document.getElementById('pageDescription');
    const resultDiv = document.getElementById('result');
    const canonicalUrl = resultDiv.querySelector('.canonical-url');
    const tagHtml = resultDiv.querySelector('.tag-html');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Reset UI
        previewSection.classList.add('d-none');
        resultDiv.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');

        const formData = new FormData();
        formData.append('url', urlInput.value);

        try {
            const response = await fetch('/get-preview', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Update preview section with meta information
                pageTitle.textContent = data.title || 'No title available';
                pageDescription.textContent = data.description || 'No description available';
                previewSection.classList.remove('d-none');

                // If canonical URL is available, show it in results section
                if (data.canonical_data && data.canonical_data.canonical_url) {
                    resultDiv.classList.remove('d-none');
                    canonicalUrl.textContent = data.canonical_data.canonical_url;
                    tagHtml.textContent = data.canonical_data.tag_html;
                }
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            resultDiv.classList.remove('d-none');
            canonicalUrl.innerHTML = `<span class="text-danger">${error.message || 'Failed to get preview. Please try again.'}</span>`;
            tagHtml.textContent = '';
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    });
});