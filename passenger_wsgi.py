import os
import sys

# Define the application directory
APP_DIR = os.path.dirname(__file__)
sys.path.insert(0, APP_DIR)

try:
    from a2wsgi import ASGIMiddleware
    from server import app
    
    # This is what Passenger looks for
    application = ASGIMiddleware(app)
except Exception as err:
    # Capture the error message to avoid NameError
    error_message = str(err)
    
    # If the app fails to load, this helps debug
    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        body = f"Error loading application: {error_message}\nPath: {APP_DIR}\nPython: {sys.version}"
        return [body.encode()]
