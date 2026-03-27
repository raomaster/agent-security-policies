# Vulnerable: Path traversal via user input
import os
from flask import Flask, request, send_file

app = Flask(__name__)
UPLOADS_DIR = '/var/data/uploads'

@app.route('/files/<path:filename>')
def get_file(filename):
    # Vulnerable: no path validation
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, 'r') as f:
        return f.read()

@app.route('/download')
def download():
    # Vulnerable: direct user input in path
    filepath = request.args.get('path')
    return send_file(filepath)

@app.route('/logs')
def get_logs():
    # Vulnerable: user input in file path
    date = request.args.get('date', 'today')
    log_file = f"/var/log/app/{date}.log"
    with open(log_file) as f:
        return f.read()
