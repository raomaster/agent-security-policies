# Vulnerable: S3 bucket with public access
resource "aws_s3_bucket" "data" {
  bucket = "my-app-data-bucket"
  acl    = "public-read"

  tags = {
    Environment = "production"
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
