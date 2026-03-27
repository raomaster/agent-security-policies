# Vulnerable: Weak cryptographic algorithms
import hashlib
from Crypto.Cipher import DES

def hash_password(password):
    # Vulnerable: MD5 for password hashing
    return hashlib.md5(password.encode()).hexdigest()

def encrypt_data(data, key):
    # Vulnerable: DES encryption
    cipher = DES.new(key[:8].encode(), DES.MODE_ECB)
    padded = data + '\x00' * (8 - len(data) % 8)
    return cipher.encrypt(padded.encode()).hex()

def generate_token(user_id):
    # Vulnerable: predictable token using MD5
    return hashlib.md5(f"token-{user_id}".encode()).hexdigest()
