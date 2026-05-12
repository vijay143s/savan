import os
import sys

# Add the app directory to the path so we can import server.py
sys.path.insert(0, os.path.dirname(__file__))

from a2wsgi import ASGIMiddleware
from server import app

# This is the entry point Passenger looks for
application = ASGIMiddleware(app)
