---
name: sast-scan
description: Run static application security testing with Semgrep — reports CWE-mapped code vulnerabilities
---

# SAST Scan (Semgrep)

Run static analysis to detect code-level security vulnerabilities. Findings are mapped to CWE IDs.

## Prerequisites

One of the following:
- **Docker** installed (recommended — zero local setup)
- **Semgrep** installed locally: `pip install semgrep` or `brew install semgrep`

## Run

### Option 1: Docker (recommended)

```bash
docker run --rm -v "$(pwd):/src" semgrep/semgrep:latest \
  semgrep scan \
  --config=auto \
  --json \
  --output=/src/sast-report.json \
  /src
```

### Option 2: Local installation

```bash
semgrep scan \
  --config=auto \
  --json \
  --output=sast-report.json \
  .
```

### Option 3: Specific rulesets

```bash
# OWASP Top 10 only
semgrep scan --config=p/owasp-top-ten --json --output=sast-report.json .

# Security-focused rules
semgrep scan --config=p/security-audit --json --output=sast-report.json .

# Multiple rulesets
semgrep scan \
  --config=p/owasp-top-ten \
  --config=p/security-audit \
  --config=p/secrets \
  --json \
  --output=sast-report.json \
  .
```

## Output

Report saved as `sast-report.json`. Key fields per finding:

```json
{
  "results": [
    {
      "check_id": "python.lang.security.audit.eval-detected",
      "path": "src/utils.py",
      "start": { "line": 42, "col": 5 },
      "end": { "line": 42, "col": 28 },
      "extra": {
        "message": "Detected use of eval(). This can execute arbitrary code.",
        "severity": "ERROR",
        "metadata": {
          "cwe": ["CWE-94: Improper Control of Generation of Code"],
          "owasp": ["A03:2021 - Injection"],
          "confidence": "HIGH"
        }
      }
    }
  ]
}
```

### Severity Levels

| Semgrep Severity | Maps to |
|------------------|---------|
| `ERROR` | 🔴 CRITICAL / 🟠 HIGH |
| `WARNING` | 🟡 MEDIUM |
| `INFO` | 🔵 LOW |

## Interpret Results

After running the scan:

1. **Read `sast-report.json`**
2. **Group findings by severity** (ERROR first)
3. **For each finding**, identify:
   - The CWE ID from `extra.metadata.cwe`
   - The file and line number
   - The Semgrep rule that triggered it
4. **Map to AGENT_RULES.md** — Find the corresponding mandatory rule
5. **Propose a fix** that addresses the root cause, not just the symptom

## Common Findings & Rules

| Semgrep Rule Pattern | CWE | AGENT_RULES.md Rule |
|---------------------|-----|---------------------|
| `*.security.audit.eval-detected` | CWE-94 | Rule 2: Injection Prevention |
| `*.security.audit.subprocess-shell-true` | CWE-78 | Rule 8: Subprocess |
| `*.sql.injection.*` | CWE-89 | Rule 2: Injection Prevention |
| `*.xss.*` | CWE-79 | Rule 2: Injection Prevention |
| `*.security.hardcoded-*` | CWE-798 | Rule 3: Secrets Management |
| `*.deserialization.*` | CWE-502 | Rule 2: Injection Prevention |
| `*.path-traversal.*` | CWE-22 | Rule 2: Injection Prevention |
| `*.crypto.weak-*` | CWE-327 | Rule 6: Cryptography |

## Next Steps

Use the **fix-findings** skill to remediate:
```
Read sast-report.json and fix the vulnerabilities following AGENT_RULES.md
```

## References

- [Semgrep Registry](https://semgrep.dev/explore) — Browse available rules
- [AGENT_RULES.md](../../AGENT_RULES.md) — Security rules
- [policies/cwe_top25.yaml](../../policies/cwe_top25.yaml) — CWE Top 25 mappings
