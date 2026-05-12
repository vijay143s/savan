import os
import sys
import traceback

# Define the application directory
APP_DIR = os.path.dirname(__file__)
sys.path.insert(0, APP_DIR)

# Global for lazy loading
_cached_app = None

def application(environ, start_response):
    global _cached_app
    
    try:
        # If the app isn't loaded yet, load it now
        if _cached_app is None:
            from a2wsgi import ASGIMiddleware
            from api import app
            _cached_app = ASGIMiddleware(app)
        
        # Pass the request to the real app
        return _cached_app(environ, start_response)

    except Exception:
        error_trace = traceback.format_exc()
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        body = f"LAZY LOAD ERROR: App failed to start.\n\n{error_trace}"
        return [body.encode()]
