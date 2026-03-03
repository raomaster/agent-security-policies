// src/installer.ts — Core installation logic (ported from install.sh)

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
    SUPPORTED_AGENTS,
    SKILLS_LIST,
    POLICY_FILES,
    PROFILES,
    INSTRUCTIONS_BLOCK,
    getAgentById,
    type AgentConfig,
} from "./agents.js";
import { info, ok, warn, err, step } from "./logger.js";

// ─── Package root (where AGENT_RULES.md, policies/, skills/ live) ────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, "..");

// ─── Types ──────────────────────────────────────────────────────────
export interface InstallOptions {
    agents: string[];
    profile: string;
    skills: boolean;
    target: string;
}

// ─── Helpers ────────────────────────────────────────────────────────
function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyIfMissing(src: string, dest: string, label: string): boolean {
    if (fs.existsSync(dest)) {
        warn(`${label} already exists — skipping`);
        return false;
    }
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    ok(label);
    return true;
}

function stripYamlFrontmatter(content: string): string {
    const lines = content.split("\n");
    if (lines[0]?.trim() !== "---") return content;

    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "---") {
            endIndex = i;
            break;
        }
    }

    if (endIndex === -1) return content;
    return lines.slice(endIndex + 1).join("\n").trimStart();
}

// ─── Step 1: Core files ─────────────────────────────────────────────
function installCoreFiles(targetDir: string, profile: string): void {
    step(`Installing security policies to ${targetDir}`);

    // Find profile config
    const profileConfig = PROFILES.find((p) => p.id === profile) ?? PROFILES[0];
    const rulesFile = profileConfig.file;

    // Copy AGENT_RULES*.md
    const rulesSrc = path.join(PACKAGE_ROOT, rulesFile);
    const rulesDest = path.join(targetDir, rulesFile);
    copyIfMissing(rulesSrc, rulesDest, `${rulesFile} (profile: ${profile})`);

    // If lite profile, also copy full rules for reference
    if (profile === "lite") {
        const fullSrc = path.join(PACKAGE_ROOT, "AGENT_RULES.md");
        const fullDest = path.join(targetDir, "AGENT_RULES.md");
        copyIfMissing(fullSrc, fullDest, "AGENT_RULES.md (full reference)");
    }

    // Copy policies/
    const policiesDir = path.join(targetDir, "policies");
    ensureDir(policiesDir);
    for (const policy of POLICY_FILES) {
        const src = path.join(PACKAGE_ROOT, "policies", policy);
        const dest = path.join(policiesDir, policy);
        copyIfMissing(src, dest, `policies/${policy}`);
    }
}

// ─── Step 2: Agent configs ──────────────────────────────────────────
function installAgentConfigs(targetDir: string, agentIds: string[]): void {
    for (const agentId of agentIds) {
        const agent = getAgentById(agentId);
        if (!agent) {
            warn(`Unknown agent: ${agentId} — skipping`);
            continue;
        }

        step(`Configuring ${agent.name} (${agent.description})`);

        // Create required directories
        for (const dir of agent.directories) {
            ensureDir(path.join(targetDir, dir));
        }

        const configPath = path.join(targetDir, agent.configPath);

        if (fs.existsSync(configPath)) {
            const existing = fs.readFileSync(configPath, "utf-8");
            if (existing.includes("AGENT_RULES.md")) {
                warn(`${agent.configPath} already references AGENT_RULES.md — skipping`);
            } else {
                // Append to existing file
                const appendText = `\n\n<!-- agent-security-policies -->\n${INSTRUCTIONS_BLOCK}\n`;
                fs.appendFileSync(configPath, appendText, "utf-8");
                ok(`${agent.configPath} — appended security rules`);
            }
        } else {
            ensureDir(path.dirname(configPath));
            const content = agent.generateConfig(INSTRUCTIONS_BLOCK);
            fs.writeFileSync(configPath, content, "utf-8");
            ok(`${agent.configPath} — created`);
        }
    }
}

// ─── Step 3: Skills ─────────────────────────────────────────────────
function installSkills(targetDir: string, agentIds: string[]): void {
    step("Installing security skills");

    // Copy skills/ directory
    const skillsDir = path.join(targetDir, "skills");
    ensureDir(skillsDir);

    for (const skill of SKILLS_LIST) {
        const src = path.join(PACKAGE_ROOT, "skills", skill.id, "SKILL.md");
        const destDir = path.join(skillsDir, skill.id);
        const dest = path.join(destDir, "SKILL.md");
        ensureDir(destDir);
        copyIfMissing(src, dest, `skills/${skill.id}/SKILL.md`);
    }

    // Install skills per agent format
    for (const agentId of agentIds) {
        const agent = getAgentById(agentId);
        if (!agent) continue;

        const format = agent.skillFormat;
        if (format.type === "none") continue;

        step(`Installing skills for ${agent.name}`);

        for (const skill of SKILLS_LIST) {
            const skillSrc = path.join(targetDir, "skills", skill.id, "SKILL.md");
            if (!fs.existsSync(skillSrc)) continue;

            const skillContent = fs.readFileSync(skillSrc, "utf-8");

            switch (format.type) {
                case "copy": {
                    const destPath = path.join(
                        targetDir,
                        format.destPattern.replace("{skill}", skill.id)
                    );
                    ensureDir(path.dirname(destPath));
                    if (fs.existsSync(destPath)) {
                        warn(`${format.destPattern.replace("{skill}", skill.id)} already exists — skipping`);
                    } else {
                        fs.copyFileSync(skillSrc, destPath);
                        ok(format.destPattern.replace("{skill}", skill.id));
                    }
                    break;
                }

                case "strip-frontmatter": {
                    const destPath = path.join(
                        targetDir,
                        format.destPattern.replace("{skill}", skill.id)
                    );
                    ensureDir(path.dirname(destPath));
                    if (fs.existsSync(destPath)) {
                        warn(`${format.destPattern.replace("{skill}", skill.id)} already exists — skipping`);
                    } else {
                        const stripped = stripYamlFrontmatter(skillContent);
                        fs.writeFileSync(destPath, stripped, "utf-8");
                        ok(format.destPattern.replace("{skill}", skill.id));
                    }
                    break;
                }

                case "append": {
                    const destPath = path.join(targetDir, format.destFile);
                    if (fs.existsSync(destPath)) {
                        const existing = fs.readFileSync(destPath, "utf-8");
                        if (existing.includes(`skill:${skill.id}`)) {
                            warn(`${format.destFile} already contains ${skill.id} — skipping`);
                            continue;
                        }
                    }
                    const stripped = stripYamlFrontmatter(skillContent);
                    const appendText = `\n\n<!-- skill:${skill.id} -->\n${stripped}`;
                    fs.appendFileSync(destPath, appendText, "utf-8");
                    ok(`${format.destFile} — appended ${skill.id} skill`);
                    break;
                }
            }
        }
    }
}

// ─── Summary ────────────────────────────────────────────────────────
function printSummary(opts: InstallOptions): void {
    step("Done!");
    console.log("");
    info(`Files installed in: ${path.resolve(opts.target)}`);
    info(`Agents configured: ${opts.agents.join(", ")}`);
    info(`Profile: ${opts.profile}`);
    if (opts.skills) {
        info(`Skills installed: ${SKILLS_LIST.map((s) => s.id).join(", ")}`);
    }
    console.log("");
    console.log("  Next steps:");
    console.log("    1. Commit the new files to your repository");
    console.log("    2. Your AI agent will automatically detect the security rules");
    console.log("    3. Read AGENT_RULES.md for the full security ruleset");
    if (opts.skills) {
        console.log(
            "    4. Try a skill: ask your agent to run sast-scan or threat-model"
        );
    }
    console.log("");
    console.log("  Docs: https://github.com/raomaster/agent-security-policies");
    console.log("");
}

// ─── Main entry ─────────────────────────────────────────────────────
export function install(opts: InstallOptions): void {
    const targetDir = path.resolve(opts.target);

    // Validate target exists
    if (!fs.existsSync(targetDir)) {
        err(`Target directory does not exist: ${targetDir}`);
        process.exit(1);
    }

    // Validate profile
    if (!PROFILES.some((p) => p.id === opts.profile)) {
        err(`Invalid profile: ${opts.profile} (supported: ${PROFILES.map((p) => p.id).join(", ")})`);
        process.exit(1);
    }

    // Validate agents
    const validAgentIds = SUPPORTED_AGENTS.map((a) => a.id);
    for (const agent of opts.agents) {
        if (!validAgentIds.includes(agent)) {
            warn(`Unknown agent: ${agent} — will be skipped`);
        }
    }

    // Step 1: Core files
    installCoreFiles(targetDir, opts.profile);

    // Step 2: Agent configs
    installAgentConfigs(targetDir, opts.agents);

    // Step 3: Skills
    if (opts.skills) {
        installSkills(targetDir, opts.agents);
    }

    // Summary
    printSummary(opts);
}
