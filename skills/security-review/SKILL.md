---
name: security-review
description: Multi-phase security code review — analyzes git diff and source code for vulnerabilities without requiring external tools or Docker. Applies 3-phase methodology with false-positive filtering and confidence scoring.
---

# Security Review (No-Tool Code Analysis)

Perform a thorough security review of code changes using a structured 3-phase methodology. This skill does not require Docker, Semgrep, or any external tool — it uses the agent's own analysis capabilities.

## When to Use

- After implementing a new feature before merging
- During PR review to catch security issues early
- When Docker/Semgrep is not available but a security review is needed
- As the first step before running `sast-scan` (provides context)
- When asked to `/security-review` (user-invocable command)

## Prerequisites

None. This skill uses only:
- `git diff` to see what changed
- `Read` tool to examine context files
- The agent's knowledge of security vulnerabilities

---

## Phase 1: Repository Context Research

Before analyzing code, build situational awareness:

### 1.1 Understand the tech stack

```bash
# Identify languages and frameworks
ls -la
cat package.json 2>/dev/null || cat requirements.txt 2>/dev/null || cat go.mod 2>/dev/null || cat pom.xml 2>/dev/null || cat Cargo.toml 2>/dev/null || true
```

Read key project files:
- `README.md` — project purpose, architecture overview
- `AGENT_RULES.md` — security rules in force (if present)
- Main entry points (e.g., `src/index.ts`, `app.py`, `main.go`)

### 1.2 Identify the security context

For each component in scope, determine:
- **Data sensitivity**: Does it handle PII, credentials, payment data, or health data?
- **Authentication model**: How does the code verify identity?
- **Data flow**: Where does data enter? Where does it leave? Where is it stored?
- **Trust boundaries**: What inputs are from external/untrusted sources?
- **Privilege level**: Does the code run with elevated permissions?

### 1.3 Get the diff

```bash
# Changes since last commit
git diff HEAD

# Or for a specific branch
git diff main...HEAD

# Or for staged changes only
git diff --cached
```

If reviewing a specific file:
```bash
git log --oneline -10  # See recent commits
git show <commit>      # See specific commit
```

---

## Phase 2: Comparative Analysis

Compare the changed code against established security patterns.

### 2.1 Check against AGENT_RULES.md

For each change in the diff, verify compliance with:

| Rule | Check |
|------|-------|
| Rule 1: Input Validation | Are all new inputs validated at trust boundaries? |
| Rule 2: Injection Prevention | Any new SQL/OS/LDAP/code constructions? |
| Rule 3: Secrets Management | Any new hardcoded values? Any secret logging? |
| Rule 4: Auth & Authorization | Any new endpoints without auth checks? |
| Rule 5: Error Handling | Any new bare exceptions? Stack traces to users? |
| Rule 6: Cryptography | Any new crypto code? Using approved algorithms? |
| Rule 7: Dependencies | Any new dependencies added? |
| Rule 8: Subprocess | Any new shell commands? Using shell=True/ShellExecute? |
| Rule 9: Data Protection | Any new PII handling or storage? |
| Rule 10: Concurrency | Any new shared state or file operations? |
| Rule 11: API Security | Any new endpoints? Auth enforced on all? |

### 2.2 Compare with existing codebase patterns

Look for:
- **Inconsistencies**: Does the new code follow the same security patterns as existing code?
- **Regressions**: Does the new code remove or bypass existing security controls?
- **New patterns**: Does the new code introduce a pattern not seen before that could be dangerous?

```bash
# Find similar patterns in the codebase for comparison
grep -r "db.query\|execute\|cursor" --include="*.py" -l 2>/dev/null | head -5
grep -r "subprocess\|os.system\|exec\|eval" --include="*.py" -l 2>/dev/null | head -5
grep -r "request.args\|request.form\|req.body\|req.query" --include="*.ts" --include="*.js" -l 2>/dev/null | head -5
```

### 2.3 Identify the attack surface changes

The diff changes the attack surface. For each addition:
- **New endpoint**: Who can call it? With what input?
- **New function with parameters**: What happens with malicious input?
- **New data store operation**: Is the query parameterized?
- **New external call**: Is the target URL validated?

---

## Phase 3: Vulnerability Assessment

Perform data flow analysis on the identified attack surface.

### 3.1 Trace data flows

For each new input point:
1. **Source**: Where does data come from? (user input, API, file, DB, env var, queue)
2. **Transform**: What happens to the data? (parsing, encoding, formatting)
3. **Sink**: Where does data go? (DB, OS command, HTML output, log, file, network)
4. **Controls**: What validation/sanitization exists between source and sink?

### 3.2 Check injection paths (CWE-89, CWE-78, CWE-79, CWE-94)

**SQL Injection (CWE-89)**
```python
# VULNERABLE: string concatenation
query = f"SELECT * FROM users WHERE id = {user_id}"

# SAFE: parameterized
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

**OS Command Injection (CWE-78)**
```python
# VULNERABLE: shell=True with user input
subprocess.run(f"ls {user_path}", shell=True)

# SAFE: shell=False, validated arguments
subprocess.run(["ls", validated_path], shell=False)
```

**XSS (CWE-79)**
```javascript
// VULNERABLE: innerHTML with unsanitized input
element.innerHTML = userInput;

// SAFE: textContent or sanitized
element.textContent = userInput;
// or sanitize with DOMPurify before innerHTML
```

### 3.3 Check secret management (CWE-798)

Look for patterns like:
```
api_key = "sk-..."
password = "hardcoded"
token = "eyJ..."
SECRET_KEY = "my-secret"
```

Also check: Are secrets being logged? Are they in error messages?

### 3.4 Check authentication/authorization (CWE-862, CWE-863)

For each new route/endpoint/function:
- Is there an auth check before sensitive logic?
- Is authorization checked server-side (not just client-side)?
- Is ownership validated (can user A access user B's data)?

### 3.5 Check error handling (CWE-755)

```python
# VULNERABLE: bare exception + stack trace to user
try:
    result = process(data)
except:
    return {"error": str(e), "trace": traceback.format_exc()}

# SAFE: typed exception + generic message
try:
    result = process(data)
except ValueError as e:
    logger.error("Validation error", exc_info=True)
    return {"error": "Invalid input"}
```

---

## False Positive Exclusions

Do NOT report as vulnerabilities:

1. **Test files** (`test_*.py`, `*.test.ts`, `__tests__/`, `spec/`) — intentional vulnerable samples in tests
2. **Mock data in tests** — fake credentials, sample tokens, example SQL queries
3. **Comments describing vulnerabilities** — documentation is not code
4. **Security tool definitions** — Semgrep rules, CodeQL queries, test exploits
5. **Minified/compiled output** — `dist/`, `build/`, `*.min.js` — review source, not output
6. **Vendor code** — `node_modules/`, `vendor/`, `third_party/` — dependency scans cover these
7. **Example code with "DO NOT USE" warnings** — clearly marked as anti-examples
8. **Configuration templates with explicit placeholders** — `"YOUR_API_KEY_HERE"`, `"<REPLACE_ME>"`
9. **Dead code with no reachable path** — verify code path is actually reachable
10. **Local-only debug utilities** — tools that run only in development environment
11. **SHA checksums that look like secrets** — 40-hex-char strings that are content hashes
12. **Base64-encoded images in CSS/HTML** — `data:image/png;base64,...`
13. **Generated code** — `*.generated.ts`, `*.pb.go`, `*.pb.js` — review the generator, not output
14. **Type definition files** — `*.d.ts` — no runtime behavior
15. **Configuration files outside trust boundaries** — `pyproject.toml` version strings, etc.
16. **Intentionally public constants** — public API versions, public rate limit values
17. **Security headers being SET** — setting `Content-Security-Policy` is NOT a CSP bypass
18. **Already-reported findings** — do not duplicate findings from `sast-report.json`

---

## Confidence Scoring

Rate each finding with a confidence score:

| Score | Label | Meaning |
|-------|-------|---------|
| 90–100% | **CONFIRMED** | Exploitable code path identified with direct evidence |
| 80–89% | **LIKELY** | Probable vulnerability; pending one piece of context to confirm |
| 70–79% | **POSSIBLE** | Pattern matches known vulnerability; requires manual verification |
| < 70% | **SKIP** | Do not report — too speculative without more context |

---

## Output Format

```markdown
# Security Review Report

**Scope:** [files/commits reviewed]
**Date:** [YYYY-MM-DD]
**Reviewer:** Aegis (agent-security-policies security-review skill)
**Methodology:** 3-Phase (Context Research → Comparative Analysis → Vulnerability Assessment)

## Executive Summary

**Verdict:** [PASS / CONDITIONAL / FAIL]
**Total findings:** X (Y critical, Z high, W medium)

## Findings

### [FINDING-001] — [Short title] — 🔴 CRITICAL (Confidence: 95%)

**File:** `path/to/file.py` (line X–Y)
**CWE:** CWE-89 (SQL Injection)
**AGENT_RULES.md:** Rule 2: Injection Prevention

**Vulnerable Code:**
```python
[code snippet]
```

**Attack Scenario:**
[How an attacker exploits this — be specific]

**Recommended Fix:**
```python
[fixed code snippet]
```

**References:** OWASP ASVS V2.3, CWE-89

---

## False Positives Excluded

| Pattern | Reason Excluded |
|---------|----------------|
| [line N in file X] | Test file — intentional mock data |

## What Was NOT Covered

- Container/OS vulnerabilities (use `container-scan` skill)
- Known CVEs in dependencies (use `dependency-scan` skill)
- Leaked secrets in git history (use `secrets-scan` skill)
- Infrastructure misconfigurations (use `iac-scan` skill)
```

## Verdict Criteria

- ❌ **FAIL**: Any CRITICAL finding, or ≥3 HIGH findings
- ⚠️ **CONDITIONAL**: 1–2 HIGH findings, or ≥3 MEDIUM findings
- ✅ **PASS**: No HIGH+, ≤2 MEDIUM findings

## Next Steps

After this review:
1. Fix all CRITICAL and HIGH findings before merging
2. For deeper scanning: run `sast-scan` (requires Semgrep/Docker)
3. Use `fix-findings` skill to apply fixes systematically

## References

- [AGENT_RULES.md](../../AGENT_RULES.md) — Security rules in force
- [policies/owasp_asvs.yaml](../../policies/owasp_asvs.yaml) — ASVS checklist
- [policies/owasp_proactive_controls.yaml](../../policies/owasp_proactive_controls.yaml) — Proactive Controls
- [policies/cwe_top25.yaml](../../policies/cwe_top25.yaml) — CWE Top 25
