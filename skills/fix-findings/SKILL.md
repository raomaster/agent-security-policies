---
name: fix-findings
description: Remediate security findings from any scan using AGENT_RULES.md
---

# Fix Findings

Take the JSON output from any detection skill and propose code fixes following AGENT_RULES.md.

## When to Use

After running any detection skill:
- `sast-scan` → `sast-report.json` (CWE findings)
- `secrets-scan` → `secrets-report.json` (leaked credentials)
- `dependency-scan` → `dependency-report.json` (CVE findings)
- `container-scan` → `container-report.json` (image CVE findings)
- `iac-scan` → `iac-report.json` (misconfigurations)

## Instructions

### 1. Load the Scan Report

Read the JSON report file. Identify the report type from its structure:

| Report | Key identifier | Finding type |
|--------|---------------|-------------|
| SAST | `results[].check_id` | CWE — code vulnerabilities |
| Secrets | `[].RuleID` | Hardcoded credentials |
| Dependency | `Results[].Vulnerabilities[].VulnerabilityID` | CVE — library vulnerabilities |
| Container | `Results[].Vulnerabilities[].VulnerabilityID` + `Class` | CVE — OS/library vulnerabilities |
| IaC | `queries[].query_name` | Misconfigurations |

### 2. Triage Findings

Sort and prioritize:

1. **Group by severity**: CRITICAL → HIGH → MEDIUM → LOW → INFO
2. **Filter actionable findings**: Skip findings with no fix available
3. **Identify duplicates**: Same CWE in multiple locations → fix the pattern, not each instance

### 3. Map to AGENT_RULES.md

For each finding, identify the applicable rule:

| Finding type | CWE | AGENT_RULES.md Rule |
|-------------|-----|---------------------|
| SQL Injection | CWE-89 | Rule 2: Injection Prevention |
| XSS | CWE-79 | Rule 2: Injection Prevention |
| OS Command Injection | CWE-78 | Rule 2 + Rule 8: Subprocess |
| Hardcoded Secrets | CWE-798 | Rule 3: Secrets Management |
| Missing Auth | CWE-862 | Rule 4: Auth & Authorization |
| Weak Crypto | CWE-327 | Rule 6: Cryptography |
| Vulnerable Dependency | CWE-1035 | Rule 7: Dependencies |
| Path Traversal | CWE-22 | Rule 2: Injection Prevention |
| Info Disclosure | CWE-200 | Rule 9: Data Protection |
| Deserialization | CWE-502 | Rule 2: Injection Prevention |
| SSRF | CWE-918 | Rule 2: Injection Prevention |
| Race Condition | CWE-362 | Rule 10: Concurrency |

### 4. Generate Fixes

For each finding, produce:

```markdown
## Finding: [check_id or CVE ID]

**File:** `path/to/file.py` (line X)
**Severity:** 🔴 CRITICAL
**CWE:** CWE-89 (SQL Injection)
**Rule:** AGENT_RULES.md Rule 2: Injection Prevention

### Current Code (vulnerable)
\```python
query = f"SELECT * FROM users WHERE id = {user_id}"
cursor.execute(query)
\```

### Fixed Code
\```python
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
\```

### Explanation
Parameterized queries prevent SQL injection by separating code from data.
The user input is passed as a parameter, never concatenated into the query string.
```

### 5. Fix Priority

Apply fixes in this order:

1. **CRITICAL** — Fix immediately. These are exploitable now.
2. **HIGH** — Fix in current sprint. Exploitable with moderate effort.
3. **MEDIUM** — Fix in next sprint. Requires specific conditions.
4. **LOW** — Backlog. Minimal impact, defense in depth.

### 6. Validation

After applying fixes:

1. **Re-run the original scan** to verify the finding is resolved
2. **Run existing tests** to ensure no regressions
3. **Check for new findings** introduced by the fix itself

## Report Types

### For SAST findings (sast-report.json)

- Read `results[].extra.metadata.cwe` for CWE mapping
- Read `results[].path` and `results[].start.line` for location
- Apply the code fix at the exact location
- Run `semgrep` again to verify

### For Secrets findings (secrets-report.json)

- **Rotate the credential immediately** — it's been exposed
- Replace with environment variable: `os.environ["VAR_NAME"]`
- Add to `.gitignore` if it's a file (`.env`)
- Add to `.gitleaksignore` if false positive
- Check git history — secret may still be in old commits

### For Dependency findings (dependency-report.json)

- Check `FixedVersion` — update to that version
- If no fix: evaluate alternatives or apply workarounds
- Update lock files after version changes
- Run `trivy fs .` again to verify

### For Container findings (container-report.json)

- Update base image to latest patched version
- Consider minimal images (`slim`, `alpine`, `distroless`)
- Update application dependencies inside the image
- Rebuild and re-scan

### For IaC findings (iac-report.json)

- Read `expected_value` — that's what KICS wants you to set
- Modify the IaC resource attribute accordingly
- Re-run `kics scan` to verify

## Output Format

Produce a structured remediation report:

```markdown
# Security Remediation Report

**Scan type:** [SAST / Secrets / Dependency / Container / IaC]
**Report file:** [report filename]
**Total findings:** X (Y critical, Z high)
**Fixed:** A | **Remaining:** B | **False positives:** C

## Fixes Applied

### 1. [Finding title] — 🔴 CRITICAL
- **File:** path/to/file
- **CWE:** CWE-XXX
- **Fix:** [description of change]

### 2. [Finding title] — 🟠 HIGH
...

## Remaining (No Fix Available)

### 1. [CVE-YYYY-XXXXX] — 🟠 HIGH
- **Package:** name@version
- **Reason:** No patched version available
- **Workaround:** [if applicable]
```

## References

- [AGENT_RULES.md](../../AGENT_RULES.md) — Full security rules
- [policies/cwe_top25.yaml](../../policies/cwe_top25.yaml) — CWE mappings
- [policies/owasp_asvs.yaml](../../policies/owasp_asvs.yaml) — ASVS checklist
