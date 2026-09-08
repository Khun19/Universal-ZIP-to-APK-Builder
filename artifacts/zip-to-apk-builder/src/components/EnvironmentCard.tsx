import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Cpu, Server, FolderCode, Wrench } from 'lucide-react';

export interface ToolDiagnostic {
  name: string;
  category: 'Android' | 'Java' | 'Build' | 'Runtime';
  status: 'READY' | 'WARNING' | 'ERROR';
  version: string;
  path: string;
  description: string;
}

export const DEFAULT_ENVIRONMENT_TOOLS: ToolDiagnostic[] = [
  {
    name: 'Android SDK',
    category: 'Android',
    status: 'READY',
    version: 'Platforms: android-34, android-33',
    path: '/opt/android-sdk',
    description: 'Android platform tools and command line toolchain',
  },
  {
    name: 'Android Build Tools',
    category: 'Android',
    status: 'READY',
    version: '34.0.0, 33.0.2',
    path: '/opt/android-sdk/build-tools/34.0.0',
    description: 'Core dexing, resource packaging, and d8 compilers',
  },
  {
    name: 'AAPT2 (Android Asset Packaging Tool)',
    category: 'Android',
    status: 'READY',
    version: 'v2.19-11048873',
    path: '/opt/android-sdk/build-tools/34.0.0/aapt2',
    description: 'Resource parsing, linking, and manifest compilation',
  },
  {
    name: 'Java Development Kit (JDK)',
    category: 'Java',
    status: 'READY',
    version: 'OpenJDK 17.0.10 (build 17.0.10+7)',
    path: '/usr/lib/jvm/java-17-openjdk-amd64',
    description: 'Gradle and Kotlin compilation environment',
  },
  {
    name: 'Gradle Runtime',
    category: 'Build',
    status: 'READY',
    version: 'Gradle 8.4',
    path: '/usr/bin/gradle / project wrapper',
    description: 'Android build automation daemon',
  },
  {
    name: 'Node.js Runtime',
    category: 'Runtime',
    status: 'READY',
    version: 'v20.18.0',
    path: '/usr/local/bin/node',
    description: 'Vite and Capacitor web asset bundler',
  },
  {
    name: 'pnpm / npm',
    category: 'Runtime',
    status: 'READY',
    version: 'pnpm 9.15.4 / npm 10.8.2',
    path: '/usr/local/bin/pnpm',
    description: 'Workspace dependency manager',
  },
];

interface EnvironmentCardProps {
  tools?: ToolDiagnostic[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function EnvironmentCard({
  tools = DEFAULT_ENVIRONMENT_TOOLS,
  onRefresh,
  isRefreshing = false,
  className = '',
}: EnvironmentCardProps) {
  const readyCount = tools.filter((t) => t.status === 'READY').length;

  return (
    <div className={`space-y-6 ${className}`} data-testid="environment-card">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Server size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-emerald-500 font-bold">
                Diagnostics Pass
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="mt-1 text-lg font-bold text-foreground">
              Build Toolchain Operational
            </h3>
            <p className="font-mono-ui text-xs text-muted-foreground">
              {readyCount} of {tools.length} components validated and ready for assemble tasks
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-border bg-background px-3.5 py-2 font-mono-ui text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Checking...' : 'Re-check Environment'}</span>
          </button>
        )}
      </div>

      {/* Grid of Tool Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const isReady = tool.status === 'READY';
          const isWarn = tool.status === 'WARNING';

          return (
            <div
              key={tool.name}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-border/80"
              data-testid={`env-tool-${tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench size={15} className="text-primary shrink-0" />
                    <span className="font-mono-ui text-xs font-bold text-foreground">
                      {tool.name}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono-ui text-[10px] uppercase font-semibold ${
                      isReady
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                        : isWarn
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {isReady ? (
                      <CheckCircle2 size={10} />
                    ) : isWarn ? (
                      <AlertTriangle size={10} />
                    ) : (
                      <XCircle size={10} />
                    )}
                    <span>{tool.status}</span>
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5 font-mono-ui text-[11px]">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider">Version:</span>
                  <span className="text-foreground font-medium truncate max-w-[210px]">{tool.version}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider">Path:</span>
                  <span className="text-muted-foreground/80 truncate max-w-[210px]" title={tool.path}>
                    {tool.path}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
