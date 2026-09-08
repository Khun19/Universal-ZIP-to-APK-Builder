import { useRoute, Link, useLocation } from 'wouter';
import { AlertOctagon, RotateCcw, Terminal, ArrowLeft, Bug, HelpCircle, FileText } from 'lucide-react';
import { useBuild } from '@/context/BuildContext';
import { BuilderTerrain } from '@/components/BuilderTerrain';

export function BuildFailedView() {
  const [, params] = useRoute('/build/:id/failed');
  const [, setLocation] = useLocation();
  const { builds, retryBuild } = useBuild();

  const buildId = params?.id;
  const build = builds.find((b) => b.id === buildId) || builds[0];

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

  const handleTryAgain = () => {
    retryBuild(false);
    setLocation(`/build/${build.id}`);
  };

  const failedPhase = build.failedPhase || 'GRADLE_BUILD';
  const errorMessage =
    build.errorMessage ||
    'Task :app:mergeDebugResources failed. AAPT: error: style attribute "@attr/colorSurfaceVariant" not found.';

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="build-failed-view">
      {/* Top breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/build/${build.id}`}
          className="inline-flex items-center gap-1.5 font-mono-ui text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Build Console</span>
        </Link>

        <span className="font-mono-ui text-xs text-rose-500 font-semibold">
          HALTED AT VALIDATION GATE
        </span>
      </div>

      {/* Failure Header with Restrained Styling */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 font-mono-ui text-xs font-bold text-rose-500">
          <AlertOctagon size={13} />
          <span>COMPILATION EXCEPTION</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Build Failed
        </h1>

        <p className="max-w-md text-sm sm:text-base text-muted-foreground">
          The Android build toolchain encountered an unrecoverable error during the assemble step.
        </p>

        {/* BuilderTerrain in STOPPED mode */}
        <div className="pt-2">
          <BuilderTerrain
            status="STOPPED"
            size="md"
            titleOverride="STOPPED"
            subtitleOverride={`Pipeline halted at ${failedPhase}`}
          />
        </div>
      </div>

      {/* Failure Diagnosis Card */}
      <div className="rounded-3xl border border-rose-500/25 bg-card p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
          <div>
            <span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-rose-500 font-bold">
              Failure Diagnosis
            </span>
            <h3 className="mt-1 font-mono-ui text-base font-bold text-foreground">
              Phase: {failedPhase}
            </h3>
          </div>

          <div className="font-mono-ui text-xs text-muted-foreground">
            BUILD ID: <span className="text-foreground font-semibold">{build.id}</span>
          </div>
        </div>

        {/* Formatted Error Message Box */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 font-mono-ui text-xs text-rose-300 leading-relaxed break-all">
          <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
            <Bug size={14} />
            <span>Root Cause Exception:</span>
          </div>
          {errorMessage}
        </div>

        {/* Suggested Resolution Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono-ui text-xs font-semibold text-muted-foreground">
            <HelpCircle size={14} />
            <span>Recommended developer fixes:</span>
          </div>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 pl-1">
            <li>Verify all Android styles & color resources exist in <code className="text-foreground">android/app/src/main/res/values/</code></li>
            <li>Ensure compileSdk and targetSdk versions in <code className="text-foreground">build.gradle</code> align with API 34</li>
            <li>If using Capacitor or Vite, verify that <code className="text-foreground">dist/</code> was generated before syncing</li>
          </ul>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
          <button
            onClick={handleTryAgain}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-xs sm:text-sm text-primary-foreground shadow-sm hover:brightness-110 active:scale-95 transition-all"
            data-testid="button-try-again"
          >
            <RotateCcw size={16} />
            <span>Try Again</span>
          </button>

          <Link
            href={`/build/${build.id}`}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-medium text-xs sm:text-sm text-foreground hover:bg-muted transition-colors"
            data-testid="button-view-logs-fail"
          >
            <Terminal size={15} />
            <span>View Full Build Terminal</span>
          </Link>

          <Link
            href={`/analysis/${build.id}`}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-medium text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText size={15} />
            <span>Re-check Analysis</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
