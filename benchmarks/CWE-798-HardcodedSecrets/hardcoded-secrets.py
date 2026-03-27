# Vulnerable: Hardcoded credentials
import boto3

AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
JWT_SECRET = "my-super-secret-jwt-key-do-not-share-2024"
DATABASE_URL = "postgresql://admin:Password123@db.example.com:5432/prod"

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

def verify_token(token):
    import jwt
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
