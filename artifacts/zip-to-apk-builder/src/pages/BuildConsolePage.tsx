import React, { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import {
  Terminal,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  StopCircle,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { PhaseTimeline, TimelinePhase } from '../components/PhaseTimeline';
import { TerminalPanel } from '../components/TerminalPanel';
import { BuilderTerrain } from '../components/BuilderTerrain';
import {
  getStoredProjects,
  saveStoredProjects,
  ProjectItem,
  BuildJobItem,
  BuildLog,
} from '../services/mockData';

export const BuildConsolePage: React.FC = () => {
  const [, params] = useRoute('/build/:id/console');
  const [, setLocation] = useLocation();
  const buildIdOrProjId = params?.id || 'build-aps-001';

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(3); // GRADLE BUILD
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [isBuilding, setIsBuilding] = useState(true);

  // Phases definition
  const rawPhases = [
    { id: 'p1', name: 'EXTRACTING', description: 'Decompressing ZIP repository into isolated build sandbox' },
    { id: 'p2', name: 'ANALYZING', description: 'Inspecting package manifest, SDK versions, and Gradle structure' },
    { id: 'p3', name: 'PREPARING ENVIRONMENT', description: 'Configuring Java 17, Android SDK API 34, and dependencies' },
    { id: 'p4', name: 'GRADLE BUILD', description: 'Executing assembleDebug tasks, compiling dex bytecodes' },
    { id: 'p5', name: 'LOCATING APK', description: 'Scanning build/outputs/apk/debug for generated binary package' },
    { id: 'p6', name: 'VALIDATING APK', description: 'Running apksigner verification and zipalign 4-byte check' },
    { id: 'p7', name: 'HASHING', description: 'Computing SHA-256 fingerprint and registering downloadable artifact' },
  ];

  const phases: TimelinePhase[] = rawPhases.map((phase, idx) => {
    let status: 'complete' | 'active' | 'pending' | 'failed' = 'pending';
    if (idx < currentPhaseIndex) {
      status = 'complete';
    } else if (idx === currentPhaseIndex) {
      status = 'active';
    } else {
      status = 'pending';
    }

    return {
      ...phase,
      status,
      timestamp: idx <= currentPhaseIndex ? `+${idx * 18}s` : undefined,
      duration: idx < currentPhaseIndex ? `${14 + idx * 4}s` : idx === currentPhaseIndex ? 'running...' : undefined,
    };
  });

  useEffect(() => {
    const all = getStoredProjects();
    const found =
      all.find((p) => p.id === buildIdOrProjId || p.latestBuild?.id === buildIdOrProjId) ||
      all[0];
    setProject(found);

    // Initial logs
    const initialLogList = found.latestBuild?.logs || [
      { id: '1', timestamp: '19:10:01', level: 'info', message: 'Builder worker allocated on node-sand-04' },
      { id: '2', timestamp: '19:10:02', level: 'command', message: 'unzip -q project.zip -d /workspace/source' },
      { id: '3', timestamp: '19:10:05', level: 'info', message: 'Extracted files successfully.' },
      { id: '4', timestamp: '19:10:12', level: 'command', message: 'cd android && ./gradlew assembleDebug --no-daemon' },
      { id: '5', timestamp: '19:10:45', level: 'info', message: ':app:preBuild UP-TO-DATE' },
      { id: '6', timestamp: '19:11:02', level: 'info', message: ':app:compileDebugJavaWithJavac (18 source files)' },
      { id: '7', timestamp: '19:11:24', level: 'info', message: ':app:dexBuilderDebug processing classes...' },
    ];
    setLogs(initialLogList);
  }, [buildIdOrProjId]);

  // Live simulation tick to advance build stages
  useEffect(() => {
    if (!isBuilding) return;

    const logMessages = [
      { level: 'info', message: ':app:mergeDebugResources - merging Android assets' },
      { level: 'info', message: ':app:processDebugManifest - applying permissions: CAMERA, INTERNET' },
      { level: 'command', message: 'd8 --min-api 22 --output /build/dex' },
      { level: 'info', message: ':app:packageDebug - packaging compiled dex files' },
      { level: 'success', message: 'BUILD SUCCESSFUL in 1m 45s (34 actionable tasks: 30 executed, 4 up-to-date)' },
      { level: 'info', message: 'Locating APK at android/app/build/outputs/apk/debug/app-debug.apk' },
      { level: 'info', message: 'Running apksigner verify --verbose app-debug.apk -> Verified with v1 and v2 schemes' },
      { level: 'info', message: 'Computed SHA-256: 7b83c18e5e8942b0c95237ff640954b4ea0a1c1d8820c78a0b0d381016fe59da' },
      { level: 'success', message: 'Validated APK registered: ai-photo-studio-debug.apk (23.5 MB)' },
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < logMessages.length) {
        const item = logMessages[step];
        const newLog: BuildLog = {
          id: `live-${Date.now()}-${step}`,
          timestamp: new Date().toTimeString().slice(0, 8),
          level: item.level as any,
          message: item.message,
        };
        setLogs((prev) => [...prev, newLog]);

        // Advance phases
        if (step === 2) setCurrentPhaseIndex(4); // LOCATING APK
        if (step === 5) setCurrentPhaseIndex(5); // VALIDATING APK
        if (step === 7) setCurrentPhaseIndex(6); // HASHING

        step++;
      } else {
        clearInterval(interval);
        setIsBuilding(false);
        // Automatically transition to Success Screen!
        setTimeout(() => {
          setLocation(`/build/${buildIdOrProjId}/success`);
        }, 1500);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isBuilding, buildIdOrProjId, setLocation]);

  const handleStopBuild = () => {
    setIsBuilding(false);
    setLogs((prev) => [
      ...prev,
      {
        id: `stop-${Date.now()}`,
        timestamp: new Date().toTimeString().slice(0, 8),
        level: 'warn',
        message: 'Build process canceled by user request.',
      },
    ]);
  };

  const handleSimulateFailure = () => {
    setLocation(`/build/${buildIdOrProjId}/failed`);
  };

  const handleFastForwardSuccess = () => {
    setLocation(`/build/${buildIdOrProjId}/success`);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* TOP STATUS BAR */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  BUILD PIPELINE
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {isBuilding ? 'BUILD IN PROGRESS' : 'BUILD PAUSED'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans mt-1">
                {project ? project.name : 'Android Package Build'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground mt-1">
                <span>ID: {buildIdOrProjId.slice(0, 16)}</span>
                <span>·</span>
                <span>Strategy: {project?.latestBuild?.strategy || 'Capacitor Android'}</span>
                <span>·</span>
                <span>Worker: sand-node-04</span>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleStopBuild}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <StopCircle className="w-4 h-4 text-rose-500" />
                <span>Abort</span>
              </button>

              <button
                onClick={handleSimulateFailure}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-mono hover:bg-rose-500/20 transition-colors cursor-pointer"
                title="Preview failure handling state"
              >
                <span>Test Failure UI</span>
              </button>

              <button
                onClick={handleFastForwardSuccess}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:brightness-105 transition-all cursor-pointer"
              >
                <span>Complete Build</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN SPLIT: PHASE TIMELINE & TERMINAL CONSOLE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Topographic mini-radar & Vertical Timeline */}
          <div className="lg:col-span-4 space-y-6">
            {/* Topographic Visual Badge */}
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center justify-center shadow-sm">
              <BuilderTerrain
                state="BUILDING"
                size="sm"
                centerTitle="BUILDING"
                centerSubtitle="Compiling Java/Kotlin dex"
              />
            </div>

            {/* Phase Timeline Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <h3 className="font-bold text-sm text-foreground font-sans">Execution Timeline</h3>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Phase {Math.min(currentPhaseIndex + 1, phases.length)} of {phases.length}
                </span>
              </div>
              <PhaseTimeline phases={phases} />
            </div>
          </div>

          {/* Right Column: CI/CD Dark Terminal Panel */}
          <div className="lg:col-span-8">
            <TerminalPanel
              logs={logs}
              title="BUILD LOG STREAM: STDOUT / STDERR"
              isStreaming={isBuilding}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default BuildConsolePage;
