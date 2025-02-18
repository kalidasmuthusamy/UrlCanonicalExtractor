import os
import logging
from flask import Flask, render_template, request, jsonify
from utils import extract_canonical_url

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/extract-canonical', methods=['POST'])
def extract_canonical():
    url = request.form.get('url', '').strip()
    
    if not url:
        return jsonify({'error': 'Please enter a URL'}), 400
    
    try:
        canonical_url = extract_canonical_url(url)
        if canonical_url:
            return jsonify({'canonical_url': canonical_url})
        else:
            return jsonify({'error': 'No canonical URL found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error processing URL {url}: {str(e)}")
        return jsonify({'error': 'Failed to process URL'}), 500
