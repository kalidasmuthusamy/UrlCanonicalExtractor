document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');
    const confirmButton = document.getElementById('confirmExtraction');
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
                previewContent.textContent = data.preview;
                previewSection.classList.remove('d-none');
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

    confirmButton.addEventListener('click', async function() {
        loadingSpinner.classList.remove('d-none');
        resultDiv.classList.add('d-none');

        const formData = new FormData();
        formData.append('url', urlInput.value);

        try {
            const response = await fetch('/extract-canonical', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            resultDiv.classList.remove('d-none');

            if (response.ok) {
                canonicalUrl.textContent = data.canonical_url;
                tagHtml.textContent = data.tag_html;
            } else {
                canonicalUrl.innerHTML = `<span class="text-danger">${data.error}</span>`;
                tagHtml.textContent = '';
            }
        } catch (error) {
            resultDiv.classList.remove('d-none');
            canonicalUrl.innerHTML = '<span class="text-danger">Failed to process request. Please try again.</span>';
            tagHtml.textContent = '';
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    });
});