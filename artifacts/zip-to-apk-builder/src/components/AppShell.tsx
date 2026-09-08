import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FolderGit2,
  Server,
  Settings,
  Menu,
  X,
  Radio,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Layers,
  Search,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useBuild } from '@/context/BuildContext';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isSimulating, activeBuild } = useBuild();

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
    if (href === '/dashboard' && (location === '/' || location === '/dashboard')) return true;
    return location.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border/80 bg-sidebar text-sidebar-foreground z-30 select-none">
        {/* Brand Logo & Tagline */}
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3 group focus:outline-none">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Layers size={20} />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-sm tracking-tight text-sidebar-foreground leading-tight">
                Universal Builder
              </div>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/60">
                ZIP-to-APK Studio
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div
                  key={idx}
                  className="px-3 pt-5 pb-2 font-mono-ui text-[10px] font-semibold tracking-[.22em] text-sidebar-foreground/45 uppercase"
                >
                  {item.section}
                </div>
              );
            }

            const active = isActive(item.href);
            const Icon = item.icon!;

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : item.highlight
                    ? 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-semibold border border-dashed border-primary/40 bg-primary/5'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
                data-testid={`nav-link-${(item.label || 'nav').toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={16}
                    className={active ? 'text-primary-foreground' : item.highlight ? 'text-primary' : 'text-sidebar-foreground/70'}
                  />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight size={13} className="text-primary-foreground" />}
              </Link>
            );
          })}
        </nav>

        {/* Builder Engine Telemetry Badge */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30 m-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSimulating ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </span>
              <span className="font-mono-ui text-[11px] font-bold tracking-wider text-sidebar-foreground">
                BUILDER ENGINE
              </span>
            </div>
            <span
              className={`font-mono-ui text-[10px] font-bold uppercase rounded-md px-1.5 py-0.5 ${
                isSimulating ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isSimulating ? 'ACTIVE' : 'READY'}
            </span>
          </div>

          <div className="mt-2 font-mono-ui text-[10px] text-sidebar-foreground/60 leading-tight">
            Gradle 8.4 · Android SDK 34 · Host Ready
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-4 md:px-8 backdrop-blur-md">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted"
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground hidden sm:inline">
                CONSOLE /
              </span>
              <h1 className="text-sm font-bold tracking-tight text-foreground font-display capitalize">
                {location.replace('/', '').replace(/-/g, ' ') || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Right: Actions & Theme Picker */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/new-build"
              className="focus-ring hidden sm:inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-105 transition-all"
            >
              <PlusCircle size={14} />
              <span>New Build</span>
            </Link>

            {/* Theme Toggle Button */}
            <div className="flex items-center rounded-xl border border-border p-0.5 bg-card text-muted-foreground">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'light' ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:text-foreground'
                }`}
                title="Light Mode"
              >
                <Sun size={14} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'dark' ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:text-foreground'
                }`}
                title="Dark Mode"
              >
                <Moon size={14} />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'system' ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:text-foreground'
                }`}
                title="System Theme"
              >
                <Laptop size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* MOBILE DRAWER MODAL */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs border-r border-border bg-sidebar text-sidebar-foreground p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-sidebar-border">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                      <Layers size={16} />
                    </div>
                    <span className="font-bold text-sm font-display text-sidebar-foreground">
                      ZIP-to-APK
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="mt-6 space-y-1">
                  {navItems.map((item, idx) => {
                    if (item.section) {
                      return (
                        <div
                          key={idx}
                          className="pt-4 pb-1 text-[10px] font-mono-ui uppercase tracking-widest text-sidebar-foreground/40 font-semibold"
                        >
                          {item.section}
                        </div>
                      );
                    }
                    const active = isActive(item.href);
                    const Icon = item.icon!;
                    return (
                      <Link
                        key={item.href}
                        href={item.href!}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          active
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile bottom engine status */}
              <div className="pt-4 border-t border-sidebar-border font-mono-ui text-xs text-sidebar-foreground/60 flex items-center justify-between">
                <span>ENGINE STATUS</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY VIEW */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
