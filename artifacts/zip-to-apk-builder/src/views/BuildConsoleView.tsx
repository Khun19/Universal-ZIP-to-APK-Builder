import { useEffect, useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import {
  Play,
  Square,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Terminal,
  AlertTriangle,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { useBuild } from '@/context/BuildContext';
import { PhaseTimeline } from '@/components/PhaseTimeline';
import { TerminalPanel } from '@/components/TerminalPanel';
import { StatusBadge } from '@/components/StatusBadge';
import { BuilderTerrain } from '@/components/BuilderTerrain';

export function BuildConsoleView() {
  const [, params] = useRoute('/build/:id');
  const [, setLocation] = useLocation();
  const { builds, selectBuild, startBuild, cancelBuild, isSimulating, activePhase } = useBuild();

  const buildId = params?.id;
  const build = builds.find((b) => b.id === buildId) || builds[0];

  useEffect(() => {
    if (buildId) {
      selectBuild(buildId);
    }
  }, [buildId, selectBuild]);

  if (!build) {
    return (
      <div className="py-20 text-center">
        <h3 className="text-lg font-bold">Build Not Found</h3>
        <Link href="/dashboard" className="text-primary underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isBuilding = build.status === 'BUILDING';
  const isSuccess = build.status === 'SUCCESS';
  const isFailed = build.status === 'FAILED';

  const handleStartBuild = (simulateFailure = false) => {
    startBuild(build.id, simulateFailure);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" data-testid="build-console-view">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href="/history"
                className="inline-flex items-center gap-1 font-mono-ui text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={12} />
                <span>Build History</span>
              </Link>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono-ui text-xs text-muted-foreground">ID: {build.id}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                {build.projectName}
              </h1>
              <StatusBadge status={build.status} size="md" />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-ui text-xs text-muted-foreground">
              <span>Strategy: <strong className="text-foreground">{build.strategy}</strong></span>
              <span>•</span>
              <span>Archive: {build.fileName}</span>
              <span>•</span>
              <span>Duration: {build.duration}</span>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isBuilding ? (
              <button
                onClick={cancelBuild}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 font-mono-ui text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-all"
                data-testid="button-cancel-build"
              >
                <Square size={14} />
                <span>Cancel Build</span>
              </button>
            ) : isSuccess ? (
              <Link
                href={`/build/${build.id}/success`}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-xs text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                data-testid="button-view-apk-success"
              >
                <ShieldCheck size={16} />
                <span>View Validated APK</span>
                <ArrowRight size={14} />
              </Link>
            ) : isFailed ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/build/${build.id}/failed`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-mono-ui text-rose-500 hover:bg-rose-500/20"
                >
                  <XCircle size={14} />
                  <span>Failure Report</span>
                </Link>
                <button
                  onClick={() => handleStartBuild(false)}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-110"
                >
                  <RotateCcw size={14} />
                  <span>Retry Build</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartBuild(false)}
                  disabled={isSimulating}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-xs sm:text-sm text-primary-foreground shadow-md hover:brightness-110 active:scale-95 transition-all"
                  data-testid="button-queue-apk-build"
                >
                  <Play size={15} />
                  <span>Queue APK Build</span>
                </button>

                {/* Secondary: Simulate failure to test failure screen */}
                <button
                  onClick={() => handleStartBuild(true)}
                  disabled={isSimulating}
                  title="Simulate resource linking failure to verify error screen"
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2.5 font-mono-ui text-[11px] text-muted-foreground hover:bg-muted"
                >
                  <Flame size={13} className="text-amber-500" />
                  <span className="hidden sm:inline">Test Fail</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Phase Timeline + Terrain (Left) and Terminal Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols on LG): Terrain & Phase Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Topographic Terrain Visual (BUILDING / SUCCESS / STOPPED / IDLE) */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col items-center">
            <BuilderTerrain
              status={
                isSuccess
                  ? 'COMPLETE'
                  : isFailed
                  ? 'STOPPED'
                  : isBuilding
                  ? 'BUILDING'
                  : 'IDLE'
              }
              size="md"
              titleOverride={
                isSuccess
                  ? 'COMPLETE'
                  : isFailed
                  ? 'STOPPED'
                  : isBuilding
                  ? 'BUILDING'
                  : 'READY'
              }
            />
          </div>

          {/* Vertical CI/CD Phase Timeline */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
            <PhaseTimeline
              phases={build.phases}
              activePhaseId={activePhase}
            />
          </div>
        </div>

        {/* Right Column (7 Cols on LG): Build Terminal */}
        <div className="lg:col-span-7">
          <TerminalPanel
            logs={build.logs}
            title={`Build Output · ${build.projectName}`}
            isStreaming={isBuilding}
          />
        </div>
      </div>
    </div>
  );
}
