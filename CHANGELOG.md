# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.4.2] — 2026-03-05

### Changed

- `--help` now shows default values for `--skills`, `--profile`, `--gitignore`
- README: "Configuration Profiles" renamed to "Enforcement Levels" — clarifies these are manual instruction snippets independent of `--profile` (which controls token budget)
- README: reordered Quick Install examples — interactive mode is now listed second after `--all`

## [1.4.1] — 2026-03-05

### Added

- `--gitignore` CLI flag — adds all installed files to `.gitignore` with idempotent comment markers (`# >>> agent-security-policies >>>` / `# <<< agent-security-policies <<<`)
- Interactive mode now asks "Add installed files to .gitignore?" (default: No)
- Pre-install safety check — when existing agent config files are detected (e.g. `CLAUDE.md`, `AGENTS.md`), the installer shows a notice explaining that content will be appended (not replaced) and asks for confirmation before proceeding

### Changed

- `install()` is now async to support the interactive confirmation prompt
- `printSummary()` shows "Commit the updated .gitignore" when `--gitignore` is active

## [1.4.0] — 2026-03-03

### Added

- `npx agent-security-policies` CLI tool — cross-platform TypeScript installer, zero runtime dependencies
  - `--all` — install for all supported agents + security skills
  - `--agent <list>` — comma-separated agent selection (copilot, codex, claude, antigravity)
  - `--skills` — install security skills pack
  - `--profile standard|lite` — select token-optimized rule profile
  - `--target <dir>` — install to a specific project directory
  - `--list` — show available agents, profiles, and skills
  - Interactive mode when invoked with no flags
- `package.json`, `tsconfig.json`, `src/` — TypeScript CLI source (Node.js 18+)

### Changed

- `README.md` — added `npx` as the recommended (cross-platform) install method in Quick Install

## [Unreleased]

### Added

- `skills/README.md` — Skills Design and Creation Guide: anatomy of a `SKILL.md`, step-by-step process to add new skills, design principles (zero deps, one tool per skill, agent-agnostic)

### Changed

- `install.sh` and `install.ps1` — `--all` / `-All` now also install security skills to satisfy roadmap v1.3 delivery flow
- `README.md` — professional rewrite: shields.io badges, stronger value proposition, full Table of Contents, `## Agent Setup` section grouping all 10 agents as `###` sub-headings, Skills table with tool/output columns, Lite profile, Contributing and License footer sections
- `README.md` — fixed heading "método universal" → "universal method"
- `README.md` — Quick Install now documents that `--all` includes the skills pack by default
- `CONTRIBUTING.md` — added section 3 "Add or Improve Security Skills" with link to `skills/README.md`; sections renumbered to maintain correct order (1–5)
- `ROADMAP.md` — v1.3 (`Security Skills`) moved to Completed with deliverables marked as implemented

## [1.1.0] — 2026-02-15

### Changed

- `README.md` — canonical delivery model changed to repo-root paths (`AGENT_RULES.md`, `policies/`) with explicit delivery options
- `README.md` — added MASVS policy in contents and mobile scope guidance
- `AGENT_RULES.md` — ASVS references aligned to 5.0.0 with V1-V17 checklist
- `policies/owasp_asvs.yaml` — replaced old V1-V14 structure with ASVS 5.0.0-aligned V1-V17 categories
- `TODO.md` — ASVS checklist entry updated to V1-V17

### Added

- `policies/owasp_masvs.yaml` — OWASP MASVS 2.1.0 control checklist for mobile applications

## [1.0.0] — 2025-02-14

### Added

- `AGENT_RULES.md` — Main system prompt covering 10 industry standards
  - 11 mandatory security rule domains
  - Code quality requirements
  - STRIDE threat modeling template
  - OWASP ASVS 5.0 audit checklist (V1-V14)
  - Severity scoring (CRITICAL → INFO) with verdict criteria
  - CWE/SANS Top 25 2025 quick reference table
  - Standards reference with links
- `README.md` — Setup instructions for 10 AI agents/IDEs
  - GitHub Copilot (VS Code + JetBrains)
  - Cursor
  - Windsurf
  - Claude (Projects + API)
  - ChatGPT / GPT API
  - Gemini Code Assist / Antigravity
  - Cline / Roo Code
  - Aider
  - Continue.dev
  - OpenCode / PEA Engine
- `policies/base_policy.yaml` — 11 security domains with rules
- `policies/owasp_asvs.yaml` — ASVS 5.0 chapter-by-chapter checklist
- `policies/cwe_top25.yaml` — All 25 CWE/SANS 2025 entries with prevention
- `policies/llm_security.yaml` — OWASP LLM Top 10 2025 controls
- `CONTRIBUTING.md` — Contribution guidelines
- `LICENSE` — Apache 2.0
- `TODO.md` — Public roadmap
