import React, { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import {
  ShieldCheck,
  AlertTriangle,
  FileCode2,
  Check,
  ChevronRight,
  Play,
  ArrowLeft,
  Search,
  Cpu,
  Boxes,
  Code2,
  Lock,
  Compass,
  Zap,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import {
  getStoredProjects,
  saveStoredProjects,
  ProjectItem,
  ProjectAnalysisData,
} from '../services/mockData';

export const ProjectAnalysisPage: React.FC = () => {
  const [, params] = useRoute('/build/:id/analysis');
  const [, setLocation] = useLocation();
  const projectId = params?.id || 'proj-ai-photo-studio';

  const [project, setProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    const all = getStoredProjects();
    const found = all.find((p) => p.id === projectId) || all[0];
    setProject(found);
  }, [projectId]);

  const analysis: ProjectAnalysisData = project?.analysis || {
    projectId,
    projectName: project?.name || 'AI Photo Studio',
    projectType: 'Capacitor',
    confidence: 98,
    strategy: 'Capacitor Android',
    framework: 'React 19 / Vite',
    language: 'TypeScript',
    buildTool: 'Capacitor Android (Gradle 8.4)',
    packageManager: 'npm / pnpm',
    minSdk: 22,
    targetSdk: 34,
    evidence: [
      'capacitor.config.ts verified in archive root',
      'Official @capacitor/core and @capacitor/android packages declared',
      'Pre-configured android/ native sub-project discovered with gradlew',
      'Vite build configuration generates dist/ web bundle',
      'Application ID: com.aiphotostudio.app',
    ],
    warnings: [
      'Camera & Storage permissions declared in AndroidManifest.xml (requires runtime permission grant)',
    ],
    blockers: [],
  };

  const handleStartBuild = () => {
    // Navigate to the live build console
    setLocation(`/build/${projectId}/console`);
  };

  const hasBlockers = analysis.blockers.length > 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* BREADCRUMB & BACK */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="font-mono text-xs text-muted-foreground">
            PROJECT ID: {projectId.slice(0, 18)}
          </div>
        </div>

        {/* HERO TITLE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-accent mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Inspection Diagnostics
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              Project Analysis: {project?.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Evaluated repository structure, detected build strategy, and evaluated compatibility with Android API 34.
            </p>
          </div>

          <button
            onClick={handleStartBuild}
            disabled={hasBlockers}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer self-start md:self-auto"
            data-testid="button-start-build"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Android Build</span>
          </button>
        </div>

        {/* TOP SUMMARY CARDS: PROJECT TYPE, CONFIDENCE, STRATEGY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Project Type
            </div>
            <div className="mt-2 text-xl font-bold text-foreground flex items-center gap-2">
              <Boxes className="w-5 h-5 text-accent" />
              <span>{analysis.projectType}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {analysis.framework}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Inspection Confidence
            </div>
            <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {analysis.confidence}%
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${analysis.confidence}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Recommended Strategy
            </div>
            <div className="mt-2 text-xl font-bold text-foreground font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="truncate">{analysis.strategy}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Min API {analysis.minSdk} · Target API {analysis.targetSdk}
            </div>
          </div>
        </div>

        {/* DETECTED TECH STACK ATTRIBUTES */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Code2 className="w-4 h-4 text-accent" />
            <span>Detected Stack &amp; Toolchain</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Language</div>
              <div className="mt-1 text-xs font-semibold text-foreground font-mono">{analysis.language}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Build Tool</div>
              <div className="mt-1 text-xs font-semibold text-foreground font-mono">{analysis.buildTool}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Package Mgr</div>
              <div className="mt-1 text-xs font-semibold text-foreground font-mono">{analysis.packageManager}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Target Platform</div>
              <div className="mt-1 text-xs font-semibold text-foreground font-mono">Android 14 (API 34)</div>
            </div>
          </div>
        </div>

        {/* EVIDENCE SECTION */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Inspection Evidence Trail</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {analysis.evidence.length} signals confirmed
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {analysis.evidence.map((item: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-foreground"
              >
                <div className="mt-0.5 rounded-full bg-emerald-600 text-white p-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="font-mono leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WARNINGS & BLOCKERS DEDICATED VISUAL SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Warnings Section */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Compatibility Warnings</span>
              </div>
              <span className="font-mono text-xs text-amber-700 dark:text-amber-400 font-bold">
                {analysis.warnings.length}
              </span>
            </div>

            {analysis.warnings.length > 0 ? (
              <div className="space-y-2 pt-1">
                {analysis.warnings.map((warn: string, i: number) => (
                  <div key={i} className="p-3 rounded-xl border border-amber-500/20 bg-background/60 text-xs text-foreground leading-relaxed">
                    {warn}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-2">
                No warnings detected. Clean build profile.
              </p>
            )}
          </div>

          {/* Blockers Section */}
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm text-rose-800 dark:text-rose-300">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Build Blockers</span>
              </div>
              <span className="font-mono text-xs text-rose-700 dark:text-rose-400 font-bold">
                {analysis.blockers.length}
              </span>
            </div>

            {analysis.blockers.length > 0 ? (
              <div className="space-y-2 pt-1">
                {analysis.blockers.map((blocker: string, i: number) => (
                  <div key={i} className="p-3 rounded-xl border border-rose-500/20 bg-background/60 text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-semibold">
                    {blocker}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 pt-2 font-medium">
                <Check className="w-4 h-4" />
                <span>Zero build blockers identified. Ready for compilation.</span>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="font-bold text-sm text-foreground">Next Step: Execute Build Pipeline</div>
            <div className="text-xs text-muted-foreground">
              Build will assemble Java/Kotlin bytecodes, package assets, and output debug-signed APK.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/build/new"
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              Cancel / New Archive
            </Link>

            <button
              onClick={handleStartBuild}
              disabled={hasBlockers}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Queue APK Build</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ProjectAnalysisPage;
