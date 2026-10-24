import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Activity, ArrowRight, CheckCircle2, AlertCircle, Clock3, Cpu, FileArchive, FileCode2, FolderOpen, Plus, RefreshCw, ShieldCheck, Terminal, Zap } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { getStoredProjects, ProjectItem } from '../services/mockData';

const statusTone: Record<string, string> = {
  SUCCESS: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400',
  FAILED: 'border-rose-500/25 bg-rose-500/8 text-rose-600 dark:text-rose-400',
  BUILDING: 'border-amber-500/25 bg-amber-500/8 text-amber-600 dark:text-amber-400',
  ANALYZING: 'border-sky-500/25 bg-sky-500/8 text-sky-600 dark:text-sky-400',
};

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = () => setProjects(getStoredProjects());
  useEffect(load, []);

  const builds = projects.map(p => p.latestBuild).filter(Boolean);
  const successful = builds.filter(b => b?.status === 'SUCCESS').length;
  const failed = builds.filter(b => b?.status === 'FAILED').length;
  const running = builds.filter(b => b && !['SUCCESS','FAILED'].includes(b.status)).length;

  const refresh = () => { setRefreshing(true); window.setTimeout(() => { load(); setRefreshing(false); }, 350); };

  return <AppShell>
    <div className="space-y-7">
      <section className="rz-hero rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent pulse-dot"/>RZ BUILD ENGINE / READY</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] md:text-4xl">Build Android packages<br className="hidden md:block"/> from your project ZIP.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Inspect the archive, detect its framework, select the verified build strategy, then produce a real APK with validation evidence.</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/new-build" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-105"><Plus size={15}/>Start new build<ArrowRight size={14}/></Link>
              <Link href="/environment" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-medium hover:bg-muted"><Cpu size={14}/>Toolchain</Link>
            </div>
          </div>
          <div className="rz-engine-mark">
            <div className="rz-engine-core"><span>RZ</span></div>
            <div className="rz-engine-ring ring-a"/><div className="rz-engine-ring ring-b"/>
            <div className="rz-engine-label">ENGINE<br/><span>ONLINE</span></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Builds', builds.length, Activity, 'All build jobs'],
          ['Validated', successful, CheckCircle2, 'APK artifacts'],
          ['Failed', failed, AlertCircle, 'Needs inspection'],
          ['Running', running, Zap, 'Active pipeline'],
        ].map(([label,value,Icon,detail]) => <div key={String(label)} className="rz-card rounded-2xl border border-border bg-card p-4 md:p-5">
          <div className="flex items-center justify-between text-muted-foreground"><span className="font-mono-ui text-[9px] font-bold uppercase tracking-[.18em]">{label}</span><Icon size={15}/></div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{String(value)}</div><div className="mt-1 text-[10px] text-muted-foreground">{detail}</div>
        </div>)}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rz-card rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="text-sm font-semibold">Recent builds</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Latest package activity across the workspace.</p></div><button onClick={refresh} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Refresh builds"><RefreshCw size={14} className={refreshing ? 'animate-spin':''}/></button></div>
          <div className="divide-y divide-border/70">
            {projects.filter(p=>p.latestBuild).slice(0,5).map(p => { const b=p.latestBuild!; return <Link key={p.id} href={`/build/${b.id}/console`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/35 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background"><FileCode2 size={16} className="text-accent"/></div>
              <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{p.name}</div><div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground"><span className="font-mono-ui">{b.strategy}</span><span>·</span><span>{b.duration}</span></div></div>
              <span className={`hidden sm:inline-flex rounded-full border px-2 py-1 font-mono-ui text-[9px] font-bold tracking-[.08em] ${statusTone[b.status] || 'border-border bg-muted text-muted-foreground'}`}>{b.status}</span>
            </Link>; })}
          </div>
          <Link href="/history" className="flex items-center justify-between border-t border-border px-5 py-3 text-[11px] font-semibold hover:bg-muted/35"><span>View build history</span><ArrowRight size={13}/></Link>
        </div>

        <div className="rz-card rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 border-b border-border pb-4"><ShieldCheck size={16} className="text-accent"/><h3 className="text-sm font-semibold">Build posture</h3></div>
          <div className="mt-4 space-y-3">
            {[['Archive intake',FileArchive,'ZIP validation'],['Project detection',FolderOpen,'Framework evidence'],['Build engine',Terminal,'Native toolchain'],['Artifact check',ShieldCheck,'APK validation']].map(([name,Icon,detail])=><div key={String(name)} className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Icon size={14}/></div><div><div className="text-xs font-medium">{name}</div><div className="text-[10px] text-muted-foreground">{detail}</div></div><span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"/></div>)}
          </div>
          <div className="mt-5 rounded-xl border border-border bg-muted/35 p-3 font-mono-ui text-[9px] leading-5 text-muted-foreground">ZIP → VALIDATE → DETECT → BUILD → VERIFY → APK</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/60 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">Workspace principle</div><div className="mt-1 text-xs font-medium">Professional dashboard. Technical motion. No game-style UI.</div></div><div className="font-mono-ui text-[9px] text-muted-foreground">RZ DESIGN SYSTEM / v1</div></div>
      </section>
    </div>
  </AppShell>;
};

export default DashboardPage;
