import os
import sys
import traceback

# Define the application directory
APP_DIR = os.path.dirname(__file__)
sys.path.insert(0, APP_DIR)

try:
    from a2wsgi import ASGIMiddleware
    from api import app # We renamed server.py to api.py
    
    # This is the bridge between FastAPI (ASGI) and Passenger (WSGI)
    application = ASGIMiddleware(app)

except Exception:
    error_trace = traceback.format_exc()
    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        body = f"CRITICAL: App failed to start.\n\n{error_trace}"
        return [body.encode()]
