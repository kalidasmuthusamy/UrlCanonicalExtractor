document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultDiv = document.getElementById('result');
    const resultAlert = resultDiv.querySelector('.alert');
    const resultHeading = resultAlert.querySelector('.alert-heading');
    const resultContent = resultAlert.querySelector('.result-content');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset previous results
        resultDiv.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');
        
        const formData = new FormData();
        formData.append('url', urlInput.value);

        try {
            const response = await fetch('/extract-canonical', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            resultDiv.classList.remove('d-none');
            resultAlert.classList.remove('alert-success', 'alert-danger');
            
            if (response.ok) {
                resultAlert.classList.add('alert-success');
                resultHeading.textContent = 'Canonical URL Found';
                resultContent.textContent = data.canonical_url;
            } else {
                resultAlert.classList.add('alert-danger');
                resultHeading.textContent = 'Error';
                resultContent.textContent = data.error;
            }
        } catch (error) {
            resultDiv.classList.remove('d-none');
            resultAlert.classList.remove('alert-success');
            resultAlert.classList.add('alert-danger');
            resultHeading.textContent = 'Error';
            resultContent.textContent = 'Failed to process request. Please try again.';
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    });
});
