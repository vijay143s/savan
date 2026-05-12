import os
import sys
import traceback

# Define the application directory
APP_DIR = os.path.dirname(__file__)
sys.path.insert(0, APP_DIR)

def get_file_preview(filename):
    try:
        with open(os.path.join(APP_DIR, filename), 'r') as f:
            return "".join(f.readlines()[:10])
    except:
        return f"Could not read {filename}"

try:
    import a2wsgi
    import fastapi
    
    # Try to import using the new name 'api'
    import api
    app = getattr(api, 'app', None)
    
    if app is None:
        raise ImportError(f"The 'app' variable was not found inside api.py. Contents of api.py:\n{get_file_preview('api.py')}")
    
    application = a2wsgi.ASGIMiddleware(app)

except Exception:
    error_trace = traceback.format_exc()
    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        body = (
            f"DIAGNOSTIC REPORT\n"
            f"=================\n"
            f"Error:\n{error_trace}\n"
            f"api.py Preview:\n{get_file_preview('api.py')}\n"
            f"Python Path: {sys.path}\n"
        )
        return [body.encode()]
