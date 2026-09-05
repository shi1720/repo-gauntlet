'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Boxes,
  Braces,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  ExternalLink,
  FileCode2,
  Gauge,
  GitBranch,
  Layers3,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  TimerReset,
  TriangleAlert,
  Wrench,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  reports,
  repoTasks,
  type Candidate,
  type EvaluationReport,
  type RepoTask,
} from '@/lib/forge-data';

type View = 'workbench' | 'architecture' | 'methodology';
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<unknown>;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

export function RepoShell() {
  const [selectedId, setSelectedId] = useState('PY-INTERVAL-001');
  const [candidate, setCandidate] = useState<Candidate>('golden');
  const [view, setView] = useState<View>('workbench');
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState(4);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const task = useMemo(
    () => repoTasks.find((item) => item.id === selectedId) ?? repoTasks[2],
    [selectedId],
  );
  const report = reports[selectedId]?.[candidate];

  const replay = useCallback(
    async (taskId = selectedId, nextCandidate: Candidate = candidate) => {
      const artifact = reports[taskId]?.[nextCandidate];
      if (!artifact) throw new Error(`No committed local report for ${taskId}`);
      setSelectedId(taskId);
      setCandidate(nextCandidate);
      setView('workbench');
      setRunning(true);
      setVisible(0);
      if (timer.current) clearInterval(timer.current);
      await new Promise<void>((resolve) => {
        let phase = 0;
        timer.current = setInterval(() => {
          phase += 1;
          setVisible(phase);
          if (phase >= artifact.phases.length) {
            if (timer.current) clearInterval(timer.current);
            setRunning(false);
            resolve();
          }
        }, 220);
      });
      return {
        task_id: artifact.task_id,
        candidate: artifact.candidate,
        verdict: artifact.verdict,
        score: artifact.score,
        canonical_digest: artifact.canonical_digest,
      };
    },
    [candidate, selectedId],
  );

  const playCalibration = useCallback(async () => {
    for (const nextCandidate of [
      'baseline',
      'mutant',
      'golden',
    ] as Candidate[]) {
      await replay(selectedId, nextCandidate);
    }
  }, [replay, selectedId]);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'replay_committed_evaluation',
          title: 'Replay committed evaluation',
          description:
            'Replay a real, checked-in RepoGauntlet report and update the visible workbench.',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', enum: Object.keys(reports) },
              candidate: {
                type: 'string',
                enum: ['baseline', 'mutant', 'golden'],
              },
            },
            required: ['task_id', 'candidate'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: async (input) => {
            const value = input as { task_id?: string; candidate?: Candidate };
            if (
              !value.task_id ||
              !value.candidate ||
              !reports[value.task_id]?.[value.candidate]
            )
              throw new Error(
                'Choose an available task and candidate artifact',
              );
            return replay(value.task_id, value.candidate);
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [replay]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/30">
      <Header view={view} onView={setView} />
      {view === 'workbench' ? (
        <Workbench
          task={task}
          selectedId={selectedId}
          candidate={candidate}
          report={report}
          running={running}
          visible={visible}
          onSelect={(id) => {
            setSelectedId(id);
            setCandidate('golden');
            setVisible(4);
            setRunning(false);
          }}
          onCandidate={(value) => {
            setCandidate(value);
            setVisible(4);
            setRunning(false);
          }}
          onReplay={() => void replay()}
          onPlayCalibration={() => void playCalibration()}
        />
      ) : view === 'architecture' ? (
        <Architecture />
      ) : (
        <Methodology />
      )}
    </main>
  );
}

function Header({
  view,
  onView,
}: {
  view: View;
  onView: (value: View) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#070b13]/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1540px] items-center justify-between gap-4 px-4 py-3 sm:px-7">
        <button
          onClick={() => onView('workbench')}
          className="flex items-center gap-3 text-left"
        >
          <span className="grid size-9 place-items-center rounded-xl border border-lime-300/35 bg-lime-300/10">
            <Braces className="size-5 text-lime-300" />
          </span>
          <span>
            <span className="flex items-baseline gap-2">
              <span className="font-semibold tracking-[-.025em]">
                RepoGauntlet
              </span>
              <span className="rounded-full border border-white/10 px-2 py-.5 font-mono text-[10px] text-slate-400">
                v0.2.0
              </span>
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-[.16em] text-slate-500">
              Coding benchmark quality control
            </span>
          </span>
        </button>
        <nav
          aria-label="Primary navigation"
          className="hidden items-center rounded-lg border border-white/7 bg-white/[.02] p-1 md:flex"
        >
          {(['workbench', 'architecture', 'methodology'] as View[]).map(
            (item) => (
              <button
                key={item}
                aria-current={view === item ? 'page' : undefined}
                onClick={() => onView(item)}
                className={`rounded-md px-3 py-1.5 text-xs capitalize transition ${view === item ? 'bg-white/[.08] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {item}
              </button>
            ),
          )}
        </nav>
        <a
          href="https://github.com/shi1720/repo-gauntlet"
          className="flex items-center gap-2 text-xs text-slate-300 transition hover:text-white"
        >
          <GitBranch className="size-4" />
          <span className="hidden sm:inline">Source</span>
        </a>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="grid grid-cols-3 border-t border-white/7 px-3 py-2 md:hidden"
      >
        {(['workbench', 'architecture', 'methodology'] as View[]).map(
          (item) => (
            <button
              key={item}
              aria-current={view === item ? 'page' : undefined}
              onClick={() => onView(item)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs capitalize ${view === item ? 'bg-white/[.08] text-white' : 'text-slate-400'}`}
            >
              {item}
            </button>
          ),
        )}
      </nav>
    </header>
  );
}

function Workbench({
  task,
  selectedId,
  candidate,
  report,
  running,
  visible,
  onSelect,
  onCandidate,
  onReplay,
  onPlayCalibration,
}: {
  task: RepoTask;
  selectedId: string;
  candidate: Candidate;
  report?: EvaluationReport;
  running: boolean;
  visible: number;
  onSelect: (id: string) => void;
  onCandidate: (value: Candidate) => void;
  onReplay: () => void;
  onPlayCalibration: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1540px] space-y-4 p-4 sm:p-7">
      <section className="value-band panel relative overflow-hidden p-5 sm:p-6">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(420px,.65fr)] lg:items-center">
          <div>
            <p className="eyebrow text-lime-300">For coding-agent task authors</p>
            <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-[-.04em] text-white sm:text-3xl">
              Prove a coding task works before an AI sees it.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              RepoGauntlet confirms the broken code fails, an incomplete fix is
              rejected, the reference fix passes, and repeated runs produce the
              same normalized outcome.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-white/9 bg-black/20">
              <ProofNumber value="5" label="languages" />
              <ProofNumber value="5" label="task packs" />
              <ProofNumber value="15" label="controls" />
            </div>
            <Button
              onClick={onPlayCalibration}
              disabled={running || !task.localReports}
              className="h-full min-h-14 bg-lime-300 px-4 font-semibold text-[#091006] hover:bg-lime-200"
            >
              {running ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
              <span className="hidden sm:inline">Play calibration</span>
              <span className="sm:hidden">Play</span>
            </Button>
          </div>
        </div>
      </section>

      <nav
        aria-label="Choose a task"
        className="panel flex gap-2 overflow-x-auto p-2 lg:hidden"
      >
        {repoTasks.map((item) => (
          <button
            key={item.id}
            aria-current={selectedId === item.id ? 'page' : undefined}
            onClick={() => onSelect(item.id)}
            className={`min-h-11 shrink-0 rounded-lg px-3 text-left text-xs ${selectedId === item.id ? 'bg-lime-300/10 text-lime-200 ring-1 ring-lime-300/25' : 'bg-white/[.025] text-slate-300'}`}
          >
            <span className="block font-medium">{item.language}</span>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              {item.kind}
            </span>
          </button>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[292px_minmax(0,1fr)] xl:grid-cols-[292px_minmax(0,1fr)_300px]">
      <aside className="panel hidden overflow-hidden lg:block">
        <div className="flex items-center justify-between border-b border-white/8 p-4">
          <p className="eyebrow">Task catalog</p>
          <span className="font-mono text-xs text-slate-400">05 / 05</span>
        </div>
        <div className="space-y-1 p-2">
          {repoTasks.map((item) => (
            <button
              key={item.id}
              aria-current={selectedId === item.id ? 'page' : undefined}
              onClick={() => onSelect(item.id)}
              className={`task-row w-full text-left ${selectedId === item.id ? 'task-row-active' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-slate-400">
                  {item.id}
                </span>
                <span className={`task-kind task-kind-${item.tone}`}>
                  {item.kind}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100">{item.label}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Code2 className="size-3.5" />
                  {item.language}
                </span>
                <ChevronRight className="size-3.5" />
              </div>
            </button>
          ))}
        </div>
        <div className="m-3 rounded-xl border border-dashed border-white/10 bg-white/[.015] p-4">
          <div className="flex gap-3">
            <Boxes className="mt-0.5 size-4 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-200">
                What this page shows
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-400">
                Saved evaluator reports from the repository—not code running in
                your browser.
              </p>
            </div>
          </div>
        </div>
      </aside>
      <section className="min-w-0 space-y-4">
        <div className="panel overflow-hidden">
          <div className="border-b border-white/8 p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="status-pill">
                    <GitBranch className="size-3" />
                    {task.id}
                  </span>
                  <span className="status-pill">
                    <Wrench className="size-3" />
                    {task.kind}
                  </span>
                  <span className="status-pill">
                    <Gauge className="size-3" />
                    {task.difficulty}
                  </span>
                </div>
                <h1 className="max-w-2xl text-2xl font-semibold tracking-[-.035em] text-white sm:text-[2rem]">
                  {task.title}
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-300">
                  {task.issue}
                </p>
              </div>
              <Button
                onClick={onReplay}
                disabled={running || !report}
                className="h-11 shrink-0 bg-lime-300 px-5 font-semibold text-[#091006] hover:bg-lime-200 disabled:bg-slate-700 disabled:text-slate-300"
              >
                {running ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
                {report
                  ? running
                    ? 'Replaying…'
                    : 'Replay saved run'
                  : 'CLI required'}
              </Button>
            </div>
            {task.localReports && (
              <CandidateRail
                task={task}
                candidate={candidate}
                onCandidate={onCandidate}
              />
            )}
          </div>
          {report ? (
            <ReportPanel report={report} visible={visible} running={running} />
          ) : (
            <Unavailable task={task} />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Signal
            icon={ShieldCheck}
            label="Only solution files can change"
            detail="Blocks path escapes, symlinks, and oversized files"
          />
          <Signal
            icon={TimerReset}
            label="Repeatability check"
            detail="Three reference runs must share one outcome fingerprint"
          />
          <Signal
            icon={Zap}
            label="Separate quality gate"
            detail="Distinct checks earn points; redundant checks earn zero"
          />
        </div>
      </section>
      <ScorePanel task={task} candidate={candidate} report={report} />
      </div>
    </div>
  );
}

function ProofNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-white/8 px-3 py-3 text-center last:border-r-0">
      <span className="block font-mono text-lg font-semibold text-white">
        {value}
      </span>
      <span className="block text-[11px] text-slate-400">{label}</span>
    </div>
  );
}

function CandidateRail({
  task,
  candidate,
  onCandidate,
}: {
  task: RepoTask;
  candidate: Candidate;
  onCandidate: (value: Candidate) => void;
}) {
  const controls: Array<{
    id: Candidate;
    label: string;
    expectation: string;
    success: string;
  }> = [
    {
      id: 'baseline',
      label: 'Broken baseline',
      expectation: 'must fail',
      success: 'Defect detected',
    },
    {
      id: 'mutant',
      label: 'Incomplete fix',
      expectation: 'must fail',
      success: 'Shortcut rejected',
    },
    {
      id: 'golden',
      label: 'Reference fix',
      expectation: 'must pass ×3',
      success: 'Task is solvable',
    },
  ];

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="eyebrow">Calibration proof</p>
        <p className="hidden text-xs text-slate-400 sm:block">
          Select a control to inspect its saved evidence
        </p>
      </div>
      <fieldset
        aria-label="Calibration control"
        className="grid gap-2 sm:grid-cols-3"
      >
        {controls.map((control, index) => {
          const controlReport = reports[task.id]?.[control.id];
          const valid = controlReport
            ? control.id === 'golden'
              ? controlReport.verdict === 'RESOLVED'
              : controlReport.verdict === 'TEST_FAILED'
            : false;
          return (
            <label
              key={control.id}
              className={`control-choice relative min-h-20 cursor-pointer rounded-xl border p-3 text-left transition ${candidate === control.id ? 'border-lime-300/35 bg-lime-300/[.07] shadow-[inset_0_0_0_1px_rgba(190,242,100,.08)]' : 'border-white/8 bg-black/15 hover:border-white/15 hover:bg-white/[.025]'}`}
            >
              <input
                type="radio"
                name="calibration-control"
                value={control.id}
                checked={candidate === control.id}
                onChange={() => onCandidate(control.id)}
                className="sr-only"
              />
              {index < controls.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-5 rounded-full border border-white/8 bg-[#0c121d] p-1 text-slate-500 sm:block" />
              )}
              <span className="flex items-start justify-between gap-2">
                <span>
                  <span className="block text-sm font-semibold text-slate-100">
                    {control.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {control.expectation}
                  </span>
                </span>
                <span
                  className={`mt-0.5 size-2.5 shrink-0 rounded-full ${valid ? 'bg-lime-300 shadow-[0_0_14px_rgba(190,242,100,.55)]' : 'bg-slate-600'}`}
                />
              </span>
              <span
                className={`mt-2 flex items-center gap-1.5 text-xs ${valid ? 'text-lime-200' : 'text-slate-500'}`}
              >
                {valid && <Check className="size-3.5" />}
                {controlReport ? control.success : 'Report not bundled'}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

function ReportPanel({
  report,
  visible,
  running,
}: {
  report: EvaluationReport;
  visible: number;
  running: boolean;
}) {
  const shown = report.phases.slice(0, visible);
  const totalMs = report.phases.reduce(
    (sum, phase) => sum + phase.duration_ms,
    0,
  );
  return (
    <div className="grid md:grid-cols-[1fr_240px]">
      <div className="border-b border-white/8 p-5 md:border-b-0 md:border-r sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow">Saved evaluation run</p>
          <span
            aria-live="polite"
            className={`flex items-center gap-1.5 font-mono text-[11px] ${running ? 'text-cyan-300' : report.verdict === 'RESOLVED' ? 'text-lime-300' : 'text-amber-300'}`}
          >
            <Activity className="size-3.5" />
            {running ? 'REPLAYING' : report.verdict}
          </span>
        </div>
        <div className="terminal-grid min-h-[270px] overflow-hidden rounded-xl border border-white/8 bg-[#05080e]">
          <div className="flex items-center justify-between border-b border-white/7 px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-red-400/60" />
              <span className="size-2 rounded-full bg-amber-300/60" />
              <span className="size-2 rounded-full bg-lime-300/60" />
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              seed: {report.seed} / {report.candidate}
            </span>
          </div>
          <div className="space-y-3 p-4 font-mono text-xs leading-5 text-slate-300 sm:p-5">
            {shown.map((phase) => (
              <div key={phase.name} className="trace-line">
                <p>
                  <span
                    className={
                      phase.status === 'passed'
                        ? 'text-lime-300'
                        : phase.status === 'skipped'
                          ? 'text-slate-400'
                          : 'text-amber-300'
                    }
                  >
                    {phase.status === 'passed'
                      ? '✓'
                      : phase.status === 'skipped'
                        ? '–'
                        : '!'}
                  </span>{' '}
                  {phaseLabel(phase.name).padEnd(13)} {phase.status}{' '}
                  <span className="text-slate-500">{phase.duration_ms}ms</span>
                </p>
                {phase.output && (
                  <p className="ml-4 mt-1 line-clamp-2 whitespace-pre-wrap text-[11px] text-slate-400">
                    {lastMeaningfulLine(phase.output)}
                  </p>
                )}
              </div>
            ))}
            {!running && (
              <div
                className={`border-l-2 px-3 py-2 ${report.verdict === 'RESOLVED' ? 'border-lime-300/40 bg-lime-300/[.04] text-lime-100/80' : 'border-amber-300/40 bg-amber-300/[.04] text-amber-100/80'}`}
              >
                score {report.score.toFixed(1)} / 100 · outcome fingerprint{' '}
                {report.canonical_digest.slice(0, 12)}…
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <p className="eyebrow mb-4">Phase results</p>
        <div className="space-y-4">
          {report.phases.map((phase, index) => (
            <div
              key={phase.name}
              className={index < visible ? 'opacity-100' : 'opacity-25'}
            >
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="capitalize text-slate-400">
                  {phaseLabel(phase.name)}
                </span>
                <span
                  className={
                    phase.status === 'passed'
                      ? 'text-lime-300'
                      : 'text-amber-300'
                  }
                >
                  {phase.points} pts
                </span>
              </div>
              <Progress
                aria-label={`${phase.name} score`}
                value={index < visible ? phase.points : 0}
                max={phaseMaximum(report, phase.name)}
                className="h-1.5 bg-white/7 [&_[data-slot=progress-indicator]]:bg-lime-300"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Metric icon={Clock3} value={`${totalMs}ms`} label="Recorded time" />
          <Metric
            icon={FileCode2}
            value={report.artifact_digest.slice(0, 7)}
            label="Bundle fingerprint"
          />
        </div>
      </div>
    </div>
  );
}

function Unavailable({ task }: { task: RepoTask }) {
  return (
    <div className="grid min-h-[390px] place-items-center p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-12 place-items-center rounded-xl border border-white/8 bg-white/[.025]">
          <Terminal className="size-5 text-slate-300" />
        </span>
        <h2 className="mt-5 font-semibold text-white">
          Run this pack with {task.language}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          This static release does not invent a result for a toolchain that was
          unavailable on the authoring host. The source, graders, controls, and
          CI job are ready; use the documented CLI or inspect the workflow
          result.
        </p>
        <code className="mt-5 block rounded-lg bg-black/30 px-3 py-2 text-xs text-lime-300">
          repogauntlet validate {task.id}
        </code>
      </div>
    </div>
  );
}
function ScorePanel({
  task,
  candidate,
  report,
}: {
  task: RepoTask;
  candidate: Candidate;
  report?: EvaluationReport;
}) {
  const expectedResult = report
    ? candidate === 'golden'
      ? report.verdict === 'RESOLVED'
      : report.verdict === 'TEST_FAILED'
    : false;
  const interpretation =
    candidate === 'baseline'
      ? 'Expected failure — the defect is observable.'
      : candidate === 'mutant'
        ? 'Expected failure — the shortcut is rejected.'
        : 'Expected pass — the task is solvable and repeatable.';
  const repository = 'https://github.com/shi1720/repo-gauntlet';
  const implementation =
    candidate === 'baseline'
      ? `${task.repositoryPath}/source`
      : `${task.repositoryPath}/candidates/${candidate}`;
  const evidence = [
    ['Task manifest', `${repository}/blob/main/${task.repositoryPath}/task.json`],
    ['Grader tests', `${repository}/tree/main/${task.repositoryPath}/grader`],
    ['Selected code', `${repository}/tree/main/${implementation}`],
    ['Raw report', `${repository}/blob/main/reports/${task.id}/${candidate}.json`],
    ['Polyglot CI', `${repository}/actions/workflows/ci.yml`],
  ];

  return (
    <aside className="panel hidden overflow-hidden xl:block">
      <div className="border-b border-white/8 p-5">
        <p className="eyebrow">Selected candidate score</p>
        <div className="mt-4 flex items-end gap-2">
          <span className="font-mono text-5xl font-semibold tracking-[-.07em] text-white">
            {report ? report.score.toFixed(1) : '—'}
          </span>
          {report && (
            <span className="mb-1.5 text-sm text-slate-400">/ 100</span>
          )}
        </div>
        {report && (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/7">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lime-300"
              style={{ width: `${report.score}%` }}
            />
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="eyebrow mb-3">Calibration meaning</p>
        {report ? (
          <div
            className={`rounded-xl border p-3 ${expectedResult ? 'border-lime-300/20 bg-lime-300/[.055]' : 'border-rose-300/20 bg-rose-300/[.055]'}`}
          >
            <p
              className={`flex items-start gap-2 text-sm font-medium leading-5 ${expectedResult ? 'text-lime-200' : 'text-rose-200'}`}
            >
              {expectedResult ? (
                <Check className="mt-0.5 size-4 shrink-0" />
              ) : (
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              )}
              {expectedResult ? interpretation : 'Calibration control failed.'}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              A low candidate score can be the correct outcome when testing a
              broken or incomplete solution.
            </p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-400">
            No browser artifact is bundled for this toolchain.
          </p>
        )}
      </div>
      <div className="border-t border-white/8 p-5">
        <p className="eyebrow mb-3">Inspect the evidence</p>
        <div className="space-y-1">
          {evidence.map(([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-10 items-center justify-between rounded-lg px-2.5 text-sm text-slate-300 transition hover:bg-white/[.04] hover:text-white"
            >
              {label}
              <ExternalLink className="size-3.5 text-slate-500" />
            </a>
          ))}
        </div>
      </div>
      <div className="mx-5 border-t border-white/8 py-5">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-cyan-300" />
          <p className="text-xs leading-5 text-slate-400">
            Scores, verdicts, timings, and fingerprints come from repository
            reports regenerated in CI.
          </p>
        </div>
      </div>
    </aside>
  );
}

function phaseMaximum(
  report: EvaluationReport,
  phaseName: EvaluationReport['phases'][number]['name'],
) {
  return (
    reports[report.task_id]?.golden?.phases.find(
      (phase) => phase.name === phaseName,
    )?.points || 1
  );
}

function Architecture() {
  const steps = [
    [FileCode2, 'Task pack', 'Frozen source + strict manifest'],
    [ShieldCheck, 'Overlay firewall', 'Paths, size, and symlink checks'],
    [
      Terminal,
      'Fresh workspaces',
      'Temporary directory per phase; commands still run on the host',
    ],
    [Activity, 'Four real commands', 'Build, public, held-out, quality'],
    [GitBranch, 'Canonical report', 'Bundle + normalized outcome fingerprints'],
  ] as const;
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-7 sm:py-16">
      <div className="mb-10 max-w-3xl">
        <p className="eyebrow mb-4">Implemented architecture</p>
        <h1 className="text-3xl font-semibold tracking-[-.04em] text-white sm:text-5xl">
          How a coding task earns trust.
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-300">
          RepoGauntlet verifies evaluation design before a task is used to train
          or assess a coding agent. The local runner is intentionally scoped to
          trusted authors and CI—not arbitrary hostile submissions.
        </p>
      </div>
      <div className="panel grid gap-px overflow-hidden bg-white/8 lg:grid-cols-5">
        {steps.map(([Icon, title, text], index) => (
          <div key={title} className="relative bg-[#0b111b] p-6">
            <div className="mb-8 flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-white/[.045]">
                <Icon className="size-5 text-lime-300" />
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                0{index + 1}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
            {index < 4 && (
              <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-5 rounded-full bg-[#0b111b] p-1 text-slate-400 lg:block" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="panel p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <Layers3 className="size-5 text-cyan-300" />
            <h2 className="font-semibold text-white">Current trust boundary</h2>
          </div>
          <p className="text-sm leading-6 text-slate-300">
            Safe for repository owners, reviewers, and CI that trust the task
            pack. Arbitrary third-party code needs the documented rootless OCI
            or microVM boundary before deployment.
          </p>
        </div>
        <div className="panel p-6 sm:p-8">
          <p className="eyebrow mb-5">Emitted verdicts</p>
          <div className="flex flex-wrap gap-2">
            {[
              'PATCH_REJECTED',
              'BUILD_FAILED',
              'TEST_FAILED',
              'QUALITY_FAILED',
              'TIMEOUT',
              'INFRA_ERROR',
              'RESOLVED',
            ].map((item) => (
              <span key={item} className="status-pill">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function Methodology() {
  const skills = [
    [
      'Python 3',
      'Runner, schema validation, timeout cleanup, and safe file overlays',
    ],
    ['Java', 'Thread-safe ledger; stress tests reject lost updates'],
    [
      'Rust',
      'Iterative planning handles 50,000-deep graphs and reports cycle paths',
    ],
    ['C++', 'Top-k selection meets a deterministic O(n log k) comparison budget'],
    ['TypeScript', 'Exactly-once async batching plus the interactive report UI'],
    [
      'Engineering',
      'Bug fixes, features, refactoring, optimization, tests, CI, and documentation',
    ],
  ];
  return (
    <section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-7 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="eyebrow mb-4">Calibration methodology</p>
          <h1 className="text-3xl font-semibold tracking-[-.04em] text-white sm:text-5xl">
            A benchmark must test its own tests.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Broken code must fail for the intended reason. A plausible shortcut
            must also fail. The reviewed reference must pass three times with
            one normalized outcome fingerprint.
          </p>
          <div className="mt-8 space-y-3">
            <Control
              icon={TriangleAlert}
              label="Broken baseline"
              detail="Untouched source builds, then exposes the defect"
              tone="amber"
            />
            <Control
              icon={Wrench}
              label="Incomplete fix"
              detail="A plausible shortcut builds, then gets rejected"
              tone="cyan"
            />
            <Control
              icon={Check}
              label="Reference fix × 3"
              detail="Every phase passes with one outcome fingerprint"
              tone="lime"
            />
          </div>
        </div>
        <div className="panel overflow-hidden">
          <div className="border-b border-white/8 p-5">
            <p className="eyebrow">Skill-to-evidence map</p>
          </div>
          {skills.map(([name, evidence]) => (
            <div
              key={name}
              className="grid gap-2 border-b border-white/7 p-5 last:border-0 sm:grid-cols-[130px_1fr]"
            >
              <span className="font-mono text-sm text-lime-300">{name}</span>
              <span className="text-sm leading-6 text-slate-300">
                {evidence}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Signal
          icon={CircleDot}
          label="Baseline defect"
          detail="Proves the issue is observable"
        />
        <Signal
          icon={GitBranch}
          label="Negative control"
          detail="Rejects a plausible incomplete solution"
        />
        <Signal
          icon={Gauge}
          label="Quality command"
          detail="Runs independently after behavior passes"
        />
      </div>
    </section>
  );
}

function lastMeaningfulLine(output: string) {
  return (
    output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? ''
  );
}
function phaseLabel(name: string) {
  return name === 'hidden_tests'
    ? 'held-out tests'
    : name.replace('_', ' ');
}
function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock3;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-white/7 bg-white/[.025] p-3">
      <Icon className="mb-2 size-3.5 text-slate-400" />
      <p className="font-mono text-sm text-slate-200">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}
function Signal({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Clock3;
  label: string;
  detail: string;
}) {
  return (
    <div className="panel flex items-start gap-3 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[.035]">
        <Icon className="size-4 text-slate-300" />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-200">
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-400">
          {detail}
        </span>
      </span>
    </div>
  );
}
function Control({
  icon: Icon,
  label,
  detail,
  tone,
}: {
  icon: typeof Check;
  label: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/7 bg-white/[.02] p-4">
      <Icon
        className={`size-5 ${tone === 'lime' ? 'text-lime-300' : tone === 'amber' ? 'text-amber-300' : 'text-cyan-300'}`}
      />
      <span>
        <span className="block text-sm font-medium text-slate-200">
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-slate-400">{detail}</span>
      </span>
    </div>
  );
}
