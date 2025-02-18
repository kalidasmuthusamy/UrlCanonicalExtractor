import os
import logging
from flask import Flask, render_template, request, jsonify
from utils import extract_canonical_url, get_webpage_preview

# Environment configuration
APP_ENV = os.environ.get("APP_ENV", "development")
is_prod = APP_ENV == "production"

# Set up logging with appropriate level
logging.basicConfig(level=logging.INFO if is_prod else logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET",
                                "default-secret-key" if not is_prod else None)

if not is_prod and app.secret_key == "default-secret-key":
    logger.warning(
        "Using default secret key in development. Don't use this in production!"
    )
elif is_prod and app.secret_key is None:
    raise RuntimeError(
        "SESSION_SECRET environment variable must be set in production!")

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")


@app.after_request
def add_header(response):
    response.headers[
        'Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response


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
