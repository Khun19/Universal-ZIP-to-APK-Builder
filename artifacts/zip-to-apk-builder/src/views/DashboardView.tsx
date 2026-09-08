import { Link } from 'wouter';
import {
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileArchive,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Server,
  Download,
  Terminal,
} from 'lucide-react';
import { useBuild } from '@/context/BuildContext';
import { DashboardCard } from '@/components/DashboardCard';
import { StatusBadge } from '@/components/StatusBadge';
import { BuilderTerrain } from '@/components/BuilderTerrain';

export function DashboardView() {
  const { builds, selectBuild } = useBuild();

  const totalBuilds = builds.length;
  const successfulBuilds = builds.filter((b) => b.status === 'SUCCESS').length;
  const failedBuilds = builds.filter((b) => b.status === 'FAILED').length;
  const runningBuilds = builds.filter((b) => b.status === 'BUILDING' || b.status === 'INSPECTING').length;

  const recentBuilds = builds.slice(0, 5);

  return (
    <div className="space-y-8" data-testid="dashboard-view">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
        {/* Subtle Topographic Terrain Motif in background */}
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-15 pointer-events-none hidden md:block">
          <BuilderTerrain size="sm" status="IDLE" className="h-full w-full border-0 bg-transparent shadow-none" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 font-mono-ui text-[11px] uppercase tracking-[.2em] text-primary font-semibold">
            <span>Developer Build Console</span>
            <span>•</span>
            <span className="text-emerald-500">Host Online</span>
          </div>

          <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Universal ZIP-to-APK Builder
          </h2>

          <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
            Upload any web or mobile project archive. The Builder inspects the AST structure, validates Gradle toolchains, and packages a genuine installable Android APK.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/new-build"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:brightness-110 active:scale-95 transition-all"
              data-testid="button-new-build-hero"
            >
              <PlusCircle size={16} />
              <span>New Build</span>
            </Link>

            <Link
              href="/environment"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Server size={15} className="text-muted-foreground" />
              <span>Toolchain Diagnostics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Build Statistics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          label="Total Builds"
          value={totalBuilds}
          subtext="Recorded project jobs"
          icon={Layers}
          accent="primary"
        />
        <DashboardCard
          label="Successful"
          value={successfulBuilds}
          subtext="Validated APK packages"
          icon={CheckCircle2}
          accent="emerald"
        />
        <DashboardCard
          label="Failed"
          value={failedBuilds}
          subtext="Validation stopped"
          icon={XCircle}
          accent="rose"
        />
        <DashboardCard
          label="Active Jobs"
          value={runningBuilds}
          subtext="In assemble pipeline"
          icon={Clock}
          accent="amber"
        />
      </div>

      {/* Recent Builds Table & Environment Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Builds (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-foreground">Recent Builds</h3>
              <p className="text-xs text-muted-foreground">Latest Android package artifacts & jobs</p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 font-mono-ui text-xs font-semibold text-primary hover:underline"
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Desktop Table Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 border-b border-border bg-muted/30 px-5 py-3 font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">
              <span className="col-span-5">Project / Archive</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-3">Strategy</span>
              <span className="col-span-2 text-right">Action</span>
            </div>

            {/* Builds List */}
            <div className="divide-y divide-border">
              {recentBuilds.map((build) => (
                <div
                  key={build.id}
                  className="flex flex-col sm:grid sm:grid-cols-12 gap-3 p-4 sm:px-5 sm:py-3.5 sm:items-center hover:bg-muted/30 transition-colors"
                >
                  {/* Project Info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileArchive size={17} />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/build/${build.id}`}
                        onClick={() => selectBuild(build.id)}
                        className="font-semibold text-sm text-foreground hover:text-primary truncate block font-sans"
                      >
                        {build.projectName}
                      </Link>
                      <div className="font-mono-ui text-[10px] text-muted-foreground truncate">
                        {build.fileName} · {build.fileSize}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2">
                    <StatusBadge status={build.status} size="sm" />
                  </div>

                  {/* Strategy */}
                  <div className="col-span-3">
                    <span className="text-xs text-muted-foreground font-medium truncate block">
                      {build.strategy}
                    </span>
                    <span className="font-mono-ui text-[10px] text-muted-foreground/60">
                      {build.duration}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-2 sm:text-right flex items-center sm:justify-end gap-2">
                    {build.status === 'SUCCESS' && build.artifact ? (
                      <Link
                        href={`/build/${build.id}/success`}
                        onClick={() => selectBuild(build.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono-ui text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Download size={12} />
                        <span>APK</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/build/${build.id}`}
                        onClick={() => selectBuild(build.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 font-mono-ui text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Terminal size={12} />
                        <span>Console</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Environment Status Quick Card (1 column) */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold font-display text-foreground">Builder Environment</h3>
            <p className="text-xs text-muted-foreground">Host Android SDK & compilers</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono-ui text-xs font-bold text-foreground">ENGINE ONLINE</span>
              </div>
              <span className="font-mono-ui text-[10px] text-muted-foreground">AGP 8.3 / JDK 17</span>
            </div>

            <div className="space-y-3 font-mono-ui text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Android SDK:</span>
                <span className="font-semibold text-foreground">API 34 (UpsideDownCake)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Build Tools:</span>
                <span className="font-semibold text-foreground">34.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Java runtime:</span>
                <span className="font-semibold text-foreground">OpenJDK 17.0.10</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gradle daemon:</span>
                <span className="font-semibold text-foreground">v8.4 Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AAPT2 status:</span>
                <span className="font-semibold text-emerald-500">Ready</span>
              </div>
            </div>

            <Link
              href="/environment"
              className="mt-2 block w-full rounded-xl border border-border bg-muted/40 p-2.5 text-center font-mono-ui text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              View Full Diagnostics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
