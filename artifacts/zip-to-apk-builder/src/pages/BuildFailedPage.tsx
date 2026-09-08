import React, { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import {
  AlertCircle,
  RotateCcw,
  Terminal,
  FileCode2,
  ArrowLeft,
  ChevronDown,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { BuilderTerrain } from '../components/BuilderTerrain';
import { TerminalPanel } from '../components/TerminalPanel';
import {
  getStoredProjects,
  ProjectItem,
  BuildJobItem,
} from '../services/mockData';

export const BuildFailedPage: React.FC = () => {
  const [, params] = useRoute('/build/:id/failed');
  const [, setLocation] = useLocation();
  const buildIdOrProjId = params?.id || 'build-zen-003';

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [showLogs, setShowLogs] = useState(true);

  useEffect(() => {
    const all = getStoredProjects();
    const found =
      all.find((p) => p.id === buildIdOrProjId || p.latestBuild?.id === buildIdOrProjId) ||
      all[2] ||
      all[0];
    setProject(found);
  }, [buildIdOrProjId]);

  const failedJob: BuildJobItem = project?.latestBuild?.status === 'FAILED'
    ? project.latestBuild
    : {
        id: buildIdOrProjId,
        projectId: project?.id || 'proj-zen-dashboard',
        projectName: project?.name || 'Zen Dashboard App',
        status: 'FAILED',
        strategy: 'Capacitor Android',
        createdAt: new Date().toISOString(),
        duration: '2m 10s',
        currentPhase: 'GRADLE BUILD',
        failedPhase: 'GRADLE BUILD',
        errorMessage:
          'Execution failed for task :app:processDebugResources. AAPT2: duplicate resource identifier "color/primary" found across multiple styles.xml manifests.',
        logs: [
          { id: '1', timestamp: '14:20:01', level: 'info', message: 'Extracting source tree...' },
          { id: '2', timestamp: '14:20:10', level: 'command', message: 'cd android && ./gradlew assembleDebug' },
          { id: '3', timestamp: '14:21:45', level: 'error', message: 'AAPT2 error: resource color/primary has already been defined' },
          { id: '4', timestamp: '14:22:05', level: 'error', message: 'Execution failed for task :app:processDebugResources.' },
          { id: '5', timestamp: '14:22:10', level: 'error', message: 'BUILD FAILED in 2m 10s' },
        ],
      };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* TOP STATUS HEADER & RESTRAINED TOPOGRAPHIC TERRAIN */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            Pipeline Halted
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            Build Failed
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            The Android build engine encountered a compilation issue during toolchain execution.
          </p>

          <div className="flex justify-center pt-2">
            <BuilderTerrain
              state="FAILED"
              size="md"
              centerTitle="STOPPED"
              centerSubtitle={`Halted at ${failedJob.failedPhase || 'GRADLE BUILD'}`}
            />
          </div>
        </div>

        {/* ERROR DIAGNOSTICS CARD */}
        <div className="rounded-2xl border border-rose-500/30 bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Project Name
              </span>
              <h3 className="font-bold text-lg text-foreground font-sans mt-0.5">
                {failedJob.projectName}
              </h3>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground self-start sm:self-auto">
              <span>BUILD ID: {failedJob.id.slice(0, 16)}</span>
            </div>
          </div>

          {/* Key Metrics: Failed Phase & Strategy */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Failed Phase</div>
              <div className="mt-1 font-semibold text-rose-600 dark:text-rose-400 text-sm font-mono">
                {failedJob.failedPhase || 'GRADLE BUILD'}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Strategy</div>
              <div className="mt-1 font-semibold text-foreground text-sm font-mono">
                {failedJob.strategy}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Duration Before Halt</div>
              <div className="mt-1 font-semibold text-foreground text-sm font-mono">
                {failedJob.duration}
              </div>
            </div>
          </div>

          {/* Root Cause Message Box */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Diagnostic Failure Message</span>
            </div>
            <p className="font-mono text-xs text-foreground leading-relaxed">
              {failedJob.errorMessage || 'Compiler exited with non-zero status code.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setLocation('/build/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              data-testid="button-try-again"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again / New Build</span>
            </button>

            <button
              onClick={() => setShowLogs(!showLogs)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span>{showLogs ? 'Collapse Logs' : 'View Full Logs'}</span>
            </button>

            <Link
              href="/environment"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              <span>Check Toolchain</span>
            </Link>
          </div>
        </div>

        {/* TERMINAL LOGS PANEL */}
        {showLogs && (
          <div className="space-y-2">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Failure Traceback &amp; Execution Output
            </div>
            <TerminalPanel
              logs={failedJob.logs}
              title="Failure Diagnostics Console"
              isStreaming={false}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default BuildFailedPage;
