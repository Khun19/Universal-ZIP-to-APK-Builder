import { useState } from 'react';
import { Link } from 'wouter';
import {
  Search,
  Filter,
  FileArchive,
  Download,
  Terminal,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { useBuild } from '@/context/BuildContext';
import { StatusBadge } from '@/components/StatusBadge';

export function BuildHistoryView() {
  const {
    builds,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectBuild,
    deleteBuild,
  } = useBuild();

  const filteredBuilds = builds.filter((build) => {
    // Status filter
    if (statusFilter === 'success' && build.status !== 'SUCCESS') return false;
    if (statusFilter === 'failed' && build.status !== 'FAILED') return false;
    if (statusFilter === 'running' && !['BUILDING', 'INSPECTING'].includes(build.status)) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = build.projectName.toLowerCase().includes(q);
      const matchId = build.id.toLowerCase().includes(q);
      const matchStrategy = build.strategy.toLowerCase().includes(q);
      const matchFile = build.fileName.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchStrategy && !matchFile) return false;
    }

    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" data-testid="build-history-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Build History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Audit trail of all project inspection, compilation, and APK outputs.
          </p>
        </div>

        <Link
          href="/new-build"
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-xs text-primary-foreground shadow-sm hover:brightness-105 transition-all self-start sm:self-auto"
        >
          <PlusCircle size={15} />
          <span>New Build</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search builds by project, ID, or strategy..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 font-mono-ui text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            data-testid="input-search-history"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'success', 'running', 'failed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 font-mono-ui text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid={`filter-tab-${tab}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Builds Table / Mobile Cards */}
      {filteredBuilds.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileArchive size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-bold text-base text-foreground">No builds found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery ? `No results match your filter "${searchQuery}".` : 'No builds recorded in this filter view.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Desktop Table Header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 border-b border-border bg-muted/30 px-5 py-3 font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">
            <span className="col-span-4">Project / Archive</span>
            <span className="col-span-2">Build ID</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2">Strategy</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          {/* List items */}
          <div className="divide-y divide-border">
            {filteredBuilds.map((build) => (
              <div
                key={build.id}
                className="flex flex-col lg:grid lg:grid-cols-12 gap-3 p-4 lg:px-5 lg:py-3.5 lg:items-center hover:bg-muted/30 transition-colors"
                data-testid={`history-row-${build.id}`}
              >
                {/* Project Name & Archive */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileArchive size={18} />
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
                      {build.fileName} ({build.fileSize})
                    </div>
                  </div>
                </div>

                {/* Build ID & Date */}
                <div className="col-span-2 font-mono-ui text-xs">
                  <span className="font-semibold text-foreground truncate block">{build.id}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(build.createdAt)}</span>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={build.status} size="sm" />
                </div>

                {/* Strategy & Duration */}
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground font-medium truncate block font-mono-ui">
                    {build.strategy}
                  </span>
                  <span className="font-mono-ui text-[10px] text-muted-foreground/70">
                    Duration: {build.duration}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-between lg:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-0 border-border/60">
                  <div className="flex items-center gap-2">
                    {build.status === 'SUCCESS' && build.artifact ? (
                      <Link
                        href={`/build/${build.id}/success`}
                        onClick={() => selectBuild(build.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 font-mono-ui text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20"
                      >
                        <Download size={12} />
                        <span>APK</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/build/${build.id}`}
                        onClick={() => selectBuild(build.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-mono-ui text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Terminal size={12} />
                        <span>Logs</span>
                      </Link>
                    )}

                    <button
                      onClick={() => deleteBuild(build.id)}
                      className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Remove record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <Link
                    href={`/build/${build.id}`}
                    onClick={() => selectBuild(build.id)}
                    className="lg:hidden text-primary font-mono-ui text-xs font-medium"
                  >
                    Open Console →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
