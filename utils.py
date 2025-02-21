import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse


def is_valid_url(url):
    """Validate if the given string is a valid URL."""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except (ValueError, AttributeError):
        return False


def get_webpage_preview(url):
    """Get a preview of the webpage content including meta information."""
    if not is_valid_url(url):
        raise ValueError("Invalid URL format")

    try:
        # Send request with a common user agent
        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/91.0.4472.124 Safari/537.36'
            )
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # Get meta title and description
        title = soup.find('title')
        title = title.text.strip() if title else None

        meta_description = soup.find('meta', {'name': 'description'})
        description = meta_description.get(
            'content', '').strip() if meta_description else None

        # Extract canonical URL
        canonical_tag = soup.find('link', {'rel': 'canonical'})
        canonical_data = {
            'canonical_url': (
                canonical_tag.get('href') if canonical_tag else None
            ),
            'tag_html': (
                str(canonical_tag) if canonical_tag else None
            )
        }

        return {
            'title': title,
            'description': description,
            'canonical_data': canonical_data
        }

    except Exception as e:
        raise ValueError(f"Failed to fetch webpage preview: {str(e)}")


def extract_canonical_url(url):
    """Extract canonical URL from the given webpage."""
    if not is_valid_url(url):
        raise ValueError("Invalid URL format")

    try:
        # Send request with a common user agent
        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/91.0.4472.124 Safari/537.36'
            )
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
