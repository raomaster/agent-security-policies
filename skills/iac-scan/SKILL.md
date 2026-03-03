---
name: iac-scan
description: Scan Infrastructure as Code for security misconfigurations with KICS
---

# IaC Scan (KICS)

Scan Infrastructure as Code (Terraform, CloudFormation, Kubernetes, Docker, Ansible, etc.) for security misconfigurations.

## Prerequisites

One of the following:
- **Docker** installed (recommended)
- **KICS** installed locally: download from [GitHub releases](https://github.com/Checkmarx/kics/releases)

## Run

### Option 1: Docker (recommended)

```bash
docker run --rm -v "$(pwd):/src" checkmarx/kics:latest \
  scan \
  --path /src \
  --output-path /src \
  --output-name iac-report \
  --report-formats json \
  --type Terraform,Dockerfile,Kubernetes,CloudFormation,Ansible
```

### Option 2: Local installation

```bash
kics scan \
  --path . \
  --output-path . \
  --output-name iac-report \
  --report-formats json
```

### Option 3: Specific IaC type

```bash
# Terraform only
docker run --rm -v "$(pwd):/src" checkmarx/kics:latest \
  scan --path /src --type Terraform \
  --output-path /src --output-name iac-report --report-formats json

# Kubernetes manifests only
docker run --rm -v "$(pwd):/src" checkmarx/kics:latest \
  scan --path /src --type Kubernetes \
  --output-path /src --output-name iac-report --report-formats json

# Dockerfile only
docker run --rm -v "$(pwd):/src" checkmarx/kics:latest \
  scan --path /src --type Dockerfile \
  --output-path /src --output-name iac-report --report-formats json
```

## Supported IaC Platforms

| Platform | File types |
|----------|-----------|
| **Terraform** | `.tf`, `.tfvars` |
| **CloudFormation** | `.yaml`, `.json` (AWS templates) |
| **Kubernetes** | YAML manifests, Helm charts |
| **Dockerfile** | `Dockerfile`, `*.dockerfile` |
| **Ansible** | Playbooks, roles |
| **Azure Resource Manager** | ARM templates |
| **Google Deployment Manager** | GCP configs |
| **OpenAPI** | Swagger/OpenAPI specs |
| **Docker Compose** | `docker-compose.yml` |

## Output

Report saved as `iac-report.json`. Key fields per finding:

```json
{
  "queries": [
    {
      "query_name": "S3 Bucket Without Encryption",
      "query_id": "a227ec01-f97a-4084-91a4-47b350c1db54",
      "severity": "HIGH",
      "platform": "Terraform",
      "category": "Encryption",
      "description": "S3 Bucket should have server-side encryption enabled",
      "files": [
        {
          "file_name": "infra/s3.tf",
          "line": 12,
          "issue_type": "MissingAttribute",
          "search_key": "aws_s3_bucket[data].server_side_encryption_configuration",
          "expected_value": "server_side_encryption_configuration should be defined",
          "actual_value": "server_side_encryption_configuration is not defined"
        }
      ]
    }
  ],
  "severity_counters": {
    "CRITICAL": 0,
    "HIGH": 3,
    "MEDIUM": 7,
    "LOW": 2,
    "INFO": 1
  }
}
```

### Common Misconfiguration Categories

| Category | Examples | Impact |
|----------|---------|--------|
| **Encryption** | Unencrypted storage, weak TLS | Data at rest/transit exposure |
| **Access Control** | Public buckets, open security groups | Unauthorized access |
| **Networking** | Unrestricted ingress (0.0.0.0/0) | Network exposure |
| **Logging** | Disabled audit logs, no monitoring | Lack of visibility |
| **Secrets** | Hardcoded credentials in IaC | Credential exposure |
| **Containers** | Root user, privileged mode | Container escape |
| **Identity** | Overly permissive IAM policies | Privilege escalation |

## Interpret Results

After running the scan:

1. **Read `iac-report.json`**
2. **Check `severity_counters`** for overall risk posture
3. **For each finding**:
   - Review `expected_value` vs `actual_value`
   - Check `issue_type`: `MissingAttribute` (add it), `IncorrectValue` (change it), `RedundantAttribute` (remove it)
4. **Fix the IaC code** following the expected values
5. **Re-scan** after fixes to verify

### Terraform Remediation Patterns

```hcl
# ❌ BAD: No encryption
resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
}

# ✅ GOOD: Encryption enabled
resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}
```

## AGENT_RULES.md Mapping

Findings map to multiple rules:
- **Rule 3: Secrets Management** (CWE-798) — Hardcoded credentials in IaC
- **Rule 6: Cryptography** — Missing encryption, weak algorithms
- **Rule 9: Data Protection** (CWE-200) — Exposed storage, public access
- **Rule 4: Auth & Authorization** (CWE-862) — Overly permissive IAM

## Next Steps

Use the **fix-findings** skill to remediate:
```
Read iac-report.json and fix the infrastructure misconfigurations
```

## References

- [KICS Documentation](https://docs.kics.io/)
- [KICS Queries Catalog](https://docs.kics.io/latest/queries/all-queries/)
- [AGENT_RULES.md](../../AGENT_RULES.md) — Rules 3, 4, 6, 9
