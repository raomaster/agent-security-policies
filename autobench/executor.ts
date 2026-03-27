import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ScanFinding } from './types.js';
import type { SkillDef } from './skill.js';

// ─── Execute tool following skill instructions ──────────────────────

export function executeTool(
  skill: SkillDef,
  caseDir: string,
  file: string
): ScanFinding[] {
  const filePath = resolve(caseDir, file);
  if (!existsSync(filePath)) return [];

  switch (skill.tool) {
    case 'semgrep':
      return runSemgrep(caseDir, file, filePath);
    case 'gitleaks':
      return runGitleaks(caseDir, file, filePath);
    default:
      return [];
  }
}

// ─── Semgrep (following sast-scan SKILL.md instructions) ────────────

function runSemgrep(caseDir: string, file: string, filePath: string): ScanFinding[] {
  const useDocker = canUseDocker();
  const cmd = useDocker ? 'docker' : 'semgrep';
  const args = useDocker
    ? ['run', '--rm', '-v', `${caseDir}:/src`, 'semgrep/semgrep:latest',
       'semgrep', 'scan', '--config=auto', '--json', '--quiet', `/src/${file}`]
    : ['scan', '--config=auto', '--json', '--quiet', filePath];

  try {
    const stdout = execFileSync(cmd, args, {
      timeout: 60_000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    const report = JSON.parse(stdout);
    return (report.results || []).map((r: any) => ({
      tool: 'semgrep' as const,
      file: r.path?.replace(caseDir + '/', '') || file,
      line: r.start?.line || 0,
      column: r.start?.col,
      endLine: r.end?.line,
      cwe: extractCwe(r.extra?.metadata?.cwe),
      severity: r.extra?.severity || 'WARNING',
      message: r.extra?.message || '',
      ruleId: r.check_id || '',
      confidence: r.extra?.metadata?.confidence === 'HIGH' ? 90 : 50
    }));
  } catch {
    return [];
  }
}

// ─── Gitleaks (following secrets-scan SKILL.md instructions) ────────

function runGitleaks(caseDir: string, file: string, filePath: string): ScanFinding[] {
  const useDocker = canUseDocker();
  const reportPath = `/tmp/gitleaks-${Date.now()}.json`;

  const cmd = useDocker ? 'docker' : 'gitleaks';
  const args = useDocker
    ? ['run', '--rm', '-v', `${caseDir}:/src`, 'zricethezav/gitleaks:latest',
       'detect', '--source=/src', '--report-format=json', `--report-path=${reportPath}`, '--no-git', '--exit-code=0']
    : ['detect', `--source=${caseDir}`, '--report-format=json', `--report-path=${reportPath}`, '--no-git', '--exit-code=0'];

  try {
    execFileSync(cmd, args, { timeout: 30_000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

    if (!useDocker && existsSync(reportPath)) {
      const { readFileSync, unlinkSync } = require('node:fs');
      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
      unlinkSync(reportPath);
      return report
        .filter((f: any) => f.File === file || f.File?.endsWith('/' + file))
        .map((f: any) => ({
          tool: 'gitleaks' as const,
          file: f.File || file,
          line: f.StartLine || 0,
          cwe: 'CWE-798',
          severity: 'HIGH' as const,
          message: f.Description || f.RuleID || 'Secret detected',
          ruleId: f.RuleID || ''
        }));
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function canUseDocker(): boolean {
  try {
    execFileSync('docker', ['--version'], { timeout: 5000, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function extractCwe(cweField: any): string {
  if (!cweField) return 'UNKNOWN';
  const arr = Array.isArray(cweField) ? cweField : [cweField];
  const first = String(arr[0]);
  const match = first.match(/CWE-?(\d+)/);
  return match ? `CWE-${match[1].padStart(3, '0')}` : first;
}
