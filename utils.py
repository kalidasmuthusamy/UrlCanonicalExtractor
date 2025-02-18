import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def is_valid_url(url):
    """Validate if the given string is a valid URL."""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

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
        
        # Look for canonical link in different formats
        canonical_tag = (
            soup.find('link', {'rel': 'canonical'}) or 
            soup.find('meta', {'property': 'og:url'}) or
            soup.find('meta', {'name': 'canonical'})
        )
        
        if canonical_tag:
            if 'href' in canonical_tag.attrs:
                return canonical_tag['href']
            elif 'content' in canonical_tag.attrs:
                return canonical_tag['content']
                
        return None
        
    except requests.RequestException as e:
        raise ValueError(f"Failed to fetch URL: {str(e)}")
