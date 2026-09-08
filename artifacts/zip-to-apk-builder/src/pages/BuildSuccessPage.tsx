import React, { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import {
  CheckCircle2,
  Download,
  ArrowRight,
  RotateCcw,
  Terminal,
  FileCode2,
  ShieldCheck,
  PackageCheck,
  ChevronDown,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { BuilderTerrain } from '../components/BuilderTerrain';
import { ArtifactCard } from '../components/ArtifactCard';
import { TerminalPanel } from '../components/TerminalPanel';
import {
  getStoredProjects,
  ProjectItem,
  BuildJobItem,
} from '../services/mockData';

export const BuildSuccessPage: React.FC = () => {
  const [, params] = useRoute('/build/:id/success');
  const [, setLocation] = useLocation();
  const buildIdOrProjId = params?.id || 'build-aps-001';

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    const all = getStoredProjects();
    const found =
      all.find((p) => p.id === buildIdOrProjId || p.latestBuild?.id === buildIdOrProjId) ||
      all[0];
    setProject(found);
  }, [buildIdOrProjId]);

  const defaultJob: BuildJobItem = project?.latestBuild || {
    id: buildIdOrProjId,
    projectId: project?.id || 'proj-ai-photo-studio',
    projectName: project?.name || 'AI Photo Studio',
    status: 'SUCCESS',
    strategy: 'Capacitor Android',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    duration: '1m 48s',
    currentPhase: 'COMPLETE',
    artifact: {
      filename: 'ai-photo-studio-debug.apk',
      sizeBytes: 24658120,
      formattedSize: '23.5 MB',
      sha256: '7b83c18e5e8942b0c95237ff640954b4ea0a1c1d8820c78a0b0d381016fe59da',
      downloadUrl: `/api/artifacts/${buildIdOrProjId}/download`,
      versionName: '1.0.0',
      versionCode: 1,
      packageName: 'com.aiphotostudio.app',
    },
    logs: [
      { id: '1', timestamp: '19:10:01', level: 'info', message: 'Compilation finished successfully.' },
      { id: '2', timestamp: '19:10:02', level: 'success', message: 'APK packaging verified with debug keystore.' },
    ],
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* HERO SUCCESS BANNER & TOPOGRAPHIC TERRAIN */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            Pipeline Completed
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            APK Build Successful
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Your Android APK is ready for deployment, local testing, or distribution.
          </p>

          {/* Topographic Visual Component */}
          <div className="flex justify-center pt-2">
            <BuilderTerrain
              state="SUCCESS"
              size="md"
              centerTitle="VERIFIED"
              centerSubtitle="APK artifact validated & signed"
            />
          </div>
        </div>

        {/* AUTHORITATIVE ARTIFACT CARD */}
        <ArtifactCard
          job={defaultJob}
          onViewLogs={() => setShowLogs(!showLogs)}
          onBuildAgain={() => setLocation('/build/new')}
        />

        {/* TOGGLEABLE EXPANDED LOGS SECTION */}
        {showLogs && (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <Terminal className="w-4 h-4 text-accent" />
                <span>Build Verification Logs</span>
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                Hide logs
              </button>
            </div>
            <TerminalPanel
              logs={defaultJob.logs}
              title="Execution Output"
              isStreaming={false}
            />
          </div>
        )}

        {/* BOTTOM NAVIGATION LINKS */}
        <div className="pt-6 border-t border-border flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xs font-mono text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href="/build/history"
            className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
          >
            <span>View All Builds</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default BuildSuccessPage;
