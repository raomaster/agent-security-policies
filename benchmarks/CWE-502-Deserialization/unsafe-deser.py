# Vulnerable: Insecure deserialization
import pickle
import yaml
import json
from flask import Flask, request

app = Flask(__name__)

@app.route('/load-session', methods=['POST'])
def load_session():
    data = request.get_data()
    # Vulnerable: pickle.loads executes arbitrary code
    session = pickle.loads(data)
    return session

@app.route('/import-config', methods=['POST'])
def import_config():
    config_text = request.get_data(as_text=True)
    # Vulnerable: yaml.load without SafeLoader can execute code
    config = yaml.load(config_text)
    return config

@app.route('/parse', methods=['POST'])
def parse():
    raw = request.get_data(as_text=True)
    # Vulnerable: eval on user input
    result = eval(raw)
    return str(result)
