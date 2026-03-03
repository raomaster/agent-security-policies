---
name: container-scan
description: Scan container images for OS and library CVEs with Trivy
---

# Container Scan (Trivy)

Scan Docker/OCI container images for known vulnerabilities in OS packages and application libraries.

## Prerequisites

One of the following:
- **Docker** installed (recommended)
- **Trivy** installed locally: `brew install trivy` or download from [GitHub releases](https://github.com/aquasecurity/trivy/releases)

## Run

### Option 1: Docker (recommended)

```bash
# Scan a published image
docker run --rm aquasec/trivy:latest \
  image \
  --format json \
  --output /dev/stdout \
  your-image:tag > container-report.json

# Scan a locally built image (mount Docker socket)
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$(pwd):/output" \
  aquasec/trivy:latest \
  image \
  --format json \
  --output /output/container-report.json \
  your-image:tag
```

### Option 2: Local installation

```bash
trivy image \
  --format json \
  --output container-report.json \
  your-image:tag
```

### Option 3: Severity filter + ignore unfixed

```bash
trivy image \
  --severity CRITICAL,HIGH \
  --ignore-unfixed \
  --format json \
  --output container-report.json \
  your-image:tag
```

### Option 4: Scan Dockerfile for misconfigurations

```bash
docker run --rm -v "${PWD}:/src" aquasec/trivy:latest \
  config \
  --format json \
  --output /src/dockerfile-report.json \
  /src/Dockerfile
```

## Output

Report saved as `container-report.json`. Key fields per finding:

```json
{
  "Results": [
    {
      "Target": "ubuntu:22.04 (ubuntu 22.04)",
      "Class": "os-pkgs",
      "Type": "ubuntu",
      "Vulnerabilities": [
        {
          "VulnerabilityID": "CVE-2024-2961",
          "PkgName": "libc6",
          "InstalledVersion": "2.35-0ubuntu3.6",
          "FixedVersion": "2.35-0ubuntu3.7",
          "Severity": "CRITICAL",
          "Title": "glibc iconv buffer overflow",
          "CVSS": {
            "nvd": { "V3Score": 9.8 }
          }
        }
      ]
    },
    {
      "Target": "Python",
      "Class": "lang-pkgs",
      "Type": "pip",
      "Vulnerabilities": [...]
    }
  ]
}
```

### Finding Classes

| Class | What it scans | Examples |
|-------|--------------|---------|
| `os-pkgs` | OS-level packages | apt, apk, yum packages |
| `lang-pkgs` | Application libraries | pip, npm, gem packages inside the image |

## Interpret Results

After running the scan:

1. **Read `container-report.json`**
2. **Prioritize by class**: OS packages → then application libraries
3. **For each CRITICAL/HIGH finding**:
   - Is `FixedVersion` available? → Update base image or package
   - Is it in `os-pkgs`? → Consider a newer/minimal base image (e.g., `alpine`, `distroless`)
   - Is it in `lang-pkgs`? → Update the application dependency
4. **Remediation strategies**:
   - Use multi-stage builds to minimize attack surface
   - Use `distroless` or `scratch` base images where possible
   - Run as non-root user (`USER nonroot`)
   - Remove unnecessary packages and tools

### Dockerfile Best Practices

```dockerfile
# Use specific version, not :latest
FROM python:3.12-slim AS base

# Run as non-root
RUN useradd --create-home appuser
USER appuser

# Don't store secrets in layers
# Use --mount=type=secret for build-time secrets

# Minimize layers and attack surface
RUN apt-get update && apt-get install -y --no-install-recommends \
    package-name \
    && rm -rf /var/lib/apt/lists/*
```

## AGENT_RULES.md Mapping

Findings map to:
- **Rule 7: Dependencies & Supply Chain** (CWE-1035) — Vulnerable packages
- **Rule 3: Secrets Management** (CWE-798) — Secrets leaked in image layers
- **Rule 9: Data Protection** (CWE-200) — Sensitive files exposed in image

## Next Steps

Use the **fix-findings** skill to remediate:
```
Read container-report.json and update the Dockerfile to fix vulnerabilities
```

## References

- [Trivy Image Scanning](https://aquasecurity.github.io/trivy/latest/docs/target/container_image/)
- [AGENT_RULES.md](../../AGENT_RULES.md) — Rules 3, 7, 9
- [Docker Security Best Practices](https://docs.docker.com/build/building/best-practices/)
