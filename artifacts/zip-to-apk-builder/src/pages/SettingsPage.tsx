import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Check,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Layers,
  HardDrive,
  Info,
  Bell,
  Save,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import {
  getStoredSettings,
  saveStoredSettings,
  UserSettings,
  INITIAL_SETTINGS,
} from '../services/mockData';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setSettings(getStoredSettings());
  }, []);

  const handleUpdate = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveStoredSettings(updated);

    // If theme changed, apply directly to document
    if (key === 'theme') {
      const root = document.documentElement;
      if (value === 'dark') {
        root.classList.add('dark');
      } else if (value === 'light') {
        root.classList.remove('dark');
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    }

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleResetDefaults = () => {
    setSettings(INITIAL_SETTINGS);
    saveStoredSettings(INITIAL_SETTINGS);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-accent">
              <SettingsIcon className="w-3.5 h-3.5" />
              Configuration
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans mt-0.5">
              Builder Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage theme appearance, build behavior defaults, and interface density.
            </p>
          </div>

          {savedToast && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold animate-fade-in self-start sm:self-auto">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Preferences Saved</span>
            </div>
          )}
        </div>

        {/* 1. APPEARANCE SETTINGS */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Sun className="w-4 h-4 text-accent" />
            <span>Appearance &amp; Theme</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => handleUpdate('theme', 'light')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                settings.theme === 'light'
                  ? 'border-accent bg-accent/10 text-foreground font-semibold shadow-xs'
                  : 'border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Sun className="w-5 h-5 mb-2" />
              <span className="text-xs">Light</span>
            </button>

            <button
              onClick={() => handleUpdate('theme', 'dark')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                settings.theme === 'dark'
                  ? 'border-accent bg-accent/10 text-foreground font-semibold shadow-xs'
                  : 'border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Moon className="w-5 h-5 mb-2" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              onClick={() => handleUpdate('theme', 'system')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                settings.theme === 'system'
                  ? 'border-accent bg-accent/10 text-foreground font-semibold shadow-xs'
                  : 'border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Monitor className="w-5 h-5 mb-2" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </div>

        {/* 2. BUILD PREFERENCES */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Build Pipeline Defaults</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Strategy Choice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/70">
              <div>
                <div className="text-xs font-semibold text-foreground">Default Strategy Selection</div>
                <div className="text-[11px] text-muted-foreground">
                  Allow automated inspection to decide or force a specific build strategy.
                </div>
              </div>
              <select
                value={settings.defaultStrategy}
                onChange={(e) => handleUpdate('defaultStrategy', e.target.value as any)}
                className="h-8 px-3 rounded-xl border border-border bg-background text-xs font-mono text-foreground cursor-pointer focus:outline-hidden focus:border-accent"
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="native">Force Native Gradle</option>
                <option value="capacitor">Force Capacitor Android</option>
                <option value="web">Force Web Wrapper</option>
              </select>
            </div>

            {/* Clean Cache */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/70">
              <div>
                <div className="text-xs font-semibold text-foreground">Clean Workspace Before Each Build</div>
                <div className="text-[11px] text-muted-foreground">
                  Purges intermediate .dex and aapt2 caches to guarantee deterministic output.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.cleanCacheBeforeBuild}
                onChange={(e) => handleUpdate('cleanCacheBeforeBuild', e.target.checked)}
                className="w-4 h-4 rounded-sm border-border text-accent focus:ring-accent"
              >
              </input>
            </div>

            {/* Verbose Logging */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/70">
              <div>
                <div className="text-xs font-semibold text-foreground">Verbose Logging (--debug / --info)</div>
                <div className="text-[11px] text-muted-foreground">
                  Include raw Gradle daemon task traces and stdout in console stream.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.verboseLogging}
                onChange={(e) => handleUpdate('verboseLogging', e.target.checked)}
                className="w-4 h-4 rounded-sm border-border text-accent focus:ring-accent"
              >
              </input>
            </div>

            {/* Auto-Scroll Console */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-foreground">Follow Terminal Output (Auto-Scroll)</div>
                <div className="text-[11px] text-muted-foreground">
                  Automatically scroll build console to latest emitted log lines.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoScrollLogs}
                onChange={(e) => handleUpdate('autoScrollLogs', e.target.checked)}
                className="w-4 h-4 rounded-sm border-border text-accent focus:ring-accent"
              >
              </input>
            </div>
          </div>
        </div>

        {/* 3. INTERFACE DENSITY */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Layers className="w-4 h-4 text-accent" />
            <span>Interface Density</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleUpdate('density', 'comfortable')}
              className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                settings.density === 'comfortable'
                  ? 'border-accent bg-accent/10 text-foreground font-semibold'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Comfortable (Default)
            </button>
            <button
              onClick={() => handleUpdate('density', 'compact')}
              className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                settings.density === 'compact'
                  ? 'border-accent bg-accent/10 text-foreground font-semibold'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Compact (Dense tables)
            </button>
          </div>
        </div>

        {/* 4. ABOUT SECTION */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Info className="w-4 h-4 text-accent" />
            <span>About Universal ZIP-to-APK Builder</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-mono">
            <div className="p-3 rounded-xl border border-border/60 bg-background/50">
              <span className="text-muted-foreground block text-[10px]">App Version</span>
              <span className="font-semibold text-foreground mt-0.5 block">v2.4.0</span>
            </div>
            <div className="p-3 rounded-xl border border-border/60 bg-background/50">
              <span className="text-muted-foreground block text-[10px]">Android Target</span>
              <span className="font-semibold text-foreground mt-0.5 block">API Level 34</span>
            </div>
            <div className="p-3 rounded-xl border border-border/60 bg-background/50">
              <span className="text-muted-foreground block text-[10px]">Build Orchestrator</span>
              <span className="font-semibold text-foreground mt-0.5 block">Gradle 8.4</span>
            </div>
            <div className="p-3 rounded-xl border border-border/60 bg-background/50">
              <span className="text-muted-foreground block text-[10px]">Architecture</span>
              <span className="font-semibold text-foreground mt-0.5 block">Topographic CI/CD</span>
            </div>
          </div>
        </div>

        {/* RESET DEFAULTS BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore All Defaults</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
};

export default SettingsPage;
