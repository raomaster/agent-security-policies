# Vulnerable: OS command injection
import os
import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/ping')
def ping():
    host = request.args.get('host')
    # Vulnerable: os.system with user input
    os.system(f"ping -c 4 {host}")
    return "Ping sent"

@app.route('/convert')
def convert():
    filename = request.args.get('file')
    # Vulnerable: subprocess with shell=True and user input
    result = subprocess.run(
        f"convert {filename} output.png",
        shell=True,
        capture_output=True,
        text=True
    )
    return result.stdout

@app.route('/compress')
def compress():
    path = request.args.get('path')
    # Vulnerable: os.popen with user input
    output = os.popen(f"tar -czf archive.tar.gz {path}").read()
    return output
