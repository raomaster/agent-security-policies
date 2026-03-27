# Vulnerable: random module for security purposes
import random
import string

def generate_token():
    # Vulnerable: random module is not cryptographically secure
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

def generate_session_id():
    # Vulnerable: predictable
    return 'sess_' + str(random.random())[2:18]

def generate_reset_code():
    # Vulnerable: weak random for security code
    return str(random.randint(1000, 9999))
