// ─── Benchmark Definitions ───────────────────────────────────────────

export interface GroundTruthFinding {
  line: number;
  cwe: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface BenchmarkCase {
  id: string;
  file: string;
  language: string;
  cwe: string;
  vulnerable: boolean;
  findings: GroundTruthFinding[];
  note?: string;
}

export interface BenchmarkGroup {
  cwe: string;
  name: string;
  category: string;
  cases: BenchmarkCase[];
}

export interface BenchmarkManifest {
  version: string;
  generated: string;
  totalCases: number;
  groups: { cwe: string; name: string; caseCount: number; dir: string }[];
}

// ─── Scan Results ────────────────────────────────────────────────────

export interface ScanFinding {
  tool: 'semgrep' | 'gitleaks' | 'trivy' | 'kics';
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  cwe: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  message: string;
  ruleId: string;
  confidence?: number;
}

export interface ScanResult {
  tool: 'semgrep' | 'gitleaks' | 'trivy' | 'kics';
  findings: ScanFinding[];
  durationMs: number;
  exitCode: number;
  stderr?: string;
}

// ─── Evaluation Metrics ─────────────────────────────────────────────

export interface Metrics {
  cwe: string;
  tool: string;
  caseId: string;
  language: string;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1: number;
  durationMs: number;
}

export interface AggregateMetrics {
  totalCases: number;
  totalTp: number;
  totalFp: number;
  totalFn: number;
  totalTn: number;
  precision: number;
  recall: number;
  f1: number;
  byCwe: Map<string, { precision: number; recall: number; f1: number; count: number }>;
  byTool: Map<string, { precision: number; recall: number; f1: number; count: number }>;
}

export interface RunResult {
  runId: number;
  timestamp: string;
  aggregate: AggregateMetrics;
  metrics: Metrics[];
  durationMs: number;
}

// ─── Fix Proposals ──────────────────────────────────────────────────

export interface FixProposal {
  caseId: string;
  cwe: string;
  finding: ScanFinding;
  originalCode: string;
  proposedFix: string;
  explanation: string;
  provider: 'openai' | 'anthropic';
  model: string;
  tokensUsed: number;
}

export interface FixVerification {
  proposal: FixProposal;
  applied: boolean;
  resolved: boolean;
  newFindings: ScanFinding[];
  error?: string;
}

// ─── Auto-Learning ──────────────────────────────────────────────────

export interface Improvement {
  target: 'skill' | 'policy' | 'rules' | 'semgrepignore';
  file: string;
  description: string;
  diff: string;
}

export interface IterationResult {
  iteration: number;
  timestamp: string;
  improvement: Improvement | null;
  beforeMetrics: AggregateMetrics;
  afterMetrics: AggregateMetrics;
  status: 'keep' | 'discard' | 'crash';
  scoreDelta: number;
}

// ─── CLI Options ────────────────────────────────────────────────────

export interface BenchOptions {
  cwe?: string[];
  tool?: string[];
  limit?: number;
  fix?: boolean;
  provider?: 'openai' | 'anthropic';
  loop?: boolean;
  iterations?: number;
  dashboard?: boolean;
  verbose?: boolean;
}

// ─── Dashboard Data ─────────────────────────────────────────────────

export interface DashboardData {
  generated: string;
  totalRuns: number;
  latestRun: RunResult | null;
  history: { runId: number; timestamp: string; f1: number; precision: number; recall: number }[];
  byCwe: { cwe: string; name: string; precision: number; recall: number; f1: number }[];
  byTool: { tool: string; precision: number; recall: number; f1: number; fpRate: number }[];
}
