import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HardDrive,
  Terminal,
  ShieldCheck,
  Layers,
  FolderOpen,
  Info,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { INITIAL_ENVIRONMENT_TOOLS, EnvironmentTool } from '../services/mockData';

export const EnvironmentPage: React.FC = () => {
  const [tools, setTools] = useState<EnvironmentTool[]>(INITIAL_ENVIRONMENT_TOOLS);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState('Just now');

  const handleRunDoctor = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setLastChecked('Just now');
    }, 800);
  };

  const readyCount = tools.filter((t) => t.status === 'READY').length;
  const warnCount = tools.filter((t) => t.status === 'WARNING').length;
  const errorCount = tools.filter((t) => t.status === 'ERROR').length;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-accent">
              <Cpu className="w-3.5 h-3.5" />
              Host &amp; Container Toolchains
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans mt-0.5">
              Build Environment Diagnostics
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Health check of compilers, Android SDKs, JVM daemons, and package managers.
            </p>
          </div>

          <button
            onClick={handleRunDoctor}
            disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Environment...' : 'Run Diagnostics'}</span>
          </button>
        </div>

        {/* SYSTEM STATUS BANNER */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground font-sans">
                    All Core Build Tools are Operational
                  </h3>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    ALL SYSTEMS GO
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Host container is equipped to build Native Gradle, Capacitor Android, and hybrid web wrappers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground shrink-0">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{readyCount} Ready</span>
              <span>·</span>
              <span className={warnCount > 0 ? 'text-amber-500 font-semibold' : ''}>{warnCount} Warnings</span>
              <span>·</span>
              <span className={errorCount > 0 ? 'text-rose-500 font-semibold' : ''}>{errorCount} Errors</span>
            </div>
          </div>
        </div>

        {/* TOOLCHAIN CARDS GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground font-mono uppercase tracking-wider">
              Installed Toolchain Components ({tools.length})
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              Last checked: {lastChecked}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => {
              const statusMap: Record<string, { badge: string; icon: typeof CheckCircle2; iconColor: string }> = {
                READY: {
                  badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
                  icon: CheckCircle2,
                  iconColor: 'text-emerald-500',
                },
                WARNING: {
                  badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
                  icon: AlertTriangle,
                  iconColor: 'text-amber-500',
                },
                ERROR: {
                  badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
                  icon: XCircle,
                  iconColor: 'text-rose-500',
                },
              };
              const statusConfig = statusMap[tool.status] || statusMap.READY;

              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={tool.name}
                  className="rounded-2xl border border-border bg-card p-5 shadow-2xs hover:border-border/90 transition-colors space-y-3"
                  data-testid={`tool-card-${tool.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                        {tool.category}
                      </span>
                      <h4 className="font-bold text-base text-foreground font-sans mt-0.5">
                        {tool.name}
                      </h4>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider border ${statusConfig.badge}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{tool.status}</span>
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>

                  <div className="pt-2 border-t border-border/70 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-semibold text-foreground">{tool.version}</span>
                    </div>

                    <div className="flex items-start justify-between text-xs font-mono gap-2">
                      <span className="text-muted-foreground shrink-0">Path</span>
                      <code className="text-[11px] text-foreground/80 truncate block text-right">
                        {tool.path}
                      </code>
                    </div>

                    {tool.details && (
                      <div className="mt-2 text-[11px] font-mono text-muted-foreground/80 bg-muted/40 p-2 rounded-lg border border-border/50">
                        {tool.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTAINER SANDBOX TELEMETRY */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <HardDrive className="w-4 h-4 text-accent" />
            <span>Sandbox Allocation &amp; Storage</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
              <div className="font-mono text-[9px] uppercase text-muted-foreground font-bold">Allocated Memory</div>
              <div className="mt-1 text-sm font-bold text-foreground font-mono">4,096 MB RAM</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">JVM Heap max: 3,072 MB</div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
              <div className="font-mono text-[9px] uppercase text-muted-foreground font-bold">Workspace Disk</div>
              <div className="mt-1 text-sm font-bold text-foreground font-mono">18.4 GB Free</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Ephemeral container volume</div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
              <div className="font-mono text-[9px] uppercase text-muted-foreground font-bold">Gradle Cache</div>
              <div className="mt-1 text-sm font-bold text-foreground font-mono">1.2 GB Cached</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Shared dependency cache</div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
              <div className="font-mono text-[9px] uppercase text-muted-foreground font-bold">Concurrency</div>
              <div className="mt-1 text-sm font-bold text-foreground font-mono">2 Parallel Workers</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Non-interfering builds</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default EnvironmentPage;
