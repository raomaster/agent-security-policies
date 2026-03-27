# AutoBench: Continuous Security Skill Refinement

> An autonomous benchmarking and self-improvement framework for AI security agent skills, inspired by [autoresearch](https://github.com/karpathy/autoresearch) by Andrej Karpathy.

---

## Quickstart

```bash
# 1. Setup (once)
cd autobench
npm install

# 2. Test sast-scan skill (single pass)
npx tsx run.ts

# 3. Quick smoke test (5 cases)
npx tsx run.ts --limit 5 --verbose

# 4. Test secrets-scan skill
npx tsx run.ts --skill secrets-scan

# 5. Show fix proposals (using fix-findings)
npx tsx run.ts --fix

# 6. Auto-learning loop (100 iterations, ~2h)
npx tsx run.ts --loop

# 7. Overnight run (200 iterations)
npx tsx run.ts --loop --iterations 200 --verbose

# 8. Generate HTML dashboard
npx tsx run.ts --dashboard
```

### All Commands

| Command | Description |
|---------|-------------|
| `npx tsx run.ts` | Full benchmark on sast-scan (default) |
| `npx tsx run.ts --skill secrets-scan` | Benchmark secrets-scan skill |
| `npx tsx run.ts --skill iac-scan` | Benchmark IaC scanning skill |
| `npx tsx run.ts --limit 5` | Test only 5 cases (quick validation) |
| `npx tsx run.ts --verbose` | Show unmapped rules and gaps |
| `npx tsx run.ts --fix` | Show fix proposals from fix-findings |
| `npx tsx run.ts --loop` | Auto-learning loop (100 iter default) |
| `npx tsx run.ts --loop --iterations 50` | Custom iteration count |
| `npx tsx run.ts --dashboard` | Generate HTML dashboard from results |

### Prerequisites

- **Node.js** ≥18
- **Docker** (for Semgrep/Gitleaks) or local tool installation

---

## The Problem

Security scanning tools (Semgrep, Gitleaks, Trivy, KICS) produce raw findings. But the value of an AI security agent lies in the **skill layer** — the instructions, CWE mappings, severity rules, and false-positive exclusions defined in `SKILL.md` files.

How do you know if your skills are accurate? How do you improve them systematically?

**AutoBench answers both questions.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AutoBench Pipeline                           │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐  │
│  │ 1. Load  │──▶│ 2. Scan  │──▶│ 3. Map   │──▶│ 4. Fix     │  │
│  │ SKILL.md │   │ semgrep/ │   │ CWE via  │   │ fix-findings│  │
│  │          │   │ gitleaks │   │ skill    │   │ AGENT_RULES │  │
│  └──────────┘   └──────────┘   └──────────┘   └─────┬──────┘  │
│                                                      │         │
│                                                      ▼         │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────────┐   │
│  │ 7. Keep  │◀──│ 6. Score │◀──│ 5. Evaluate              │   │
│  │ or Revert│   │ F1 delta │   │ TP/FP/FN vs ground truth │   │
│  │ (git)    │   │          │   │                          │   │
│  └──────────┘   └──────────┘   └──────────────────────────┘   │
│       │                                                       │
│       ▼                                                       │
│  results.tsv  ◀────  metrics per iteration                    │
│  dashboard/   ◀────  HTML visualization                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Auto-Learning Loop

Like autoresearch trains a model by iterating on code, AutoBench iterates on **skill instructions**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   benchmarks/ ──▶ scan ──▶ evaluate ──▶ identify gaps       │
│        ▲                                      │             │
│        │                                      ▼             │
│        └──── commit ◀── improve ◀── analyze patterns        │
│               (if F1 ↑)      (edit SKILL.md)                │
│        │                                                    │
│        └──── revert ◀── discard ◀── (if F1 ≤)              │
│                                                             │
│   Metric: F1 score (harmonic mean of precision & recall)    │
│   Budget: ~100 iterations overnight                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### How It Works

```
Iteration N:
  1. Run benchmarks → get F1 = 0.750
  2. Analyze: CWE-330 not detected (FN), xss-004 flagged as safe (FP)
  3. Propose: Add `*.random.insecure*` → CWE-330 mapping to sast-scan SKILL.md
  4. git commit: "[autobench] iter 12: add CWE-330 mapping"
  5. Re-run benchmarks → get F1 = 0.812
  6. F1 improved (+0.062) → ✅ KEEP commit

Iteration N+1:
  1. Run benchmarks → get F1 = 0.812
  2. Analyze: xss-004 still flagged (FP on DOMPurify code)
  3. Propose: Add exclusion for `*safe*` files to sast-scan SKILL.md
  4. git commit: "[autobench] iter 13: add safe-file exclusion"
  5. Re-run benchmarks → get F1 = 0.798
  6. F1 decreased (-0.014) → ❌ REVERT (git reset --hard HEAD~1)
```

---

## What Gets Improved

| Target File | What Changes | Example |
|-------------|-------------|---------|
| `skills/sast-scan/SKILL.md` | CWE mapping table, severity rules, exclusions | Add `*.random.insecure*` → CWE-330 |
| `skills/secrets-scan/SKILL.md` | Secret type patterns, exclusion rules | Add gitleaks custom rule |
| `skills/fix-findings/SKILL.md` | CWE → AGENT_RULES.md mapping | Add CWE-330 → Rule 6 |
| `policies/*.yaml` | Severity levels, prevention rules | Adjust CWE-330 severity |

**What is never modified:**
- `benchmarks/` — ground truth is immutable
- `src/` — CLI code
- `autobench/` — the tool itself

---

## Metrics

AutoBench measures the complete skill pipeline end-to-end:

| Metric | Formula | What It Measures |
|--------|---------|------------------|
| **Precision** | TP / (TP + FP) | % of findings that are real vulnerabilities |
| **Recall** | TP / (TP + FN) | % of real vulnerabilities that were found |
| **F1 Score** | 2×P×R / (P+R) | Combined accuracy (primary metric) |
| **Fix Rate** | Verified / Proposed | % of fixes that resolve the vulnerability |
| **Mapping Coverage** | Mapped / Total | % of findings mapped by skill vs raw tool |

### Ground Truth Format

Each benchmark case has labeled ground truth:

```json
{
  "id": "xss-001",
  "file": "reflected-xss.js",
  "vulnerable": true,
  "findings": [
    { "line": 8, "cwe": "CWE-079", "severity": "HIGH", "description": "..." }
  ]
}
```

Safe samples (`"vulnerable": false`) test false-positive resistance.

---

## Benchmark Coverage

| CWE | Category | JS | Python | Java | IaC |
|-----|----------|-----|--------|------|-----|
| CWE-079 | Cross-Site Scripting | ✅ | ✅ | — | — |
| CWE-089 | SQL Injection | ✅ | ✅ | — | — |
| CWE-078 | OS Command Injection | ✅ | ✅ | — | — |
| CWE-798 | Hardcoded Secrets | ✅ | ✅ | — | — |
| CWE-532 | Sensitive Data in Logs | ✅ | ✅ | — | — |
| CWE-327 | Weak Cryptography | ✅ | ✅ | — | — |
| CWE-330 | Insufficient Randomness | ✅ | ✅ | — | — |
| CWE-022 | Path Traversal | ✅ | ✅ | — | — |
| CWE-502 | Insecure Deserialization | — | ✅ | — | — |
| CWE-287 | Authentication Bypass | ✅ | — | — | — |
| CWE-862 | Missing Authorization | ✅ | — | — | — |
| IaC | Terraform Misconfigs | — | — | — | ✅ |
| IaC | Kubernetes Misconfigs | — | — | — | ✅ |

**Total: 33 benchmark cases across 13 CWE categories.**

---

## Output

### Console Output

```
══════════════════════════════════════════════════════════════
  AutoBench: Testing skill "sast-scan"
══════════════════════════════════════════════════════════════

  📄 Loaded: skills/sast-scan/SKILL.md
  🔧 Tool: semgrep
  📊 Mappings: 8 CWE rules
  🔧 Fix skill: fix-findings (CWE → AGENT_RULES.md)

  ━━ CWE-079: Cross-Site Scripting (5 cases) ━━

    xss-001... ✅ P:1 R:1 F1:1 (1250ms) [1/1 mapped]
    xss-004... ⚠️ P:0 R:0 F1:0 (1180ms) [0/1 mapped]

  ━━ CWE-089: SQL Injection (5 cases) ━━

    sqli-001... ✅ P:1 R:1 F1:1 (980ms) [1/1 mapped]
    sqli-004... ✅ P:1 R:1 F1:1 (920ms) [0/0 mapped]

╔══════════════════════════════════════════════════════════════╗
║  AGGREGATE               │ 33 cases │ P:0.870 R:0.930      ║
║  F1 Score                │ 0.899                            ║
╚══════════════════════════════════════════════════════════════╝

  📋 Improvement Opportunities:
    - False Negatives: CWE-330, CWE-287
      → Add semgrep rules to sast-scan SKILL.md
    - False Positives: xss-004
      → Add exclusion patterns to sast-scan SKILL.md
```

### results.tsv

Tab-separated metrics per iteration (like autoresearch's results.tsv):

```tsv
run_id  timestamp           cwe      tool    case_id  tp  fp  fn  precision  recall  f1    status   description
1       2026-03-26T10:00:00 CWE-079  semgrep xss-001  1   0   0   1.000      1.000   1.000 baseline 
1       2026-03-26T10:00:01 CWE-079  semgrep xss-004  0   1   0   0.000      0.000   0.000 baseline 
2       2026-03-26T10:05:00 CWE-079  semgrep xss-004  0   0   0   1.000      1.000   1.000 keep     iter-2 improved
```

### Dashboard (HTML)

Generated at `results/dashboard/index.html` with:
- Summary cards (F1, Precision, Recall)
- CWE breakdown chart (grouped bar)
- Tool FP rate chart (horizontal bar)
- Score timeline (line chart)
- Detailed results table

---

## How Skills Are Evaluated

AutoBench tests the complete **skill pipeline**, not just raw tools:

```
                    ┌─────────────┐
                    │ SKILL.md    │
                    │ (sast-scan) │
                    └──────┬──────┘
                           │ defines
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │ CWE Mapping  │ │ Severity │ │ Exclusions   │
    │ Table        │ │ Mapping  │ │ (skip tests) │
    └──────┬───────┘ └────┬─────┘ └──────┬───────┘
           │              │              │
           └──────────────┼──────────────┘
                          ▼
                 ┌─────────────────┐
                 │ Skill-processed │
                 │ findings        │
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │ Ground truth    │
                 │ comparison      │
                 └─────────────────┘
```

Each layer is tested independently:
- **CWE Mapping**: Does `*.sql.injection.*` correctly map to CWE-89?
- **Severity**: Does `ERROR` correctly map to `HIGH`?
- **Exclusions**: Are test files properly excluded?
- **Fix Mapping**: Does fix-findings correctly map CWE-89 → Rule 2?

---

## File Structure

```
autobench/
├── run.ts            CLI entry point
├── runner.ts         Pipeline orchestrator + auto-learning loop
├── skill.ts          SKILL.md parser (CWE mapping, severity, exclusions)
├── executor.ts       Tool execution (semgrep, gitleaks)
├── fixer.ts          fix-findings SKILL integration (CWE→Rule, fix generation)
├── evaluator.ts      TP/FP/FN → precision/recall/F1
├── improver.ts       Gap analysis → SKILL.md improvement proposals
├── git.ts            Git operations (commit, revert)
├── results.ts        TSV logging
├── dashboard.ts      HTML dashboard generation
├── types.ts          TypeScript interfaces
├── program.md        Instructions for autonomous agent
└── __tests__/
    └── evaluator.test.ts

benchmarks/
├── manifest.json     Index of all benchmark cases
├── CWE-079-XSS/      5 cases (vulnerable + safe)
├── CWE-089-SQLi/     5 cases
├── CWE-078-CmdInjection/
├── CWE-798-HardcodedSecrets/
├── CWE-532-LogSecrets/
├── CWE-327-WeakCrypto/
├── CWE-330-WeakRandom/
├── CWE-022-PathTraversal/
├── CWE-502-Deserialization/
├── CWE-287-AuthBypass/
├── CWE-862-MissingAuthz/
├── IaC-Terraform/
└── IaC-Kubernetes/
```

---

## Relationship to autoresearch

| Aspect | autoresearch (Karpathy) | AutoBench |
|--------|------------------------|-----------|
| **Target** | `train.py` (GPT model) | `skills/*/SKILL.md` (instructions) |
| **Metric** | `val_bpb` (bits per byte) | `F1` (precision × recall) |
| **Tool** | PyTorch + Muon optimizer | Semgrep + Gitleaks + KICS |
| **Loop** | Modify code → train 5min → eval | Edit SKILL.md → scan → evaluate |
| **Keep/Discard** | Git commit or revert | Git commit or revert |
| **Runtime** | ~100 experiments/night | ~100 iterations/night |
| **Budget** | GPU hours | CPU minutes |

Both follow the same meta-optimization pattern: **let the system improve itself by iterating on measurable outcomes**.

---

## Design Principles

1. **Skills are the product, not tools.** Semgrep finds patterns; the skill decides what to do with them.

2. **Ground truth is sacred.** Benchmark cases are never modified to make scores look better.

3. **Every improvement must be measurable.** F1 delta is the arbiter of keep vs revert.

4. **Simplicity over complexity.** A small improvement that adds ugly complexity is not worth it.

5. **Removing things that work equally well is a win.** Less surface area = fewer bugs.

---

## License

Apache-2.0 — Part of [agent-security-policies](https://github.com/raomaster/agent-security-policies).
