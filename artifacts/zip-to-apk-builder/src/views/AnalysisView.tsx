import { useRoute, Link, useLocation } from 'wouter';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  FileCheck2,
  Cpu,
  Layers,
  Terminal,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Settings,
  Sliders,
  Check,
} from 'lucide-react';
import { useBuild } from '@/context/BuildContext';

export function AnalysisView() {
  const [, params] = useRoute('/analysis/:id');
  const [, setLocation] = useLocation();
  const { builds, startBuild } = useBuild();

  const buildId = params?.id;
  const build = builds.find((b) => b.id === buildId) || builds[0];
  const analysis = build?.analysis;

  if (!build || !analysis) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold">No Analysis Found</h3>
        <Link href="/new-build" className="mt-4 inline-block text-primary underline">
          Upload a project archive
        </Link>
      </div>
    );
  }

  const handleProceedToBuild = () => {
    setLocation(`/build/${build.id}`);
  };

  const scoreColor =
    analysis.compatibilityScore >= 80
      ? 'text-emerald-500'
      : analysis.compatibilityScore >= 60
      ? 'text-amber-500'
      : 'text-rose-500';

  const scoreBg =
    analysis.compatibilityScore >= 80
      ? 'bg-emerald-500'
      : analysis.compatibilityScore >= 60
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="analysis-view">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/inspect/${build.id}`}
            className="inline-flex items-center gap-1.5 font-mono-ui text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft size={13} />
            <span>Inspection Overview</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Project Analysis
            </h1>
            <span className="font-mono-ui text-xs rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">
              {build.id}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-mono-ui">
            Target archive: <span className="text-foreground">{build.fileName}</span> ({build.fileSize})
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 font-mono-ui text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Sliders size={14} />
            <span>Configure</span>
          </Link>

          <button
            onClick={handleProceedToBuild}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-xs sm:text-sm text-primary-foreground shadow-md hover:brightness-110 active:scale-95 transition-all"
            data-testid="button-proceed-to-build"
          >
            <span>Proceed to Build</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Core Analysis Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Project Type & Confidence */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">
              Detected Stack
            </span>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-display text-foreground">
              {analysis.projectType}
            </div>
            <div className="mt-1 flex items-center gap-2 font-mono-ui text-xs text-muted-foreground">
              <span>Confidence:</span>
              <span className="font-semibold text-emerald-500">{analysis.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Strategy */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">
              Build Strategy
            </span>
            <div className="rounded-lg bg-teal-500/10 p-2 text-teal-500">
              <Cpu size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-base font-bold font-display text-foreground truncate">
              {analysis.strategy}
            </div>
            <div className="mt-1 font-mono-ui text-xs text-muted-foreground">
              {analysis.buildTool} · {analysis.language}
            </div>
          </div>
        </div>

        {/* Card 3: Compatibility Score */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">
              Readiness Score
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-display ${scoreColor}`}>
              {analysis.compatibilityScore}
            </span>
            <span className="text-sm text-muted-foreground font-mono-ui">/ 100</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreBg} transition-all duration-700`}
              style={{ width: `${analysis.compatibilityScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Evidence Trail Section */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <FileCheck2 size={18} className="text-emerald-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider font-mono-ui text-foreground">
            Structural Evidence Trail
          </h3>
        </div>

        <div className="mt-5 space-y-2.5">
          {analysis.evidence.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3 text-xs leading-relaxed"
            >
              <div className="rounded-full bg-emerald-500/10 p-1 text-emerald-500 mt-0.5">
                <Check size={12} />
              </div>
              <span className="text-foreground font-mono-ui">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings & Blockers in Dedicated Visual Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Warnings Section */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-amber-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider font-mono-ui text-amber-500">
                Warnings ({analysis.warnings.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono-ui text-muted-foreground">Non-blocking</span>
          </div>

          <div className="mt-4 space-y-2">
            {analysis.warnings.length === 0 ? (
              <p className="text-xs text-muted-foreground">No warnings reported for this project archive.</p>
            ) : (
              analysis.warnings.map((warn, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-amber-500/20 bg-background/70 p-3 text-xs text-foreground/90 font-sans"
                >
                  {warn}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blockers Section */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2">
              <XCircle size={17} className="text-rose-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider font-mono-ui text-rose-500">
                Blockers ({analysis.blockers.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono-ui text-muted-foreground">Pipeline Gate</span>
          </div>

          <div className="mt-4 space-y-2">
            {analysis.blockers.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-500">
                <Check size={14} />
                <span>Zero blockers identified. Build gate is open.</span>
              </div>
            ) : (
              analysis.blockers.map((blocker, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-rose-500/20 bg-background/70 p-3 text-xs text-rose-400 font-sans"
                >
                  {blocker}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
