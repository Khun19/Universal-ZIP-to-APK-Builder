import { useState } from 'react';
import { Link } from 'wouter';
import { FolderGit2, PlusCircle, FileArchive, ArrowRight, Terminal, Download, Layers } from 'lucide-react';
import { useBuild } from '@/context/BuildContext';
import { StatusBadge } from '@/components/StatusBadge';

export function ProjectsView() {
  const { builds, selectBuild } = useBuild();
  const [filterType, setFilterType] = useState<string>('all');

  // Group builds into distinct projects
  const filtered = builds.filter((b) => {
    if (filterType === 'all') return true;
    return b.projectType.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="projects-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Managed Projects
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Workspaces created from uploaded ZIP archives and detected Android strategies.
          </p>
        </div>

        <Link
          href="/new-build"
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-xs text-primary-foreground shadow-sm hover:brightness-105 transition-all self-start sm:self-auto"
        >
          <PlusCircle size={15} />
          <span>Upload Project</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'Capacitor', 'Native Android', 'React / Vite'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-xl px-3.5 py-1.5 font-mono-ui text-xs font-medium transition-all ${
              filterType === type
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {type === 'all' ? 'All Types' : type}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((build) => (
          <div
            key={build.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-border/90 hover:shadow-md transition-all"
            data-testid={`project-card-${build.id}`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileArchive size={20} />
                </div>
                <StatusBadge status={build.status} size="sm" />
              </div>

              <h3 className="mt-4 font-bold text-base text-foreground font-display truncate">
                {build.projectName}
              </h3>
              <p className="font-mono-ui text-xs text-muted-foreground truncate">
                {build.fileName} · {build.fileSize}
              </p>

              <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5 font-mono-ui text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Stack:</span>
                  <span className="text-foreground font-medium">{build.projectType}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Strategy:</span>
                  <span className="text-foreground font-medium truncate max-w-[180px]">{build.strategy}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Last Job:</span>
                  <span className="text-muted-foreground/80">{build.duration}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between">
              <Link
                href={`/inspect/${build.id}`}
                onClick={() => selectBuild(build.id)}
                className="font-mono-ui text-xs text-muted-foreground hover:text-foreground"
              >
                Inspection
              </Link>

              <Link
                href={`/build/${build.id}`}
                onClick={() => selectBuild(build.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-mono-ui text-xs font-semibold text-primary-foreground hover:brightness-105 transition-all"
              >
                <span>Console</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
