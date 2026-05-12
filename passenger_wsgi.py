import os
import sys

# Simple test to verify the environment
def application(environ, start_response):
    start_response('200 OK', [('Content-Type', 'text/plain')])
    message = (
        f"BRIDGE IS WORKING!\n"
        f"Python Version: {sys.version}\n"
        f"App Path: {os.getcwd()}\n"
        f"Files: {os.listdir('.')}\n"
    )
    return [message.encode()]
