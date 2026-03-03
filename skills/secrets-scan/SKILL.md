---
name: secrets-scan
description: Detect hardcoded secrets and credentials with Gitleaks
---

# Secrets Scan (Gitleaks)

Detect hardcoded secrets, API keys, tokens, and passwords in source code and git history.

## Prerequisites

One of the following:
- **Docker** installed (recommended)
- **Gitleaks** installed locally: `brew install gitleaks` or download from [GitHub releases](https://github.com/gitleaks/gitleaks/releases)

## Run

### Option 1: Docker (recommended)

```bash
# Scan current directory
docker run --rm -v "${PWD}:/src" zricethezav/gitleaks:latest \
  detect \
  --source=/src \
  --report-format=json \
  --report-path=/src/secrets-report.json \
  --no-git

# Scan git history (deeper but slower)
docker run --rm -v "${PWD}:/src" zricethezav/gitleaks:latest \
  detect \
  --source=/src \
  --report-format=json \
  --report-path=/src/secrets-report.json
```

### Option 2: Local installation

```bash
# Files only (no git history)
gitleaks detect --source=. --report-format=json --report-path=secrets-report.json --no-git

# With git history
gitleaks detect --source=. --report-format=json --report-path=secrets-report.json
```

### Option 3: Pre-commit hook

```bash
# Scan staged files only (fast, for CI)
gitleaks protect --staged --report-format=json --report-path=secrets-report.json
```

## Output

Report saved as `secrets-report.json`. Key fields per finding:

```json
[
  {
    "Description": "AWS Access Key",
    "StartLine": 15,
    "EndLine": 15,
    "StartColumn": 20,
    "EndColumn": 40,
    "File": "config/settings.py",
    "Secret": "AKIA...(redacted)",
    "Match": "aws_access_key_id = \"AKIA...\"",
    "RuleID": "aws-access-key-id",
    "Entropy": 3.52,
    "Fingerprint": "config/settings.py:aws-access-key-id:15"
  }
]
```

### Common Secret Types Detected

| RuleID | Description | CWE |
|--------|-------------|-----|
| `aws-access-key-id` | AWS Access Key | CWE-798 |
| `aws-secret-access-key` | AWS Secret Key | CWE-798 |
| `github-pat` | GitHub Personal Access Token | CWE-798 |
| `generic-api-key` | API key patterns | CWE-798 |
| `private-key` | RSA/SSH private keys | CWE-321 |
| `jwt` | JSON Web Tokens | CWE-798 |
| `slack-webhook` | Slack webhook URLs | CWE-798 |
| `password-in-url` | Credentials in URLs | CWE-798 |

All findings map to **CWE-798 (Hardcoded Credentials)** → AGENT_RULES.md **Rule 3: Secrets Management**.

## Interpret Results

After running the scan:

1. **Read `secrets-report.json`**
2. **For each finding**, determine:
   - Is it a real secret or a false positive (test fixtures, examples)?
   - Is the secret still active / rotatable?
   - Is it in current code or only in git history?
3. **For real secrets**:
   - Immediately rotate the credential
   - Replace with environment variable or secrets manager reference
   - Add the pattern to `.gitignore` if it's a file (e.g., `.env`)
4. **For false positives**:
   - Add to `.gitleaksignore` or inline `gitleaks:allow` comment

### Configuring Allowlists

Create `.gitleaks.toml` in project root:

```toml
[allowlist]
description = "Project-specific allowlist"
paths = [
  '''test/fixtures/.*''',
  '''docs/examples/.*''',
]
regexes = [
  '''EXAMPLE_.*''',
  '''test-key-.*''',
]
```

## Next Steps

Use the **fix-findings** skill to remediate:
```
Read secrets-report.json and replace hardcoded secrets with environment variables or secrets manager references
```

## References

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [AGENT_RULES.md](../../AGENT_RULES.md) — Rule 3: Secrets Management
- [policies/base_policy.yaml](../../policies/base_policy.yaml) — Secrets domain
