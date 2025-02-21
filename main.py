import os
from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    is_prod = os.environ.get("APP_ENV", "development") == "production"
    app.run(host="0.0.0.0", port=port, debug=not is_prod)
