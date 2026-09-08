import { Check, CircleDot, Clock, XCircle, FileArchive, Search, Cpu, Terminal, FolderSearch, ShieldCheck, Hash } from 'lucide-react';
import type { PhaseInfo, BuildPhaseId } from '@/context/BuildContext';

export interface TimelinePhase {
  id: string;
  name: string;
  description?: string;
  status: 'complete' | 'active' | 'pending' | 'failed' | 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'FAILED';
  timestamp?: string;
  duration?: string;
}

export interface PhaseTimelineProps {
  phases: (PhaseInfo | TimelinePhase)[];
  activePhaseId?: string | null;
  className?: string;
}

const PHASE_ICONS: Record<string, typeof FileArchive> = {
  EXTRACTING: FileArchive,
  ANALYZING: Search,
  PREPARING_ENVIRONMENT: Cpu,
  'PREPARING ENVIRONMENT': Cpu,
  GRADLE_BUILD: Terminal,
  'GRADLE BUILD': Terminal,
  LOCATING_APK: FolderSearch,
  'LOCATING APK': FolderSearch,
  VALIDATING_APK: ShieldCheck,
  'VALIDATING APK': ShieldCheck,
  HASHING: Hash,
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  EXTRACTING: 'Unpacking ZIP archive payload into isolated workspace',
  ANALYZING: 'Detecting project type, AGP compatibility & manifest parameters',
  PREPARING_ENVIRONMENT: 'Configuring Android SDK, JDK 17, and Gradle daemon',
  'PREPARING ENVIRONMENT': 'Configuring Android SDK, JDK 17, and Gradle daemon',
  GRADLE_BUILD: 'Executing ./gradlew assembleDebug task tree',
  'GRADLE BUILD': 'Executing ./gradlew assembleDebug task tree',
  LOCATING_APK: 'Locating generated debug APK package in output targets',
  'LOCATING APK': 'Locating generated debug APK package in output targets',
  VALIDATING_APK: 'AAPT2 inspection for activity readiness and package metadata',
  'VALIDATING APK': 'AAPT2 inspection for activity readiness and package metadata',
  HASHING: 'Calculating SHA-256 fingerprint and sealing artifact',
};

export function PhaseTimeline({ phases, activePhaseId, className = '' }: PhaseTimelineProps) {
  const isStatusCompleted = (st: string) => st === 'COMPLETED' || st === 'complete';
  const isStatusActive = (st: string) => st === 'ACTIVE' || st === 'active';
  const isStatusFailed = (st: string) => st === 'FAILED' || st === 'failed';

  return (
    <div className={`space-y-3 ${className}`} data-testid="phase-timeline">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="font-mono text-[11px] uppercase tracking-[.18em] text-muted-foreground">
          Build Pipeline Phases
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {phases.filter((p) => isStatusCompleted(p.status)).length} / {phases.length} Complete
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-border/60">
        {phases.map((phase) => {
          const isCompleted = isStatusCompleted(phase.status);
          const isActive = isStatusActive(phase.status) || phase.id === activePhaseId;
          const isFailed = isStatusFailed(phase.status);

          const phaseName = ('label' in phase && phase.label) ? phase.label : ('name' in phase && phase.name) ? phase.name : phase.id;
          const IconComponent = PHASE_ICONS[phase.id] || (('name' in phase && phase.name) ? PHASE_ICONS[phase.name] : null) || Terminal;
          const desc = ('description' in phase && phase.description) || PHASE_DESCRIPTIONS[phase.id] || (('name' in phase && phase.name) ? PHASE_DESCRIPTIONS[phase.name] : '') || '';
          const phaseDuration = ('duration' in phase && phase.duration) ? phase.duration : ('durationMs' in phase && phase.durationMs) ? `${(phase.durationMs / 1000).toFixed(1)}s` : undefined;

          return (
            <div
              key={phase.id}
              className={`relative group transition-all duration-300 ${
                isActive ? 'translate-x-1' : ''
              }`}
              data-testid={`phase-item-${phase.id.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300 ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                    : isFailed
                    ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                    : isActive
                    ? 'border-accent bg-accent text-accent-foreground animate-pulse shadow-xs'
                    : 'border-border bg-card text-muted-foreground/40'
                }`}
              >
                {isCompleted ? (
                  <Check size={11} strokeWidth={2.5} />
                ) : isFailed ? (
                  <XCircle size={11} strokeWidth={2.5} />
                ) : isActive ? (
                  <CircleDot size={11} strokeWidth={2.5} className="animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </div>

              {/* Phase Content Box */}
              <div
                className={`rounded-xl border p-3 transition-all duration-200 ${
                  isActive
                    ? 'border-accent/40 bg-accent/5 shadow-2xs'
                    : isCompleted
                    ? 'border-border/70 bg-card/60'
                    : isFailed
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : 'border-border/40 bg-card/30 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <IconComponent
                      size={14}
                      className={
                        isActive
                          ? 'text-accent'
                          : isCompleted
                          ? 'text-emerald-500'
                          : isFailed
                          ? 'text-rose-500'
                          : 'text-muted-foreground'
                      }
                    />
                    <span
                      className={`text-xs font-mono font-semibold tracking-wide ${
                        isActive
                          ? 'text-accent'
                          : isCompleted
                          ? 'text-foreground'
                          : isFailed
                          ? 'text-rose-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {phaseName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold px-1.5 py-0.2 rounded-sm bg-accent/15">
                        RUNNING
                      </span>
                    )}
                    {phaseDuration && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {phaseDuration}
                      </span>
                    )}
                  </div>
                </div>

                {desc && (
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed pl-5">
                    {desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
