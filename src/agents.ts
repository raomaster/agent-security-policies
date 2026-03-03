// src/agents.ts — Agent configuration definitions

export interface AgentConfig {
    /** Display name */
    name: string;
    /** CLI flag value */
    id: string;
    /** Description shown in --list and interactive mode */
    description: string;
    /** Relative path to the config file (from target directory) */
    configPath: string;
    /** Generate the config file content */
    generateConfig: (instructions: string) => string;
    /** Directories to create before writing config */
    directories: string[];
    /** Skill installation config */
    skillFormat: SkillFormat;
}

export type SkillFormat =
    | { type: "copy"; destPattern: string }       // e.g. .agent/skills/{skill}/SKILL.md
    | { type: "strip-frontmatter"; destPattern: string }  // e.g. .claude/commands/{skill}.md
    | { type: "append"; destFile: string }         // e.g. append to AGENTS.md
    | { type: "none" };

export const SUPPORTED_AGENTS: AgentConfig[] = [
    {
        id: "copilot",
        name: "GitHub Copilot",
        description: "VS Code + JetBrains",
        configPath: ".github/copilot-instructions.md",
        directories: [".github"],
        generateConfig: (instructions) =>
            `# Security Policy Instructions\n\n${instructions}\n`,
        skillFormat: {
            type: "strip-frontmatter",
            destPattern: ".github/prompts/{skill}.prompt.md",
        },
    },
    {
        id: "codex",
        name: "Codex CLI",
        description: "OpenAI",
        configPath: "AGENTS.md",
        directories: [],
        generateConfig: (instructions) =>
            `# Project Agent Instructions\n\n## Security Policy\n\n${instructions}\n`,
        skillFormat: { type: "append", destFile: "AGENTS.md" },
    },
    {
        id: "claude",
        name: "Claude CLI",
        description: "Anthropic",
        configPath: "CLAUDE.md",
        directories: [],
        generateConfig: (instructions) =>
            `# Project Instructions\n\n## Security Policy\n\n${instructions}\n`,
        skillFormat: {
            type: "strip-frontmatter",
            destPattern: ".claude/commands/{skill}.md",
        },
    },
    {
        id: "antigravity",
        name: "Antigravity",
        description: "Google Gemini",
        configPath: ".agent/rules/security.md",
        directories: [".agent", ".agent/rules"],
        generateConfig: (instructions) =>
            `---\ndescription: Security policy — OWASP ASVS, CWE Top 25, NIST SSDF\nalwaysApply: true\n---\n\n${instructions}\n`,
        skillFormat: {
            type: "copy",
            destPattern: ".agent/skills/{skill}/SKILL.md",
        },
    },
];

export const SKILLS_LIST = [
    { id: "sast-scan", tool: "Semgrep", description: "CWE code vulnerabilities" },
    { id: "secrets-scan", tool: "Gitleaks", description: "Hardcoded credentials" },
    { id: "dependency-scan", tool: "Trivy", description: "CVE in dependencies" },
    { id: "container-scan", tool: "Trivy", description: "CVE in containers" },
    { id: "iac-scan", tool: "Trivy", description: "IaC misconfigurations" },
    { id: "threat-model", tool: "Agent", description: "STRIDE threat modeling" },
    { id: "fix-findings", tool: "Agent", description: "Remediate scan findings" },
];

export const PROFILES = [
    { id: "standard", description: "Full rules (~3K tokens)", file: "AGENT_RULES.md" },
    { id: "lite", description: "Compact rules (~1K tokens)", file: "AGENT_RULES_LITE.md" },
];

export const INSTRUCTIONS_BLOCK = `Follow ALL security and code quality rules defined in AGENT_RULES.md.

Key mandatory rules:
- Apply OWASP ASVS 5.0.0 verification checklist to every change
- Prevent all CWE/SANS Top 25 2025 weaknesses
- Use typed exceptions — never bare except
- Never hardcode secrets (CWE-798)
- Validate all inputs at trust boundaries (CWE-20)
- shell=False in subprocess calls (CWE-78)
- Parameterized queries only — never concatenate SQL (CWE-89)
- Type hints + docstrings on all public APIs
- Structured logging with correlation IDs
- STRIDE threat model for new features

Reference policies/ for detailed YAML security rulesets:
- policies/base_policy.yaml — 11 security domains
- policies/owasp_asvs.yaml — ASVS 5.0.0 (V1-V17)
- policies/cwe_top25.yaml — CWE/SANS Top 25 2025
- policies/llm_security.yaml — OWASP LLM Top 10 2025`;

export const POLICY_FILES = [
    "base_policy.yaml",
    "owasp_asvs.yaml",
    "owasp_masvs.yaml",
    "cwe_top25.yaml",
    "llm_security.yaml",
];

export function getAgentById(id: string): AgentConfig | undefined {
    return SUPPORTED_AGENTS.find((a) => a.id === id);
}

export function getAllAgentIds(): string[] {
    return SUPPORTED_AGENTS.map((a) => a.id);
}
