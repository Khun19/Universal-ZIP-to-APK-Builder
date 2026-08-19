import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  Activity, AlertTriangle, ArrowRight, Box, Check, ChevronRight, CircleDot, CircleX,
  Clock3, Code2, Download, FileArchive, FileCode2, FileText, Gauge, GitBranch,
  HardDriveDownload, History, LayoutDashboard, LoaderCircle, Menu, PackageCheck,
  Play, RefreshCw, Rocket, Search, ServerCog, ShieldCheck, Terminal, UploadCloud,
  X, Zap,
} from 'lucide-react';
import {
  getGetBuildLogsQueryKey,
  getGetBuildQueryKey,
  getGetProjectAnalysisQueryKey,
  getGetProjectQueryKey,
  getListProjectsQueryKey,
  getDownloadArtifactQueryKey,
  useAnalyzeProject,
  useCreateBuild,
  useCreateProject,
  useDownloadArtifact,
  useGetBuild,
  useGetBuildLogs,
  useGetProject,
  useGetProjectAnalysis,
  useHealthCheck,
  useListProjects,
} from '@workspace/api-client-react';
import type { Analysis, BuildJob, Project } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();

const isActiveBuild = (status?: string) => Boolean(status && !['SUCCESS', 'FAILED'].includes(status));
const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const formatDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function StatusPill({ value, tone }: { value: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const inferred = value === 'SUCCESS' || value === 'UPLOADED' || value === 'COMPLETE' ? 'good' : value === 'FAILED' || value === 'REJECTED' ? 'bad' : value === 'PENDING' ? 'neutral' : 'warn';
  const applied = tone ?? inferred;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-ui text-[10px] font-medium tracking-[.08em] ${applied === 'good' ? 'border-emerald-700/25 bg-emerald-700/10 text-emerald-800' : applied === 'bad' ? 'border-red-700/25 bg-red-700/10 text-red-800' : applied === 'warn' ? 'border-amber-700/25 bg-amber-700/10 text-amber-800' : 'border-slate-500/20 bg-slate-500/10 text-slate-600'}`} data-testid={`status-${slug(value)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${applied === 'good' ? 'bg-emerald-600' : applied === 'bad' ? 'bg-red-600' : applied === 'warn' ? 'bg-amber-600 pulse-dot' : 'bg-slate-500'}`} />
      {value.replaceAll('_', ' ')}
    </span>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} aria-label="Loading" />;
}

function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground"><Box size={21} /></div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{copy}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function ErrorState({ onRetry, message = 'The control room could not reach the builder service.' }: { onRetry: () => void; message?: string }) {
  return (
    <div className="rounded-xl border border-red-700/25 bg-red-700/5 px-6 py-10 text-center">
      <CircleX className="mx-auto text-red-700" size={24} />
      <h3 className="mt-3 font-semibold text-red-900">Connection interrupted</h3>
      <p className="mt-1 text-sm text-red-800/75">{message}</p>
      <button onClick={onRetry} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg border border-red-700/30 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-700/10" data-testid="button-retry">
        <RefreshCw size={14} /> Retry request
      </button>
    </div>
  );
}

function Shell({ children, projectId }: { children: ReactNode; projectId?: string }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: health } = useHealthCheck({ query: { queryKey: ['/api/healthz'], refetchInterval: 15000 } });
  const nav = projectId ? [
    { href: `/projects/${projectId}`, label: 'Overview', icon: LayoutDashboard },
    { href: `/projects/${projectId}/analysis`, label: 'Analysis', icon: Search },
    { href: `/projects/${projectId}/build`, label: 'Build control', icon: Rocket },
    { href: `/projects/${projectId}/artifacts`, label: 'Artifacts', icon: PackageCheck },
  ] : [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];
  return (
    <div className="app-shell flex bg-background">
      <button className={`fixed inset-0 z-30 bg-slate-950/40 md:hidden ${mobileOpen ? 'block' : 'hidden'}`} onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation" />
      <aside className={`nav-grid-bg fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="focus-ring flex items-center gap-3" data-testid="link-brand">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Zap size={17} strokeWidth={2.5} /></div>
            <div><div className="text-[13px] font-bold tracking-[.14em]">ZIP<span className="text-sidebar-primary">→</span>APK</div><div className="font-mono-ui text-[9px] tracking-[.15em] text-sidebar-foreground/55">BUILD CONTROL ROOM</div></div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="md:hidden" aria-label="Close menu" data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="px-4 pt-7">
          <div className="mb-3 px-3 font-mono-ui text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/45">Workspace</div>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid={`link-nav-${slug(label)}`}><Icon size={16} /><span>{label}</span>{active && <ChevronRight size={14} className="ml-auto text-sidebar-primary" />}</Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-sidebar-border p-5">
          <div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.14em] text-sidebar-foreground/60"><span className={`h-2 w-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-400' : 'bg-amber-400 pulse-dot'}`} /> Builder service</div>
          <div className="mt-2 flex items-center justify-between font-mono-ui text-[10px] text-sidebar-foreground/40"><span>{health?.status === 'ok' ? 'Operational' : 'Checking status'}</span><span>v0.1.0</span></div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex h-[76px] items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur md:px-9">
          <button onClick={() => setMobileOpen(true)} className="focus-ring rounded-lg p-2 md:hidden" aria-label="Open navigation" data-testid="button-open-menu"><Menu size={20} /></button>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><Activity size={14} className="text-accent" /> Evidence-first builds <span className="mx-1 text-border">/</span> no simulated success</div>
          <div className="ml-auto flex items-center gap-3"><div className="hidden rounded-full border border-border bg-card px-3 py-1.5 font-mono-ui text-[10px] text-muted-foreground sm:block">LOCAL WORKSPACE</div><div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">DV</div></div>
        </header>
        {children}
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="font-mono-ui text-[10px] font-medium uppercase tracking-[.22em] text-accent">{eyebrow}</div><h1 className="mt-2 text-3xl font-bold tracking-[-.04em] text-foreground md:text-[40px]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy}</p></div>{action}</div>;
}

function UploadPanel({ onUploaded }: { onUploaded: (project: Project) => void }) {
  const createProject = useCreateProject();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const chooseFile = (candidate?: File) => { if (!candidate) return; if (!candidate.name.toLowerCase().endsWith('.zip')) { setError('Only .zip project archives are accepted.'); return; } setError(''); setFile(candidate); if (!name) setName(candidate.name.replace(/\.zip$/i, '')); };
  const submit = () => {
    if (!name.trim() || !file) { setError('Add a project name and a ZIP archive before continuing.'); return; }
    setError('');
    createProject.mutate({ data: { name: name.trim() } }, {
      onSuccess: async (project) => {
        const body = new FormData(); body.append('file', file);
        try {
          const response = await fetch(`/api/projects/${project.id}/upload`, { method: 'POST', body });
          if (!response.ok) throw new Error('Upload was rejected by the builder service.');
          onUploaded(project);
          setName(''); setFile(null);
        } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.'); }
      },
      onError: () => setError('Project could not be created. Check the builder service and try again.'),
    });
  };
  return (
    <div className="fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">New input</div><h2 className="mt-1 font-semibold">Bring a project into the room</h2></div><FileArchive className="text-primary" size={22} /></div>
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1.35fr] lg:p-7">
        <div><label className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground" htmlFor="project-name">Project name</label><input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Field Notes Mobile" className="focus-ring mt-2 w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-project-name" /><p className="mt-2 text-xs text-muted-foreground">Use a name your team will recognize in the build history.</p></div>
        <div><label className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">ZIP archive</label><label onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }} className={`mt-2 flex min-h-[114px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-5 text-center transition-colors ${dragging ? 'border-accent bg-accent/10' : 'border-input bg-background hover:border-accent/60'}`} data-testid="dropzone-project-upload"><input type="file" accept=".zip,application/zip" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} data-testid="input-project-file" />{file ? <><Check size={18} className="text-accent" /><span className="mt-2 text-sm font-medium">{file.name}</span><span className="font-mono-ui text-[10px] text-muted-foreground">{formatBytes(file.size)} · ready to send</span></> : <><UploadCloud size={20} className="text-muted-foreground" /><span className="mt-2 text-sm font-medium">Drop ZIP here or browse</span><span className="font-mono-ui text-[10px] text-muted-foreground">MAX 250 MB · ZIP ONLY</span></>}</label></div>
      </div>
      {(error || createProject.isPending) && <div className={`mx-5 mb-5 rounded-lg border px-3 py-2 text-xs ${error ? 'border-red-700/20 bg-red-700/5 text-red-800' : 'border-amber-700/20 bg-amber-700/5 text-amber-800'}`} role={error ? 'alert' : 'status'} data-testid="status-upload"><span className="inline-flex items-center gap-2">{createProject.isPending && <LoaderCircle size={14} className="animate-spin" />}{error || 'Creating project and transferring archive…'}</span></div>}
      <div className="flex justify-end border-t border-border bg-muted/35 px-5 py-4"><button onClick={submit} disabled={createProject.isPending} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55" data-testid="button-upload-project">{createProject.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowRight size={15} />} {createProject.isPending ? 'Transferring' : 'Create & upload'}</button></div>
    </div>
  );
}

function Dashboard() {
  const { data: projects, isLoading, isError, refetch } = useListProjects();
  const invalidate = useQueryClient();
  const [uploaded, setUploaded] = useState('');
  const list = projects ?? [];
  return <Shell><div className="mx-auto max-w-[1380px] px-5 py-8 md:px-9 md:py-11">
    <PageHeading eyebrow="Workspace / dashboard" title="Build with receipts." copy="A clear handoff from generated source to a validated Android package. Every transition is visible, every failure is actionable." action={<button onClick={() => { refetch(); invalidate.invalidateQueries({ queryKey: getListProjectsQueryKey() }); }} className="focus-ring inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-medium hover:bg-muted lg:self-auto" data-testid="button-refresh-projects"><RefreshCw size={15} /> Refresh index</button>} />
    {uploaded && <div className="fade-up mb-5 flex items-center gap-2 rounded-lg border border-emerald-700/25 bg-emerald-700/5 px-4 py-3 text-sm text-emerald-800" role="status" data-testid="status-project-uploaded"><Check size={16} /> {uploaded} was added to the workspace.</div>}
    <UploadPanel onUploaded={(project) => { setUploaded(project.name); invalidate.invalidateQueries({ queryKey: getListProjectsQueryKey() }); }} />
    <section className="mt-10"><div className="mb-4 flex items-center justify-between"><div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Workspace index</div><h2 className="mt-1 text-xl font-semibold">Recent projects</h2></div><div className="font-mono-ui text-xs text-muted-foreground" data-testid="text-project-count">{list.length} {list.length === 1 ? 'project' : 'projects'}</div></div>
      {isLoading ? <div className="grid gap-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-[82px]" />)}</div> : isError ? <ErrorState onRetry={() => refetch()} /> : list.length === 0 ? <EmptyState title="Your workspace is clear." copy="Upload a ZIP generated by your coding agent to start collecting compatibility evidence." /> : <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="hidden grid-cols-[1fr_150px_150px_150px_38px] gap-4 border-b border-border bg-muted/35 px-5 py-3 font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground md:grid"><span>Project</span><span>Archive</span><span>Analysis</span><span>Created</span><span /></div>{list.map((project) => <Link href={`/projects/${project.id}`} key={project.id} className="focus-ring grid grid-cols-1 gap-2 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/30 md:grid-cols-[1fr_150px_150px_150px_38px] md:items-center md:gap-4" data-testid={`link-project-${project.id}`}><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><FileArchive size={17} /></div><div className="min-w-0"><div className="truncate text-sm font-semibold">{project.name}</div><div className="font-mono-ui text-[10px] text-muted-foreground">{project.id.slice(0, 12)}</div></div></div><div className="flex items-center gap-2 text-xs text-muted-foreground md:block"><span className="md:hidden">Archive</span><StatusPill value={project.uploadStatus} /></div><div className="flex items-center gap-2 text-xs text-muted-foreground md:block"><span className="md:hidden">Analysis</span><StatusPill value={project.analysisStatus} /></div><div className="text-xs text-muted-foreground">{formatDate(project.createdAt)}</div><ChevronRight className="hidden text-muted-foreground md:block" size={16} /></Link>)}</div>}
    </section>
  </div></Shell>;
}

function ProjectHeader({ project, active }: { project: Project; active: string }) {
  const tabs = [{ href: `/projects/${project.id}`, label: 'Overview' }, { href: `/projects/${project.id}/analysis`, label: 'Analysis' }, { href: `/projects/${project.id}/build`, label: 'Build control' }, { href: `/projects/${project.id}/artifacts`, label: 'Artifacts' }];
  return <div className="border-b border-border bg-card/50 px-5 pt-7 md:px-9 md:pt-9"><div className="mx-auto max-w-[1380px]"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><Link href="/dashboard" className="focus-ring inline-flex items-center gap-1 font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground hover:text-foreground" data-testid="link-back-dashboard"><ChevronRight size={13} className="rotate-180" /> Workspace index</Link><h1 className="mt-4 truncate text-2xl font-bold tracking-[-.035em] md:text-3xl">{project.name}</h1><div className="mt-2 flex flex-wrap items-center gap-2"><StatusPill value={project.uploadStatus} /><span className="font-mono-ui text-[10px] text-muted-foreground">{formatBytes(project.fileSize)} · added {formatDate(project.createdAt)}</span></div></div><div className="hidden rounded-lg border border-border bg-background px-3 py-2 text-right sm:block"><div className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-muted-foreground">Project ID</div><div className="mt-1 font-mono-ui text-xs">{project.id.slice(0, 18)}</div></div></div><nav className="mt-7 flex gap-5 overflow-x-auto">{tabs.map((tab) => <Link key={tab.href} href={tab.href} className={`focus-ring shrink-0 border-b-2 pb-3 text-sm font-medium ${active === tab.label ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`} data-testid={`link-project-tab-${slug(tab.label)}`}>{tab.label}</Link>)}</nav></div></div>;
}

function ProjectFrame({ project, active, children }: { project: Project; active: string; children: ReactNode }) {
  return <Shell projectId={project.id}><ProjectHeader project={project} active={active} />{children}</Shell>;
}

function ProjectLoader({ children }: { children: (project: Project) => ReactNode }) {
  const { id = '' } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, refetch } = useGetProject(id, { query: { queryKey: getGetProjectQueryKey(id), enabled: Boolean(id) } });
  if (isLoading) return <Shell><div className="mx-auto max-w-[1380px] px-5 py-10 md:px-9"><Skeleton className="h-8 w-56" /><Skeleton className="mt-4 h-4 w-96 max-w-full" /><div className="mt-10 grid gap-4 md:grid-cols-2"><Skeleton className="h-52" /><Skeleton className="h-52" /></div></div></Shell>;
  if (isError || !project) return <Shell><div className="mx-auto max-w-xl px-5 py-20 md:px-9"><ErrorState onRetry={() => refetch()} message="This project could not be loaded. It may have been removed or the service is unavailable." /></div></Shell>;
  return <>{children(project)}</>;
}

function Overview({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const { data: analysis } = useGetProjectAnalysis(project.id, { query: { queryKey: getGetProjectAnalysisQueryKey(project.id), enabled: project.analysisStatus === 'COMPLETE' } });
  const analyze = useAnalyzeProject();
  const [buildId] = useState(() => localStorage.getItem(`build:${project.id}`));
  const { data: build } = useGetBuild(buildId || 'none', { query: { queryKey: getGetBuildQueryKey(buildId || 'none'), enabled: Boolean(buildId), refetchInterval: buildId ? 4000 : false } });
  return <ProjectFrame project={project} active="Overview"><div className="mx-auto max-w-[1380px] px-5 py-8 md:px-9 md:py-10"><div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
    <div className="fade-up rounded-2xl border border-border bg-card p-6 md:p-8"><div className="flex items-start justify-between"><div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">Readiness brief</div><h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Know what you can build.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">The builder inspects the uploaded source before it touches Android tooling. Run analysis to get evidence, not a guess.</p></div><Gauge className="text-primary" size={27} /></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><Metric label="Archive" value={project.uploadStatus} detail={formatBytes(project.fileSize)} /><Metric label="Compatibility" value={analysis ? `${analysis.compatibilityScore}%` : 'Not scored'} detail={analysis ? `${analysis.confidence}% confidence` : 'Analysis required'} /><Metric label="Latest build" value={build?.status ?? 'Not started'} detail={build ? `${build.progress}% complete` : 'No job queued'} /></div><div className="mt-8 flex flex-wrap gap-3">{project.analysisStatus === 'COMPLETE' ? <Link href={`/projects/${project.id}/analysis`} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:brightness-105" data-testid="link-review-analysis">Review evidence <ArrowRight size={15} /></Link> : <button onClick={() => analyze.mutate({ id: project.id }, { onSuccess: (result) => { queryClient.setQueryData(getGetProjectAnalysisQueryKey(project.id), result); queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) }); } })} disabled={analyze.isPending} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-55" data-testid="button-run-analysis">{analyze.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />} {analyze.isPending ? 'Inspecting source' : 'Run compatibility analysis'}</button>}<Link href={`/projects/${project.id}/build`} className={`focus-ring inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium ${project.analysisStatus === 'COMPLETE' ? 'hover:bg-muted' : 'pointer-events-none opacity-45'}`} data-testid="link-open-build">Open build control <ChevronRight size={15} /></Link></div></div>
    <div className="fade-up-2 scanline rounded-2xl border border-sidebar-border bg-sidebar p-6 text-sidebar-foreground md:p-8"><div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-sidebar-primary"><CircleDot size={12} className="pulse-dot" /> Control room</div><div className="mt-10"><div className="font-mono-ui text-[11px] uppercase tracking-[.16em] text-sidebar-foreground/50">Current phase</div><div className="mt-3 text-3xl font-semibold tracking-[-.04em]">{build?.status ?? (project.analysisStatus === 'COMPLETE' ? 'Ready' : 'Awaiting analysis')}</div><p className="mt-3 text-sm leading-6 text-sidebar-foreground/60">{build ? 'This panel reflects the latest job reported by the builder service.' : 'Nothing is hidden behind a success screen. The next honest step is shown above.'}</p></div><div className="mt-10 border-t border-sidebar-border pt-4 font-mono-ui text-[10px] text-sidebar-foreground/45"><div className="flex justify-between"><span>TRACE</span><span>{build ? build.id.slice(0, 12) : 'NO ACTIVE JOB'}</span></div></div></div>
  </div><div className="mt-8 grid gap-5 md:grid-cols-3"><InfoCard icon={FileCode2} title="Source inspection" copy="Framework, package manager, language and build tool are detected from the archive itself." /><InfoCard icon={ShieldCheck} title="Compatibility evidence" copy="Blockers and warnings stay visible so a failed build never looks like a successful download." /><InfoCard icon={Terminal} title="Real build output" copy="Follow the builder's own log stream as it prepares, compiles and validates the APK." /></div></div></ProjectFrame>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-lg border border-border bg-background/70 p-3.5"><div className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-muted-foreground">{label}</div><div className="mt-2 truncate font-semibold">{value}</div><div className="mt-1 truncate text-xs text-muted-foreground">{detail}</div></div>;
}
function InfoCard({ icon: Icon, title, copy }: { icon: typeof FileCode2; title: string; copy: string }) {
  return <div className="rounded-xl border border-border bg-card p-5"><Icon size={19} className="text-accent" /><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>;
}

function AnalysisPage({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const { data: analysis, isLoading, isError, refetch } = useGetProjectAnalysis(project.id, { query: { queryKey: getGetProjectAnalysisQueryKey(project.id), enabled: project.analysisStatus === 'COMPLETE' } });
  const analyze = useAnalyzeProject();
  const run = () => analyze.mutate({ id: project.id }, { onSuccess: (result) => { queryClient.setQueryData(getGetProjectAnalysisQueryKey(project.id), result); queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) }); } });
  return <ProjectFrame project={project} active="Analysis"><div className="mx-auto max-w-[1380px] px-5 py-8 md:px-9 md:py-10"><PageHeading eyebrow="Evidence / compatibility" title="Compatibility, laid bare." copy="The analysis is a report from the uploaded source. It is not a promise that the project will build." action={project.analysisStatus !== 'COMPLETE' && <button onClick={run} disabled={analyze.isPending} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-55" data-testid="button-analyze-project">{analyze.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />} {analyze.isPending ? 'Inspecting source' : 'Run analysis'}</button>} />
    {analyze.isError && <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-700/20 bg-red-700/5 px-4 py-3 text-sm text-red-800" role="alert" data-testid="status-analysis-error"><AlertTriangle size={16} /> Analysis failed. No compatibility result was saved.</div>}
    {isLoading ? <div className="grid gap-5 md:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div> : isError && project.analysisStatus === 'COMPLETE' ? <ErrorState onRetry={() => refetch()} /> : !analysis ? <EmptyState title="No analysis evidence yet." copy="Run source inspection to identify the actual framework, toolchain and build risks." action={<button onClick={run} disabled={analyze.isPending} className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="button-run-analysis-empty">Start inspection</button>} /> : <AnalysisContent analysis={analysis} />}
  </div></ProjectFrame>;
}

function AnalysisContent({ analysis }: { analysis: Analysis }) {
  const scoreColor = analysis.compatibilityScore >= 75 ? 'text-emerald-700' : analysis.compatibilityScore >= 45 ? 'text-amber-700' : 'text-red-700';
  return <div className="fade-up grid gap-5 xl:grid-cols-[.82fr_1.18fr]"><div className="space-y-5"><div className="rounded-2xl border border-border bg-card p-6 md:p-7"><div className="flex items-end justify-between"><div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Compatibility score</div><div className={`mt-2 text-6xl font-bold tracking-[-.06em] ${scoreColor}`}>{analysis.compatibilityScore}<span className="text-2xl text-muted-foreground">/100</span></div></div><div className="text-right"><div className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Confidence</div><div className="mt-2 text-xl font-semibold">{analysis.confidence}%</div></div></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${analysis.compatibilityScore >= 75 ? 'bg-emerald-600' : analysis.compatibilityScore >= 45 ? 'bg-amber-500' : 'bg-red-600'}`} style={{ width: `${analysis.compatibilityScore}%` }} /></div><div className="mt-4 flex items-start gap-2 text-sm leading-5 text-muted-foreground"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />{analysis.recommendedStrategy}</div></div><div className="rounded-xl border border-border bg-card p-6"><div className="flex items-center gap-2"><Code2 size={17} className="text-accent" /><h2 className="font-semibold">Detected stack</h2></div><div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">{[['Framework', analysis.framework], ['Version', analysis.version ?? 'Not detected'], ['Build tool', analysis.buildTool], ['Language', analysis.language], ['Package manager', analysis.packageManager], ['Project type', analysis.projectType ?? 'Not classified']].map(([label, value]) => <div key={label}><div className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-muted-foreground">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>)}</div></div></div><div className="space-y-5"><EvidenceList title="Blockers" items={analysis.blockers} tone="bad" empty="No blockers reported by analysis." /><EvidenceList title="Warnings" items={analysis.warnings} tone="warn" empty="No warnings reported by analysis." /><div className="rounded-xl border border-border bg-card p-6"><div className="flex items-center gap-2"><FileText size={17} className="text-accent" /><h2 className="font-semibold">Evidence trail</h2></div><div className="mt-4 space-y-3">{analysis.evidence.map((item, index) => <div key={`${item}-${index}`} className="flex gap-3 border-l-2 border-primary/60 pl-3 text-sm leading-6 text-muted-foreground"><span className="font-mono-ui text-[10px] text-accent">0{index + 1}</span><span>{item}</span></div>)}</div></div></div></div>;
}

function EvidenceList({ title, items, tone, empty }: { title: string; items: string[]; tone: 'bad' | 'warn'; empty: string }) {
  return <div className={`rounded-xl border p-6 ${tone === 'bad' ? 'border-red-700/20 bg-red-700/5' : 'border-amber-700/20 bg-amber-700/5'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2">{tone === 'bad' ? <CircleX size={17} className="text-red-700" /> : <AlertTriangle size={17} className="text-amber-700" />}<h2 className="font-semibold">{title}</h2></div><span className="font-mono-ui text-xs text-muted-foreground">{items.length}</span></div>{items.length ? <div className="mt-4 space-y-2">{items.map((item, index) => <div key={`${item}-${index}`} className="rounded-lg border border-current/10 bg-background/45 px-3 py-2.5 text-sm leading-5 text-foreground">{item}</div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">{empty}</p>}</div>;
}

function BuildPage({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [buildId, setBuildId] = useState(() => localStorage.getItem(`build:${project.id}`) ?? '');
  const createBuild = useCreateBuild();
  const { data: analysis } = useGetProjectAnalysis(project.id, { query: { queryKey: getGetProjectAnalysisQueryKey(project.id), enabled: project.analysisStatus === 'COMPLETE' } });
  const buildQuery = useGetBuild(buildId || 'none', { query: { queryKey: getGetBuildQueryKey(buildId || 'none'), enabled: Boolean(buildId), refetchInterval: (query) => isActiveBuild(query.state.data?.status) ? 2500 : false } });
  const logsQuery = useGetBuildLogs(buildId || 'none', { query: { queryKey: getGetBuildLogsQueryKey(buildId || 'none'), enabled: Boolean(buildId), refetchInterval: buildQuery.data && isActiveBuild(buildQuery.data.status) ? 2500 : false } });
  const build = buildQuery.data;
  const logs = logsQuery.data?.logs ?? build?.logs ?? [];
  const queueBuild = () => createBuild.mutate({ id: project.id }, { onSuccess: (job) => { setBuildId(job.id); localStorage.setItem(`build:${project.id}`, job.id); queryClient.setQueryData(getGetBuildQueryKey(job.id), job); } });
  const ready = project.analysisStatus === 'COMPLETE' && (analysis?.blockers.length ?? 0) === 0;
  return <ProjectFrame project={project} active="Build control"><div className="mx-auto max-w-[1380px] px-5 py-8 md:px-9 md:py-10"><PageHeading eyebrow="Execution / build control" title="Watch the real build." copy="Queue only when the source has a path forward. Status and logs below are reported by the builder service." action={<button onClick={queueBuild} disabled={!ready || createBuild.isPending || Boolean(build && isActiveBuild(build.status))} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-queue-build">{createBuild.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Play size={15} />} {createBuild.isPending ? 'Queueing build' : build && isActiveBuild(build.status) ? 'Build in progress' : 'Queue APK build'}</button>} />
    {!ready && <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-700/25 bg-amber-700/5 px-4 py-3.5 text-sm text-amber-900" role="status" data-testid="status-build-not-ready"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><div><div className="font-semibold">Build gate is closed</div><div className="mt-1 text-amber-900/75">{project.analysisStatus !== 'COMPLETE' ? 'Run compatibility analysis before queuing an APK build.' : 'Resolve the blockers in the analysis report before queuing.'}</div></div><Link href={`/projects/${project.id}/analysis`} className="ml-auto shrink-0 font-medium underline" data-testid="link-build-gate-analysis">View report</Link></div>}
    {createBuild.isError && <div className="mb-5 rounded-lg border border-red-700/20 bg-red-700/5 px-4 py-3 text-sm text-red-800" role="alert" data-testid="status-build-error">The builder did not accept this job. No success was recorded.</div>}
    {!build ? <EmptyState title="No build job selected." copy="When you queue a build, this page will stay attached to its status and log stream." action={<button onClick={queueBuild} disabled={!ready || createBuild.isPending} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-45" data-testid="button-queue-build-empty"><Play size={15} /> Queue first build</button>} /> : <div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]"><BuildStatus job={build} /><LogPanel logs={logs} isLoading={logsQuery.isLoading} isError={logsQuery.isError} /></div>}
  </div></ProjectFrame>;
}

function BuildStatus({ job }: { job: BuildJob }) {
  const failed = job.status === 'FAILED'; const success = job.status === 'SUCCESS';
  return <div className="rounded-2xl border border-border bg-card p-6 md:p-7"><div className="flex items-center justify-between"><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Job telemetry</div><StatusPill value={job.status} /></div><div className="mt-8 flex items-end justify-between"><div><div className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Reported progress</div><div className="mt-2 text-6xl font-bold tracking-[-.07em]">{job.progress}<span className="text-2xl text-muted-foreground">%</span></div></div><Activity size={30} className={failed ? 'text-red-700' : success ? 'text-emerald-700' : 'text-primary pulse-dot'} /></div><div className="mt-7 h-3 overflow-hidden rounded-full bg-muted"><div className={`progress-bar h-full rounded-full ${failed ? 'bg-red-600' : success ? 'bg-emerald-600' : 'bg-primary'}`} style={{ width: `${job.progress}%` }} /></div><div className="mt-5 space-y-3">{['QUEUED', 'ANALYZING', 'PREPARING', 'BUILDING', 'VALIDATING', 'SUCCESS'].map((step, index) => { const done = success || (!failed && ['QUEUED', 'ANALYZING', 'PREPARING', 'BUILDING', 'VALIDATING'].indexOf(job.status) >= index); const current = job.status === step; return <div key={step} className={`flex items-center gap-3 text-sm ${done || current ? 'text-foreground' : 'text-muted-foreground/45'}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${done ? 'border-emerald-600 bg-emerald-600 text-white' : current ? 'border-primary bg-primary/15 text-foreground' : 'border-border'}`}>{done ? <Check size={12} /> : current ? <CircleDot size={12} className="pulse-dot" /> : <span className="h-1 w-1 rounded-full bg-current" />}</span><span className={current ? 'font-semibold' : ''}>{step}</span>{current && <span className="ml-auto font-mono-ui text-[9px] uppercase tracking-[.12em] text-accent">active</span>}</div>; })}</div>{job.error && <div className="mt-6 rounded-lg border border-red-700/20 bg-red-700/5 p-3 text-sm leading-5 text-red-800"><div className="font-semibold">Builder reported a failure</div><div className="mt-1">{job.error}</div></div>}{success && job.artifactId && <Link href={`/projects/${job.projectId}/artifacts`} className="focus-ring mt-6 flex items-center justify-between rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground" data-testid="link-build-artifact">Open validated artifact <ArrowRight size={15} /></Link>}<div className="mt-7 border-t border-border pt-4 font-mono-ui text-[10px] text-muted-foreground"><div className="flex justify-between"><span>JOB ID</span><span>{job.id.slice(0, 18)}</span></div><div className="mt-2 flex justify-between"><span>QUEUED</span><span>{formatDate(job.createdAt)}</span></div></div></div>;
}

function LogPanel({ logs, isLoading, isError }: { logs: string[]; isLoading: boolean; isError: boolean }) {
  return <div className="scanline min-h-[450px] rounded-2xl border border-sidebar-border bg-sidebar p-5 text-sidebar-foreground md:p-6"><div className="flex items-center justify-between border-b border-sidebar-border pb-4"><div className="flex items-center gap-2"><Terminal size={16} className="text-sidebar-primary" /><span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/75">Build output</span></div><div className="flex items-center gap-2 font-mono-ui text-[9px] text-sidebar-foreground/45"><span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary pulse-dot" /> live stream</div></div><div className="mt-5 max-h-[520px] overflow-auto font-mono-ui text-[11px] leading-6">{isLoading ? <div className="space-y-2">{[1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-4 bg-sidebar-accent" />)}</div> : isError ? <div className="text-red-300">Log stream unavailable. The build status remains authoritative.</div> : logs.length ? logs.map((log, index) => <div key={`${log}-${index}`} className="flex gap-4"><span className="select-none text-sidebar-foreground/30">{String(index + 1).padStart(3, '0')}</span><span className={/error|fail/i.test(log) ? 'text-red-300' : /warn/i.test(log) ? 'text-amber-200' : 'text-sidebar-foreground/80'}>{log}</span></div>) : <div className="text-sidebar-foreground/45">Waiting for the builder to emit output…</div>}</div></div>;
}

function ArtifactsPage({ project }: { project: Project }) {
  const [artifactId, setArtifactId] = useState(() => localStorage.getItem(`artifact:${project.id}`) ?? '');
  const download = useDownloadArtifact(artifactId || 'none', { query: { queryKey: getDownloadArtifactQueryKey(artifactId || 'none'), enabled: false } });
  const buildId = localStorage.getItem(`build:${project.id}`);
  const { data: build } = useGetBuild(buildId || 'none', { query: { queryKey: getGetBuildQueryKey(buildId || 'none'), enabled: Boolean(buildId) } });
  useEffect(() => { if (build?.artifactId) { localStorage.setItem(`artifact:${project.id}`, build.artifactId); setArtifactId(build.artifactId); } }, [build?.artifactId, project.id]);
  const currentArtifact = artifactId || build?.artifactId || '';
  const handleDownload = () => { if (!currentArtifact) return; void download.refetch(); window.location.assign(`/api/artifacts/${currentArtifact}/download`); };
  return <ProjectFrame project={project} active="Artifacts"><div className="mx-auto max-w-[1380px] px-5 py-8 md:px-9 md:py-10"><PageHeading eyebrow="Output / validated artifacts" title="Only ship what passed." copy="An APK appears here only when a build job reports success and a validated artifact ID is available." />{currentArtifact && build?.status === 'SUCCESS' ? <div className="fade-up max-w-3xl rounded-2xl border border-emerald-700/25 bg-emerald-700/5 p-6 md:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-emerald-800"><PackageCheck size={15} /> Validation passed</div><h2 className="mt-3 text-2xl font-semibold tracking-[-.03em]">APK is ready for download.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This package is linked to the successful job below. Downloading calls the builder's artifact endpoint directly.</p></div><ShieldCheck className="text-emerald-700" size={32} /></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><Metric label="Artifact ID" value={currentArtifact.slice(0, 18)} detail="Validated package" /><Metric label="Build job" value={build.id.slice(0, 18)} detail={formatDate(build.createdAt)} /></div><button onClick={handleDownload} disabled={download.isFetching} className="focus-ring mt-7 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground disabled:opacity-60" data-testid="button-download-apk">{download.isFetching ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />} Download validated APK</button></div> : <EmptyState title="No validated APK yet." copy={build?.status === 'FAILED' ? 'The latest build failed validation. Review its real logs, resolve the reported issue, and queue another build.' : 'Queue a build from Build control. This page will stay empty until the service reports a validated artifact.'} action={<Link href={`/projects/${project.id}/build`} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="link-go-to-build"><Rocket size={15} /> Open build control</Link>} />}</div></ProjectFrame>;
}

function Router() {
  return <ErrorBoundary resetKey={window.location.pathname}><Switch><Route path="/" component={Dashboard} /><Route path="/dashboard" component={Dashboard} /><Route path="/projects/:id/analysis"><ProjectLoader>{(project) => <AnalysisPage project={project} />}</ProjectLoader></Route><Route path="/projects/:id/build"><ProjectLoader>{(project) => <BuildPage project={project} />}</ProjectLoader></Route><Route path="/projects/:id/artifacts"><ProjectLoader>{(project) => <ArtifactsPage project={project} />}</ProjectLoader></Route><Route path="/projects/:id"><ProjectLoader>{(project) => <Overview project={project} />}</ProjectLoader></Route><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;