# Vulnerable: EBS volume without encryption
resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1a"
  size              = 100
  type              = "gp3"
  # Missing: encrypted = true

  tags = {
    Name = "data-volume"
  }
}

resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.medium"

  root_block_device {
    volume_size = 50
    # Missing: encrypted = true
  }
}
