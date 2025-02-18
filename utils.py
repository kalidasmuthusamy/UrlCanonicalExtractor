import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import trafilatura

def is_valid_url(url):
    """Validate if the given string is a valid URL."""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def get_webpage_preview(url):
    """Get a preview of the webpage content."""
    if not is_valid_url(url):
        raise ValueError("Invalid URL format")

    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded is None:
            raise ValueError("Failed to fetch webpage content")

        extracted_text = trafilatura.extract(downloaded, include_comments=False, 
                                           include_tables=False, no_fallback=True,
                                           include_images=False, include_links=False)

        if not extracted_text:
            raise ValueError("No readable content found")

        # Get first 500 characters as preview
        preview = extracted_text[:500] + ('...' if len(extracted_text) > 500 else '')
        return preview.strip()

    except Exception as e:
        raise ValueError(f"Failed to fetch webpage preview: {str(e)}")

def extract_canonical_url(url):
    """Extract canonical URL from the given webpage."""
    if not is_valid_url(url):
        raise ValueError("Invalid URL format")

    try:
        # Send request with a common user agent
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # Only look for <link rel="canonical"> tags
        canonical_tag = soup.find('link', {'rel': 'canonical'})

        if canonical_tag:
            return {
                'canonical_url': canonical_tag.get('href'),
                'tag_html': str(canonical_tag)
            }

        return None

    except requests.RequestException as e:
        raise ValueError(f"Failed to fetch URL: {str(e)}")