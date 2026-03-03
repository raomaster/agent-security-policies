# Agent Security Skills

Security Skills are standardized, executable actions that an AI agent can perform to evaluate, analyze, or remediate code within this project.

By providing atomic, well-defined tools, we allow agents to apply security policies deterministically.

## Anatomy of a Skill

Each skill resides in its own directory (e.g., `skills/sast-scan/`) and must contain a `SKILL.md` file. The agent will read this file to understand when and how to execute the skill.

A well-formed `SKILL.md` contains the following structure:

1. **YAML Frontmatter**: Defines `name` and a short `description` for the agent.
2. **Prerequisites**: Installation requirements. **Docker must be provided as the primary option** to guarantee a zero-dependency local environment.
3. **Run Instructions**: The exact CLI commands the agent should run. The command must output structured data (like JSON or XML) rather than plain text.
4. **Output Format**: Documentation of the expected output schema (or at least the most critical fields) and a severity mapping table (e.g., `ERROR` -> `CRITICAL/HIGH`).
5. **Interpret Results**: A step-by-step textual algorithm telling the agent how to parse the output and what to look for (like CWE IDs).
6. **Common Findings & Rules**: A mapping table connecting the tool's specific findings to a standardized CWE and an existing rule in `AGENT_RULES.md`.
7. **Next Steps**: How to chain skills. For example, instruct the agent to use `fix-findings` after reviewing the output.

## How to Add a New Skill

1. **Create the directory**: Make a new folder `skills/[skill-name]/`. Keep the name short and lowercase, using hyphens (e.g., `unit-test`, `quality-scan`).
2. **Create `SKILL.md`**: Start with the YAML frontmatter.
3. **Define the CLI execution**: Ensure the tool can be run via Docker. You can provide alternative local installation methods as secondary options.
4. **Enforce structured output**: If the tool supports `--json`, `--sarif`, or similar flags, mandate their use in the **Run Instructions** section.
5. **Write the mapping table**: This is the most important part! Map the tool's output patterns to CWEs and existing rules in `AGENT_RULES.md`. Without this, the agent won't be able to enforce the project's security policies based on the scan.
6. **Submit a Pull Request**: Add your skill to the `ROADMAP.md` (if applicable) and open a PR.

## Design Principles for Skills

- **One tool per skill**: Do not mix multiple scanners (like Semgrep and Trivy) in a single skill. Create `sast-scan` and `container-scan` separately.
- **Zero dependencies**: Ensure users don't need to install Python, Node, or specific CLI tools locally. Docker is the preferred execution layer.
- **Agent-Agnostic**: Skills must be written in simple, declarative markdown so any agent (Copilot, Claude, Antigravity) can understand and execute them.
