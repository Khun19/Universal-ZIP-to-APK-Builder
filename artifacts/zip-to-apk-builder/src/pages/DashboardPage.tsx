import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Layers,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Activity,
  ArrowRight,
  Download,
  FileCode2,
  Clock,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Terminal,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { BuilderTerrain } from '../components/BuilderTerrain';
import { getStoredProjects, ProjectItem } from '../services/mockData';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setProjects(getStoredProjects());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadData();
      setRefreshing(false);
    }, 400);
  };

  // Compute stats across projects and their latest builds
  const allBuilds = projects.map((p) => p.latestBuild).filter(Boolean);
  const totalBuilds = allBuilds.length;
  const successfulBuilds = allBuilds.filter((b) => b?.status === 'SUCCESS').length;
  const failedBuilds = allBuilds.filter((b) => b?.status === 'FAILED').length;
  const runningBuilds = allBuilds.filter((b) => b && ['ANALYZING', 'PREPARING', 'BUILDING', 'VALIDATING'].includes(b.status)).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* TOP HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-accent">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Build Automation Workspace
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              Universal ZIP-to-APK Builder
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Transform web, hybrid, or native mobile repositories into production-ready Android APK packages with full pipeline verification.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
              title="Refresh workspace telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/build/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:brightness-105 active:scale-[0.98] transition-all"
              data-testid="dashboard-cta-new-build"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>New Android Build</span>
            </Link>
          </div>
        </div>

        {/* 4 METRIC STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-border/90 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Total Builds</span>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
              {totalBuilds}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Across {projects.length} repository projects
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-border/90 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Successful</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {successfulBuilds}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Validated &amp; ready for download
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-border/90 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Failed</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
              {failedBuilds}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Diagnostics &amp; logs captured
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-border/90 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Running</span>
              <PlayCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
              {runningBuilds}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Worker threads active: 0/4
            </div>
          </div>
        </div>

        {/* HERO INTERACTIVE SHOWCASE: TOPOGRAPHIC RADAR & BUILDER ENGINE STATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Topographic Visual Card */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
            <div className="space-y-4 max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-semibold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                Pipeline Orchestrator
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
                Build your Android APK from any ZIP
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Upload your ZIP archive. The builder engine automatically inspects the manifest, determines the optimal strategy (Native Gradle, Capacitor, or Web wrapper), compiles bytecode, and delivers a signed APK.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/build/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:brightness-105 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Start New Build</span>
                </Link>
                <Link
                  href="/environment"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Check Toolchain</span>
                </Link>
              </div>
            </div>

            {/* Topographic Visual Component */}
            <div className="shrink-0">
              <BuilderTerrain state="ANALYZING" size="sm" centerTitle="STANDBY" centerSubtitle="Ready for archive input" />
            </div>
          </div>

          {/* Environment Status Card */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent" />
                  <h3 className="font-bold text-sm text-foreground">Toolchain Status</h3>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  HEALTHY
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Android SDK</span>
                  <span className="font-mono font-medium text-foreground">API 34 (Android 14)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Build Tools</span>
                  <span className="font-mono font-medium text-foreground">34.0.0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">JDK Version</span>
                  <span className="font-mono font-medium text-foreground">OpenJDK 17.0.10</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gradle Daemon</span>
                  <span className="font-mono font-medium text-foreground">Gradle 8.4</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Node.js / npm</span>
                  <span className="font-mono font-medium text-foreground">v20.18.0 / 10.8</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border">
              <Link
                href="/environment"
                className="flex items-center justify-between text-xs font-semibold text-accent hover:underline"
              >
                <span>View Complete Diagnostics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* RECENT BUILDS TABLE / CARDS */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:px-6 border-b border-border bg-muted/20">
            <div>
              <h3 className="font-bold text-base text-foreground font-sans">Recent Android Builds</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                History of compiled APK packages, strategies, and execution duration.
              </p>
            </div>
            <Link
              href="/build/history"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors self-start sm:self-auto"
            >
              <span>View All History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-6">Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-6 text-right">APK Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {projects.map((project) => {
                  const build = project.latestBuild;
                  if (!build) return null;

                  const statusMap: Record<string, string> = {
                    SUCCESS: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
                    FAILED: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
                    BUILDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 animate-pulse',
                    ANALYZING: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20 animate-pulse',
                    PREPARING: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
                    VALIDATING: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
                    QUEUED: 'bg-muted text-muted-foreground border-border',
                  };
                  const statusPill = statusMap[build.status] || 'bg-muted text-muted-foreground border-border';

                  return (
                    <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <Link href={`/projects/${project.id}`} className="font-semibold text-foreground hover:text-accent flex items-center gap-2">
                          <FileCode2 className="w-4 h-4 text-accent shrink-0" />
                          <span>{project.name}</span>
                        </Link>
                        <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">
                          {project.filename}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider border ${statusPill}`}>
                          {build.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                          {build.status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                          <span>{build.status}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                          {build.strategy}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono text-muted-foreground">
                        {new Date(build.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 font-mono text-muted-foreground">
                        {build.duration}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {build.status === 'SUCCESS' && build.artifact ? (
                          <Link
                            href={`/build/${build.id}/success`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download APK</span>
                          </Link>
                        ) : build.status === 'FAILED' ? (
                          <Link
                            href={`/build/${build.id}/failed`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-mono text-xs transition-colors"
                          >
                            <span>Inspect Error</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/build/${build.id}/console`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-2xs"
                          >
                            <span>View Console</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-border/70 p-2">
            {projects.map((project) => {
              const build = project.latestBuild;
              if (!build) return null;
              return (
                <div key={project.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{project.name}</h4>
                      <p className="font-mono text-[10px] text-muted-foreground">{project.filename}</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted">
                      {build.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>{build.strategy}</span>
                    <span>{build.duration}</span>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(build.createdAt).toLocaleDateString()}
                    </span>
                    {build.status === 'SUCCESS' ? (
                      <Link
                        href={`/build/${build.id}/success`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Get APK</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/build/${build.id}/failed`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs"
                      >
                        <span>Details</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default DashboardPage;
