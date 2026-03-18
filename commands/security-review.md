---
description: "Run a full security review: multi-phase code analysis + available scan skills + consolidated findings report"
---

Run a comprehensive security review of the current project or recent changes.

$ARGUMENTS (optional: scope — "diff" for recent changes only, "full" for entire codebase, or a specific file/directory path; defaults to "diff")

## Process

### 1. Determine Scope

```bash
# Show what changed recently
git log --oneline -10
git diff HEAD --stat
```

Set scope based on `$ARGUMENTS`:
- `diff` (default): review recent uncommitted changes and last few commits
- `full`: review the entire codebase
- `path/to/file`: review only the specified file or directory

### 2. Run Security Review Skill (Phase 1–3)

Execute the full 3-phase security review from `skills/security-review/SKILL.md`:

**Phase 1 — Repository Context Research**
- Read README.md, package.json / requirements.txt / go.mod
- Read AGENT_RULES.md to understand active rules
- Get the git diff: `git diff HEAD` (or appropriate scope)

**Phase 2 — Comparative Analysis**
- Compare changed code against all 11 AGENT_RULES.md rules
- Identify inconsistencies with existing security patterns
- Map changes to OWASP ASVS V1-V17 chapters

**Phase 3 — Vulnerability Assessment**
- Trace data flows from sources to sinks
- Check injection paths (SQL, OS command, XSS, code injection)
- Check secret management (hardcoded values, logging)
- Check auth/authz (missing checks, IDOR)
- Check error handling (bare exceptions, stack traces)
- Apply false positive exclusions (18 categories)
- Score each finding with confidence percentage

### 3. Run Available Scan Skills

Check which tools are available and run them:

```bash
# Check for Docker
if command -v docker &>/dev/null; then
  echo "Docker available — can run SAST, secrets, dependency scans"
else
  echo "Docker not available — skipping tool-based scans"
fi

# Check for local tools
command -v semgrep &>/dev/null && echo "semgrep: available"
command -v gitleaks &>/dev/null && echo "gitleaks: available"
command -v trivy &>/dev/null && echo "trivy: available"
```

Run each available tool following its SKILL.md:

**If Semgrep/Docker available** — run `sast-scan` skill:
```bash
# Docker path
docker run --rm -v "${PWD}:/src" semgrep/semgrep:latest \
  semgrep scan --config=auto --json --output=/src/sast-report.json /src
```

**If Gitleaks/Docker available** — run `secrets-scan` skill:
```bash
docker run --rm -v "${PWD}:/path" zricethezav/gitleaks:latest \
  detect --source="/path" --report-format=json --report-path=/path/secrets-report.json
```

**If Trivy/Docker available** — run `dependency-scan` skill:
```bash
docker run --rm -v "${PWD}:/src" aquasec/trivy:latest \
  fs --format json --output /src/dependency-report.json /src
```

### 4. Aggregate and Deduplicate Findings

Collect all findings from:
- Phase 3 analysis (security-review skill output)
- `sast-report.json` (if generated)
- `secrets-report.json` (if generated)
- `dependency-report.json` (if generated)

Deduplicate: if the same vulnerability is found by both code analysis and SAST, keep the SAST finding (more precise location) but note the code analysis also detected it.

### 5. Produce Consolidated Security Report

Output a structured report:

```markdown
# Security Review Report — [Project Name]

**Date:** [YYYY-MM-DD]
**Scope:** [diff/full/path]
**Branch:** [current branch]
**Commit:** [git rev-parse --short HEAD output]

## Verdict: [PASS / CONDITIONAL / FAIL]

| Severity | Code Analysis | SAST | Secrets | Dependencies | Total |
|----------|-------------|------|---------|-------------|-------|
| 🔴 CRITICAL | X | X | X | X | X |
| 🟠 HIGH | X | X | X | X | X |
| 🟡 MEDIUM | X | X | X | X | X |
| 🔵 LOW | X | X | X | X | X |

## Critical & High Findings (fix before merge)

[Findings with code snippets, attack scenarios, and fixes]

## Medium Findings (fix in next sprint)

[Findings]

## What Was Covered

- [x] Multi-phase code analysis (security-review skill)
- [x or -] SAST scan (Semgrep) — [available/not available]
- [x or -] Secrets scan (Gitleaks) — [available/not available]
- [x or -] Dependency CVE scan (Trivy) — [available/not available]

## What Was NOT Covered

- Container image scanning (run `container-scan` skill separately)
- Infrastructure as Code (run `iac-scan` skill separately)

## Next Steps

1. Fix all CRITICAL and HIGH findings
2. Re-run `/security-review` to verify fixes
3. Use `fix-findings` skill for systematic remediation
```

### 6. Cleanup Report Files

After aggregating:
```bash
# Remove intermediate scan files (keep consolidated report)
rm -f sast-report.json secrets-report.json dependency-report.json container-report.json
```

Note: If the user wants to keep the raw scan files, skip this step.
