# Safe: Secure deserialization
import json
import yaml
from flask import Flask, request

app = Flask(__name__)

@app.route('/load-session', methods=['POST'])
def load_session():
    data = request.get_data(as_text=True)
    # Safe: json.loads cannot execute code
    session = json.loads(data)
    return session

@app.route('/import-config', methods=['POST'])
def import_config():
    config_text = request.get_data(as_text=True)
    # Safe: yaml.safe_load only loads basic Python types
    config = yaml.safe_load(config_text)
    return config
