# agent-security-policies installer (PowerShell)
# Zero dependencies - requires only PowerShell 5.1+ (built into Windows 10+)
#
# Usage:
#   irm https://raw.githubusercontent.com/raomaster/agent-security-policies/main/install.ps1 | iex
#   .\install.ps1 -All
#   .\install.ps1 -All -Skills
#   .\install.ps1 -Agent copilot,codex,claude,antigravity
#   .\install.ps1 -Agent copilot,claude -Target C:\path\to\project
#   .\install.ps1 -All -Profile lite

[CmdletBinding()]
param(
    [switch]$All,
    [string]$Agent = "",
    [switch]$Skills,
    [ValidateSet("standard", "lite")]
    [Alias("Profile")]
    [string]$RuleProfile = "standard",
    [string]$Target = ".",
    [switch]$Help
)

$SkillsList = @("sast-scan", "secrets-scan", "dependency-scan", "container-scan", "iac-scan", "threat-model", "fix-findings")

$ErrorActionPreference = "Stop"

# --- Config ---
$RepoUrl = "https://raw.githubusercontent.com/raomaster/agent-security-policies/main"

# --- Helpers ---
function Write-Info { param([string]$Msg) Write-Host "  i " -ForegroundColor Blue -NoNewline; Write-Host $Msg }
function Write-Ok { param([string]$Msg) Write-Host "  + " -ForegroundColor Green -NoNewline; Write-Host $Msg }
function Write-Warn { param([string]$Msg) Write-Host "  ! " -ForegroundColor Yellow -NoNewline; Write-Host $Msg }
function Write-Err { param([string]$Msg) Write-Host "  X " -ForegroundColor Red -NoNewline; Write-Host $Msg }
function Write-Step { param([string]$Msg) Write-Host "`n-- $Msg --" -ForegroundColor White }

function Show-Usage {
    Write-Host ""
    Write-Host "  agent-security-policies installer"
    Write-Host ""
    Write-Host "  Usage:"
    Write-Host "    install.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "  Options:"
    Write-Host "    -All                Install for all supported agents (includes skills)"
    Write-Host "    -Agent [list]       Comma-separated: copilot,codex,claude,antigravity"
    Write-Host "    -Skills             Also install security skills"
    Write-Host "    -Profile [name]     Rule profile: standard (~3K tokens) or lite (~1K tokens)"
    Write-Host "    -Target [dir]       Target project directory (default: current directory)"
    Write-Host "    -Help               Show this help"
    Write-Host ""
    Write-Host "  Examples:"
    Write-Host "    install.ps1 -All"
    Write-Host "    install.ps1 -All -Skills"
    Write-Host "    install.ps1 -Agent copilot,claude -Skills"
    Write-Host "    install.ps1 -Agent codex -Target .\my-project"
    Write-Host "    install.ps1 -All -Profile lite"
    Write-Host ""
    Write-Host "  Supported agents:"
    Write-Host "    copilot       GitHub Copilot (VS Code + JetBrains)"
    Write-Host "    codex         OpenAI Codex CLI"
    Write-Host "    claude        Claude CLI (Claude Code)"
    Write-Host "    antigravity   Google Antigravity (Gemini)"
    Write-Host ""
    Write-Host "  Skills (use -Skills to install):"
    Write-Host "    sast-scan         Semgrep - CWE code vulnerabilities"
    Write-Host "    secrets-scan      Gitleaks - hardcoded credentials"
    Write-Host "    dependency-scan   Trivy fs - CVE in dependencies"
    Write-Host "    container-scan    Trivy image - CVE in containers"
    Write-Host "    iac-scan          KICS - IaC misconfigurations"
    Write-Host "    threat-model      STRIDE threat modeling (agent-only)"
    Write-Host "    fix-findings      Remediate findings from any scan"
    Write-Host ""
    exit 0
}

# --- Parse args ---
if ($Help) { Show-Usage }

if ($All) {
    $Agent = "copilot,codex,claude,antigravity"
    $Skills = $true
}

if ([string]::IsNullOrWhiteSpace($Agent)) {
    Write-Host "`n  agent-security-policies - Secure coding rules for AI agents`n"
    Write-Host "  No agents specified. Use -All or -Agent [list]`n"
    Show-Usage
}

$TargetDir = (Resolve-Path $Target).Path

# --- Detect source mode ---
$ScriptDir = $PSScriptRoot
$LocalMode = $false

if ($ScriptDir -and (Test-Path "$ScriptDir\AGENT_RULES.md")) {
    $LocalMode = $true
    Write-Info "Local mode - reading from $ScriptDir"
}
else {
    Write-Info "Remote mode - downloading from GitHub"
}

# --- Fetch file helper ---
function Get-PolicyFile {
    param([string]$FileName, [string]$Dest)

    if ($LocalMode) {
        Copy-Item "$ScriptDir\$FileName" -Destination $Dest -Force
    }
    else {
        Invoke-RestMethod -Uri "$RepoUrl/$FileName" -OutFile $Dest
    }
}

# --- Shared instructions block ---
$InstructionsBlock = @"
Follow ALL security and code quality rules defined in AGENT_RULES.md.

Key mandatory rules:
- Apply OWASP ASVS 5.0.0 verification checklist to every change
- Prevent all CWE/SANS Top 25 2025 weaknesses
- Use typed exceptions - never bare except
- Never hardcode secrets (CWE-798)
- Validate all inputs at trust boundaries (CWE-20)
- shell=False in subprocess calls (CWE-78)
- Parameterized queries only - never concatenate SQL (CWE-89)
- Type hints + docstrings on all public APIs
- Structured logging with correlation IDs
- STRIDE threat model for new features

Reference policies/ for detailed YAML security rulesets:
- policies/base_policy.yaml - 11 security domains
- policies/owasp_asvs.yaml - ASVS 5.0.0 (V1-V17)
- policies/cwe_top25.yaml - CWE/SANS Top 25 2025
- policies/llm_security.yaml - OWASP LLM Top 10 2025
"@

# --- Step 1: Copy core files ---
Write-Step "Installing security policies to $TargetDir"

# AGENT_RULES.md (standard or lite based on profile)
if ($RuleProfile -eq "lite") {
    $RulesFile = "AGENT_RULES_LITE.md"
    $RulesDest = "AGENT_RULES_LITE.md"
}
else {
    $RulesFile = "AGENT_RULES.md"
    $RulesDest = "AGENT_RULES.md"
}

if (Test-Path "$TargetDir\$RulesDest") {
    Write-Warn "$RulesDest already exists - skipping (non-destructive)"
}
else {
    Get-PolicyFile $RulesFile "$TargetDir\$RulesDest"
    Write-Ok "$RulesDest (profile: $RuleProfile)"
}

# Also copy full rules if installing lite (for reference)
if ($RuleProfile -eq "lite" -and -not (Test-Path "$TargetDir\AGENT_RULES.md")) {
    Get-PolicyFile "AGENT_RULES.md" "$TargetDir\AGENT_RULES.md"
    Write-Ok "AGENT_RULES.md (full reference)"
}

# policies/
$PoliciesDir = Join-Path $TargetDir "policies"
if (-not (Test-Path $PoliciesDir)) { New-Item -ItemType Directory -Path $PoliciesDir -Force | Out-Null }

$PolicyFiles = @("base_policy.yaml", "owasp_asvs.yaml", "owasp_masvs.yaml", "cwe_top25.yaml", "llm_security.yaml")
foreach ($policy in $PolicyFiles) {
    $dest = Join-Path $PoliciesDir $policy
    if (Test-Path $dest) {
        Write-Warn "policies/$policy already exists - skipping"
    }
    else {
        Get-PolicyFile "policies/$policy" $dest
        Write-Ok "policies/$policy"
    }
}

# --- Step 2: Generate agent-specific configs ---
$AgentList = $Agent -split ',' | ForEach-Object { $_.Trim() }

foreach ($ag in $AgentList) {
    switch ($ag) {

        # -- GitHub Copilot --
        "copilot" {
            Write-Step "Configuring GitHub Copilot"
            $ghDir = Join-Path $TargetDir ".github"
            $copilotFile = Join-Path $ghDir "copilot-instructions.md"
            if (-not (Test-Path $ghDir)) { New-Item -ItemType Directory -Path $ghDir -Force | Out-Null }

            if (Test-Path $copilotFile) {
                $content = Get-Content $copilotFile -Raw -ErrorAction SilentlyContinue
                if ($content -and $content -match "AGENT_RULES\.md") {
                    Write-Warn ".github/copilot-instructions.md already references AGENT_RULES.md - skipping"
                }
                else {
                    $appendText = "`n`n<!-- agent-security-policies -->`n$InstructionsBlock"
                    Add-Content -Path $copilotFile -Value $appendText
                    Write-Ok ".github/copilot-instructions.md - appended security rules"
                }
            }
            else {
                $copilotContent = "# Security Policy Instructions`n`n$InstructionsBlock"
                Set-Content -Path $copilotFile -Value $copilotContent
                Write-Ok ".github/copilot-instructions.md - created"
            }
        }

        # -- Codex CLI --
        "codex" {
            Write-Step "Configuring Codex CLI"
            $codexFile = Join-Path $TargetDir "AGENTS.md"

            if (Test-Path $codexFile) {
                $content = Get-Content $codexFile -Raw -ErrorAction SilentlyContinue
                if ($content -and $content -match "AGENT_RULES\.md") {
                    Write-Warn "AGENTS.md already references AGENT_RULES.md - skipping"
                }
                else {
                    $appendText = "`n`n<!-- agent-security-policies -->`n## Security Policy`n`n$InstructionsBlock"
                    Add-Content -Path $codexFile -Value $appendText
                    Write-Ok "AGENTS.md - appended security rules"
                }
            }
            else {
                $codexContent = "# Project Agent Instructions`n`n## Security Policy`n`n$InstructionsBlock"
                Set-Content -Path $codexFile -Value $codexContent
                Write-Ok "AGENTS.md - created"
            }
        }

        # -- Claude CLI --
        "claude" {
            Write-Step "Configuring Claude CLI"
            $claudeFile = Join-Path $TargetDir "CLAUDE.md"

            if (Test-Path $claudeFile) {
                $content = Get-Content $claudeFile -Raw -ErrorAction SilentlyContinue
                if ($content -and $content -match "AGENT_RULES\.md") {
                    Write-Warn "CLAUDE.md already references AGENT_RULES.md - skipping"
                }
                else {
                    $appendText = "`n`n<!-- agent-security-policies -->`n## Security Policy`n`n$InstructionsBlock"
                    Add-Content -Path $claudeFile -Value $appendText
                    Write-Ok "CLAUDE.md - appended security rules"
                }
            }
            else {
                $claudeContent = "# Project Instructions`n`n## Security Policy`n`n$InstructionsBlock"
                Set-Content -Path $claudeFile -Value $claudeContent
                Write-Ok "CLAUDE.md - created"
            }
        }

        # -- Antigravity --
        "antigravity" {
            Write-Step "Configuring Antigravity (Gemini)"
            $rulesDir = Join-Path $TargetDir ".agent\rules"
            $agFile = Join-Path $rulesDir "security.md"
            if (-not (Test-Path $rulesDir)) { New-Item -ItemType Directory -Path $rulesDir -Force | Out-Null }

            if (Test-Path $agFile) {
                Write-Warn ".agent/rules/security.md already exists - skipping"
            }
            else {
                $agContent = @"
---
description: Security policy - OWASP ASVS, CWE Top 25, NIST SSDF
alwaysApply: true
---

$InstructionsBlock
"@
                Set-Content -Path $agFile -Value $agContent
                Write-Ok ".agent/rules/security.md - created (always-on rule)"
            }
        }

        default {
            Write-Warn "Unknown agent: $ag - skipping (supported: copilot, codex, claude, antigravity)"
        }
    }
}

# --- Step 3: Install skills if requested ---
if ($Skills) {
    Write-Step "Installing security skills"

    # Copy skills/ directory
    $skillsDir = Join-Path $TargetDir "skills"
    if (-not (Test-Path $skillsDir)) { New-Item -ItemType Directory -Path $skillsDir -Force | Out-Null }

    foreach ($skill in $SkillsList) {
        $skillDir = Join-Path $skillsDir $skill
        if (-not (Test-Path $skillDir)) { New-Item -ItemType Directory -Path $skillDir -Force | Out-Null }
        $skillFile = Join-Path $skillDir "SKILL.md"
        if (Test-Path $skillFile) {
            Write-Warn "skills/$skill/SKILL.md already exists - skipping"
        }
        else {
            Get-PolicyFile "skills/$skill/SKILL.md" $skillFile
            Write-Ok "skills/$skill/SKILL.md"
        }
    }

    # Helper: strip YAML frontmatter
    function Remove-YamlFrontmatter {
        param([string]$Content)
        if ($Content -match '^---') {
            $lines = $Content -split "`n"
            $inFrontmatter = $false
            $pastFrontmatter = $false
            $result = @()
            foreach ($line in $lines) {
                if (-not $pastFrontmatter -and $line -match '^---') {
                    if ($inFrontmatter) {
                        $pastFrontmatter = $true
                        continue
                    }
                    $inFrontmatter = $true
                    continue
                }
                if ($pastFrontmatter -or -not $inFrontmatter) {
                    $result += $line
                }
            }
            return ($result -join "`n").TrimStart()
        }
        return $Content
    }

    # Install skills per agent
    foreach ($ag in $AgentList) {
        switch ($ag) {

            # Antigravity - native SKILL.md format
            "antigravity" {
                Write-Step "Installing skills for Antigravity"
                foreach ($skill in $SkillsList) {
                    $agSkillDir = Join-Path $TargetDir ".agent\skills\$skill"
                    if (-not (Test-Path $agSkillDir)) { New-Item -ItemType Directory -Path $agSkillDir -Force | Out-Null }
                    $agSkillFile = Join-Path $agSkillDir "SKILL.md"
                    if (Test-Path $agSkillFile) {
                        Write-Warn ".agent/skills/$skill/SKILL.md already exists - skipping"
                    }
                    else {
                        Copy-Item (Join-Path $skillsDir "$skill\SKILL.md") -Destination $agSkillFile
                        Write-Ok ".agent/skills/$skill/SKILL.md"
                    }
                }
            }

            # Claude CLI - slash commands
            "claude" {
                Write-Step "Installing skills for Claude CLI"
                $claudeCmdsDir = Join-Path $TargetDir ".claude\commands"
                if (-not (Test-Path $claudeCmdsDir)) { New-Item -ItemType Directory -Path $claudeCmdsDir -Force | Out-Null }
                foreach ($skill in $SkillsList) {
                    $cmdFile = Join-Path $claudeCmdsDir "$skill.md"
                    if (Test-Path $cmdFile) {
                        Write-Warn ".claude/commands/$skill.md already exists - skipping"
                    }
                    else {
                        $raw = Get-Content (Join-Path $skillsDir "$skill\SKILL.md") -Raw
                        $stripped = Remove-YamlFrontmatter $raw
                        Set-Content -Path $cmdFile -Value $stripped
                        Write-Ok ".claude/commands/$skill.md"
                    }
                }
            }

            # Copilot - prompt files
            "copilot" {
                Write-Step "Installing skills for Copilot"
                $promptsDir = Join-Path $TargetDir ".github\prompts"
                if (-not (Test-Path $promptsDir)) { New-Item -ItemType Directory -Path $promptsDir -Force | Out-Null }
                foreach ($skill in $SkillsList) {
                    $promptFile = Join-Path $promptsDir "$skill.prompt.md"
                    if (Test-Path $promptFile) {
                        Write-Warn ".github/prompts/$skill.prompt.md already exists - skipping"
                    }
                    else {
                        $raw = Get-Content (Join-Path $skillsDir "$skill\SKILL.md") -Raw
                        $stripped = Remove-YamlFrontmatter $raw
                        Set-Content -Path $promptFile -Value $stripped
                        Write-Ok ".github/prompts/$skill.prompt.md"
                    }
                }
            }

            # Codex CLI - append to AGENTS.md
            "codex" {
                Write-Step "Installing skills for Codex CLI"
                $codexFile = Join-Path $TargetDir "AGENTS.md"
                foreach ($skill in $SkillsList) {
                    $existingContent = if (Test-Path $codexFile) { Get-Content $codexFile -Raw -ErrorAction SilentlyContinue } else { "" }
                    if ($existingContent -and $existingContent -match "skill:$skill") {
                        Write-Warn "AGENTS.md already contains $skill skill - skipping"
                    }
                    else {
                        $raw = Get-Content (Join-Path $skillsDir "$skill\SKILL.md") -Raw
                        $stripped = Remove-YamlFrontmatter $raw
                        $appendText = "`n`n<!-- skill:$skill -->`n$stripped"
                        Add-Content -Path $codexFile -Value $appendText
                        Write-Ok "AGENTS.md - appended $skill skill"
                    }
                }
            }
        }
    }
}

# --- Summary ---
Write-Step "Done!"
Write-Host ""
Write-Info "Files installed in: $TargetDir"
Write-Info "Agents configured: $Agent"
Write-Info "Profile: $RuleProfile"
if ($Skills) { Write-Info "Skills installed: $($SkillsList -join ', ')" }
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    1. Commit the new files to your repository"
Write-Host "    2. Your AI agent will automatically detect the security rules"
Write-Host "    3. Read AGENT_RULES.md for the full security ruleset"
if ($Skills) { Write-Host "    4. Try a skill: ask your agent to run sast-scan or threat-model" }
Write-Host ""
Write-Host "  Docs: " -NoNewline
Write-Host "https://github.com/raomaster/agent-security-policies" -ForegroundColor Blue
