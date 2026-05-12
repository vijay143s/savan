import os
import sys
import traceback

# Define the application directory
APP_DIR = os.path.dirname(__file__)
sys.path.insert(0, APP_DIR)

try:
    # 1. Try to import dependencies first to see if they exist
    import a2wsgi
    import fastapi
    import requests
    
    # 2. Try to load the app
    from server import app
    
    # 3. Initialize the bridge
    application = a2wsgi.ASGIMiddleware(app)

except Exception:
    # Capture the FULL error traceback so we can see the exact line of failure
    error_trace = traceback.format_exc()
    
    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        body = (
            f"DEPLOYMENT DEBUG INFO\n"
            f"=====================\n"
            f"Error Traceback:\n{error_trace}\n"
            f"Path: {APP_DIR}\n"
            f"Python: {sys.version}\n"
            f"Files in directory: {os.listdir(APP_DIR)}\n"
        )
        return [body.encode()]
