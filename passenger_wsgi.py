import os
import sys
import traceback

# Define the application directory
APP_DIR = os.path.dirname(__file__)
sys.path.insert(0, APP_DIR)

try:
    # Check for core dependencies
    import a2wsgi
    import fastapi
    from server import app
    
    # This is what Passenger looks for
    application = a2wsgi.ASGIMiddleware(app)

except ImportError as e:
    # Specifically handle missing modules
    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        body = f"Missing Dependency Error: {str(e)}\n\nPlease run 'Pip Install' on requirements.txt in cPanel.\nPath: {APP_DIR}\nPython: {sys.version}"
        return [body.encode()]

except Exception:
    # Handle other errors (syntax, etc)
    error_trace = traceback.format_exc()
    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        body = f"Application Error:\n\n{error_trace}\nPath: {APP_DIR}\nPython: {sys.version}"
        return [body.encode()]
