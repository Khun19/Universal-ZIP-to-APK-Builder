import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, PlusCircle, History, FolderGit2, Server, Settings, Menu, X, Sun, Moon, Laptop, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useBuild } from '@/context/BuildContext';

interface AppShellProps { children: ReactNode; }

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isSimulating } = useBuild();

  useEffect(() => {
    const key = 'rz-builder-launch-v1';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      setShowLaunch(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(24);
      const timer = window.setTimeout(() => setShowLaunch(false), 1250);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { section: 'BUILD' },
    { label: 'New Build', href: '/new-build', icon: PlusCircle, highlight: true },
    { label: 'Build History', href: '/history', icon: History },
    { section: 'PROJECT' },
    { label: 'Projects', href: '/projects', icon: FolderGit2 },
    { section: 'SYSTEM' },
    { label: 'Environment', href: '/environment', icon: Server },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') return location === '/' || location === '/dashboard';
    return location.startsWith(href);
  };

  return (
    <div className="rz-shell flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {showLaunch && (
        <div className="rz-launch fixed inset-0 z-[100] flex items-center justify-center bg-[#071016] text-white" aria-label="RZ Builder launching">
          <div className="rz-launch-grid absolute inset-0" />
          <div className="rz-energy absolute h-56 w-56 rounded-full border border-primary/20" />
          <div className="rz-energy rz-energy-delay absolute h-36 w-36 rounded-full border border-accent/30" />
          <div className="relative text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/[.04] shadow-2xl shadow-primary/10">
              <span className="text-3xl font-black tracking-[-.08em]">RZ</span>
            </div>
            <div className="mt-4 font-mono-ui text-[10px] uppercase tracking-[.32em] text-white/55">Builder Engine</div>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border/80 bg-sidebar text-sidebar-foreground z-30 select-none">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3 focus:outline-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-md shadow-primary/15">RZ</div>
            <div>
              <div className="font-bold text-sm tracking-tight">RZ Universal Builder</div>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/55">ZIP → APK ENGINE</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item, idx) => item.section ? (
            <div key={idx} className="px-3 pt-5 pb-2 font-mono-ui text-[10px] font-semibold tracking-[.22em] text-sidebar-foreground/40 uppercase">{item.section}</div>
          ) : (() => {
            const active = isActive(item.href);
            const Icon = item.icon!;
            return <Link key={item.href} href={item.href!} className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${active ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : item.highlight ? 'border border-dashed border-primary/35 bg-primary/5 text-sidebar-foreground font-semibold hover:bg-primary/10' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid={`nav-link-${(item.label || 'nav').toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="flex items-center gap-3"><Icon size={16} className={active ? 'text-primary-foreground' : item.highlight ? 'text-primary' : 'text-sidebar-foreground/65'} />{item.label}</span>
              {active && <ChevronRight size={13} />}
            </Link>;
          })())}
        </nav>

        <div className="m-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/25 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold tracking-[.16em]">BUILDER ENGINE</span>
            <span className={`flex items-center gap-1.5 font-mono-ui text-[9px] font-bold uppercase ${isSimulating ? 'text-amber-400' : 'text-emerald-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isSimulating ? 'bg-amber-400 pulse-dot' : 'bg-emerald-400'}`} />{isSimulating ? 'BUILDING' : 'READY'}
            </span>
          </div>
          <div className="mt-2 text-[10px] leading-5 text-sidebar-foreground/45">Local-first build orchestration · evidence based output</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-muted" aria-label="Open navigation"><Menu size={18} /></button>
            <div className="flex items-center gap-2"><span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground hidden sm:inline">RZ /</span><h1 className="text-sm font-bold tracking-tight capitalize">{location.replace('/', '').replace(/-/g, ' ') || 'Dashboard'}</h1></div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/new-build" className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-105 transition-all"><PlusCircle size={14}/>New Build</Link>
            <div className="flex items-center rounded-xl border border-border p-0.5 bg-card text-muted-foreground">
              <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'hover:text-foreground'}`}><Sun size={14}/></button>
              <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'hover:text-foreground'}`}><Moon size={14}/></button>
              <button onClick={() => setTheme('system')} className={`p-1.5 rounded-lg ${theme === 'system' ? 'bg-primary text-primary-foreground' : 'hover:text-foreground'}`}><Laptop size={14}/></button>
            </div>
          </div>
        </header>

        {mobileMenuOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}/><div className="fixed inset-y-0 left-0 w-3/4 max-w-xs border-r border-border bg-sidebar text-sidebar-foreground p-6 shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-sidebar-border"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs">RZ</div><span className="font-bold text-sm">RZ Universal Builder</span></div><button onClick={() => setMobileMenuOpen(false)}><X size={20}/></button></div>
          <nav className="mt-6 space-y-1">{navItems.map((item, idx) => item.section ? <div key={idx} className="pt-4 pb-1 text-[10px] font-mono-ui uppercase tracking-widest text-sidebar-foreground/40 font-semibold">{item.section}</div> : <Link key={item.href} href={item.href!} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium ${isActive(item.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}><item.icon size={16}/>{item.label}</Link>)}</nav>
        </div></div>}

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
