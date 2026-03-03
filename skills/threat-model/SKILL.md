---
name: threat-model
description: Generate a STRIDE threat model for a component or feature
---

# Threat Model (STRIDE)

Generate a structured threat model for a system component following the STRIDE methodology.

## When to Use

- Planning a new feature or service
- Reviewing architecture changes
- Before a security review or audit
- Evaluating third-party integrations

## Instructions

Analyze the target component and produce a threat model covering all six STRIDE categories.

### 1. Identify the Scope

Ask the user (or determine from context):
- What component/feature is being analyzed?
- What are the trust boundaries?
- What data flows exist?
- Who are the actors (users, services, external systems)?

### 2. Generate Data Flow Diagram

Describe the data flow in a structured format:

```
[Actor] → (Process) → [Data Store]
              ↕
        [External System]
```

Identify every trust boundary crossing.

### 3. Apply STRIDE Analysis

For each component in the data flow, analyze:

| Component | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation |
|-----------|----------|-----------|-------------|-----------------|-----|-----------|
| _name_ | Risk? Mitigation | Risk? Mitigation | Risk? Mitigation | Risk? Mitigation | Risk? Mitigation | Risk? Mitigation |

#### STRIDE Categories

| Category | Question | Typical Mitigations |
|----------|----------|---------------------|
| **S**poofing | Can an attacker impersonate a user or component? | Authentication, certificates, MFA |
| **T**ampering | Can data be modified in transit or at rest? | Integrity checks, HMAC, digital signatures |
| **R**epudiation | Can an actor deny performing an action? | Audit logging, timestamps, non-repudiation |
| **I**nfo Disclosure | Can sensitive data leak? | Encryption, access controls, data classification |
| **D**enial of Service | Can the system be made unavailable? | Rate limiting, throttling, redundancy |
| **E**levation of Privilege | Can an attacker gain higher access? | Least privilege, RBAC, input validation |

### 4. Risk Rating

Rate each threat:

| Severity | Criteria |
|----------|----------|
| 🔴 **CRITICAL** | Exploitable now, data breach or full compromise |
| 🟠 **HIGH** | Exploitable with moderate effort |
| 🟡 **MEDIUM** | Requires specific conditions |
| 🔵 **LOW** | Minimal impact, defense in depth |

### 5. Output Format

Produce the final threat model as a Markdown document with:

1. **Scope & Assumptions** — What was analyzed, what was excluded
2. **Data Flow Diagram** — Components, trust boundaries, data flows
3. **STRIDE Table** — One row per component, all 6 categories
4. **Risk Summary** — Ranked list of threats by severity
5. **Recommended Mitigations** — Actionable items referencing AGENT_RULES.md rules
6. **Residual Risks** — Threats accepted or deferred

### 6. Standards Mapping

Map each identified threat to:
- **CWE ID** (from CWE Top 25 when applicable)
- **OWASP ASVS chapter** (V1-V17)
- **NIST control** (SP 800-53 Rev 5)

## Example Usage

> "Generate a threat model for the user authentication module of our REST API"

> "Analyze the data flow between our mobile app and the payment gateway"

> "Threat model the CI/CD pipeline including GitHub Actions and Docker registry"

## References

- [AGENT_RULES.md](../../AGENT_RULES.md) — Security rules and STRIDE template
- [policies/owasp_asvs.yaml](../../policies/owasp_asvs.yaml) — ASVS verification checklist
- [policies/cwe_top25.yaml](../../policies/cwe_top25.yaml) — CWE Top 25 mappings
