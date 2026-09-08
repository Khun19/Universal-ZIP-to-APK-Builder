import { useEffect, useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { Check, CircleDot, Clock, ArrowRight, ShieldCheck, FileArchive, Terminal, ArrowLeft } from 'lucide-react';
import { useBuild } from '@/context/BuildContext';
import { BuilderTerrain } from '@/components/BuilderTerrain';

export function InspectView() {
  const [, params] = useRoute('/inspect/:id');
  const [, setLocation] = useLocation();
  const { builds, selectBuild, isSimulating } = useBuild();

  const buildId = params?.id;
  const currentBuild = builds.find((b) => b.id === buildId) || builds[0];

  useEffect(() => {
    if (buildId) {
      selectBuild(buildId);
    }
  }, [buildId, selectBuild]);

  // If already analyzed, allow user to jump forward or inspect details
  const isAnalyzed = currentBuild?.status === 'ANALYZED' || currentBuild?.status === 'BUILDING' || currentBuild?.status === 'SUCCESS';

  // Activity steps derived from actual state
  const activitySteps = [
    { label: 'ZIP received', state: 'done' },
    { label: 'File validated', state: 'done' },
    {
      label: 'Inspecting project',
      state: isAnalyzed ? 'done' : 'active',
    },
    {
      label: 'Detecting project type',
      state: isAnalyzed ? 'done' : isSimulating ? 'active' : 'pending',
    },
    {
      label: 'Preparing build',
      state: currentBuild?.status === 'BUILDING' || currentBuild?.status === 'SUCCESS' ? 'done' : 'pending',
    },
    {
      label: 'Building APK',
      state: currentBuild?.status === 'SUCCESS' ? 'done' : 'pending',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="inspect-view">
      {/* Top breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/new-build"
          className="inline-flex items-center gap-1.5 font-mono-ui text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Upload</span>
        </Link>

        <div className="font-mono-ui text-xs text-muted-foreground">
          PROJECT ID: <span className="font-semibold text-foreground">{currentBuild?.id}</span>
        </div>
      </div>

      {/* Hero Visual Container: The Signature BuilderTerrain */}
      <div className="flex flex-col items-center">
        <BuilderTerrain
          status={isAnalyzed ? 'INSPECTING' : 'INSPECTING'}
          size="hero"
          titleOverride={isAnalyzed ? 'READY' : 'ANALYZING'}
          subtitleOverride={
            isAnalyzed
              ? 'Project structure identified & compatibility scored'
              : 'Inspecting project structure & Gradle dependencies'
          }
        />
      </div>

      {/* Builder Activity Panel (Phase-Based) */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono-ui text-xs font-bold uppercase tracking-[.18em] text-foreground">
              Builder Activity
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
          </div>
          <span className="font-mono-ui text-[11px] text-muted-foreground">
            {currentBuild?.projectName} ({currentBuild?.fileName})
          </span>
        </div>

        {/* Phase List with subtle motion on active step */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {activitySteps.map((step, idx) => {
            const isDone = step.state === 'done';
            const isActive = step.state === 'active';

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 font-mono-ui text-xs transition-all ${
                  isActive
                    ? 'border-teal-500/50 bg-teal-500/10 text-teal-400 shadow-sm animate-pulse'
                    : isDone
                    ? 'border-border bg-background/60 text-foreground'
                    : 'border-border/40 bg-background/20 text-muted-foreground/50'
                }`}
                data-testid={`activity-step-${idx}`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isActive
                      ? 'border-teal-400 bg-teal-400/20 text-teal-400'
                      : 'border-border bg-card text-muted-foreground/30'
                  }`}
                >
                  {isDone ? (
                    <Check size={13} strokeWidth={2.5} />
                  ) : isActive ? (
                    <CircleDot size={13} className="animate-spin" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </div>

                <span className="font-medium truncate">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Analysis Ready Call To Action Banner */}
        {isAnalyzed && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-500 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  Inspection Succeeded ({currentBuild?.analysis?.compatibilityScore}/100)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Detected {currentBuild?.analysis?.projectType} using {currentBuild?.analysis?.buildTool}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/analysis/${currentBuild?.id}`}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 font-semibold text-xs text-secondary-foreground hover:brightness-105 transition-all"
                data-testid="button-view-analysis"
              >
                <span>View Full Analysis</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                href={`/build/${currentBuild?.id}`}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-xs text-primary-foreground shadow-md hover:brightness-105 transition-all"
                data-testid="button-proceed-build"
              >
                <span>Proceed to Build</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
