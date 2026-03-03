---
name: dependency-scan
description: Scan project dependencies for known CVEs with Trivy
---

# Dependency Scan (Trivy)

Scan project dependencies (packages, libraries) for known vulnerabilities (CVEs).

## Prerequisites

One of the following:
- **Docker** installed (recommended)
- **Trivy** installed locally: `brew install trivy` or download from [GitHub releases](https://github.com/aquasecurity/trivy/releases)

## Run

### Option 1: Docker (recommended)

```bash
docker run --rm -v "$(pwd):/src" aquasec/trivy:latest \
  fs \
  --scanners vuln \
  --format json \
  --output /src/dependency-report.json \
  /src
```

### Option 2: Local installation

```bash
trivy fs \
  --scanners vuln \
  --format json \
  --output dependency-report.json \
  .
```

### Option 3: Severity filter

```bash
# Only CRITICAL and HIGH
docker run --rm -v "$(pwd):/src" aquasec/trivy:latest \
  fs \
  --scanners vuln \
  --severity CRITICAL,HIGH \
  --format json \
  --output /src/dependency-report.json \
  /src
```

## Supported Package Managers

| Ecosystem | Files detected |
|-----------|---------------|
| Python | `requirements.txt`, `Pipfile.lock`, `poetry.lock`, `pyproject.toml` |
| Node.js | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` |
| Go | `go.sum` |
| Java | `pom.xml`, `build.gradle.kts`, `gradle.lockfile` |
| .NET | `*.csproj`, `packages.lock.json` |
| Rust | `Cargo.lock` |
| Ruby | `Gemfile.lock` |
| PHP | `composer.lock` |

## Output

Report saved as `dependency-report.json`. Key fields per finding:

```json
{
  "Results": [
    {
      "Target": "requirements.txt",
      "Type": "pip",
      "Vulnerabilities": [
        {
          "VulnerabilityID": "CVE-2023-50782",
          "PkgName": "cryptography",
          "InstalledVersion": "41.0.4",
          "FixedVersion": "42.0.0",
          "Severity": "HIGH",
          "Title": "Bleichenbacher timing oracle attack",
          "Description": "...",
          "References": ["https://nvd.nist.gov/vuln/detail/CVE-2023-50782"],
          "CVSS": {
            "nvd": { "V3Score": 7.5 }
          }
        }
      ]
    }
  ]
}
```

### Severity Levels

| Trivy Severity | CVSS Score | Maps to |
|----------------|-----------|---------|
| `CRITICAL` | 9.0-10.0 | 🔴 CRITICAL |
| `HIGH` | 7.0-8.9 | 🟠 HIGH |
| `MEDIUM` | 4.0-6.9 | 🟡 MEDIUM |
| `LOW` | 0.1-3.9 | 🔵 LOW |

## Interpret Results

After running the scan:

1. **Read `dependency-report.json`**
2. **Group by severity** (CRITICAL first)
3. **For each vulnerability**, check:
   - Is a `FixedVersion` available? → **Update immediately**
   - Is there no fix yet? → Evaluate workarounds or alternative libraries
   - Is the vulnerable code path actually reachable in your project?
4. **Update dependencies**:
   - Python: `pip install package==fixed_version`
   - Node.js: `npm audit fix` or manual update in `package.json`
   - Go: `go get package@fixed_version`
5. **Re-scan** after updates to verify fixes

### Ignoring False Positives

Create `.trivyignore` in project root:

```
# Not applicable — we don't use the affected function
CVE-2023-12345

# Disputed — vendor confirmed not exploitable
CVE-2023-67890
```

## AGENT_RULES.md Mapping

All findings map to **Rule 7: Dependencies & Supply Chain** (CWE-1035, SLSA, NIST SA-12):
- Pin dependency versions
- Audit for known CVEs before adding
- Keep dependencies up to date

## Next Steps

Use the **fix-findings** skill to remediate:
```
Read dependency-report.json and update vulnerable dependencies to their fixed versions
```

## References

- [Trivy Documentation](https://aquasecurity.github.io/trivy)
- [AGENT_RULES.md](../../AGENT_RULES.md) — Rule 7: Dependencies & Supply Chain
- [policies/cwe_top25.yaml](../../policies/cwe_top25.yaml) — CWE-1035 mapping
