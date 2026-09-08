import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Download,
  FileCode2,
  Calendar,
  Clock,
  ChevronRight,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { getStoredProjects, ProjectItem, BuildJobItem } from '../services/mockData';

export const BuildHistoryPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'RUNNING' | 'FAILED'>('ALL');

  useEffect(() => {
    setProjects(getStoredProjects());
  }, []);

  // Extract all builds
  const allBuilds: (BuildJobItem & { projectFilename: string })[] = projects
    .map((p) => {
      if (!p.latestBuild) return null;
      return {
        ...p.latestBuild,
        projectFilename: p.filename,
      };
    })
    .filter(Boolean) as any;

  // Filter builds
  const filteredBuilds = allBuilds.filter((build) => {
    const matchesSearch =
      searchQuery === '' ||
      build.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.strategy.toLowerCase().includes(searchQuery.toLowerCase());

    const isRunning = ['ANALYZING', 'PREPARING', 'BUILDING', 'VALIDATING'].includes(build.status);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUCCESS' && build.status === 'SUCCESS') ||
      (statusFilter === 'FAILED' && build.status === 'FAILED') ||
      (statusFilter === 'RUNNING' && isRunning);

    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-accent">
              <History className="w-3.5 h-3.5" />
              Build Ledger
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans mt-0.5">
              Build History
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Audit log of all compilation jobs, strategies, runtimes, and output APK packages.
            </p>
          </div>

          <Link
            href="/build/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:brightness-105 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Build</span>
          </Link>
        </div>

        {/* CONTROLS: SEARCH & FILTER TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border self-start">
            {(['ALL', 'SUCCESS', 'RUNNING', 'FAILED'] as const).map((tab) => {
              const active = statusFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-card text-foreground shadow-2xs border border-border/80'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search builds by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* RESULTS TABLE (DESKTOP) & CARDS (MOBILE) */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {filteredBuilds.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <History className="w-8 h-8 mx-auto stroke-[1.2] opacity-40" />
              <div className="font-semibold text-sm">No builds matched your filter.</div>
              <p className="text-xs">Try clearing the search query or changing the filter status.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-6">Project</th>
                      <th className="py-3 px-4">Build ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Strategy</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-6 text-right">Artifact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {filteredBuilds.map((build) => {
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
                        <tr key={build.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              <FileCode2 className="w-4 h-4 text-accent shrink-0" />
                              <span>{build.projectName}</span>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">
                              {build.projectFilename}
                            </span>
                          </td>

                          <td className="py-4 px-4 font-mono text-muted-foreground text-[11px]">
                            {build.id.slice(0, 14)}
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
                                <span>{build.artifact.formattedSize}</span>
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                              >
                                <span>Live Console</span>
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
                {filteredBuilds.map((build) => (
                  <div key={build.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{build.projectName}</h4>
                        <p className="font-mono text-[10px] text-muted-foreground">{build.id.slice(0, 16)}</p>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted">
                        {build.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>{build.strategy}</span>
                      <span>{build.duration}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-border/50">
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
                          <span>Error Log</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default BuildHistoryPage;
