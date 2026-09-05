import pyBaseline from '@/reports/PY-INTERVAL-001/baseline.json';
import pyMutant from '@/reports/PY-INTERVAL-001/mutant.json';
import pyGolden from '@/reports/PY-INTERVAL-001/golden.json';
import cppBaseline from '@/reports/CPP-TOPK-001/baseline.json';
import cppMutant from '@/reports/CPP-TOPK-001/mutant.json';
import cppGolden from '@/reports/CPP-TOPK-001/golden.json';
import tsBaseline from '@/reports/TS-BATCHER-001/baseline.json';
import tsMutant from '@/reports/TS-BATCHER-001/mutant.json';
import tsGolden from '@/reports/TS-BATCHER-001/golden.json';
import javaBaseline from '@/reports/JAVA-LEDGER-001/baseline.json';
import javaMutant from '@/reports/JAVA-LEDGER-001/mutant.json';
import javaGolden from '@/reports/JAVA-LEDGER-001/golden.json';
import rustBaseline from '@/reports/RUST-PLANNER-001/baseline.json';
import rustMutant from '@/reports/RUST-PLANNER-001/mutant.json';
import rustGolden from '@/reports/RUST-PLANNER-001/golden.json';

export type Candidate = 'baseline' | 'mutant' | 'golden';
export type ReportPhase = {
  name: string;
  status: string;
  duration_ms: number;
  exit_code: number;
  output: string;
  points: number;
};
export type EvaluationReport = {
  task_id: string;
  candidate: string;
  verdict: string;
  score: number;
  seed: number;
  artifact_digest: string;
  canonical_digest: string;
  phases: ReportPhase[];
};
export type RepoTask = {
  id: string;
  label: string;
  title: string;
  kind: 'BUG FIX' | 'PERFORMANCE' | 'FEATURE' | 'REFACTOR';
  language: string;
  tone: 'lime' | 'cyan' | 'violet' | 'orange' | 'blue';
  difficulty: string;
  issue: string;
  localReports: boolean;
  repositoryPath: string;
};

export const repoTasks: RepoTask[] = [
  {
    id: 'JAVA-LEDGER-001',
    label: 'Concurrent ledger repair',
    title: 'Repair lost concurrent credits',
    kind: 'BUG FIX',
    language: 'Java',
    tone: 'lime',
    difficulty: 'Expert',
    issue:
      'Apply every positive credit exactly once under contention, keep balance reads thread-safe, reject negative amounts, and preserve the public API.',
    localReports: true,
    repositoryPath: 'tasks/java/concurrent-ledger',
  },
  {
    id: 'RUST-PLANNER-001',
    label: 'Dependency planner refactor',
    title: 'Remove recursive stack growth',
    kind: 'REFACTOR',
    language: 'Rust',
    tone: 'cyan',
    difficulty: 'Expert',
    issue:
      'Replace recursive graph traversal with a deterministic iterative planner that survives deep graphs and reports concrete cycle witnesses.',
    localReports: true,
    repositoryPath: 'tasks/rust/dependency-planner',
  },
  {
    id: 'PY-INTERVAL-001',
    label: 'Interval reconciliation',
    title: 'Repair half-open interval reconciliation',
    kind: 'BUG FIX',
    language: 'Python',
    tone: 'violet',
    difficulty: 'Medium',
    issue:
      'Merge unordered half-open windows, reject reversed intervals, discard empty intervals, and preserve the caller’s input.',
    localReports: true,
    repositoryPath: 'tasks/python/interval-ledger',
  },
  {
    id: 'CPP-TOPK-001',
    label: 'Streaming top-k optimization',
    title: 'Bound streaming top-k work',
    kind: 'PERFORMANCE',
    language: 'C++',
    tone: 'orange',
    difficulty: 'Hard',
    issue:
      'Replace full sorting with O(n log k) comparison work while preserving duplicates and edge-case behavior.',
    localReports: true,
    repositoryPath: 'tasks/cpp/streaming-topk',
  },
  {
    id: 'TS-BATCHER-001',
    label: 'Async event batcher',
    title: 'Make async batches re-entrancy safe',
    kind: 'FEATURE',
    language: 'TypeScript',
    tone: 'blue',
    difficulty: 'Hard',
    issue:
      'Guarantee exactly-once ordered delivery during active flushes and retain failed batches for retry.',
    localReports: true,
    repositoryPath: 'tasks/typescript/event-batcher',
  },
];

export const reports: Record<
  string,
  Partial<Record<Candidate, EvaluationReport>>
> = {
  'JAVA-LEDGER-001': {
    baseline: javaBaseline as EvaluationReport,
    mutant: javaMutant as EvaluationReport,
    golden: javaGolden as EvaluationReport,
  },
  'RUST-PLANNER-001': {
    baseline: rustBaseline as EvaluationReport,
    mutant: rustMutant as EvaluationReport,
    golden: rustGolden as EvaluationReport,
  },
  'PY-INTERVAL-001': {
    baseline: pyBaseline as EvaluationReport,
    mutant: pyMutant as EvaluationReport,
    golden: pyGolden as EvaluationReport,
  },
  'CPP-TOPK-001': {
    baseline: cppBaseline as EvaluationReport,
    mutant: cppMutant as EvaluationReport,
    golden: cppGolden as EvaluationReport,
  },
  'TS-BATCHER-001': {
    baseline: tsBaseline as EvaluationReport,
    mutant: tsMutant as EvaluationReport,
    golden: tsGolden as EvaluationReport,
  },
};
