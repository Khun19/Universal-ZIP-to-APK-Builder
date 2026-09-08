import { useState, useEffect } from 'react';
import { Sun, Moon, Laptop, Sliders, Bell, Eye, Info, Check, Shield, Layers, Github } from 'lucide-react';
import { useTheme, type Theme } from '@/context/ThemeContext';

interface UserSettings {
  autoOpenTerminal: boolean;
  parallelBuilds: boolean;
  verboseLogging: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  cleanWorkspaceAfterBuild: boolean;
  defaultSigningMode: 'debug' | 'unsigned';
}

const DEFAULT_SETTINGS: UserSettings = {
  autoOpenTerminal: true,
  parallelBuilds: true,
  verboseLogging: false,
  notifyOnSuccess: true,
  notifyOnFailure: true,
  cleanWorkspaceAfterBuild: false,
  defaultSigningMode: 'debug',
};

export function SettingsView() {
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('builder-user-settings');
      if (stored) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('builder-user-settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="settings-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage appearance, build preferences, notifications, and toolchain configurations.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-mono-ui text-xs font-semibold text-emerald-500 animate-fade-in">
            <Check size={13} />
            <span>Saved</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Section 1: Appearance */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Eye size={17} className="text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono-ui text-foreground">
              Appearance
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { id: 'light' as Theme, label: 'Light', icon: Sun, desc: 'Clean high-contrast daytime layout' },
              { id: 'dark' as Theme, label: 'Dark', icon: Moon, desc: 'Console twilight developer theme' },
              { id: 'system' as Theme, label: 'System', icon: Laptop, desc: 'Synchronized to device preferences' },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-background/50 hover:border-primary/40 hover:bg-background'
                  }`}
                  data-testid={`theme-option-${t.id}`}
                >
                  <div className={`p-2 rounded-xl border mb-3 ${isSelected ? 'border-primary/30 bg-primary/20 text-primary' : 'border-border text-muted-foreground'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="font-semibold text-sm text-foreground flex items-center justify-between w-full">
                    <span>{t.label}</span>
                    {isSelected && <Check size={14} className="text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Build Preferences */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Sliders size={17} className="text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono-ui text-foreground">
              Build Preferences
            </h3>
          </div>

          <div className="divide-y divide-border space-y-3 pt-1">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-sm text-foreground">Parallel Gradle Execution</div>
                <div className="text-xs text-muted-foreground">Run decoupled tasks concurrently (-Dorg.gradle.parallel=true)</div>
              </div>
              <input
                type="checkbox"
                checked={settings.parallelBuilds}
                onChange={(e) => updateSetting('parallelBuilds', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-sm text-foreground">Verbose Build Output</div>
                <div className="text-xs text-muted-foreground">Include --stacktrace and --info flags in Gradle stdout</div>
              </div>
              <input
                type="checkbox"
                checked={settings.verboseLogging}
                onChange={(e) => updateSetting('verboseLogging', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-sm text-foreground">Default APK Signing Profile</div>
                <div className="text-xs text-muted-foreground">Debug keystore automatically signs debug packages</div>
              </div>
              <select
                value={settings.defaultSigningMode}
                onChange={(e) => updateSetting('defaultSigningMode', e.target.value as 'debug' | 'unsigned')}
                className="rounded-xl border border-border bg-background px-3 py-1.5 font-mono-ui text-xs text-foreground focus:outline-none"
              >
                <option value="debug">Android Debug Keystore</option>
                <option value="unsigned">Unsigned (Raw APK)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Interface & Notifications */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Bell size={17} className="text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono-ui text-foreground">
              Notifications & Console Behavior
            </h3>
          </div>

          <div className="divide-y divide-border space-y-3 pt-1">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-sm text-foreground">Auto-Focus Terminal on Execution</div>
                <div className="text-xs text-muted-foreground">Automatically open live log stream when assembling</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoOpenTerminal}
                onChange={(e) => updateSetting('autoOpenTerminal', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-sm text-foreground">Notify on Build Success</div>
                <div className="text-xs text-muted-foreground">Play tone or show banner when APK is validated</div>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnSuccess}
                onChange={(e) => updateSetting('notifyOnSuccess', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Section 4: About */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Info size={17} className="text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono-ui text-foreground">
              About Universal ZIP-to-APK Builder
            </h3>
          </div>

          <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Universal ZIP-to-APK Builder provides an automated pipeline for turning web, Capacitor, and native source archives into genuine Android APK binaries.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 font-mono-ui text-[11px] text-foreground">
              <span>VERSION: 2.4.0-PROD</span>
              <span>HOST: Linux x86_64</span>
              <span>AGP: 8.3.1</span>
              <span>TARGET: Android 14 (API 34)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
