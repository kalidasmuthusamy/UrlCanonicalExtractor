import os
import logging
from flask import Flask, render_template, request, jsonify
from utils import extract_canonical_url, get_webpage_preview

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-preview', methods=['POST'])
def get_preview():
    url = request.form.get('url', '').strip()

    if not url:
        return jsonify({'error': 'Please enter a URL'}), 400

    try:
        preview_data = get_webpage_preview(url)
        return jsonify(preview_data)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error getting preview for URL {url}: {str(e)}")
        return jsonify({'error': 'Failed to get webpage preview'}), 500

@app.route('/extract-canonical', methods=['POST'])
def extract_canonical():
    url = request.form.get('url', '').strip()

    if not url:
        return jsonify({'error': 'Please enter a URL'}), 400

    try:
        result = extract_canonical_url(url)
        if result:
            return jsonify({
                'canonical_url': result['canonical_url'],
                'tag_html': result['tag_html']
            })
        else:
            return jsonify({'error': 'No canonical URL found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error processing URL {url}: {str(e)}")
        return jsonify({'error': 'Failed to process URL'}), 500